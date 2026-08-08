import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Memvalidasi body request memakai skema Zod dari @helpdesk/contract.
 *
 * Skema yang sama dipakai sisi web untuk validasi form, sehingga aturan validasi
 * hanya ditulis sekali dan tidak bisa berbeda antara kedua sisi.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const hasil = this.schema.safeParse(value);
    if (hasil.success) return hasil.data;

    const fields: Record<string, string> = {};
    for (const issue of hasil.error.issues) {
      const nama = issue.path.join('.') || '_';
      // Ambil pesan pertama saja per field — form hanya menampilkan satu.
      if (!(nama in fields)) fields[nama] = issue.message;
    }

    throw new BadRequestException({ fields });
  }
}