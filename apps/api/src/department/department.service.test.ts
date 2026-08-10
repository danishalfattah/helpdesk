import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@helpdesk/contract';
import { DepartmentService } from './department.service.js';

function buatPrismaPalsu() {
  return {
    department: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('DepartmentService', () => {
  let prisma: ReturnType<typeof buatPrismaPalsu>;
  let service: DepartmentService;

  beforeEach(() => {
    prisma = buatPrismaPalsu();
    service = new DepartmentService(prisma as never);
  });

  describe('create', () => {
    it('berhasil membuat department induk (tanpa parentId)', async () => {
      prisma.department.findUnique.mockResolvedValueOnce(null); // cek nama belum dipakai
      prisma.department.create.mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null });

      const hasil = await service.create({ name: 'IT' });

      expect(hasil.name).toBe('IT');
      expect(prisma.department.create).toHaveBeenCalledWith({ data: { name: 'IT', parentId: null } });
    });

    it('berhasil membuat department anak dari induk yang valid', async () => {
      prisma.department.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null }) // cek induk
        .mockResolvedValueOnce(null); // cek nama
      prisma.department.create.mockResolvedValueOnce({ id: 2, name: 'Jaringan', isActive: true, parentId: 1 });

      const hasil = await service.create({ name: 'Jaringan', parentId: 1 });

      expect(hasil.parentId).toBe(1);
    });

    it('menolak kalau induk yang dipilih tidak ditemukan', async () => {
      prisma.department.findUnique.mockResolvedValueOnce(null);

      await expect(service.create({ name: 'Jaringan', parentId: 99 })).rejects.toMatchObject({
        code: ErrorCode.DEPARTMENT_INVALID_PARENT,
      });
    });

    it('menolak kalau induk yang dipilih sendiri sudah punya induk (mencegah 3 tingkat)', async () => {
      prisma.department.findUnique.mockResolvedValueOnce({ id: 2, name: 'Jaringan', isActive: true, parentId: 1 });

      await expect(service.create({ name: 'Wifi', parentId: 2 })).rejects.toMatchObject({
        code: ErrorCode.DEPARTMENT_INVALID_PARENT,
      });
    });

    it('menolak nama yang sudah dipakai', async () => {
      prisma.department.findUnique.mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null });

      await expect(service.create({ name: 'IT' })).rejects.toMatchObject({
        code: ErrorCode.DEPARTMENT_NAME_TAKEN,
      });
    });
  });

  describe('update', () => {
    it('menolak memindahkan department yang punya anak jadi anak department lain', async () => {
      prisma.department.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null }) // findOne di awal
        .mockResolvedValueOnce({ id: 3, name: 'Umum', isActive: true, parentId: null }); // calon induk baru valid
      prisma.department.count.mockResolvedValueOnce(2); // department 1 masih punya 2 anak

      await expect(service.update(1, { parentId: 3 })).rejects.toMatchObject({
        code: ErrorCode.DEPARTMENT_INVALID_PARENT,
      });
    });
  });

  describe('remove', () => {
    it('menolak menghapus department yang masih punya anak', async () => {
      prisma.department.findUnique.mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null });
      prisma.department.count.mockResolvedValueOnce(1);

      await expect(service.remove(1)).rejects.toMatchObject({ code: ErrorCode.DEPARTMENT_HAS_CHILDREN });
      expect(prisma.department.delete).not.toHaveBeenCalled();
    });

    it('berhasil menghapus department tanpa anak', async () => {
      prisma.department.findUnique.mockResolvedValueOnce({ id: 2, name: 'Jaringan', isActive: true, parentId: 1 });
      prisma.department.count.mockResolvedValueOnce(0);
      prisma.department.delete.mockResolvedValueOnce({ id: 2 });

      await service.remove(2);

      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });
  });
});
