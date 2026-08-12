import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@helpdesk/contract';
import { TicketService } from './ticket.service.js';

function buatPrismaPalsu() {
  return {
    ticket: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), aggregate: vi.fn() },
    department: { findUnique: vi.fn() },
    category: { findUnique: vi.fn() },
    categoryDepartment: { findMany: vi.fn() },
    priority: { findUnique: vi.fn() },
    ticketStatus: { findUnique: vi.fn() },
    requester: { upsert: vi.fn() },
    agent: { findUnique: vi.fn() },
  };
}

function buatThreadEventsPalsu() {
  return { record: vi.fn() };
}

const tiketTerbuka = (over: Record<string, unknown> = {}) => ({
  id: 1,
  number: 1000015,
  subject: 'Laptop tidak bisa nyala',
  requesterId: 10,
  departmentId: 1,
  categoryId: null,
  statusId: 2,
  priorityId: 3,
  assigneeId: null,
  status: { id: 2, name: 'New', isClosed: false, sortOrder: 1 },
  ...over,
});

const inputDasar = {
  subject: 'Laptop tidak bisa nyala',
  description: 'Sudah dicoba charge semalaman, tetap tidak menyala.',
  requesterEmail: 'pelapor@socfindo.co.id',
  requesterName: 'Budi',
  departmentId: 1,
};

