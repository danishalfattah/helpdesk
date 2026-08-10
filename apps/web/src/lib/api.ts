import { ApiErrorResponse } from '@helpdesk/contract';

const BASE = 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * credentials: 'include' wajib supaya cookie sesi httpOnly ikut terkirim —
 * tanpa ini login berhasil tapi setiap permintaan berikutnya dianggap belum login.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = ApiErrorResponse.safeParse(body);
    if (parsed.success) {
      throw new ApiError(parsed.data.error.code, parsed.data.error.message, parsed.data.error.fields);
    }
    throw new ApiError('INTERNAL_ERROR', `Permintaan gagal (${res.status})`);
  }

  return body as T;
}
