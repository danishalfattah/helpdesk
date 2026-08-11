import { Injectable } from '@nestjs/common';
import { ErrorCode, type AgentDto } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from '../auth/password.service.js';
import { DomainError } from '../common/domain.error.js';

interface CreateInput {
  email: string;
  name: string;
  password: string;
  roleIds?: number[];
}

interface UpdateInput {
  name?: string;
  isActive?: boolean;
}

type AgentRow = {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  roles: { role: { id: number; name: string } }[];
};

function toResponse(row: AgentRow): AgentDto {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isActive: row.isActive,
    roles: row.roles.map((ar) => ar.role),
  };
}

const includeRoles = { roles: { include: { role: true } } } as const;

@Injectable()
export class AgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async list(): Promise<AgentDto[]> {
    const semua = await this.prisma.agent.findMany({ include: includeRoles, orderBy: { name: 'asc' } });
    return (semua as AgentRow[]).map(toResponse);
  }

  async findOne(id: number): Promise<AgentDto> {
    const agent = await this.prisma.agent.findUnique({ where: { id }, include: includeRoles });
    if (!agent) {
      throw new DomainError(ErrorCode.AGENT_NOT_FOUND, 'Agent tidak ditemukan.', 404);
    }
    return toResponse(agent as AgentRow);
  }

  async create(input: CreateInput): Promise<AgentDto> {
    const dipakai = await this.prisma.agent.findUnique({ where: { email: input.email } });
    if (dipakai) {
      throw new DomainError(ErrorCode.AGENT_EMAIL_TAKEN, `Email "${input.email}" sudah dipakai.`, 409);
    }

    const roleIds = input.roleIds ?? [];
    if (roleIds.length > 0) {
      await this.pastikanSemuaRoleAda(roleIds);
    }

    const passwordHash = await this.passwords.hash(input.password);
    const dibuat = await this.prisma.agent.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      include: includeRoles,
    });
    return toResponse(dibuat as AgentRow);
  }

  async update(id: number, input: UpdateInput): Promise<AgentDto> {
    await this.findOne(id);

    const diubah = await this.prisma.agent.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: includeRoles,
    });
    return toResponse(diubah as AgentRow);
  }

  async assignRole(agentId: number, roleId: number): Promise<void> {
    await this.findOne(agentId);
    await this.pastikanSemuaRoleAda([roleId]);

    await this.prisma.agentRole.upsert({
      where: { agentId_roleId: { agentId, roleId } },
      create: { agentId, roleId },
      update: {},
    });
  }

  async removeRole(agentId: number, roleId: number): Promise<void> {
    await this.prisma.agentRole.deleteMany({ where: { agentId, roleId } });
  }

  private async pastikanSemuaRoleAda(roleIds: number[]): Promise<void> {
    const ditemukan = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });
    if (ditemukan.length !== new Set(roleIds).size) {
      throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Salah satu role tidak ditemukan.', 404);
    }
  }
}
