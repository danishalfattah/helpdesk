import { z } from 'zod';

export const CreateCategoryRequest = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(128, 'Nama kategori maksimal 128 karakter'),
  parentId: z.number().int().nullable().optional(),
  // Kosong/tidak diisi = berlaku untuk semua department.
  departmentIds: z.array(z.number().int()).optional(),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>;

export const UpdateCategoryRequest = CreateCategoryRequest.partial();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequest>;

export const AssignDepartmentsRequest = z.object({
  departmentIds: z.array(z.number().int()),
});
export type AssignDepartmentsRequest = z.infer<typeof AssignDepartmentsRequest>;

export const CategoryResponse = z.object({
  id: z.number().int(),
  name: z.string(),
  isActive: z.boolean(),
  parentId: z.number().int().nullable(),
  departmentIds: z.array(z.number().int()),
});
export type CategoryResponse = z.infer<typeof CategoryResponse>;