import { Injectable } from '@nestjs/common';
import { ErrorCode, type CreateThreadEntryRequest, type ThreadEntryResponse } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

type ThreadEntryRow = {
  id: number;
  ticketId: number;
  authorAgentId: number | null;
  authorRequesterId: number | null;
  isInternal: boolean;
  body: string;
  createdAt: Date;
};

function toResponse(row: ThreadEntryRow): ThreadEntryResponse {
  return {
    id: row.id,
    ticketId: row.ticketId,
    authorAgentId: row.authorAgentId,
    authorRequesterId: row.authorRequesterId,
    isInternal: row.isInternal,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ThreadEntryService {
  constructor(private readonly prisma: PrismaService) {}

  // Balasan/catatan selalu dari AGENT yang login lewat endpoint ini — balasan
  // dari REQUESTER (portal/email) ditangani jalur terpisah, bukan di sini.
  async create(ticketId: number, agentId: number, input: CreateThreadEntryRequest): Promise<ThreadEntryResponse> {
    await this.pastikanTiketBolehDibalas(ticketId);

    const dibuat = await this.prisma.threadEntry.create({
      data: {
        ticketId,
        authorAgentId: agentId,
        isInternal: input.isInternal ?? false,
        body: input.body,
      },
    });
    return toResponse(dibuat as ThreadEntryRow);
  }

  async list(ticketId: number): Promise<ThreadEntryResponse[]> {
    await this.pastikanTiketAda(ticketId);
    const semua = await this.prisma.threadEntry.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
    return (semua as ThreadEntryRow[]).map(toResponse);
  }

  private async pastikanTiketAda(ticketId: number) {
    const tiket = await this.prisma.ticket.findUnique({ where: { id: ticketId }, include: { status: true } });
    if (!tiket) throw new DomainError(ErrorCode.TICKET_NOT_FOUND, 'Tiket tidak ditemukan.', 404);
    return tiket;
  }

  private async pastikanTiketBolehDibalas(ticketId: number) {
    const tiket = await this.pastikanTiketAda(ticketId);
    if (tiket.status.isClosed) {
      throw new DomainError(ErrorCode.TICKET_CLOSED, 'Tiket sudah ditutup. Buka kembali sebelum membalas.', 409);
    }
  }
}