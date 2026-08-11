import { z } from 'zod';

export const AgentRoleInfo = z.object({
  id: z.number().int(),
  name: z.string(),
});

export type AgentRoleInfo = z.infer<typeof AgentRoleInfo>;

export const AgentDto = z.object({
  id: z.number().int(),
  email: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  roles: z.array(AgentRoleInfo),
});

export type AgentDto = z.infer<typeof AgentDto>;

export const ListAgentsResponse = z.object({
  agents: z.array(AgentDto),
});

export type ListAgentsResponse = z.infer<typeof ListAgentsResponse>;
