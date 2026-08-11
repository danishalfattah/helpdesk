import { describe, it, expect } from 'vitest';
import { CreateAgentRequest } from './create.js';

describe('CreateAgentRequest', () => {
  it('menerima data agent yang valid tanpa roleIds', () => {
    const hasil = CreateAgentRequest.safeParse({
      email: 'agent@socfindo.co.id',
      name: 'Agen Satu',
      password: 'password123',
    });
    expect(hasil.success).toBe(true);
  });

  it('menerima roleIds opsional', () => {
    const hasil = CreateAgentRequest.safeParse({
      email: 'agent@socfindo.co.id',
      name: 'Agen Satu',
      password: 'password123',
      roleIds: [1, 2],
    });
    expect(hasil.success).toBe(true);
  });

  it('menolak format email tidak valid', () => {
    const hasil = CreateAgentRequest.safeParse({
      email: 'bukan-email',
      name: 'Agen Satu',
      password: 'password123',
    });
    expect(hasil.success).toBe(false);
  });

  it('menolak nama kosong', () => {
    const hasil = CreateAgentRequest.safeParse({
      email: 'agent@socfindo.co.id',
      name: '',
      password: 'password123',
    });
    expect(hasil.success).toBe(false);
  });

  it('menolak password kurang dari 8 karakter', () => {
    const hasil = CreateAgentRequest.safeParse({
      email: 'agent@socfindo.co.id',
      name: 'Agen Satu',
      password: 'pendek',
    });
    expect(hasil.success).toBe(false);
  });

  it('mengubah email jadi huruf kecil dan membuang spasi tepi', () => {
    const hasil = CreateAgentRequest.parse({
      email: '  Agent@Socfindo.co.id  ',
      name: '  Agen Satu  ',
      password: 'password123',
    });
    expect(hasil.email).toBe('agent@socfindo.co.id');
    expect(hasil.name).toBe('Agen Satu');
  });
});
