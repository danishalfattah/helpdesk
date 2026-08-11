import { describe, it, expect, vi } from 'vitest';
import { DomainError } from '../common/domain.error.js';
import { CategoryService } from './category.service.js';

function buatPrisma() {
  return {
    category: {
      findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(),
    },
    categoryDepartment: { deleteMany: vi.fn(), createMany: vi.fn() },
    department: { findUnique: vi.fn() },
  };
}

const kat = (over: Record<string, unknown> = {}) => ({
  id: 1, name: 'Jaringan', isActive: true, parentId: null, departments: [], ...over,
});

describe('CategoryService', () => {
  describe('create', () => {
    it('membuat kategori tingkat atas (tanpa parent)', async () => {
      const prisma = buatPrisma();
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(kat());
      const service = new CategoryService(prisma as never);
      const hasil = await service.create({ name: 'Jaringan' });
      expect(hasil.name).toBe('Jaringan');
    });

    it('menolak parent yang tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(null);
      const service = new CategoryService(prisma as never);
      await expect(service.create({ name: 'Wifi', parentId: 99 })).rejects.toThrow(DomainError);
    });

    it('menolak parent yang sudah di tingkat 3 (bikin tingkat 4)', async () => {
      const prisma = buatPrisma();
      // parent adalah tingkat 3: parent.parent.parentId != null
      prisma.category.findUnique.mockResolvedValue(
        kat({ id: 5, parentId: 2, parent: { id: 2, parentId: 1 } }),
      );
      const service = new CategoryService(prisma as never);
      await expect(service.create({ name: 'Detail', parentId: 5 })).rejects.toThrow(DomainError);
    });

    it('menolak nama yang sudah dipakai kategori lain di parent yang sama', async () => {
      const prisma = buatPrisma();
      prisma.category.findFirst.mockResolvedValue(kat());
      const service = new CategoryService(prisma as never);
      await expect(service.create({ name: 'Jaringan' })).rejects.toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('mengganti daftar department kalau departmentIds dikirim', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      prisma.department.findUnique.mockResolvedValue({ id: 2 });
      const service = new CategoryService(prisma as never);
      await service.update(1, { departmentIds: [2] });
      expect(prisma.categoryDepartment.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 1 } });
      expect(prisma.categoryDepartment.createMany).toHaveBeenCalled();
    });

    it('array kosong tetap memanggil assignDepartments -- melepas semua batasan department', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      const service = new CategoryService(prisma as never);
      await service.update(1, { departmentIds: [] });
      expect(prisma.categoryDepartment.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 1 } });
      expect(prisma.categoryDepartment.createMany).not.toHaveBeenCalled();
    });

    it('tidak menyentuh department kalau departmentIds tidak dikirim sama sekali', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      const service = new CategoryService(prisma as never);
      await service.update(1, { name: 'Jaringan Baru' });
      expect(prisma.categoryDepartment.deleteMany).not.toHaveBeenCalled();
      expect(prisma.categoryDepartment.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('melempar DomainError kalau tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(null);
      const service = new CategoryService(prisma as never);
      await expect(service.findOne(99)).rejects.toThrow(DomainError);
    });
  });

  describe('remove', () => {
    it('menolak hapus kategori yang masih punya anak', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      prisma.category.count.mockResolvedValue(2);
      const service = new CategoryService(prisma as never);
      await expect(service.remove(1)).rejects.toThrow(DomainError);
    });

    it('menghapus kategori yang tidak punya anak', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      prisma.category.count.mockResolvedValue(0);
      const service = new CategoryService(prisma as never);
      await service.remove(1);
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('assignDepartments', () => {
    it('menolak kalau ada departmentId yang tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      prisma.department.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
      const service = new CategoryService(prisma as never);
      await expect(service.assignDepartments(1, [1, 99])).rejects.toThrow(DomainError);
    });

    it('mengganti seluruh daftar department yang valid', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      prisma.department.findUnique.mockResolvedValue({ id: 1 });
      const service = new CategoryService(prisma as never);
      await service.assignDepartments(1, [1]);
      expect(prisma.categoryDepartment.deleteMany).toHaveBeenCalledWith({ where: { categoryId: 1 } });
      expect(prisma.categoryDepartment.createMany).toHaveBeenCalled();
    });

    it('array kosong artinya lepas semua batasan department', async () => {
      const prisma = buatPrisma();
      prisma.category.findUnique.mockResolvedValue(kat());
      const service = new CategoryService(prisma as never);
      await service.assignDepartments(1, []);
      expect(prisma.categoryDepartment.deleteMany).toHaveBeenCalled();
      expect(prisma.categoryDepartment.createMany).not.toHaveBeenCalled();
    });
  });
});