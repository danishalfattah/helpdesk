import { z } from 'zod';

export const CreateCategoryRequest = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(128, 'Nama kategori maksimal 128 karakter'),
  parentId: z.number().int().nullable().optional(),
  // Kosong/tidak diisi = berlaku untuk semua department.
  departmentIds: z.array(z.number().int()).optional(),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>;

// .partial() saja tidak cukup -- CategoryService.update() membaca input.isActive
// (buat toggle aktif/nonaktif), tapi field itu tidak pernah ada di CreateCategoryRequest.
// Tanpa .extend() ini, Zod diam-diam MEMBUANG isActive dari body (default z.object()
// men-strip key yang tidak dikenal), jadi endpoint PATCH tidak pernah benar-benar
// mengubah status aktif walau tidak ada error sama sekali. Ketahuan lewat #20 saat
// halaman Category butuh toggle aktif/nonaktif, sama seperti Department.
export const UpdateCategoryRequest = CreateCategoryRequest.partial().extend({
  isActive: z.boolean().optional(),
});
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