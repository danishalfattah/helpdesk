import { z } from 'zod';

export const LoginRequest = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type LoginRequest = z.infer<typeof LoginRequest>;

export const AgentProfile = z.object({
  id: z.number().int(),
  email: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});

export type AgentProfile = z.infer<typeof AgentProfile>;

export const LoginResponse = z.object({
  agent: AgentProfile,
});

export type LoginResponse = z.infer<typeof LoginResponse>;
