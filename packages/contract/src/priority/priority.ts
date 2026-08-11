import { z } from 'zod';

export const CreatePriorityRequest = z.object({
  name: z.string().trim().min(1, 'Nama prioritas wajib diisi').max(64, 'Nama prioritas maksimal 64 karakter'),
  sortOrder: z.number().int().optional(),
});
export type CreatePriorityRequest = z.infer<typeof CreatePriorityRequest>;

export const UpdatePriorityRequest = CreatePriorityRequest.partial();
export type UpdatePriorityRequest = z.infer<typeof UpdatePriorityRequest>;

export const PriorityResponse = z.object({
  id: z.number().int(),
  name: z.string(),
  sortOrder: z.number().int(),
});
export type PriorityResponse = z.infer<typeof PriorityResponse>;