import { describe, it, expect, vi } from 'vitest';
import { DomainError } from '../common/domain.error.js';
import { ThreadEntryService } from './thread-entry.service.js';

function buatPrisma() {
  return {
    ticket: { findUnique: vi.fn() },
    threadEntry: { create: vi.fn(), findMany: vi.fn() },
  };
}

const tiketTerbuka = { id: 1, status: { isClosed: false } };
const tiketTertutup = { id: 1, status: { isClosed: true } };
const entryRow = (over: Record<string, unknown> = {}) => ({
  id: 1, ticketId: 1, authorAgentId: 7, authorRequesterId: null,
  isInternal: false, body: 'Balasan', createdAt: new Date(), ...over,
});

describe('ThreadEntryService', () => {
  describe('create', () => {
    it('menolak kalau tiket tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(null);
      const service = new ThreadEntryService(prisma as never);
      await expect(service.create(99, 7, { body: 'Halo' })).rejects.toThrow(DomainError);
    });

    it('menolak balas tiket yang sudah closed', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(tiketTertutup);
      const service = new ThreadEntryService(prisma as never);
      await expect(service.create(1, 7, { body: 'Halo' })).rejects.toThrow(DomainError);
    });

    it('membuat balasan biasa (isInternal false secara default)', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(tiketTerbuka);
      prisma.threadEntry.create.mockResolvedValue(entryRow());
      const service = new ThreadEntryService(prisma as never);
      const hasil = await service.create(1, 7, { body: 'Balasan' });
      expect(hasil.isInternal).toBe(false);
      expect(prisma.threadEntry.create).toHaveBeenCalledWith({
        data: { ticketId: 1, authorAgentId: 7, isInternal: false, body: 'Balasan' },
      });
    });

    it('membuat catatan internal saat isInternal true', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(tiketTerbuka);
      prisma.threadEntry.create.mockResolvedValue(entryRow({ isInternal: true }));
      const service = new ThreadEntryService(prisma as never);
      const hasil = await service.create(1, 7, { body: 'Catatan', isInternal: true });
      expect(hasil.isInternal).toBe(true);
    });
  });

  describe('list', () => {
    it('menolak kalau tiket tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(null);
      const service = new ThreadEntryService(prisma as never);
      await expect(service.list(99)).rejects.toThrow(DomainError);
    });

    it('mengembalikan daftar entry terurut dari yang paling lama', async () => {
      const prisma = buatPrisma();
      prisma.ticket.findUnique.mockResolvedValue(tiketTerbuka);
      prisma.threadEntry.findMany.mockResolvedValue([entryRow()]);
      const service = new ThreadEntryService(prisma as never);
      const hasil = await service.list(1);
      expect(hasil).toHaveLength(1);
      expect(prisma.threadEntry.findMany).toHaveBeenCalledWith({
        where: { ticketId: 1 },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});