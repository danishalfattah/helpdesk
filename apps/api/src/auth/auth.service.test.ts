import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, MAKS_GAGAL, KUNCI_MENIT } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { DomainError } from '../common/domain.error.js';
import { ErrorCode } from '@helpdesk/contract';

function buatPrismaPalsu(agent: unknown) {
  return {
    agent: {
      findUnique: vi.fn().mockResolvedValue(agent),
      update: vi.fn().mockResolvedValue(undefined),
    },
  };
}

const sessionPalsu = { create: vi.fn().mockResolvedValue('sesi-abc') };

describe('AuthService.login', () => {
  const password = new PasswordService();
  let hash: string;

  beforeEach(async () => {
    hash = await password.hash('rahasia123');
    sessionPalsu.create.mockClear();
  });

  it('mengembalikan profil agent dan id sesi saat kredensial benar', async () => {
    const prisma = buatPrismaPalsu({
      id: 1,
      email: 'admin@socfindo.co.id',
      name: 'Admin',
      passwordHash: hash,
      isActive: true,
      failedLogins: 0,
      lockedUntil: null,
      roles: [{ role: { permissions: [{ permission: { key: 'ticket.view' } }] } }],
    });

    const service = new AuthService(prisma as never, password, sessionPalsu as never);
    const hasil = await service.login('admin@socfindo.co.id', 'rahasia123');

    expect(hasil.agent.email).toBe('admin@socfindo.co.id');
    expect(hasil.agent.permissions).toEqual(['ticket.view']);
    expect(hasil.sessionId).toBe('sesi-abc');
  });

  it('menolak password salah dengan INVALID_CREDENTIALS', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: true, failedLogins: 0, lockedUntil: null, roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'salah-total')).rejects.toThrow(DomainError);
  });

  it('memakai INVALID_CREDENTIALS juga untuk email tidak dikenal', async () => {
    const prisma = buatPrismaPalsu(null);
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('tidakada@b.com', 'apa-saja')).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('menolak akun yang sedang terkunci dengan ACCOUNT_LOCKED', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: true, failedLogins: MAKS_GAGAL,
      lockedUntil: new Date(Date.now() + KUNCI_MENIT * 60_000), roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'rahasia123')).rejects.toMatchObject({
      code: ErrorCode.ACCOUNT_LOCKED,
    });
  });

  it('menolak agent nonaktif', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: false, failedLogins: 0, lockedUntil: null, roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'rahasia123')).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });
});
