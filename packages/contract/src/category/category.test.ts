import { describe, it, expect } from 'vitest';
import { CreateCategoryRequest, UpdateCategoryRequest, AssignDepartmentsRequest } from './category.js';

describe('CreateCategoryRequest', () => {
  it('menerima nama valid tanpa parent (kategori tingkat atas)', () => {
    expect(CreateCategoryRequest.safeParse({ name: 'Jaringan' }).success).toBe(true);
  });

  it('menerima parentId dan departmentIds', () => {
    const hasil = CreateCategoryRequest.safeParse({ name: 'Wifi', parentId: 1, departmentIds: [1, 2] });
    expect(hasil.success).toBe(true);
  });

  it('menolak nama kosong', () => {
    expect(CreateCategoryRequest.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('UpdateCategoryRequest', () => {
  it('menerima objek kosong (semua field opsional)', () => {
    expect(UpdateCategoryRequest.safeParse({}).success).toBe(true);
  });
});

describe('AssignDepartmentsRequest', () => {
  it('menolak departmentIds bukan array angka', () => {
    expect(AssignDepartmentsRequest.safeParse({ departmentIds: ['satu'] }).success).toBe(false);
  });

  it('menerima array kosong (artinya lepas semua batasan department)', () => {
    expect(AssignDepartmentsRequest.safeParse({ departmentIds: [] }).success).toBe(true);
  });
});