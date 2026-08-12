# apps/web — Frontend (Kelompok 2: Danish, Farah)

Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui.

## Bahasa di layar

**Semua teks yang dilihat pengguna memakai bahasa Indonesia.** Penggunanya karyawan
Socfindo, bukan developer. Ini termasuk label tombol, judul kolom, pesan kosong, dan
pesan error.

Pakai istilah dari `docs/glosarium.md` — di layar tertulis "Kategori", bukan "Help
Topic" atau "Category", walaupun nama tipenya di kode `Category`.

## Data fetching

**Semua panggilan API lewat `lib/api.ts`.** Dilarang memakai `fetch()` langsung di
komponen.

Alasannya: `apiFetch` menangani `credentials: 'include'` (tanpa ini cookie sesi tidak
terkirim dan pengguna dianggap belum login di tiap permintaan), serta menerjemahkan
bentuk error seragam jadi `ApiError`. Melewatinya berarti kehilangan keduanya.

Untuk data yang ditampilkan, bungkus dengan TanStack Query — jangan `useEffect` +
`useState` manual. Query memberi caching, dedupe, dan status loading/error secara gratis.

## Tipe dari kontrak, bukan ditulis ulang

```ts
import { LoginRequest, type LoginResponse } from '@helpdesk/contract';   // ✅
interface LoginBody { email: string; password: string }                  // ❌
```

Menulis ulang tipe menghapus seluruh manfaat kontrak bersama. Kalau backend mengubah
bentuk response, TypeScript harus **menolak kompilasi di sini** — itu fitur, bukan
gangguan.

## Form

Selalu `react-hook-form` + `zodResolver` dengan skema dari `@helpdesk/contract`:

```tsx
const { register, handleSubmit, setError, formState: { errors } } =
  useForm<LoginRequest>({ resolver: zodResolver(LoginRequest) });
```

Ini membuat aturan validasi ditulis **sekali** dan berlaku di dua sisi. Pengguna dapat
umpan balik seketika tanpa perjalanan ke server, dan server tetap memvalidasi ulang.

Error per field dari API dipetakan balik ke form lewat `setError` — itu gunanya
`fields` di bentuk error seragam:

```ts
if (e instanceof ApiError && e.fields) {
  for (const [nama, pesan] of Object.entries(e.fields)) {
    setError(nama as keyof LoginRequest, { message: pesan });
  }
}
```

## Komponen

**Pakai shadcn/ui.** Jangan membuat tombol, input, dialog, atau tabel dari nol —
itu sumber utama UI yang tidak konsisten saat dua orang bekerja paralel.

```bash
pnpm --filter @helpdesk/web exec shadcn@latest add button input dialog table
```

Komponen shadcn disalin ke `src/components/ui/`. Itu **milik kita**, boleh diubah —
tapi kalau mengubahnya, ubah untuk seluruh aplikasi, jangan bikin varian lokal.

Komponen buatan sendiri ditaruh di `src/components/`, dinamai jelas
(`TicketStatusBadge`, bukan `Badge2`).

## Ikon

**Pakai `lucide-react`, bukan emoji.** shadcn/ui sendiri berpasangan dengan Lucide
secara default, jadi ini bukan pilihan tambahan — ikutin apa yang sudah dipakai
komponen shadcn supaya gaya ikon di seluruh aplikasi seragam.

```bash
pnpm --filter @helpdesk/web add lucide-react
```

```tsx
import { Ticket, Paperclip, CircleAlert } from 'lucide-react';

<Ticket className="size-4" />
```

Kenapa bukan emoji: renderingnya beda-beda tergantung OS dan font pengguna (emoji
di Windows bisa terlihat berbeda dari di Mac), tidak bisa diwarnai lewat token
`currentColor` seperti SVG, dan terasa tidak pas untuk aplikasi kerja internal.
Lucide juga sudah tersedia lewat `shadcn add` untuk sebagian besar komponen, jadi
biasanya tidak perlu dicari manual.

**Kecuali:** emoji di dokumentasi (`README.md`, dsb) tidak termasuk aturan ini —
itu untuk pembaca markdown di GitHub, bukan bagian dari aplikasi.

## Aturan penulisan komponen

1. **Server Component sebagai default.** Tambahkan `'use client'` hanya kalau butuh
   state, efek, atau event handler.
2. **Satu komponen satu tanggung jawab.** Berkas yang lewat ~150 baris biasanya sedang
   mengerjakan dua hal.
3. **Jangan menaruh logika bisnis di komponen.** Kalau ada perhitungan yang jawabannya
   harus sama dengan backend, itu tandanya backend yang harus mengirimkannya.

## Aksesibilitas — minimum yang tidak boleh dilewatkan

Bukan kesempurnaan, tapi ini wajib karena aplikasi dipakai sepanjang hari:

- Setiap input punya `<label htmlFor>` yang benar-benar tertaut
- Pesan error punya `role="alert"`
- Tombol memakai `<button>`, bukan `<div onClick>`
- Fokus keyboard terlihat — jangan hapus outline tanpa penggantinya

## Yang dinilai di laporan kelompok 2

Perancangan antarmuka, alur interaksi, manajemen state, dan pengujian kegunaan.
Simpan tangkapan layar sebelum/sesudah — pembandingnya ada di
`docs/qa/screenshots/` repo osTicket lama. Perbaikan yang bisa ditunjukkan
berdampingan jauh lebih kuat daripada yang hanya diklaim.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
