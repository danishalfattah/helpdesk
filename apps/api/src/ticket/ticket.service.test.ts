import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@helpdesk/contract';
import { TicketService } from './ticket.service.js';

function buatPrismaPalsu() {
  return {
    ticket: { findUnique: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
    department: { findUnique: vi.fn() },
    category: { findUnique: vi.fn() },
    categoryDepartment: { findMany: vi.fn() },
    priority: { findUnique: vi.fn() },
    ticketStatus: { findUnique: vi.fn() },
    requester: { upsert: vi.fn() },
  };
}

const inputDasar = {
  subject: 'Laptop tidak bisa nyala',
  description: 'Sudah dicoba charge semalaman, tetap tidak menyala.',
  requesterEmail: 'pelapor@socfindo.co.id',
  requesterName: 'Budi',
  departmentId: 1,
};

describe('TicketService', () => {
  let prisma: ReturnType<typeof buatPrismaPalsu>;
  let service: TicketService;

  beforeEach(() => {
    prisma = buatPrismaPalsu();
    service = new TicketService(prisma as never);

    prisma.department.findUnique.mockResolvedValue({ id: 1, name: 'IT', isActive: true, parentId: null });
    prisma.requester.upsert.mockResolvedValue({ id: 10, email: inputDasar.requesterEmail, name: 'Budi' });
    prisma.ticketStatus.findUnique.mockResolvedValue({ id: 2, name: 'New', isClosed: false, sortOrder: 1 });
    prisma.priority.findUnique.mockResolvedValue({ id: 3, name: 'Medium', sortOrder: 1 });
    prisma.ticket.aggregate.mockResolvedValue({ _max: { number: null } });
    prisma.ticket.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
  });

  describe('create', () => {
    it('membuat tiket dengan nomor awal 1000015 saat belum ada tiket sama sekali', async () => {
      const hasil = await service.create(inputDasar);
      expect(hasil.number).toBe(1000015);
    });

    it('nomor tiket lanjut dari MAX(number) yang ada', async () => {
      prisma.ticket.aggregate.mockResolvedValueOnce({ _max: { number: 1000020 } });
      const hasil = await service.create(inputDasar);
      expect(hasil.number).toBe(1000021);
    });

    it('mencari atau membuat requester lewat email', async () => {
      await service.create(inputDasar);
      expect(prisma.requester.upsert).toHaveBeenCalledWith({
        where: { email: inputDasar.requesterEmail },
        update: {},
        create: { email: inputDasar.requesterEmail, name: inputDasar.requesterName },
      });
    });

    it('membuat ThreadEntry pertama sekalian dari field description', async () => {
      await service.create(inputDasar);
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            threadEntries: {
              create: { authorRequesterId: 10, isInternal: false, body: inputDasar.description },
            },
          }),
        }),
      );
    });

    it('default priority ke "Medium" kalau priorityId tidak diisi', async () => {
      await service.create(inputDasar);
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priorityId: 3 }) }),
      );
    });

    it('memakai priorityId yang diisi kalau ada, tanpa fallback ke default', async () => {
      prisma.priority.findUnique.mockResolvedValueOnce({ id: 9, name: 'High', sortOrder: 0 });
      await service.create({ ...inputDasar, priorityId: 9 });
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ priorityId: 9 }) }),
      );
    });

    it('menolak department yang tidak ada', async () => {
      prisma.department.findUnique.mockResolvedValueOnce(null);
      await expect(service.create(inputDasar)).rejects.toMatchObject({ code: ErrorCode.DEPARTMENT_NOT_FOUND });
      expect(prisma.ticket.create).not.toHaveBeenCalled();
    });

    it('menolak priorityId yang tidak ada', async () => {
      prisma.priority.findUnique.mockResolvedValueOnce(null);
      await expect(service.create({ ...inputDasar, priorityId: 99 })).rejects.toMatchObject({
        code: ErrorCode.PRIORITY_NOT_FOUND,
      });
    });

    it('mengizinkan kategori tanpa batasan department (tidak ada baris CategoryDepartment)', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({ id: 5, name: 'Jaringan', isActive: true, parentId: null });
      prisma.categoryDepartment.findMany.mockResolvedValueOnce([]);
      const hasil = await service.create({ ...inputDasar, categoryId: 5 });
      expect(hasil.categoryId).toBe(5);
    });

    it('mengizinkan kategori yang department-nya cocok dengan scoping', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({ id: 5, name: 'Jaringan', isActive: true, parentId: null });
      prisma.categoryDepartment.findMany.mockResolvedValueOnce([{ categoryId: 5, departmentId: 1 }]);
      const hasil = await service.create({ ...inputDasar, categoryId: 5, departmentId: 1 });
      expect(hasil.categoryId).toBe(5);
    });

    it('menolak kategori yang scoping-nya tidak mencakup department yang dipilih', async () => {
      prisma.category.findUnique.mockResolvedValueOnce({ id: 5, name: 'Jaringan', isActive: true, parentId: null });
      prisma.categoryDepartment.findMany.mockResolvedValueOnce([{ categoryId: 5, departmentId: 2 }]);
      await expect(service.create({ ...inputDasar, categoryId: 5, departmentId: 1 })).rejects.toMatchObject({
        code: ErrorCode.TICKET_CATEGORY_NOT_ALLOWED,
      });
      expect(prisma.ticket.create).not.toHaveBeenCalled();
    });

    it('menolak categoryId yang tidak ada', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(null);
      await expect(service.create({ ...inputDasar, categoryId: 99 })).rejects.toMatchObject({
        code: ErrorCode.CATEGORY_NOT_FOUND,
      });
    });
  });

  describe('findOne', () => {
    it('melempar DomainError kalau tiket tidak ada', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99)).rejects.toMatchObject({ code: ErrorCode.TICKET_NOT_FOUND });
    });

    it('mengembalikan tiket kalau ditemukan', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce({ id: 1, number: 1000015 });
      const hasil = await service.findOne(1);
      expect(hasil.id).toBe(1);
    });
  });
});
