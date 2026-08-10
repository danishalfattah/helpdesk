import { z } from 'zod';
import { DepartmentDto } from './list.js';

export const UpdateDepartmentRequest = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama department wajib diisi')
    .max(128, 'Nama department maksimal 128 karakter')
    .optional(),
  isActive: z.boolean().optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export type UpdateDepartmentRequest = z.infer<typeof UpdateDepartmentRequest>;

export const UpdateDepartmentResponse = z.object({ department: DepartmentDto });

export type UpdateDepartmentResponse = z.infer<typeof UpdateDepartmentResponse>;
