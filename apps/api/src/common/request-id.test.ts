import { describe, it, expect } from 'vitest';
import { resolveRequestId } from './request-id.js';

function buatReq(header?: string | string[]): { headers: Record<string, string | string[] | undefined> } {
  return { headers: { 'x-request-id': header } };
}

describe('resolveRequestId', () => {
  it('memakai requestId dari header kalau ada', () => {
    expect(resolveRequestId(buatReq('abc-123') as never)).toBe('abc-123');
  });

  it('memakai nilai pertama kalau header berupa array', () => {
    expect(resolveRequestId(buatReq(['abc-123', 'def-456']) as never)).toBe('abc-123');
  });

  it('membuat id baru kalau header tidak ada', () => {
    const id = resolveRequestId(buatReq(undefined) as never);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('membuat id baru kalau header kosong', () => {
    const id = resolveRequestId(buatReq('') as never);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});