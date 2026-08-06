# Socfindo Helpdesk

Sistem helpdesk pengganti osTicket untuk PT Socfindo. Dikerjakan sebagai PKL
mahasiswa FILKOM Universitas Brawijaya.

## Dokumen

| Dokumen | Isi |
|---|---|
| 🚀 **[MULAI-DI-SINI.md](MULAI-DI-SINI.md)** | **Anggota tim, mulai dari sini.** Cara kerja + daftar issue kamu per nama |
| 🚀 [Setup di mesin sendiri](docs/setup-lokal.md) | Dijalankan tiap orang di laptop masing-masing |
| 📄 **[Spesifikasi desain](docs/specs/2026-08-06-desain-helpdesk.md)** | Seluruh keputusan arsitektur + alasannya |
| 📖 [Glosarium](docs/glosarium.md) | **Nama entitas yang benar.** Baca sebelum menamai apa pun |
| 🧭 [ADR](docs/adr/) | Keputusan arsitektur satuan + alternatif yang ditolak |
| 🔍 [Temuan osTicket](docs/temuan/) | Fitur yang terpakai, cacat desain yang diperbaiki |
| 🗺 **[Backlog](docs/backlog.md)** | **61 issue, Tahap 0–6.** Peta pekerjaan sampai selesai |
| 🛠 [Rencana Tahap 0](docs/plans/2026-08-06-tahap-0-fondasi.md) | 11 task, langkah TDD rinci |
| 🎫 [Issue Tahap 0](docs/issues-tahap-0.md) | Badan issue #1–#11, siap ditempel |
| ❓ [Pertanyaan tim IT](docs/pertanyaan-tim-it.md) | Ketergantungan terbuka yang memblokir |
| 🤝 [CONTRIBUTING](CONTRIBUTING.md) | Alur issue → branch → PR |

Konvensi kode ada di `CLAUDE.md` — di root dan di tiap paket.

## Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Node.js 24.13.0, pnpm 11.20.0 |
| Bahasa | TypeScript 6.0.3 |
| API | NestJS 11 + Prisma 7 |
| Database | SQL Server 2022 |
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

Tahap perancangan selesai. Implementasi Tahap 0 sedang berjalan — lihat
[docs/backlog.md](docs/backlog.md) untuk progres tiap issue.

⚠️ Enam ketergantungan ke tim IT masih terbuka dan memblokir sebagian keputusan —
lihat spesifikasi §13.
