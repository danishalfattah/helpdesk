# apps/api — Backend (Kelompok 1: Bagas, Alia)

NestJS 11 + Prisma 7 + SQL Server 2022.

## Pola modul

Tiap domain jadi satu folder di `src/`, isinya selalu bentuk yang sama:

```
src/ticket/
├── ticket.module.ts       merangkai
├── ticket.controller.ts   HTTP saja — tanpa logika bisnis
├── ticket.service.ts      seluruh logika bisnis
└── ticket.service.test.ts test untuk aturan bisnisnya
```

**Ikuti bentuk ini walaupun terasa berlebihan untuk modul kecil.** Keseragaman itu
yang membuat kode hasil generate AI tetap konsisten sepanjang sebulan.

## Path REST

Bentuk umum sudah dikunci di spec §7 (`/api/v1`, paginasi `limit`+`offset`, error
seragam). Yang belum ada di sana adalah aturan penamaan path — ditulis di sini
karena inilah tempat yang dibaca tiap kali modul baru dibuat.

| Aturan | Contoh |
|---|---|
| Resource **jamak**, `kebab-case` | `/departments`, `/help-topics` — bukan `/department` atau `/departmentList` |
| ID sebagai path param, bukan query | `/departments/:id` — bukan `/departments?id=1` |
| Anak resource nested di bawah induk | `/tickets/:id/thread-entries` — bukan `/thread-entries?ticketId=1` |
| Aksi yang bukan CRUD murni pakai kata kerja | `POST /tickets/:id/assign`, `POST /tickets/:id/reopen` |
| Nama controller & path selalu sepasang | `TicketController` → `/tickets`, jangan pernah beda |

**Kenapa ini tidak perlu daftar path lengkap dari awal:** konsumennya cuma
`apps/web`, dibangun tim yang sama, di repo yang sama. Kalau ada path berubah,
TypeScript langsung menolak compile di sisi web lewat `@helpdesk/contract` — ketahuan
seketika, bukan menunggu laporan pengguna luar. Yang wajib konsisten bukan daftar
pathnya, tapi **pola penamaannya** — itu yang dijaga tabel di atas.

## Pembagian tanggung jawab yang tidak boleh kabur

| Lapisan | Menjawab | Tidak boleh |
|---|---|---|
| **Guard** | "Boleh tidak melakukan aksi ini?" | Menyentuh data |
| **Controller** | Menerima HTTP, memanggil service | Berisi `if` aturan bisnis |
| **Service** | "Boleh tidak menyentuh baris ini?" + seluruh aturan bisnis | Tahu soal HTTP |

Service **tidak boleh** meng-import apa pun dari `express` atau melempar
`HttpException`. Kalau service perlu menolak sesuatu, lempar `DomainError`:

```ts
throw new DomainError(ErrorCode.TICKET_CLOSED, 'Tiket sudah ditutup. Buka kembali sebelum membalas.', 409);
```

`GlobalExceptionFilter` yang menerjemahkannya jadi HTTP. Ini yang membuat service
bisa diuji tanpa menyalakan server.

## Aturan bisnis ditegakkan di service, bukan UI

Ini pelajaran mahal dari osTicket. Komentar aslinya:

> *UI only — enforce it here too so a direct POST can't reply to a ticket marked done.*

Form yang disembunyikan di web **bukan** penegakan aturan. Siapa pun bisa mengirim
POST langsung. Setiap aturan bisnis wajib punya pemeriksaan di service, dan setiap
pemeriksaan itu wajib punya test.

## Prisma

**Skema dipecah per domain** supaya dua orang bisa menambah model bersamaan tanpa
konflik git:

```
prisma/
├── schema.prisma       generator + datasource SAJA
└── models/
    ├── agent.prisma
    ├── ticket.prisma
    └── department.prisma
```

Aturan khusus SQL Server (spec §3) — bukan pilihan gaya, ini keterbatasan engine:

