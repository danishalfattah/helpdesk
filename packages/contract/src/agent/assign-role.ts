import { z } from 'zod';

export const AssignAgentRoleRequest = z.object({
  roleId: z.number().int(),
});

export type AssignAgentRoleRequest = z.infer<typeof AssignAgentRoleRequest>;
