import { describe, it, expect } from 'vitest';
import { CreateDepartmentRequest } from './create.js';

describe('CreateDepartmentRequest', () => {
  it('menerima nama tanpa parentId (department induk)', () => {
    const hasil = CreateDepartmentRequest.safeParse({ name: 'IT' });
    expect(hasil.success).toBe(true);
  });

  it('menerima nama dengan parentId (department anak)', () => {
    const hasil = CreateDepartmentRequest.safeParse({ name: 'Jaringan', parentId: 1 });
    expect(hasil.success).toBe(true);
  });

  it('menolak nama kosong', () => {
    const hasil = CreateDepartmentRequest.safeParse({ name: '' });
    expect(hasil.success).toBe(false);
  });

  it('menolak nama lebih dari 128 karakter', () => {
    const hasil = CreateDepartmentRequest.safeParse({ name: 'a'.repeat(129) });
    expect(hasil.success).toBe(false);
  });

  it('membuang spasi tepi pada nama', () => {
    const hasil = CreateDepartmentRequest.parse({ name: '  IT  ' });
    expect(hasil.name).toBe('IT');
  });
});
