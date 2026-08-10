import { z } from 'zod';

/**
 * Bentuk error tunggal untuk seluruh API.
 *
 * `code` sengaja berupa string konstan, bukan hanya pesan bahasa Inggris,
 * supaya sisi web memutuskan perilaku berdasarkan kode — bukan mencocokkan teks
 * yang bisa berubah sewaktu-waktu.
 *
 * `fields` memetakan nama field ke pesan error, sehingga form di sisi web bisa
 * menampilkannya langsung tanpa penerjemahan manual.
 */
export const ApiErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;

export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
  ROLE_NAME_TAKEN: 'ROLE_NAME_TAKEN',
  ROLE_IN_USE: 'ROLE_IN_USE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
