import { Injectable } from '@nestjs/common';
import { ErrorCode, type CreatePriorityRequest, type PriorityResponse, type UpdatePriorityRequest } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

@Injectable()
export class PriorityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PriorityResponse[]> {
    return this.prisma.priority.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findById(id: number): Promise<PriorityResponse> {
    const priority = await this.prisma.priority.findUnique({ where: { id } });
    if (!priority) throw new DomainError(ErrorCode.PRIORITY_NOT_FOUND, 'Prioritas tidak ditemukan.', 404);
    return priority;
  }

  async create(input: CreatePriorityRequest): Promise<PriorityResponse> {
    await this.pastikanNamaBelumDipakai(input.name);
    return this.prisma.priority.create({
      data: { name: input.name, sortOrder: input.sortOrder ?? 0 },
    });
  }

  async update(id: number, input: UpdatePriorityRequest): Promise<PriorityResponse> {
    await this.findById(id);
    if (input.name) await this.pastikanNamaBelumDipakai(input.name, id);
    return this.prisma.priority.update({ where: { id }, data: input });
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    const jumlah = await this.prisma.ticket.count({ where: { priorityId: id } });
    if (jumlah > 0) {
      throw new DomainError(ErrorCode.PRIORITY_IN_USE, 'Prioritas ini masih dipakai tiket, tidak bisa dihapus.', 409);
    }
    await this.prisma.priority.delete({ where: { id } });
  }

  private async pastikanNamaBelumDipakai(name: string, excludeId?: number): Promise<void> {
    const dipakai = await this.prisma.priority.findUnique({ where: { name } });
    if (dipakai && dipakai.id !== excludeId) {
      throw new DomainError(ErrorCode.PRIORITY_NAME_TAKEN, `Nama prioritas "${name}" sudah dipakai.`, 409);
    }
  }
}