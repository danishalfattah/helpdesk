# Socfindo Helpdesk

Sistem helpdesk pengganti osTicket untuk PT Socfindo. Dikerjakan sebagai PKL
mahasiswa FILKOM Universitas Brawijaya.

## Dokumen utama

📄 **[Spesifikasi desain](docs/specs/2026-08-06-desain-helpdesk.md)** — baca ini dulu.
Berisi seluruh keputusan arsitektur beserta alasannya, alternatif yang ditolak,
dan urutan pengerjaan.

## Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Node.js 24.13.0, pnpm 11.20.0 |
| Bahasa | TypeScript 6.0.3 |
| API | NestJS 11 + Prisma 7 |
| Database | SQL Server (minimum 2017) |
| Web | Next.js 16 + React 19 + Tailwind 4 |
| Kontrak | Zod 4 (skema bersama) |
| Uji | Vitest 4, MSW 2 |

Alasan tiap pilihan ada di spesifikasi §3 dan §14.

## Struktur

```
helpdesk/
├── packages/contract/   skema Zod bersama    [MILIK BERSAMA]
├── apps/api/            NestJS + Prisma      [KELOMPOK 1]
└── apps/web/            Next.js + React      [KELOMPOK 2]
```

## Tim

| Kelompok | Anggota | Tanggung jawab |
|---|---|---|
| 1 | Bagas, Alia | `apps/api` — model domain, aturan bisnis, RBAC |
| 2 | Danish, Farah | `apps/web` — antarmuka, alur interaksi, state |

`packages/contract` milik bersama. Perubahannya lewat PR yang di-review kedua kelompok.

## Status

Tahap perancangan selesai. Implementasi belum dimulai.

⚠️ Enam ketergantungan ke tim IT masih terbuka dan memblokir sebagian keputusan —
lihat spesifikasi §13.
