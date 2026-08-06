import { describe, it, expect } from 'vitest';
import { LoginRequest } from './login.js';

describe('LoginRequest', () => {
  it('menerima email dan password yang valid', () => {
    const hasil = LoginRequest.safeParse({
      email: 'admin@socfindo.co.id',
      password: 'rahasia123',
    });
    expect(hasil.success).toBe(true);
  });

  it('menolak email yang bukan format email', () => {
    const hasil = LoginRequest.safeParse({
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(hasil.success).toBe(false);
  });

  it('menolak password di bawah 8 karakter', () => {
    const hasil = LoginRequest.safeParse({
      email: 'admin@socfindo.co.id',
      password: 'pendek',
    });
    expect(hasil.success).toBe(false);
  });

  it('mengubah email jadi huruf kecil dan membuang spasi tepi', () => {
    const hasil = LoginRequest.parse({
      email: '  Admin@Socfindo.co.id  ',
      password: 'rahasia123',
    });
    expect(hasil.email).toBe('admin@socfindo.co.id');
  });
});
