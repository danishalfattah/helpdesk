import { z } from 'zod';

export const CreateTicketStatusRequest = z.object({
  name: z.string().trim().min(1, 'Nama status wajib diisi').max(64, 'Nama status maksimal 64 karakter'),
  isClosed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateTicketStatusRequest = z.infer<typeof CreateTicketStatusRequest>;

export const UpdateTicketStatusRequest = CreateTicketStatusRequest.partial();
export type UpdateTicketStatusRequest = z.infer<typeof UpdateTicketStatusRequest>;

export const TicketStatusResponse = z.object({
  id: z.number().int(),
  name: z.string(),
  isClosed: z.boolean(),
  sortOrder: z.number().int(),
});
export type TicketStatusResponse = z.infer<typeof TicketStatusResponse>;