| Aturan | Alasan |
|---|---|
| Semua relasi pakai `onDelete: NoAction` | SQL Server tidak mendukung `RESTRICT` |
| Jangan pakai `enum` Prisma | Tidak didukung SQL Server — pakai tabel lookup |
| Jangan pakai tipe `Json` | Tidak didukung — pakai `String @db.NVarChar(Max)` + parse Zod |
| Kolom teks pakai `@db.NVarChar(n)` | Tanpa ini defaultnya `VarChar`, dan teks Indonesia bisa rusak |

Setiap perubahan skema wajib disertai migrasi:

```bash
pnpm --filter @helpdesk/api exec prisma migrate dev --name tambah-kolom-anu
```

**Jangan pernah mengedit berkas migrasi yang sudah di-commit.** Mesin orang lain
mungkin sudah menjalankannya.

## Query hanya lewat PrismaService

Tidak ada `new PrismaClient()` di mana pun selain `PrismaService` dan `prisma/seed.ts`.
Instance ganda berarti connection pool ganda.

## Test

```bash
pnpm --filter @helpdesk/api test              # semua
pnpm --filter @helpdesk/api test auth.service # satu berkas
```

**Yang wajib diuji:**
- Setiap aturan bisnis di service — termasuk jalur penolakannya
- Setiap Guard — kasus lolos dan kasus ditolak
- Setiap skema validasi yang punya perilaku khusus

**Yang tidak perlu diuji:** getter, setter, pemanggilan Prisma yang cuma meneruskan.
Jangan mengejar angka coverage — angka tinggi dari test yang menguji hal sepele itu
menipu diri sendiri.

Service diuji dengan Prisma palsu (`vi.fn()`), bukan database sungguhan. Test harus
cepat dan tidak bergantung pada keadaan database.

## Catatan dev server: `packages/contract` harus di-build dulu

`pnpm dev` dan `pnpm build` diawali `pnpm --filter @helpdesk/contract build`
otomatis — jangan dihapus prefix-nya.

**Kenapa:** `packages/contract` dulu sempat mengekspor source `.ts` langsung tanpa
build (lihat `packages/contract/CLAUDE.md`). Itu jalan mulus di Vitest dan Next.js
karena keduanya punya bundler sendiri yang mentransformasi apa pun yang mereka
temui. Tapi `nest start --watch` (dan runner Node polos lainnya) **tidak** ikut
mentransformasi file dari paket workspace lain yang diakses lewat `node_modules` —
begitu runtime sampai ke `packages/contract`, Node coba cari file `error.js` yang
secara harfiah tidak ada (isinya `error.ts`), lalu crash `ERR_MODULE_NOT_FOUND`.

Sudah dicoba dua solusi berbasis loader (`tsx watch`, lalu builder `-b swc`) —
dua-duanya gagal: `tsx` pakai esbuild yang tidak dukung `emitDecoratorMetadata`
(DI NestJS jadi rusak), dan builder `-b swc` cuma mengompilasi `apps/api` sendiri,
tidak menyentuh paket lain sama sekali.

**Solusinya:** `packages/contract` sekarang benar-benar di-*build* jadi CommonJS
biasa (`dist/*.js` + `.d.ts`), bukan lagi source `.ts` mentah. Node bisa
me-`require()`-nya langsung tanpa loader ajaib apa pun. `pretest`/`pretypecheck`
di `package.json` ini juga otomatis membangun ulang `packages/contract` sebelum
jalan — jadi kalau ada yang mengubah skema di `packages/contract/src`, cukup
jalankan `pnpm --filter @helpdesk/api dev`/`test` seperti biasa, tidak perlu build
manual dulu.

## Catatan Vitest

Vitest di sini memakai `unplugin-swc`, bukan esbuild bawaan. Alasannya esbuild tidak
mendukung `emitDecoratorMetadata`, padahal dependency injection NestJS bergantung
penuh padanya. **Jangan mengubah `vitest.config.ts`** kecuali paham konsekuensinya —
gejalanya semua test gagal dengan error DI yang tidak jelas asalnya.
