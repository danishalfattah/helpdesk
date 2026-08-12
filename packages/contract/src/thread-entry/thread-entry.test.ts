import { describe, it, expect } from 'vitest';
import { CreateThreadEntryRequest } from './thread-entry.js';

describe('CreateThreadEntryRequest', () => {
  it('menerima body yang valid', () => {
    expect(CreateThreadEntryRequest.safeParse({ body: 'Sudah dicek, masalahnya di kabel LAN.' }).success).toBe(true);
  });

  it('menolak body kosong', () => {
    expect(CreateThreadEntryRequest.safeParse({ body: '' }).success).toBe(false);
  });

  it('menerima isInternal true/false, dan boleh tidak diisi', () => {
    expect(CreateThreadEntryRequest.safeParse({ body: 'Catatan internal', isInternal: true }).success).toBe(true);
    expect(CreateThreadEntryRequest.safeParse({ body: 'Balasan biasa' }).success).toBe(true);
  });
});