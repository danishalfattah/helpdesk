import { z } from 'zod';

export const CreateThreadEntryRequest = z.object({
  body: z.string().trim().min(1, 'Isi balasan/catatan wajib diisi'),
  isInternal: z.boolean().optional(),
});
export type CreateThreadEntryRequest = z.infer<typeof CreateThreadEntryRequest>;

export const ThreadEntryResponse = z.object({
  id: z.number().int(),
  ticketId: z.number().int(),
  authorAgentId: z.number().int().nullable(),
  authorRequesterId: z.number().int().nullable(),
  isInternal: z.boolean(),
  body: z.string(),
  createdAt: z.string(),
});
export type ThreadEntryResponse = z.infer<typeof ThreadEntryResponse>;