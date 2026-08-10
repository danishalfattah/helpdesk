import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/**
 * Pakai requestId dari header kalau pemanggil (mis. load balancer) sudah
 * kirim satu, supaya jejak tetap nyambung lintas layanan. Kalau tidak ada,
 * buat baru.
 */
export function resolveRequestId(req: Pick<IncomingMessage, 'headers'>): string {
  const header = req.headers['x-request-id'];
  const dariHeader = Array.isArray(header) ? header[0] : header;
  return dariHeader && dariHeader.length > 0 ? dariHeader : randomUUID();
}