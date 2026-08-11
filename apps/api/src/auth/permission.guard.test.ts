import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from './permission.guard.js';

function buatContext(cookies: Record<string, string>) {
  const req: Record<string, unknown> = { cookies };
  const res = { cookie: vi.fn() };
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function buatReflector(permission: string | undefined) {
  return { getAllAndOverride: vi.fn().mockReturnValue(permission) };
}

function buatPrisma(sesi: unknown) {
  return {
    session: { findUnique: vi.fn().mockResolvedValue(sesi), update: vi.fn().mockResolvedValue(undefined) },
  };
}

const sesiValid = (permissions: string[]) => ({
  expiresAt: new Date(Date.now() + 60_000),
  agent: {
    id: 1, email: 'a@b.com', name: 'A', isActive: true,
    roles: [{ role: { permissions: permissions.map((k) => ({ permission: { key: k } })) } }],
  },
});

describe('PermissionGuard', () => {
  it('meloloskan endpoint tanpa @RequirePermission asalkan sudah login', async () => {
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(sesiValid([])) as never);
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).resolves.toBe(true);
  });

  it('menolak tanpa cookie sesi', async () => {
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(null) as never);
    await expect(guard.canActivate(buatContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it('menolak sesi yang sudah kedaluwarsa', async () => {
    const kedaluwarsa = { ...sesiValid([]), expiresAt: new Date(Date.now() - 1000) };
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(kedaluwarsa) as never);
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).rejects.toThrow(UnauthorizedException);
  });

  it('meloloskan agent yang punya permission yang diminta', async () => {
    const guard = new PermissionGuard(
      buatReflector('ticket.edit') as never,
      buatPrisma(sesiValid(['ticket.view', 'ticket.edit'])) as never,
    );
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).resolves.toBe(true);
  });

  it('menolak agent yang tidak punya permission yang diminta', async () => {
    const guard = new PermissionGuard(
      buatReflector('ticket.delete') as never,
      buatPrisma(sesiValid(['ticket.view'])) as never,
    );
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).rejects.toThrow(ForbiddenException);
  });

  describe('perpanjangan sesi (idle timeout)', () => {
    it('memperpanjang expiresAt di DB dan refresh cookie tiap request yang lolos autentikasi', async () => {
      const prisma = buatPrisma(sesiValid([]));
      const guard = new PermissionGuard(buatReflector(undefined) as never, prisma as never);
      const context = buatContext({ helpdesk_session: 'abc' });

      await guard.canActivate(context);

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'abc' },
        data: { expiresAt: expect.any(Date) },
      });
      expect(context.switchToHttp().getResponse().cookie).toHaveBeenCalledWith(
        'helpdesk_session',
        'abc',
        expect.objectContaining({ maxAge: 30 * 60_000 }),
      );
    });

    it('tidak memperpanjang sesi yang sudah kedaluwarsa', async () => {
      const kedaluwarsa = { ...sesiValid([]), expiresAt: new Date(Date.now() - 1000) };
      const prisma = buatPrisma(kedaluwarsa);
      const guard = new PermissionGuard(buatReflector(undefined) as never, prisma as never);

      await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.session.update).not.toHaveBeenCalled();
    });
  });
});