import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorCode, type ApiErrorResponse } from '@helpdesk/contract';
import { DomainError } from './domain.error.js';

/**
 * Satu-satunya tempat error diubah jadi response HTTP (spec §9).
 *
 * Stack trace tidak pernah keluar ke klien — hanya masuk log.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      const body: ApiErrorResponse = {
        error: { code: exception.code, message: exception.message },
      };
      res.status(exception.status).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const isi = exception.getResponse();
      const fields =
        typeof isi === 'object' && isi !== null && 'fields' in isi
          ? (isi as { fields: Record<string, string> }).fields
          : undefined;

      const body: ApiErrorResponse = {
        error: {
          code: fields ? ErrorCode.VALIDATION_FAILED : ErrorCode.INTERNAL_ERROR,
          message: exception.message,
          ...(fields ? { fields } : {}),
        },
      };
      res.status(fields ? 422 : exception.getStatus()).json(body);
      return;
    }

    this.logger.error('Error tak tertangani', exception as Error);
    const body: ApiErrorResponse = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Terjadi kesalahan pada server.',
      },
    };
    res.status(500).json(body);
  }
}