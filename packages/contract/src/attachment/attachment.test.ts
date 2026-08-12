import { describe, it, expect } from 'vitest';
import { AttachmentResponse } from './attachment.js';

describe('AttachmentResponse', () => {
  it('menerima bentuk lampiran yang valid', () => {
    const hasil = AttachmentResponse.safeParse({
      id: 1, threadEntryId: 1, originalName: 'foto.png', mimeType: 'image/png',
      size: 1024, checksum: 'abc123', createdAt: new Date().toISOString(),
    });
    expect(hasil.success).toBe(true);
  });
});