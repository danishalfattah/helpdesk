import { z } from 'zod';
import { AgentDto } from './list.js';

export const UpdateAgentRequest = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama agent wajib diisi')
    .max(128, 'Nama agent maksimal 128 karakter')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequest>;

export const UpdateAgentResponse = z.object({ agent: AgentDto });

export type UpdateAgentResponse = z.infer<typeof UpdateAgentResponse>;
