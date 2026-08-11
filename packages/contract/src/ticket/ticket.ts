import { z } from 'zod';

export const TicketDto = z.object({
  id: z.number().int(),
  number: z.number().int(),
  subject: z.string(),
  requesterId: z.number().int(),
  departmentId: z.number().int(),
  categoryId: z.number().int().nullable(),
  statusId: z.number().int(),
  priorityId: z.number().int(),
  assigneeId: z.number().int().nullable(),
  callType: z.string().nullable(),
  closureType: z.string().nullable(),
  location: z.string().nullable(),
  urgency: z.string().nullable(),
  risk: z.string().nullable(),
  solution: z.string().nullable(),
});
export type TicketDto = z.infer<typeof TicketDto>;

export const CreateTicketRequest = z.object({
  subject: z.string().trim().min(1, 'Subjek tiket wajib diisi').max(255, 'Subjek tiket maksimal 255 karakter'),
  // Pesan pertama di thread — tiket tanpa isi tidak masuk akal secara bisnis,
  // jadi dibuat sekalian dalam transaksi yang sama, bukan lewat endpoint terpisah.
  description: z.string().trim().min(1, 'Deskripsi masalah wajib diisi'),

  // Requester dicocokkan lewat email, dibuat kalau belum ada (spec §8.1) — sama
  // seperti alur email masuk, dipakai juga untuk pembuatan tiket manual oleh agent.
  requesterEmail: z.string().trim().toLowerCase().email('Format email pelapor tidak valid'),
  requesterName: z
    .string()
    .trim()
    .min(1, 'Nama pelapor wajib diisi')
    .max(128, 'Nama pelapor maksimal 128 karakter'),

  departmentId: z.number().int().positive(),
  categoryId: z.number().int().positive().optional(),
  // Opsional — default ke prioritas "Medium" kalau tidak diisi.
  priorityId: z.number().int().positive().optional(),

  // Enam field warisan Versa — semuanya opsional saat buat tiket (spec §5.1).
  callType: z.string().trim().max(64, 'Call Type maksimal 64 karakter').optional(),
  closureType: z.string().trim().max(64, 'Closure Type maksimal 64 karakter').optional(),
  location: z.string().trim().max(128, 'Lokasi maksimal 128 karakter').optional(),
  urgency: z.string().trim().max(32, 'Urgency maksimal 32 karakter').optional(),
  risk: z.string().trim().max(32, 'Risk maksimal 32 karakter').optional(),
  solution: z.string().trim().optional(),
});
export type CreateTicketRequest = z.infer<typeof CreateTicketRequest>;

export const CreateTicketResponse = z.object({ ticket: TicketDto });
export type CreateTicketResponse = z.infer<typeof CreateTicketResponse>;

// assigneeId sengaja tidak ada di sini — penugasan tiket adalah aksi tersendiri
// (issue #29, POST /tickets/:id/assign), bukan bagian dari ubah field biasa.
export const UpdateTicketRequest = z.object({
  subject: z.string().trim().min(1, 'Subjek tiket wajib diisi').max(255, 'Subjek tiket maksimal 255 karakter').optional(),
  departmentId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  priorityId: z.number().int().positive().optional(),
  statusId: z.number().int().positive().optional(),

  callType: z.string().trim().max(64, 'Call Type maksimal 64 karakter').nullable().optional(),
  closureType: z.string().trim().max(64, 'Closure Type maksimal 64 karakter').nullable().optional(),
  location: z.string().trim().max(128, 'Lokasi maksimal 128 karakter').nullable().optional(),
  urgency: z.string().trim().max(32, 'Urgency maksimal 32 karakter').nullable().optional(),
  risk: z.string().trim().max(32, 'Risk maksimal 32 karakter').nullable().optional(),
  solution: z.string().trim().nullable().optional(),
});
export type UpdateTicketRequest = z.infer<typeof UpdateTicketRequest>;

export const UpdateTicketResponse = z.object({ ticket: TicketDto });
export type UpdateTicketResponse = z.infer<typeof UpdateTicketResponse>;
