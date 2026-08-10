import { Injectable } from '@nestjs/common';
import { ErrorCode, type DepartmentDto } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

interface CreateInput {
  name: string;
  parentId?: number | null;
}

interface UpdateInput {
  name?: string;
  isActive?: boolean;
  parentId?: number | null;
}

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<DepartmentDto[]> {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number): Promise<DepartmentDto> {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new DomainError(ErrorCode.DEPARTMENT_NOT_FOUND, 'Department tidak ditemukan.', 404);
    }
    return dept;
  }

  async create(input: CreateInput): Promise<DepartmentDto> {
    if (input.parentId != null) {
      await this.pastikanBolehJadiInduk(input.parentId);
    }
    await this.pastikanNamaBelumDipakai(input.name);

    return this.prisma.department.create({
      data: { name: input.name, parentId: input.parentId ?? null },
    });
  }

  async update(id: number, input: UpdateInput): Promise<DepartmentDto> {
    const dept = await this.findOne(id);

    if (input.name !== undefined && input.name !== dept.name) {
      await this.pastikanNamaBelumDipakai(input.name);
    }

    if (input.parentId !== undefined && input.parentId !== dept.parentId) {
      if (input.parentId === id) {
        throw new DomainError(
          ErrorCode.DEPARTMENT_INVALID_PARENT,
          'Department tidak bisa menjadi induk dirinya sendiri.',
          422,
        );
      }

      if (input.parentId != null) {
        await this.pastikanBolehJadiInduk(input.parentId);

        // Department yang sudah punya anak tidak boleh dipindah jadi anak
        // department lain — itu akan membuat hierarki 3 tingkat.
        const jumlahAnak = await this.prisma.department.count({ where: { parentId: id } });
        if (jumlahAnak > 0) {
          throw new DomainError(
            ErrorCode.DEPARTMENT_INVALID_PARENT,
            'Department yang sudah punya anak tidak bisa dipindah jadi anak department lain.',
            422,
          );
        }
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const jumlahAnak = await this.prisma.department.count({ where: { parentId: id } });
    if (jumlahAnak > 0) {
      throw new DomainError(
        ErrorCode.DEPARTMENT_HAS_CHILDREN,
        'Department ini masih punya anak. Hapus atau pindahkan anaknya dulu.',
        409,
      );
    }

    // TODO: begitu Ticket/AgentDepartment ada (Tahap 2+), tambahkan
    // pengecekan dependency lain di sini sebelum delete.
    await this.prisma.department.delete({ where: { id } });
  }

  private async pastikanBolehJadiInduk(parentId: number): Promise<void> {
    const parent = await this.prisma.department.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new DomainError(ErrorCode.DEPARTMENT_INVALID_PARENT, 'Department induk tidak ditemukan.', 422);
    }
    if (parent.parentId != null) {
      throw new DomainError(
        ErrorCode.DEPARTMENT_INVALID_PARENT,
        'Department induk yang dipilih sudah punya induk sendiri — hierarki dibatasi 2 tingkat.',
        422,
      );
    }
  }

  private async pastikanNamaBelumDipakai(name: string): Promise<void> {
    const dipakai = await this.prisma.department.findUnique({ where: { name } });
    if (dipakai) {
      throw new DomainError(
        ErrorCode.DEPARTMENT_NAME_TAKEN,
        `Nama department "${name}" sudah dipakai.`,
        409,
      );
    }
  }
}
