import { describe, it, expect, vi } from 'vitest';
import { DomainError } from '../common/domain.error.js';
import { PriorityService } from './priority.service.js';

function buatPrisma() {
  return {
    priority: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    ticket: { count: vi.fn() },
  };
}

const row = (over: Record<string, unknown> = {}) => ({ id: 1, name: 'Tinggi', sortOrder: 0, ...over });

describe('PriorityService', () => {
  it('membuat prioritas baru saat nama belum dipakai', async () => {
    const prisma = buatPrisma();
    prisma.priority.findUnique.mockResolvedValue(null);
    prisma.priority.create.mockResolvedValue(row());
    const service = new PriorityService(prisma as never);
    const hasil = await service.create({ name: 'Tinggi' });
    expect(hasil.name).toBe('Tinggi');
  });

  it('menolak nama yang sudah dipakai', async () => {
    const prisma = buatPrisma();
    prisma.priority.findUnique.mockResolvedValue(row());
    const service = new PriorityService(prisma as never);
    await expect(service.create({ name: 'Tinggi' })).rejects.toThrow(DomainError);
  });

  it('melempar DomainError kalau id tidak ditemukan', async () => {
    const prisma = buatPrisma();
    prisma.priority.findUnique.mockResolvedValue(null);
    const service = new PriorityService(prisma as never);
    await expect(service.findById(99)).rejects.toThrow(DomainError);
  });

  it('menolak hapus prioritas yang masih dipakai tiket', async () => {
    const prisma = buatPrisma();
    prisma.priority.findUnique.mockResolvedValue(row());
    prisma.ticket.count.mockResolvedValue(1);
    const service = new PriorityService(prisma as never);
    await expect(service.remove(1)).rejects.toThrow(DomainError);
  });

  it('menghapus prioritas yang tidak dipakai tiket', async () => {
    const prisma = buatPrisma();
    prisma.priority.findUnique.mockResolvedValue(row());
    prisma.ticket.count.mockResolvedValue(0);
    const service = new PriorityService(prisma as never);
    await service.remove(1);
    expect(prisma.priority.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});