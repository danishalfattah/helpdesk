---
tags: [adr, arsitektur]
tanggal: 2026-08-06
status: diterima
---

# ADR-006 — Monorepo kontrak-dulu

## Konteks

Empat mahasiswa, dua kelompok PKL, dua laporan terpisah. Pembagian yang disepakati: kelompok 1 backend, kelompok 2 frontend.

Masalah bawaan pembagian backend/frontend: **kelompok frontend menunggu kelompok backend.** Dalam timeline satu bulan, itu fatal.

Masalah kedua: pembimbing meminta cakupan kontribusi yang jelas per kelompok, jadi batas kepemilikan harus tegas dan terbukti di riwayat git.

## Keputusan

Monorepo pnpm, tiga paket:

```
socfindo-helpdesk/
├── packages/contract/     ← skema Zod bersama    [MILIK BERSAMA]
├── apps/api/              ← NestJS + Prisma      [KELOMPOK 1]
└── apps/web/              ← Next.js + React      [KELOMPOK 2]
```

**Intinya ada di `packages/contract`** — isinya skema Zod, bukan dokumen OpenAPI terpisah.

- `apps/api` memvalidasi request masuk dengan skema itu (`ZodValidationPipe`, ±10 baris, tanpa dependensi tambahan)
- `apps/web` meng-import skema yang sama untuk tipe TypeScript dan validasi form (`react-hook-form` + `zodResolver`)

Karena keduanya membaca **berkas yang sama**, kontraknya secara struktural tidak bisa melenceng. Kalau kelompok 1 mengubah bentuk response, TypeScript menolak kompilasi di sisi kelompok 2 seketika — bukan ketahuan saat demo. Tanpa langkah codegen, tanpa spec tulisan tangan yang basi.

## Cara kelompok 2 tidak menganggur

Kontrak disepakati hari 1–2. Kelompok 2 lalu jalan dengan MSW (mock diturunkan dari skema Zod yang sama) sampai API sungguhan siap. Mereka tidak pernah menunggu.

`packages/contract` diubah lewat PR yang **wajib di-review kedua kelompok**. Ini satu-satunya titik sinkronisasi, dan itu disengaja.

## Pembagian untuk laporan

| | Kelompok 1 (Bagas & Alia) | Kelompok 2 (Danish & Farah) |
|---|---|---|
| Milik | `apps/api` | `apps/web` |
| Bab laporan | Perancangan basis data, arsitektur berlapis, aturan bisnis, pengujian unit | Perancangan antarmuka, alur interaksi, manajemen state, pengujian kegunaan |

## Deployment

```
IIS (ARR reverse proxy)
 ├── /      → Next.js  :3000  (Windows Service)
 └── /api   → NestJS   :3001  (Windows Service)
```

⚠️ Butuh modul **ARR (Application Request Routing)** dan **URL Rewrite** terpasang di IIS. Kalau tim IT menolak, arsitektur harus berubah — lihat [Pertanyaan untuk tim IT](../pertanyaan-tim-it.md).

## Alternatif yang ditolak

**Next.js full-stack dibagi per domain fitur** — lebih cepat sampai garis akhir dan tanpa sinkronisasi kontrak. Ditolak karena mengaburkan batas kontribusi antar kelompok, justru hal yang diminta pembimbing. Tetap jadi rencana cadangan kalau timeline terbukti terlalu ketat.
