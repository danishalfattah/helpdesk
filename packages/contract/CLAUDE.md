# packages/contract — MILIK BERSAMA

⚠️ **Paket ini dipakai kedua kelompok.** Perubahan di sini bisa merusak pekerjaan
orang lain seketika. Baca seluruh berkas ini sebelum mengubah apa pun.

## Kenapa paket ini ada

Skema Zod di sini adalah **satu-satunya definisi kontrak API**. Bukan dokumen
OpenAPI terpisah, bukan tipe yang di-generate.

- `apps/api` memvalidasi request masuk dengan skema ini
- `apps/web` memakai skema yang sama untuk tipe TypeScript dan validasi form

Karena keduanya membaca **berkas yang sama**, kontraknya tidak bisa melenceng secara
struktural. Kalau bentuk response diubah di sini, TypeScript langsung menolak
kompilasi di sisi yang belum menyesuaikan — bukan ketahuan saat demo.

**Itu jaminan yang hilang begitu ada yang mendefinisikan tipe secara terpisah.**
Jangan pernah menulis ulang tipe kontrak di `apps/api` atau `apps/web`. Import dari sini.

## Aturan mengubah

| Jenis perubahan | Boleh | Syarat |
|---|---|---|
| Menambah berkas skema baru | ✅ | Ada test |
| Menambah field **opsional** | ✅ | Ada test |
| Menambah field **wajib** | ⚠️ | Sepakati dulu — merusak sisi yang belum menyesuaikan |
| Mengganti nama field | ⚠️ | Sepakati dulu |
| Menghapus field | ❌ | Hanya lewat kesepakatan kedua kelompok di issue |
| Mengubah tipe field | ❌ | Sama seperti di atas |

**PR ke paket ini wajib di-review satu orang dari tiap kelompok.** Bukan formalitas —
yang me-review adalah orang yang kodenya akan rusak kalau kontraknya salah.

**Waktu terbaik mengubah kontrak: di awal tiap tahap, sekaligus.** Mengubah kontrak
sambil jalan memaksa kedua kelompok berhenti dan menyesuaikan.

## Pola berkas

Satu berkas per endpoint. Nama skema mengikuti nama endpoint.

```ts
// packages/contract/src/ticket/create.ts
import { z } from 'zod';

export const CreateTicketRequest = z.object({ ... });
export type CreateTicketRequest = z.infer<typeof CreateTicketRequest>;

export const CreateTicketResponse = z.object({ ... });
export type CreateTicketResponse = z.infer<typeof CreateTicketResponse>;
```

Tiga hal yang wajib:

1. **Nama tipe sama persis dengan nama skema.** `z.infer` di-export dengan nama yang
   sama supaya pemakainya cukup `import { CreateTicketRequest }` untuk keduanya.
2. **Daftarkan di `src/index.ts`.** Itu satu-satunya titik ekspor.
3. **Pesan error dalam bahasa Indonesia** — pesan ini tampil langsung di form
   pengguna, tidak diterjemahkan lagi di sisi web.

```ts
z.string().min(8, 'Password minimal 8 karakter')   // ✅ tampil apa adanya
z.string().min(8)                                   // ❌ pengguna lihat pesan Zod bawaan
```

## Test wajib

Tiap skema minimal menguji: satu masukan valid, satu masukan tidak valid per aturan,
dan hasil transform kalau ada (`.trim()`, `.toLowerCase()`).

```bash
pnpm --filter @helpdesk/contract test
```

Test di sini murah dan cepat — tidak ada database, tidak ada jaringan. Tidak ada
alasan melewatkannya.

## Paket ini di-build, bukan dipakai sebagai source `.ts` mentah

`main`/`exports` di `package.json` menunjuk ke `dist/`, bukan `src/`. Jalankan
`pnpm --filter @helpdesk/contract build` (`tsc`) untuk menghasilkannya —
`apps/api` sudah otomatis melakukan ini lewat `pretest`/`pretypecheck`/`dev` di
`package.json`-nya sendiri, jadi biasanya tidak perlu build manual.

**Kenapa bukan source langsung:** sempat dicoba, dan Vitest + Next.js baik-baik
saja (keduanya punya bundler sendiri yang mentransformasi apa pun yang mereka
temui). Tapi `apps/api` menjalankan Node polos lewat `nest start --watch` — tidak
ada bundler, dan tidak ada cara aman untuk membuat Node mentransformasi `.ts` dari
paket workspace lain tanpa merusak dependency injection NestJS (`emitDecoratorMetadata`
butuh transform berbasis `tsc`/SWC yang tepat, bukan esbuild). Build ke `dist/`
menghilangkan masalah ini sepenuhnya — Node tinggal `require()` JS biasa.

`dist/` tidak ikut git (`.gitignore`). Kalau `packages/contract/src` diubah, cukup
jalankan ulang perintah `dev`/`test` di `apps/api` — dibangun ulang otomatis.

## Yang TIDAK boleh masuk sini

- Logika bisnis — ini cuma bentuk data
- Query Prisma atau apa pun yang menyentuh database
- Komponen React
- Apa pun yang meng-import dari `apps/`

Ketergantungan hanya boleh satu arah: `apps/*` → `packages/contract`. **Tidak pernah
sebaliknya.**
