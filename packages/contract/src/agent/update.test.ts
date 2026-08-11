import { describe, it, expect } from 'vitest';
import { UpdateAgentRequest } from './update.js';

describe('UpdateAgentRequest', () => {
  it('menerima objek kosong (semua field opsional)', () => {
    expect(UpdateAgentRequest.safeParse({}).success).toBe(true);
  });

  it('menerima isActive saja untuk nonaktifkan agent', () => {
    expect(UpdateAgentRequest.safeParse({ isActive: false }).success).toBe(true);
  });

  it('menolak nama kosong', () => {
    expect(UpdateAgentRequest.safeParse({ name: '' }).success).toBe(false);
  });

  it('menolak nama lebih dari 128 karakter', () => {
    expect(UpdateAgentRequest.safeParse({ name: 'a'.repeat(129) }).success).toBe(false);
  });
});
