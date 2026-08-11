import { Injectable } from '@nestjs/common';
import { ErrorCode, type CreateTicketStatusRequest, type TicketStatusResponse, type UpdateTicketStatusRequest } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

@Injectable()
export class TicketStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TicketStatusResponse[]> {
    return this.prisma.ticketStatus.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findById(id: number): Promise<TicketStatusResponse> {
    const status = await this.prisma.ticketStatus.findUnique({ where: { id } });
    if (!status) throw new DomainError(ErrorCode.TICKET_STATUS_NOT_FOUND, 'Status tiket tidak ditemukan.', 404);
    return status;
  }

  async create(input: CreateTicketStatusRequest): Promise<TicketStatusResponse> {
    await this.pastikanNamaBelumDipakai(input.name);
    return this.prisma.ticketStatus.create({
      data: { name: input.name, isClosed: input.isClosed ?? false, sortOrder: input.sortOrder ?? 0 },
    });
  }

  async update(id: number, input: UpdateTicketStatusRequest): Promise<TicketStatusResponse> {
    await this.findById(id);
    if (input.name) await this.pastikanNamaBelumDipakai(input.name, id);
    return this.prisma.ticketStatus.update({ where: { id }, data: input });
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    const jumlah = await this.prisma.ticket.count({ where: { statusId: id } });
    if (jumlah > 0) {
      throw new DomainError(ErrorCode.TICKET_STATUS_IN_USE, 'Status ini masih dipakai tiket, tidak bisa dihapus.', 409);
    }
    await this.prisma.ticketStatus.delete({ where: { id } });
  }

  private async pastikanNamaBelumDipakai(name: string, excludeId?: number): Promise<void> {
    const dipakai = await this.prisma.ticketStatus.findUnique({ where: { name } });
    if (dipakai && dipakai.id !== excludeId) {
      throw new DomainError(ErrorCode.TICKET_STATUS_NAME_TAKEN, `Nama status "${name}" sudah dipakai.`, 409);
    }
  }
}