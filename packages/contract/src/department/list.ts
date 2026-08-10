import { z } from 'zod';

export const DepartmentDto = z.object({
  id: z.number().int(),
  name: z.string(),
  isActive: z.boolean(),
  parentId: z.number().int().nullable(),
});

export type DepartmentDto = z.infer<typeof DepartmentDto>;

export const ListDepartmentsResponse = z.object({
  departments: z.array(DepartmentDto),
});

export type ListDepartmentsResponse = z.infer<typeof ListDepartmentsResponse>;
