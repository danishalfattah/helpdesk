import { describe, it, expect } from 'vitest';
import { AssignAgentRoleRequest } from './assign-role.js';

describe('AssignAgentRoleRequest', () => {
  it('menerima roleId berupa angka', () => {
    expect(AssignAgentRoleRequest.safeParse({ roleId: 1 }).success).toBe(true);
  });

  it('menolak roleId bukan angka', () => {
    expect(AssignAgentRoleRequest.safeParse({ roleId: 'satu' }).success).toBe(false);
  });
});
