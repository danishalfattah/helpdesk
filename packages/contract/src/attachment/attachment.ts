import { z } from 'zod';

export const AttachmentResponse = z.object({
  id: z.number().int(),
  threadEntryId: z.number().int(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  checksum: z.string(),
  createdAt: z.string(),
});
export type AttachmentResponse = z.infer<typeof AttachmentResponse>;