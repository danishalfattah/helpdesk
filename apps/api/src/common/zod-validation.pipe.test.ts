import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const Skema = z.object({
  email: z.string().email(),
  umur: z.number().int().min(1),
});

describe('ZodValidationPipe', () => {
  it('meneruskan nilai yang valid setelah di-parse', () => {
    const pipe = new ZodValidationPipe(Skema);
    const hasil = pipe.transform({ email: 'a@b.com', umur: 20 });
    expect(hasil).toEqual({ email: 'a@b.com', umur: 20 });
  });

  it('melempar BadRequestException saat tidak valid', () => {
    const pipe = new ZodValidationPipe(Skema);
    expect(() => pipe.transform({ email: 'salah', umur: 0 })).toThrow(BadRequestException);
  });

  it('menyertakan pesan error per field, dipetakan dengan nama field', () => {
    const pipe = new ZodValidationPipe(Skema);
    try {
      pipe.transform({ email: 'salah', umur: 0 });
      expect.unreachable('seharusnya melempar');
    } catch (e) {
      const respons = (e as BadRequestException).getResponse() as {
        fields: Record<string, string>;
      };
      expect(respons.fields).toHaveProperty('email');
      expect(respons.fields).toHaveProperty('umur');
    }
  });
});