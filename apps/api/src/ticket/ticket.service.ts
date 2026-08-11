import { Injectable } from '@nestjs/common';
import { ErrorCode, type CreateTicketRequest, type TicketDto } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

// Nomor tiket lanjut dari nomor terakhir osTicket, terpisah dari id internal
// (spec §5.3). MAX+1 tanpa proteksi race-condition khusus — skala 36 user,
// konsisten dengan bagian lain project ini yang juga tidak menjaga TOCTOU ketat.
const NOMOR_TIKET_AWAL = 1000015;

const STATUS_AWAL = 'New';
const PRIORITY_DEFAULT = 'Medium';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

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
