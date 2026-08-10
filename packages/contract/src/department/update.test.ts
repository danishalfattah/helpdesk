import { describe, it, expect } from 'vitest';
import { UpdateDepartmentRequest } from './update.js';

describe('UpdateDepartmentRequest', () => {
  it('menerima objek kosong (semua field opsional)', () => {
    const hasil = UpdateDepartmentRequest.safeParse({});
    expect(hasil.success).toBe(true);
  });

  it('menerima update isActive saja', () => {
    const hasil = UpdateDepartmentRequest.safeParse({ isActive: false });
    expect(hasil.success).toBe(true);
  });

  it('menolak nama kosong kalau field name dikirim', () => {
    const hasil = UpdateDepartmentRequest.safeParse({ name: '' });
    expect(hasil.success).toBe(false);
  });

  it('menerima parentId null (memindahkan jadi department induk)', () => {
    const hasil = UpdateDepartmentRequest.safeParse({ parentId: null });
    expect(hasil.success).toBe(true);
  });
});
