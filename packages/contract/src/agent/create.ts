import { z } from 'zod';
import { AgentDto } from './list.js';

export const CreateAgentRequest = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  name: z
    .string()
    .trim()
    .min(1, 'Nama agent wajib diisi')
    .max(128, 'Nama agent maksimal 128 karakter'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  roleIds: z.array(z.number().int().positive()).optional(),
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequest>;

export const CreateAgentResponse = z.object({ agent: AgentDto });

export type CreateAgentResponse = z.infer<typeof CreateAgentResponse>;
