import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export const SESSION_COOKIE = 'helpdesk_session';
export const SESSION_TTL_MENIT = 30;

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(agentId: number): Promise<string> {
    const id = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MENIT * 60_000);
    await this.prisma.session.create({ data: { id, agentId, expiresAt } });
    return id;
  }

  async destroy(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }
}
