import { Injectable } from '@nestjs/common';
import { ErrorCode, type CreateTicketRequest, type TicketDto, type UpdateTicketRequest } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';
import { ThreadEventService } from '../thread-event/thread-event.service.js';

// Nomor tiket lanjut dari nomor terakhir osTicket, terpisah dari id internal
// (spec §5.3). MAX+1 tanpa proteksi race-condition khusus — skala 36 user,
// konsisten dengan bagian lain project ini yang juga tidak menjaga TOCTOU ketat.
const NOMOR_TIKET_AWAL = 1000015;

const STATUS_AWAL = 'New';
const STATUS_REOPEN = 'Re-Opened';
const PRIORITY_DEFAULT = 'Medium';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threadEvents: ThreadEventService,
  ) {}

  async findOne(id: number): Promise<TicketDto> {
    const tiket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!tiket) throw new DomainError(ErrorCode.TICKET_NOT_FOUND, 'Tiket tidak ditemukan.', 404);
    return tiket;
  }

  async create(input: CreateTicketRequest): Promise<TicketDto> {
    await this.pastikanDepartmentAda(input.departmentId);
    if (input.categoryId != null) {
      await this.pastikanKategoriBolehUntukDepartment(input.categoryId, input.departmentId);
    }
    if (input.priorityId != null) {
      await this.pastikanPriorityAda(input.priorityId);
    }

    const requester = await this.cariAtauBuatRequester(input.requesterEmail, input.requesterName);
    const statusId = await this.statusAwalId();
    const priorityId = input.priorityId ?? (await this.priorityDefaultId());
    const number = await this.nomorBerikutnya();

    return this.prisma.ticket.create({
      data: {
        number,
        subject: input.subject,
        requesterId: requester.id,
        departmentId: input.departmentId,
        categoryId: input.categoryId ?? null,
        statusId,
        priorityId,
        callType: input.callType ?? null,
        closureType: input.closureType ?? null,
        location: input.location ?? null,
        urgency: input.urgency ?? null,
        risk: input.risk ?? null,
        solution: input.solution ?? null,
        threadEntries: {
          create: {
            authorRequesterId: requester.id,
            isInternal: false,
            body: input.description,
          },
        },
      },
    });
  }

  // Aturan warisan osTicket (spec §8.3, class.ticket.php): tiket closed tidak
  // bisa diubah/dibalas sama sekali — harus reopen() dulu lewat aksi terpisah
  // (POST /tickets/:id/reopen), bukan digabung ke PATCH biasa.
  async update(id: number, agentId: number, input: UpdateTicketRequest): Promise<TicketDto> {
    const tiket = await this.ambilTiketDenganStatus(id);
    if (tiket.status.isClosed) {
      throw new DomainError(ErrorCode.TICKET_CLOSED, 'Tiket sudah ditutup. Buka kembali sebelum membalas.', 409);
    }

    if (input.departmentId !== undefined) {
      await this.pastikanDepartmentAda(input.departmentId);
    }
    if (input.priorityId !== undefined) {
      await this.pastikanPriorityAda(input.priorityId);
    }

    const categoryIdEfektif = input.categoryId !== undefined ? input.categoryId : tiket.categoryId;
    const departmentIdEfektif = input.departmentId ?? tiket.departmentId;
    if (categoryIdEfektif != null && (input.categoryId !== undefined || input.departmentId !== undefined)) {
      await this.pastikanKategoriBolehUntukDepartment(categoryIdEfektif, departmentIdEfektif);
    }

    let statusId: number | undefined;
    let closedAt: Date | null | undefined;
    if (input.statusId !== undefined) {
      const status = await this.pastikanStatusAda(input.statusId);
      statusId = status.id;
      closedAt = status.isClosed ? new Date() : null;
    }

    const hasil = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.priorityId !== undefined ? { priorityId: input.priorityId } : {}),
        ...(statusId !== undefined ? { statusId, closedAt } : {}),
        ...(input.callType !== undefined ? { callType: input.callType } : {}),
        ...(input.closureType !== undefined ? { closureType: input.closureType } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.urgency !== undefined ? { urgency: input.urgency } : {}),
        ...(input.risk !== undefined ? { risk: input.risk } : {}),
        ...(input.solution !== undefined ? { solution: input.solution } : {}),
      },
    });

    // Jejak audit dicatat SETELAH update berhasil (spec §8.3) — kalau update
    // gagal, tidak ada event yang tercatat setengah-jalan.
    if (statusId !== undefined) {
      const statusBaru = await this.prisma.ticketStatus.findUnique({ where: { id: statusId } });
      await this.threadEvents.record(id, agentId, 'status_changed', tiket.status.name, statusBaru?.name ?? null);
    }
    if (input.departmentId !== undefined && input.departmentId !== tiket.departmentId) {
      const deptLama = await this.prisma.department.findUnique({ where: { id: tiket.departmentId } });
      const deptBaru = await this.prisma.department.findUnique({ where: { id: input.departmentId } });
      await this.threadEvents.record(id, agentId, 'department_changed', deptLama?.name ?? null, deptBaru?.name ?? null);
    }

    return hasil;
  }

  // Satu-satunya jalan mengubah tiket closed — aksi tersendiri, bukan lewat
  // PATCH (lihat konvensi path di apps/api/CLAUDE.md: POST /tickets/:id/reopen).
  async reopen(id: number, agentId: number): Promise<TicketDto> {
    const tiket = await this.ambilTiketDenganStatus(id);
    if (!tiket.status.isClosed) {
      throw new DomainError(ErrorCode.TICKET_NOT_CLOSED, 'Tiket ini belum ditutup.', 409);
    }

    const statusBaru = await this.prisma.ticketStatus.findUnique({ where: { name: STATUS_REOPEN } });
    if (!statusBaru) {
      throw new DomainError(ErrorCode.TICKET_STATUS_NOT_FOUND, `Status "${STATUS_REOPEN}" belum di-seed.`, 500);
    }

    const hasil = await this.prisma.ticket.update({ where: { id }, data: { statusId: statusBaru.id, closedAt: null } });
    await this.threadEvents.record(id, agentId, 'status_changed', tiket.status.name, statusBaru.name);
    return hasil;
  }

  private async ambilTiketDenganStatus(id: number) {
    const tiket = await this.prisma.ticket.findUnique({ where: { id }, include: { status: true } });
    if (!tiket) throw new DomainError(ErrorCode.TICKET_NOT_FOUND, 'Tiket tidak ditemukan.', 404);
    return tiket;
  }

  private async pastikanStatusAda(id: number) {
    const status = await this.prisma.ticketStatus.findUnique({ where: { id } });
    if (!status) throw new DomainError(ErrorCode.TICKET_STATUS_NOT_FOUND, 'Status tiket tidak ditemukan.', 404);
    return status;
  }

  private async statusReopenId(): Promise<number> {
    const status = await this.prisma.ticketStatus.findUnique({ where: { name: STATUS_REOPEN } });
    if (!status) {
      throw new DomainError(ErrorCode.TICKET_STATUS_NOT_FOUND, `Status "${STATUS_REOPEN}" belum di-seed.`, 500);
    }
    return status.id;
  }

  private async cariAtauBuatRequester(email: string, name: string) {
    return this.prisma.requester.upsert({ where: { email }, update: {}, create: { email, name } });
  }

  private async statusAwalId(): Promise<number> {
    const status = await this.prisma.ticketStatus.findUnique({ where: { name: STATUS_AWAL } });
    if (!status) {
      throw new DomainError(ErrorCode.TICKET_STATUS_NOT_FOUND, `Status awal "${STATUS_AWAL}" belum di-seed.`, 500);
    }
    return status.id;
  }

  private async priorityDefaultId(): Promise<number> {
    const priority = await this.prisma.priority.findUnique({ where: { name: PRIORITY_DEFAULT } });
    if (!priority) {
      throw new DomainError(ErrorCode.PRIORITY_NOT_FOUND, `Priority default "${PRIORITY_DEFAULT}" belum di-seed.`, 500);
    }
    return priority.id;
  }

  private async pastikanDepartmentAda(id: number): Promise<void> {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new DomainError(ErrorCode.DEPARTMENT_NOT_FOUND, 'Department tidak ditemukan.', 404);
  }

  private async pastikanPriorityAda(id: number): Promise<void> {
    const priority = await this.prisma.priority.findUnique({ where: { id } });
    if (!priority) throw new DomainError(ErrorCode.PRIORITY_NOT_FOUND, 'Priority tidak ditemukan.', 404);
  }

  private async pastikanKategoriBolehUntukDepartment(categoryId: number, departmentId: number): Promise<void> {
    const kategori = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!kategori) throw new DomainError(ErrorCode.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);

    const scoping = await this.prisma.categoryDepartment.findMany({ where: { categoryId } });
    // Tidak ada baris sama sekali = kategori berlaku untuk semua department
    // (aturan yang sama dipakai CategoryService, lihat category.prisma).
    if (scoping.length === 0) return;

    const diizinkan = scoping.some((s) => s.departmentId === departmentId);
    if (!diizinkan) {
      throw new DomainError(
        ErrorCode.TICKET_CATEGORY_NOT_ALLOWED,
        'Kategori ini tidak berlaku untuk department yang dipilih.',
        422,
      );
    }
  }

  private async nomorBerikutnya(): Promise<number> {
    const hasil = await this.prisma.ticket.aggregate({ _max: { number: true } });
    return (hasil._max.number ?? NOMOR_TIKET_AWAL - 1) + 1;
  }
}
