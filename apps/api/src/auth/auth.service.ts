import { Injectable } from '@nestjs/common';
import { ErrorCode, type AgentProfile } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { DomainError } from '../common/domain.error.js';

/** Diwarisi dari config osTicket: staff_max_logins = 4 */
export const MAKS_GAGAL = 4;
/** Diwarisi dari config osTicket: staff_login_timeout = 2 (menit) */
export const KUNCI_MENIT = 2;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly session: SessionService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ agent: AgentProfile; sessionId: string }> {
    const agent = await this.prisma.agent.findUnique({
      where: { email },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });

    // Pesan yang sama untuk email tidak dikenal, password salah, dan akun
    // nonaktif — supaya tidak bisa dipakai menebak email mana yang terdaftar.
    if (!agent || !agent.isActive) {
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Email atau password salah.', 401);
    }

    if (agent.lockedUntil && agent.lockedUntil > new Date()) {
      throw new DomainError(
        ErrorCode.ACCOUNT_LOCKED,
        `Akun terkunci sementara. Coba lagi dalam ${KUNCI_MENIT} menit.`,
        423,
      );
    }

    const cocok = await this.password.verify(agent.passwordHash, password);
    if (!cocok) {
      const gagal = agent.failedLogins + 1;
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          failedLogins: gagal,
          lockedUntil: gagal >= MAKS_GAGAL ? new Date(Date.now() + KUNCI_MENIT * 60_000) : null,
        },
      });
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Email atau password salah.', 401);
    }

    if (agent.failedLogins > 0 || agent.lockedUntil) {
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }

    const permissions = agent.roles.flatMap((ar) =>
      ar.role.permissions.map((rp) => rp.permission.key),
    );

    return {
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        permissions: [...new Set(permissions)],
      },
      sessionId: await this.session.create(agent.id),
    };
  }
}
