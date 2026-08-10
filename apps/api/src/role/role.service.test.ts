import { describe, it, expect, vi } from 'vitest';
import { DomainError } from '../common/domain.error.js';
import { RoleService } from './role.service.js';

function buatPrisma() {
  return {
    role: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    permission: { findUnique: vi.fn(), findMany: vi.fn() },
    agentRole: { count: vi.fn() },
    rolePermission: { deleteMany: vi.fn(), upsert: vi.fn() },
  };
}

const roleRow = (over: Record<string, unknown> = {}) => ({
  id: 1, name: 'Supervisor', description: null, permissions: [], ...over,
});

describe('RoleService', () => {
  describe('create', () => {
    it('membuat role baru saat nama belum dipakai', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue(roleRow());
      const service = new RoleService(prisma as never);
      const hasil = await service.create({ name: 'Supervisor' });
      expect(hasil.name).toBe('Supervisor');
    });

    it('menolak nama yang sudah dipakai role lain', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      const service = new RoleService(prisma as never);
      await expect(service.create({ name: 'Supervisor' })).rejects.toThrow(DomainError);
    });
  });

  describe('findById', () => {
    it('melempar DomainError kalau role tidak ada', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(null);
      const service = new RoleService(prisma as never);
      await expect(service.findById(99)).rejects.toThrow(DomainError);
    });

    it('mengembalikan role kalau ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      const service = new RoleService(prisma as never);
      const hasil = await service.findById(1);
      expect(hasil.id).toBe(1);
    });
  });

  describe('update', () => {
    it('menolak ganti nama ke nama yang sudah dipakai role lain', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique
        .mockResolvedValueOnce(roleRow({ id: 1, name: 'Supervisor' }))
        .mockResolvedValueOnce(roleRow({ id: 2, name: 'Admin' }));
      const service = new RoleService(prisma as never);
      await expect(service.update(1, { name: 'Admin' })).rejects.toThrow(DomainError);
    });
  });

  describe('remove', () => {
    it('menolak hapus role yang masih dipakai agent', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      prisma.agentRole.count.mockResolvedValue(2);
      const service = new RoleService(prisma as never);
      await expect(service.remove(1)).rejects.toThrow(DomainError);
    });

    it('menghapus role yang tidak dipakai siapa pun', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      prisma.agentRole.count.mockResolvedValue(0);
      const service = new RoleService(prisma as never);
      await service.remove(1);
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('assignPermission', () => {
    it('menolak assign permission yang tidak ada', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      prisma.permission.findUnique.mockResolvedValue(null);
      const service = new RoleService(prisma as never);
      await expect(service.assignPermission(1, 99)).rejects.toThrow(DomainError);
    });

    it('mengizinkan assign permission yang valid, idempoten', async () => {
      const prisma = buatPrisma();
      prisma.role.findUnique.mockResolvedValue(roleRow());
      prisma.permission.findUnique.mockResolvedValue({ id: 5, key: 'ticket.edit', label: 'Edit tiket' });
      const service = new RoleService(prisma as never);
      await service.assignPermission(1, 5);
      expect(prisma.rolePermission.upsert).toHaveBeenCalled();
    });
  });
});