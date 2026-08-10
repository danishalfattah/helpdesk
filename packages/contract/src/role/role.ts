import { z } from 'zod';

export const CreateRoleRequest = z.object({
  name: z.string().trim().min(1, 'Nama role wajib diisi').max(64, 'Nama role maksimal 64 karakter'),
  description: z.string().trim().max(255).optional(),
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequest>;

export const UpdateRoleRequest = CreateRoleRequest.partial();
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequest>;

export const AssignPermissionRequest = z.object({
  permissionId: z.number().int(),
});
export type AssignPermissionRequest = z.infer<typeof AssignPermissionRequest>;

export const PermissionInfo = z.object({
  id: z.number().int(),
  key: z.string(),
  label: z.string(),
});
export type PermissionInfo = z.infer<typeof PermissionInfo>;

export const RoleResponse = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  permissions: z.array(PermissionInfo),
});
export type RoleResponse = z.infer<typeof RoleResponse>;