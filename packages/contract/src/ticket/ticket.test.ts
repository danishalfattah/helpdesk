import { describe, it, expect } from 'vitest';
import { CreateTicketRequest, UpdateTicketRequest } from './ticket.js';

const dasar = {
  subject: 'Laptop tidak bisa nyala',
  description: 'Sudah dicoba charge semalaman, tetap tidak menyala.',
  requesterEmail: 'pelapor@socfindo.co.id',
  requesterName: 'Budi',
  departmentId: 1,
};

describe('CreateTicketRequest', () => {
  it('menerima data minimal (tanpa category/priority/6 field Versa)', () => {
    expect(CreateTicketRequest.safeParse(dasar).success).toBe(true);
  });

  it('menerima data lengkap dengan 6 field Versa', () => {
    const hasil = CreateTicketRequest.safeParse({
      ...dasar,
      categoryId: 2,
      priorityId: 3,
      callType: 'Hardware',
      closureType: 'Fixed',
      location: 'Kantor Pusat',
      urgency: 'High',
      risk: 'Low',
      solution: 'Ganti baterai',
    });
    expect(hasil.success).toBe(true);
  });

  it('menolak subjek kosong', () => {
    expect(CreateTicketRequest.safeParse({ ...dasar, subject: '' }).success).toBe(false);
  });

  it('menolak deskripsi kosong', () => {
    expect(CreateTicketRequest.safeParse({ ...dasar, description: '' }).success).toBe(false);
  });

  it('menolak format email pelapor tidak valid', () => {
    expect(CreateTicketRequest.safeParse({ ...dasar, requesterEmail: 'bukan-email' }).success).toBe(false);
  });

  it('menolak departmentId bukan angka positif', () => {
    expect(CreateTicketRequest.safeParse({ ...dasar, departmentId: -1 }).success).toBe(false);
  });

  it('mengubah email pelapor jadi huruf kecil dan membuang spasi tepi', () => {
    const hasil = CreateTicketRequest.parse({ ...dasar, requesterEmail: '  Pelapor@Socfindo.co.id  ' });
    expect(hasil.requesterEmail).toBe('pelapor@socfindo.co.id');
  });
});

describe('UpdateTicketRequest', () => {
  it('menerima objek kosong (semua field opsional)', () => {
    expect(UpdateTicketRequest.safeParse({}).success).toBe(true);
  });

  it('menerima categoryId null untuk menghapus kategori', () => {
    expect(UpdateTicketRequest.safeParse({ categoryId: null }).success).toBe(true);
  });

  it('menerima statusId untuk pindah status', () => {
    expect(UpdateTicketRequest.safeParse({ statusId: 3 }).success).toBe(true);
  });

  it('menolak subjek kosong', () => {
    expect(UpdateTicketRequest.safeParse({ subject: '' }).success).toBe(false);
  });

  it('tidak menerima assigneeId — penugasan adalah aksi terpisah', () => {
    const hasil = UpdateTicketRequest.parse({ assigneeId: 5 } as never);
    expect(hasil).not.toHaveProperty('assigneeId');
  });
});
