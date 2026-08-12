import { Injectable } from '@nestjs/common';
import type { ThreadEventResponse } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';

export type ThreadEventType = 'status_changed' | 'assignee_changed' | 'department_changed';

type ThreadEventRow = {
  id: number;
  ticketId: number;
  agentId: number | null;
  eventType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

function toResponse(row: ThreadEventRow): ThreadEventResponse {
  return {
    id: row.id,
    ticketId: row.ticketId,
    agentId: row.agentId,
    eventType: row.eventType,
    oldValue: row.oldValue,
    newValue: row.newValue,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ThreadEventService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Catat satu baris jejak audit. agentId null berarti event dari sistem
   * (mis. job overdue terjadwal), bukan aksi manual seorang agent.
   *
   * Dipanggil dari TicketService tiap kali status/assignee/department
   * berubah (spec §8.3) — bukan dari endpoint sendiri, ThreadEvent murni
   * hasil sampingan otomatis.
   */
  async record(
    ticketId: number,
    agentId: number | null,
    eventType: ThreadEventType,
    oldValue: string | null,
    newValue: string | null,
  ): Promise<void> {
    if (oldValue === newValue) return; // bukan perubahan sungguhan, jangan catat noise
    await this.prisma.threadEvent.create({
      data: { ticketId, agentId, eventType, oldValue, newValue },
    });
  }

  async list(ticketId: number): Promise<ThreadEventResponse[]> {
    const semua = await this.prisma.threadEvent.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
    return (semua as ThreadEventRow[]).map(toResponse);
  }
}