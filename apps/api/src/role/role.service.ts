import { Injectable } from '@nestjs/common';
import type { CreateRoleRequest, RoleResponse, UpdateRoleRequest } from '@helpdesk/contract';
import { ErrorCode } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

type RoleRow = {
  id: number;
  name: string;
  description: string | null;
  permissions: { permission: { id: number; key: string; label: string } }[];
};

function toResponse(row: RoleRow): RoleResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: row.permissions.map((rp) => rp.permission),
  };
}

const includePermissions = { permissions: { include: { permission: true } } } as const;

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRoleRequest): Promise<RoleResponse> {
    const ada = await this.prisma.role.findUnique({ where: { name: input.name } });
    if (ada) throw new DomainError(ErrorCode.ROLE_NAME_TAKEN, 'Nama role sudah dipakai.');

    const dibuat = await this.prisma.role.create({
      data: { name: input.name, description: input.description ?? null },
      include: includePermissions,
    });
    return toResponse(dibuat as RoleRow);
  }

  async list(): Promise<RoleResponse[]> {
    const semua = await this.prisma.role.findMany({ include: includePermissions });
    return (semua as RoleRow[]).map(toResponse);
  }

  async findById(id: number): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id }, include: includePermissions });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role tidak ditemukan.', 404);
    return toResponse(role as RoleRow);
  }

  async update(id: number, input: UpdateRoleRequest): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role tidak ditemukan.', 404);

    if (input.name) {
      const dipakai = await this.prisma.role.findUnique({ where: { name: input.name } });
      if (dipakai && dipakai.id !== id) {
        throw new DomainError(ErrorCode.ROLE_NAME_TAKEN, 'Nama role sudah dipakai.');
      }
    }

    const diubah = await this.prisma.role.update({ where: { id }, data: input, include: includePermissions });
    return toResponse(diubah as RoleRow);
  }

  async remove(id: number): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role tidak ditemukan.', 404);

    const jumlahAgent = await this.prisma.agentRole.count({ where: { roleId: id } });
    if (jumlahAgent > 0) {
      throw new DomainError(ErrorCode.ROLE_IN_USE, 'Role masih dipakai agent, tidak bisa dihapus.');
    }

    // Hapus baris anak dulu — onDelete: NoAction, tidak ada cascade otomatis.
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
  }

  async assignPermission(roleId: number, permissionId: number): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new DomainError(ErrorCode.ROLE_NOT_FOUND, 'Role tidak ditemukan.', 404);

    const permission = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) throw new DomainError(ErrorCode.PERMISSION_NOT_FOUND, 'Permission tidak ditemukan.', 404);

    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  }

  async removePermission(roleId: number, permissionId: number): Promise<void> {
    await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }
}