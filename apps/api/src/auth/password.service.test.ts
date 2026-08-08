import { describe, it, expect } from 'vitest';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('menghasilkan hash yang berbeda dari password aslinya', async () => {
    const hash = await service.hash('rahasia123');
    expect(hash).not.toBe('rahasia123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('menghasilkan hash berbeda untuk password sama (salt acak)', async () => {
    const a = await service.hash('rahasia123');
    const b = await service.hash('rahasia123');
    expect(a).not.toBe(b);
  });

  it('memverifikasi password yang benar', async () => {
    const hash = await service.hash('rahasia123');
    expect(await service.verify(hash, 'rahasia123')).toBe(true);
  });

  it('menolak password yang salah', async () => {
    const hash = await service.hash('rahasia123');
    expect(await service.verify(hash, 'salah-total')).toBe(false);
  });

  it('mengembalikan false untuk hash yang rusak, bukan melempar', async () => {
    expect(await service.verify('bukan-hash-valid', 'apa-saja')).toBe(false);
  });
});