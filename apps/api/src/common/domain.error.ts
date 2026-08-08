import { ErrorCode } from '@helpdesk/contract';

/**
 * Error aturan bisnis. Dilempar service layer, diterjemahkan jadi HTTP oleh
 * GlobalExceptionFilter — service tidak perlu tahu soal HTTP sama sekali.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status = 409,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}