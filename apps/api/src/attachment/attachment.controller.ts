import { Controller, Get, Param, ParseIntPipe, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { AttachmentResponse } from '@helpdesk/contract';
import { PermissionGuard } from '../auth/permission.guard.js';
import { AttachmentService } from './attachment.service.js';

@Controller()
@UseGuards(PermissionGuard)
export class AttachmentController {
  constructor(private readonly attachments: AttachmentService) {}

  @Post('thread-entries/:threadEntryId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('threadEntryId', ParseIntPipe) threadEntryId: number,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ): Promise<AttachmentResponse> {
    return this.attachments.upload(threadEntryId, file);
  }

  @Get('attachments/:id')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const { absolutePath, originalName, mimeType } = await this.attachments.findForDownload(id);
    res.setHeader('Content-Type', mimeType);
    res.download(absolutePath, originalName);
  }
}