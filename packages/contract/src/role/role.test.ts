import { describe, it, expect } from 'vitest';
import { CreateRoleRequest, UpdateRoleRequest, AssignPermissionRequest } from './role.js';

describe('CreateRoleRequest', () => {
  it('menerima nama yang valid', () => {
    expect(CreateRoleRequest.safeParse({ name: 'Supervisor' }).success).toBe(true);
  });

  it('menolak nama kosong', () => {
    expect(CreateRoleRequest.safeParse({ name: '' }).success).toBe(false);
  });

  it('menolak nama lebih dari 64 karakter', () => {
    expect(CreateRoleRequest.safeParse({ name: 'a'.repeat(65) }).success).toBe(false);
  });
});

describe('UpdateRoleRequest', () => {
  it('menerima objek kosong (semua field opsional)', () => {
    expect(UpdateRoleRequest.safeParse({}).success).toBe(true);
  });
});

describe('AssignPermissionRequest', () => {
  it('menolak permissionId bukan angka', () => {
    expect(AssignPermissionRequest.safeParse({ permissionId: 'satu' }).success).toBe(false);
  });
});