describe('TicketService', () => {
  let prisma: ReturnType<typeof buatPrismaPalsu>;
  let threadEvents: ReturnType<typeof buatThreadEventsPalsu>;
  let service: TicketService;

  beforeEach(() => {
    prisma = buatPrismaPalsu();
    threadEvents = buatThreadEventsPalsu();
    service = new TicketService(prisma as never, threadEvents as never);

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

  describe('update', () => {
    it('menolak update apa pun kalau tiket sudah closed', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(
        tiketTerbuka({ status: { id: 8, name: 'Resolved', isClosed: true, sortOrder: 8 } }),
      );
      await expect(service.update(1, 7, { subject: 'Ganti subjek' })).rejects.toMatchObject({
        code: ErrorCode.TICKET_CLOSED,
      });
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('mengubah subjek tiket yang masih terbuka, tanpa mencatat ThreadEvent', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ subject: 'Ganti subjek' }));

      const hasil = await service.update(1, 7, { subject: 'Ganti subjek' });

      expect(hasil.subject).toBe('Ganti subjek');
      expect(prisma.ticket.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { subject: 'Ganti subjek' } });
      expect(threadEvents.record).not.toHaveBeenCalled();
    });

    it('set closedAt otomatis DAN mencatat ThreadEvent status_changed saat status berubah', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      prisma.ticketStatus.findUnique
        .mockResolvedValueOnce({ id: 8, name: 'Resolved', isClosed: true, sortOrder: 8 }) // pastikanStatusAda
        .mockResolvedValueOnce({ id: 8, name: 'Resolved', isClosed: true, sortOrder: 8 }); // ambil nama buat event
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ statusId: 8 }));

      await service.update(1, 7, { statusId: 8 });

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { statusId: 8, closedAt: expect.any(Date) },
      });
      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'status_changed', 'New', 'Resolved');
    });

    it('mencatat ThreadEvent department_changed saat department berubah', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka({ departmentId: 1 }));
      prisma.department.findUnique
        .mockResolvedValueOnce({ id: 2, name: 'HR', isActive: true, parentId: null }) // pastikanDepartmentAda (baru)
        .mockResolvedValueOnce({ id: 1, name: 'IT', isActive: true, parentId: null }) // deptLama
        .mockResolvedValueOnce({ id: 2, name: 'HR', isActive: true, parentId: null }); // deptBaru
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ departmentId: 2 }));

      await service.update(1, 7, { departmentId: 2 });

      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'department_changed', 'IT', 'HR');
    });

    it('menolak categoryId baru yang scoping-nya tidak cocok dengan department tiket', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka({ departmentId: 1 }));
      prisma.category.findUnique.mockResolvedValueOnce({ id: 5, name: 'Jaringan', isActive: true, parentId: null });
      prisma.categoryDepartment.findMany.mockResolvedValueOnce([{ categoryId: 5, departmentId: 2 }]);

      await expect(service.update(1, 7, { categoryId: 5 })).rejects.toMatchObject({
        code: ErrorCode.TICKET_CATEGORY_NOT_ALLOWED,
      });
    });

    it('menolak update kalau tiket tidak ada', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(null);
      await expect(service.update(99, 7, { subject: 'x' })).rejects.toMatchObject({ code: ErrorCode.TICKET_NOT_FOUND });
    });
  });

  describe('reopen', () => {
    it('menolak reopen kalau tiket belum closed', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      await expect(service.reopen(1, 7)).rejects.toMatchObject({ code: ErrorCode.TICKET_NOT_CLOSED });
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('memindahkan status ke Re-Opened, mengosongkan closedAt, dan mencatat ThreadEvent', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(
        tiketTerbuka({ status: { id: 8, name: 'Resolved', isClosed: true, sortOrder: 8 } }),
      );
      prisma.ticketStatus.findUnique.mockResolvedValueOnce({ id: 5, name: 'Re-Opened', isClosed: false, sortOrder: 5 });
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ statusId: 5 }));

      await service.reopen(1, 7);

      expect(prisma.ticket.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { statusId: 5, closedAt: null } });
      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'status_changed', 'Resolved', 'Re-Opened');
    });
  });

  describe('assign', () => {
    it('menugaskan tiket ke agent yang aktif, tanpa mengubah status kalau bukan status default', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(
        tiketTerbuka({ statusId: 6, status: { id: 6, name: 'Work In Progress', isClosed: false, sortOrder: 3 } }),
      );
      prisma.agent.findUnique.mockResolvedValueOnce({ id: 20, name: 'Citra', isActive: true });
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ assigneeId: 20 }));

      const hasil = await service.assign(1, 7, 20);

      expect(hasil.assigneeId).toBe(20);
      expect(prisma.ticket.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { assigneeId: 20 } });
      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'assignee_changed', null, 'Citra');
      expect(threadEvents.record).toHaveBeenCalledTimes(1);
    });

    it('memindahkan status ke Open kalau tiket masih berstatus default (New)', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      prisma.agent.findUnique.mockResolvedValueOnce({ id: 20, name: 'Citra', isActive: true });
      prisma.ticketStatus.findUnique
        .mockResolvedValueOnce({ id: 2, name: 'New', isClosed: false, sortOrder: 1 }) // statusAwalId()
        .mockResolvedValueOnce({ id: 5, name: 'Open', isClosed: false, sortOrder: 2 }); // statusByName('Open')
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ assigneeId: 20, statusId: 5 }));

      await service.assign(1, 7, 20);

      expect(prisma.ticket.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { assigneeId: 20, statusId: 5 } });
      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'assignee_changed', null, 'Citra');
      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'status_changed', 'New', 'Open');
    });

    it('mencatat nama assignee lama di ThreadEvent saat reassign ke orang lain', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(
        tiketTerbuka({
          statusId: 6,
          status: { id: 6, name: 'Work In Progress', isClosed: false, sortOrder: 3 },
          assigneeId: 15,
        }),
      );
      prisma.agent.findUnique
        .mockResolvedValueOnce({ id: 20, name: 'Citra', isActive: true }) // target
        .mockResolvedValueOnce({ id: 15, name: 'Doni', isActive: true }); // assignee lama
      prisma.ticket.update.mockResolvedValueOnce(tiketTerbuka({ assigneeId: 20 }));

      await service.assign(1, 7, 20);

      expect(threadEvents.record).toHaveBeenCalledWith(1, 7, 'assignee_changed', 'Doni', 'Citra');
    });

    it('menolak assign ke agent yang tidak ada', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      prisma.agent.findUnique.mockResolvedValueOnce(null);

      await expect(service.assign(1, 7, 99)).rejects.toMatchObject({ code: ErrorCode.AGENT_NOT_FOUND });
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('menolak assign ke agent yang nonaktif', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(tiketTerbuka());
      prisma.agent.findUnique.mockResolvedValueOnce({ id: 20, name: 'Citra', isActive: false });

      await expect(service.assign(1, 7, 20)).rejects.toMatchObject({ code: ErrorCode.AGENT_NOT_FOUND });
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('menolak assign tiket yang sudah closed', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(
        tiketTerbuka({ status: { id: 8, name: 'Resolved', isClosed: true, sortOrder: 8 } }),
      );

      await expect(service.assign(1, 7, 20)).rejects.toMatchObject({ code: ErrorCode.TICKET_CLOSED });
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('menolak assign kalau tiket tidak ada', async () => {
      prisma.ticket.findUnique.mockResolvedValueOnce(null);
      await expect(service.assign(99, 7, 20)).rejects.toMatchObject({ code: ErrorCode.TICKET_NOT_FOUND });
    });
  });
});