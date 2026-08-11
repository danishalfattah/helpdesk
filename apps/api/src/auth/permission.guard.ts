import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_COOKIE, SESSION_TTL_MENIT, sessionCookieOptions } from './session.service.js';
import { PERMISSION_KEY } from './require-permission.decorator.js';

/**
 * Menjawab satu pertanyaan saja: boleh tidak agent ini melakukan aksi ini?
 *
 * Pertanyaan "boleh tidak menyentuh baris ini" dijawab service layer lewat
 * filter departmentId — dua pertanyaan berbeda, dua mekanisme berbeda (spec §6).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException('Belum login.');

    const sesi = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        agent: {
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        },
      },
    });

    if (!sesi || sesi.expiresAt <= new Date() || !sesi.agent.isActive) {
      throw new UnauthorizedException('Sesi tidak berlaku lagi.');
    }

    // Idle timeout (spec §6, staff_session_timeout = 30 menit), bukan batas
    // absolut sejak login — tiap request yang lolos autentikasi menggeser
    // batas waktu ke depan, di DB maupun cookie di browser.
    const expiresAt = new Date(Date.now() + SESSION_TTL_MENIT * 60_000);
    await this.prisma.session.update({ where: { id: sessionId }, data: { expiresAt } });
    context.switchToHttp().getResponse<Response>().cookie(SESSION_COOKIE, sessionId, sessionCookieOptions);

    const permissions = new Set(
      sesi.agent.roles.flatMap((ar) => ar.role.permissions.map((rp) => rp.permission.key)),
    );

    // Ditempelkan supaya controller dan service tidak perlu query ulang.
    (req as Request & { agent?: unknown }).agent = {
      id: sesi.agent.id,
      email: sesi.agent.email,
      name: sesi.agent.name,
      permissions: [...permissions],
    };

    const diminta = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!diminta) return true;
    if (permissions.has(diminta)) return true;

    throw new ForbiddenException(`Butuh izin: ${diminta}`);
  }
}