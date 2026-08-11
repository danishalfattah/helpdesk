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
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',
  DEPARTMENT_NAME_TAKEN: 'DEPARTMENT_NAME_TAKEN',
  DEPARTMENT_INVALID_PARENT: 'DEPARTMENT_INVALID_PARENT',
  DEPARTMENT_HAS_CHILDREN: 'DEPARTMENT_HAS_CHILDREN',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_TAKEN: 'CATEGORY_NAME_TAKEN',
  CATEGORY_INVALID_PARENT: 'CATEGORY_INVALID_PARENT',
  CATEGORY_HAS_CHILDREN: 'CATEGORY_HAS_CHILDREN',
  TICKET_STATUS_NOT_FOUND: 'TICKET_STATUS_NOT_FOUND',
  TICKET_STATUS_NAME_TAKEN: 'TICKET_STATUS_NAME_TAKEN',
  TICKET_STATUS_IN_USE: 'TICKET_STATUS_IN_USE',
  PRIORITY_NOT_FOUND: 'PRIORITY_NOT_FOUND',
  PRIORITY_NAME_TAKEN: 'PRIORITY_NAME_TAKEN',
  PRIORITY_IN_USE: 'PRIORITY_IN_USE',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_EMAIL_TAKEN: 'AGENT_EMAIL_TAKEN',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_CATEGORY_NOT_ALLOWED: 'TICKET_CATEGORY_NOT_ALLOWED',
  TICKET_CLOSED: 'TICKET_CLOSED',
  TICKET_NOT_CLOSED: 'TICKET_NOT_CLOSED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
