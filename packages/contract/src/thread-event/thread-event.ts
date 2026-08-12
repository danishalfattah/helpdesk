import { z } from 'zod';

export const ThreadEventResponse = z.object({
  id: z.number().int(),
  ticketId: z.number().int(),
  agentId: z.number().int().nullable(),
  eventType: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.string(),
});
export type ThreadEventResponse = z.infer<typeof ThreadEventResponse>;