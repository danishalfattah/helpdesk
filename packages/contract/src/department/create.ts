import { z } from 'zod';
import { DepartmentDto } from './list.js';

export const CreateDepartmentRequest = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama department wajib diisi')
    .max(128, 'Nama department maksimal 128 karakter'),
  parentId: z.number().int().positive().nullable().optional(),
});

export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequest>;

export const CreateDepartmentResponse = z.object({ department: DepartmentDto });

export type CreateDepartmentResponse = z.infer<typeof CreateDepartmentResponse>;
