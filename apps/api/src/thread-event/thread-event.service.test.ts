import { describe, it, expect, vi } from 'vitest';
import { ThreadEventService } from './thread-event.service.js';

function buatPrisma() {
  return { threadEvent: { create: vi.fn(), findMany: vi.fn() } };
}

describe('ThreadEventService', () => {
  describe('record', () => {
    it('mencatat event kalau nilainya benar-benar berubah', async () => {
      const prisma = buatPrisma();
      const service = new ThreadEventService(prisma as never);
      await service.record(1, 7, 'status_changed', 'New', 'Work In Progress');
      expect(prisma.threadEvent.create).toHaveBeenCalledWith({
        data: { ticketId: 1, agentId: 7, eventType: 'status_changed', oldValue: 'New', newValue: 'Work In Progress' },
      });
    });

    it('TIDAK mencatat apa-apa kalau nilai lama dan baru sama (bukan perubahan sungguhan)', async () => {
      const prisma = buatPrisma();
      const service = new ThreadEventService(prisma as never);
      await service.record(1, 7, 'status_changed', 'New', 'New');
      expect(prisma.threadEvent.create).not.toHaveBeenCalled();
    });

    it('menerima agentId null (event dari sistem)', async () => {
      const prisma = buatPrisma();
      const service = new ThreadEventService(prisma as never);
      await service.record(1, null, 'status_changed', 'Open', 'Overdue');
      expect(prisma.threadEvent.create).toHaveBeenCalledWith({
        data: { ticketId: 1, agentId: null, eventType: 'status_changed', oldValue: 'Open', newValue: 'Overdue' },
      });
    });
  });

  describe('list', () => {
    it('mengembalikan event terurut dari yang paling lama', async () => {
      const prisma = buatPrisma();
      prisma.threadEvent.findMany.mockResolvedValue([]);
      const service = new ThreadEventService(prisma as never);
      await service.list(1);
      expect(prisma.threadEvent.findMany).toHaveBeenCalledWith({
        where: { ticketId: 1 },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});