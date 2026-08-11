import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@helpdesk/contract';
import { AgentService } from './agent.service.js';

function buatPrismaPalsu() {
  return {
    agent: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    role: { findMany: vi.fn() },
    agentRole: { upsert: vi.fn(), deleteMany: vi.fn() },
  };
}

function buatPasswordsPalsu() {
  return { hash: vi.fn().mockResolvedValue('hash-palsu'), verify: vi.fn() };
}

const agentRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  email: 'agent@socfindo.co.id',
  name: 'Agen Satu',
  isActive: true,
  roles: [],
  ...over,
});

describe('AgentService', () => {
  let prisma: ReturnType<typeof buatPrismaPalsu>;
  let passwords: ReturnType<typeof buatPasswordsPalsu>;
  let service: AgentService;

  beforeEach(() => {
    prisma = buatPrismaPalsu();
    passwords = buatPasswordsPalsu();
    service = new AgentService(prisma as never, passwords as never);
  });

  describe('create', () => {
    it('membuat agent baru dan hash password saat email belum dipakai', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(null);
      prisma.agent.create.mockResolvedValueOnce(agentRow());

      const hasil = await service.create({
        email: 'agent@socfindo.co.id',
        name: 'Agen Satu',
        password: 'password123',
      });

      expect(hasil.email).toBe('agent@socfindo.co.id');
      expect(passwords.hash).toHaveBeenCalledWith('password123');
      expect(prisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ passwordHash: 'hash-palsu' }) }),
      );
    });

    it('menolak email yang sudah dipakai agent lain', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(agentRow());

      await expect(
        service.create({ email: 'agent@socfindo.co.id', name: 'Agen Satu', password: 'password123' }),
      ).rejects.toMatchObject({ code: ErrorCode.AGENT_EMAIL_TAKEN });
      expect(prisma.agent.create).not.toHaveBeenCalled();
    });

    it('menolak roleId yang tidak ada saat membuat agent dengan role', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(null);
      prisma.role.findMany.mockResolvedValueOnce([{ id: 1, name: 'Supervisor' }]);

      await expect(
        service.create({
          email: 'agent@socfindo.co.id',
          name: 'Agen Satu',
          password: 'password123',
          roleIds: [1, 99],
        }),
      ).rejects.toMatchObject({ code: ErrorCode.ROLE_NOT_FOUND });
      expect(prisma.agent.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('menolak update kalau agent tidak ditemukan', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(null);

      await expect(service.update(99, { isActive: false })).rejects.toMatchObject({
        code: ErrorCode.AGENT_NOT_FOUND,
      });
    });

    it('menonaktifkan agent lewat isActive', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(agentRow());
      prisma.agent.update.mockResolvedValueOnce(agentRow({ isActive: false }));

      const hasil = await service.update(1, { isActive: false });

      expect(hasil.isActive).toBe(false);
      expect(prisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { isActive: false } }),
      );
    });
  });

  describe('assignRole', () => {
    it('menolak assign role yang tidak ada', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(agentRow());
      prisma.role.findMany.mockResolvedValueOnce([]);

      await expect(service.assignRole(1, 99)).rejects.toMatchObject({ code: ErrorCode.ROLE_NOT_FOUND });
      expect(prisma.agentRole.upsert).not.toHaveBeenCalled();
    });

    it('menolak assign role kalau agent tidak ada', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(null);

      await expect(service.assignRole(99, 1)).rejects.toMatchObject({ code: ErrorCode.AGENT_NOT_FOUND });
    });

    it('mengizinkan assign role yang valid, idempoten', async () => {
      prisma.agent.findUnique.mockResolvedValueOnce(agentRow());
      prisma.role.findMany.mockResolvedValueOnce([{ id: 2, name: 'Supervisor' }]);

      await service.assignRole(1, 2);

      expect(prisma.agentRole.upsert).toHaveBeenCalledWith({
        where: { agentId_roleId: { agentId: 1, roleId: 2 } },
        create: { agentId: 1, roleId: 2 },
        update: {},
      });
    });
  });

  describe('removeRole', () => {
    it('menghapus baris AgentRole', async () => {
      await service.removeRole(1, 2);
      expect(prisma.agentRole.deleteMany).toHaveBeenCalledWith({ where: { agentId: 1, roleId: 2 } });
    });
  });
});
