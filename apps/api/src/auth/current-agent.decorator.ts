import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AgentProfile } from '@helpdesk/contract';

/**
 * Ambil profil agent yang lagi login — sudah ditempel PermissionGuard ke
 * req.agent (lihat permission.guard.ts), decorator ini cuma jalan pintas
 * biar controller nggak perlu tulis @Req() lalu cast manual tiap kali.
 */
export const CurrentAgent = createParamDecorator((_: unknown, ctx: ExecutionContext): AgentProfile => {
  const req = ctx.switchToHttp().getRequest<Request & { agent: AgentProfile }>();
  return req.agent;
});