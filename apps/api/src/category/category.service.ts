import { Injectable } from '@nestjs/common';
import { ErrorCode, type CategoryResponse } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

interface CreateInput {
  name: string;
  parentId?: number | null;
  departmentIds?: number[];
}

interface UpdateInput {
  name?: string;
  isActive?: boolean;
  parentId?: number | null;
  departmentIds?: number[];
}

type CategoryRow = {
  id: number;
  name: string;
  isActive: boolean;
  parentId: number | null;
  departments: { departmentId: number }[];
};

function toResponse(row: CategoryRow): CategoryResponse {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    parentId: row.parentId,
    departmentIds: row.departments.map((d) => d.departmentId),
  };
}

const includeDepartments = { departments: true } as const;

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CategoryResponse[]> {
    const semua = await this.prisma.category.findMany({ include: includeDepartments, orderBy: { name: 'asc' } });
    return (semua as CategoryRow[]).map(toResponse);
  }

  async findOne(id: number): Promise<CategoryResponse> {
    const kat = await this.prisma.category.findUnique({ where: { id }, include: includeDepartments });
    if (!kat) throw new DomainError(ErrorCode.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
    return toResponse(kat as CategoryRow);
  }

  async create(input: CreateInput): Promise<CategoryResponse> {
    if (input.parentId != null) {
      await this.pastikanBolehJadiInduk(input.parentId);
    }
    await this.pastikanNamaBelumDipakai(input.name, input.parentId ?? null);

    const dibuat = await this.prisma.category.create({
      data: { name: input.name, parentId: input.parentId ?? null },
      include: includeDepartments,
    });

    if (input.departmentIds && input.departmentIds.length > 0) {
      await this.assignDepartments(dibuat.id, input.departmentIds);
      return this.findOne(dibuat.id);
    }

    return toResponse(dibuat as CategoryRow);
  }

  async update(id: number, input: UpdateInput): Promise<CategoryResponse> {
    const kat = await this.findOneMentah(id);

    if (input.name !== undefined) {
      const parentTarget = input.parentId !== undefined ? input.parentId : kat.parentId;
      await this.pastikanNamaBelumDipakai(input.name, parentTarget, id);
    }

    if (input.parentId !== undefined && input.parentId !== kat.parentId) {
      if (input.parentId === id) {
        throw new DomainError(ErrorCode.CATEGORY_INVALID_PARENT, 'Kategori tidak bisa menjadi induk dirinya sendiri.', 422);
      }

      if (input.parentId != null) {
        await this.pastikanBolehJadiInduk(input.parentId);

        const jumlahAnak = await this.prisma.category.count({ where: { parentId: id } });
        if (jumlahAnak > 0) {
          const parentBaru = await this.prisma.category.findUnique({ where: { id: input.parentId } });
          if (parentBaru && parentBaru.parentId != null) {
            throw new DomainError(
              ErrorCode.CATEGORY_INVALID_PARENT,
              'Kategori ini masih punya anak, tidak bisa dipindah ke bawah kategori tingkat 2 (akan melebihi 3 tingkat).',
              422,
            );
          }
        }
      }
    }

    await this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    });

    // Array kosong itu valid dan berarti "berlaku di semua department" (lihat
    // assignDepartments) -- jadi ceknya `!== undefined`, bukan truthy check,
    // supaya pengguna bisa menghapus semua department lewat form ubah.
    if (input.departmentIds !== undefined) {
      await this.assignDepartments(id, input.departmentIds);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOneMentah(id);

    const jumlahAnak = await this.prisma.category.count({ where: { parentId: id } });
    if (jumlahAnak > 0) {
      throw new DomainError(
        ErrorCode.CATEGORY_HAS_CHILDREN,
        'Kategori ini masih punya anak. Hapus atau pindahkan anaknya dulu.',
        409,
      );
    }

    await this.prisma.categoryDepartment.deleteMany({ where: { categoryId: id } });
    await this.prisma.category.delete({ where: { id } });
  }

  async assignDepartments(categoryId: number, departmentIds: number[]): Promise<void> {
    await this.findOneMentah(categoryId);

    for (const depId of departmentIds) {
      const dept = await this.prisma.department.findUnique({ where: { id: depId } });
      if (!dept) throw new DomainError(ErrorCode.DEPARTMENT_NOT_FOUND, `Department id ${depId} tidak ditemukan.`, 422);
    }

    await this.prisma.categoryDepartment.deleteMany({ where: { categoryId } });
    if (departmentIds.length > 0) {
      await this.prisma.categoryDepartment.createMany({
        data: departmentIds.map((departmentId) => ({ categoryId, departmentId })),
      });
    }
  }

  private async findOneMentah(id: number) {
    const kat = await this.prisma.category.findUnique({ where: { id } });
    if (!kat) throw new DomainError(ErrorCode.CATEGORY_NOT_FOUND, 'Kategori tidak ditemukan.', 404);
    return kat;
  }

  private async pastikanBolehJadiInduk(parentId: number): Promise<void> {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId }, include: { parent: true } });
    if (!parent) {
      throw new DomainError(ErrorCode.CATEGORY_INVALID_PARENT, 'Kategori induk tidak ditemukan.', 422);
    }
    if (parent.parentId != null && (parent as { parent?: { parentId: number | null } }).parent?.parentId != null) {
      throw new DomainError(
        ErrorCode.CATEGORY_INVALID_PARENT,
        'Kategori induk yang dipilih sudah di tingkat 3 — hierarki dibatasi 3 tingkat.',
        422,
      );
    }
  }

  private async pastikanNamaBelumDipakai(name: string, parentId: number | null, excludeId?: number): Promise<void> {
    const dipakai = await this.prisma.category.findFirst({
      where: { name, parentId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (dipakai) {
      throw new DomainError(
        ErrorCode.CATEGORY_NAME_TAKEN,
        `Nama kategori "${name}" sudah dipakai di tingkat yang sama.`,
        409,
      );
    }
  }
}