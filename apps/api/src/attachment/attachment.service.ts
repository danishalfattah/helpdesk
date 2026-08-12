import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode, type AttachmentResponse } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { DomainError } from '../common/domain.error.js';

// 32 MB, mengikuti max_file_size osTicket (spec §8.2).
const MAX_UKURAN_BYTES = 32 * 1024 * 1024;

type FileUpload = { originalname: string; mimetype: string; size: number; buffer: Buffer };
type AttachmentRow = {
  id: number; threadEntryId: number; originalName: string; mimeType: string;
  size: number; checksum: string; createdAt: Date;
};

function toResponse(row: AttachmentRow): AttachmentResponse {
  return {
    id: row.id,
    threadEntryId: row.threadEntryId,
    originalName: row.originalName,
    mimeType: row.mimeType,
    size: row.size,
    checksum: row.checksum,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class AttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async upload(threadEntryId: number, file: FileUpload): Promise<AttachmentResponse> {
    const entry = await this.prisma.threadEntry.findUnique({ where: { id: threadEntryId } });
    if (!entry) throw new DomainError(ErrorCode.THREAD_ENTRY_NOT_FOUND, 'Pesan tidak ditemukan.', 404);

    if (file.size > MAX_UKURAN_BYTES) {
      throw new DomainError(ErrorCode.ATTACHMENT_TOO_LARGE, 'Ukuran file maksimal 32 MB.', 422);
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const now = new Date();
    const tahun = String(now.getFullYear());
    const bulan = String(now.getMonth() + 1).padStart(2, '0');
    const namaFile = `${randomUUID()}${path.extname(file.originalname)}`;
    // Disimpan pakai "/" apapun OS-nya, biar konsisten kalau server produksi Linux.
    const relatifPath = path.posix.join(tahun, bulan, namaFile);

    const root = this.config.getOrThrow<string>('STORAGE_ROOT');
    await mkdir(path.join(root, tahun, bulan), { recursive: true });
    await writeFile(path.join(root, tahun, bulan, namaFile), file.buffer);

    const dibuat = await this.prisma.attachment.create({
      data: {
        threadEntryId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: relatifPath,
        checksum,
      },
    });

    return toResponse(dibuat as AttachmentRow);
  }

  // Folder penyimpanan wajib di luar root web (spec §8.2) — makanya download
  // SELALU lewat endpoint ini (yang dijaga PermissionGuard), tidak pernah
  // lewat static file serving langsung.
  async findForDownload(id: number): Promise<{ absolutePath: string; originalName: string; mimeType: string }> {
    const att = await this.prisma.attachment.findUnique({ where: { id } });
    if (!att) throw new DomainError(ErrorCode.ATTACHMENT_NOT_FOUND, 'Lampiran tidak ditemukan.', 404);

    const root = this.config.getOrThrow<string>('STORAGE_ROOT');
    return { absolutePath: path.join(root, att.path), originalName: att.originalName, mimeType: att.mimeType };
  }
}