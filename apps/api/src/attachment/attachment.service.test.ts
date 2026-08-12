import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), writeFile: vi.fn() }));
import { mkdir, writeFile } from 'node:fs/promises';
import { DomainError } from '../common/domain.error.js';
import { AttachmentService } from './attachment.service.js';

function buatPrisma() {
  return {
    threadEntry: { findUnique: vi.fn() },
    attachment: { create: vi.fn(), findUnique: vi.fn() },
  };
}
function buatConfig() {
  return { getOrThrow: vi.fn().mockReturnValue('/data/storage') };
}

const fileKecil = { originalname: 'foto.png', mimetype: 'image/png', size: 1024, buffer: Buffer.from('halo') };

describe('AttachmentService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('upload', () => {
    it('menolak kalau ThreadEntry tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.threadEntry.findUnique.mockResolvedValue(null);
      const service = new AttachmentService(prisma as never, buatConfig() as never);
      await expect(service.upload(99, fileKecil)).rejects.toThrow(DomainError);
    });

    it('menolak file lebih dari 32MB', async () => {
      const prisma = buatPrisma();
      prisma.threadEntry.findUnique.mockResolvedValue({ id: 1 });
      const service = new AttachmentService(prisma as never, buatConfig() as never);
      await expect(service.upload(1, { ...fileKecil, size: 33 * 1024 * 1024 })).rejects.toThrow(DomainError);
    });

    it('menyimpan file ke folder tahun/bulan dan mencatat metadata', async () => {
      const prisma = buatPrisma();
      prisma.threadEntry.findUnique.mockResolvedValue({ id: 1 });
      prisma.attachment.create.mockResolvedValue({
        id: 1, threadEntryId: 1, originalName: 'foto.png', mimeType: 'image/png',
        size: 1024, checksum: 'abc', createdAt: new Date(),
      });
      const service = new AttachmentService(prisma as never, buatConfig() as never);
      const hasil = await service.upload(1, fileKecil);

      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(hasil.originalName).toBe('foto.png');
    });
  });

  describe('findForDownload', () => {
    it('menolak kalau lampiran tidak ditemukan', async () => {
      const prisma = buatPrisma();
      prisma.attachment.findUnique.mockResolvedValue(null);
      const service = new AttachmentService(prisma as never, buatConfig() as never);
      await expect(service.findForDownload(99)).rejects.toThrow(DomainError);
    });

    it('mengembalikan path lengkap untuk diunduh', async () => {
      const prisma = buatPrisma();
      prisma.attachment.findUnique.mockResolvedValue({
        id: 1, path: '2026/08/uuid.png', originalName: 'foto.png', mimeType: 'image/png',
      });
      const service = new AttachmentService(prisma as never, buatConfig() as never);
      const hasil = await service.findForDownload(1);
      expect(hasil.originalName).toBe('foto.png');
    });
  });
});