---
tags: [pertanyaan, blocker]
tanggal: 2026-08-06
status: belum terjawab
---

# Pertanyaan untuk tim IT & pembimbing lapangan

Semua ini **memblokir keputusan desain**. Tanyakan di minggu pertama — jawaban yang datang di minggu keempat sudah terlambat untuk ditindaklanjuti.

## Prioritas tinggi — memblokir arsitektur

### 1. IIS: modul ARR terpasang?

Reverse proxy ke Node.js butuh **Application Request Routing (ARR)** dan **URL Rewrite** di IIS.

> Apakah IIS di server sudah punya modul ARR dan URL Rewrite? Kalau belum, apakah boleh dipasang?

Kalau ditolak, [ADR-006 Monorepo kontrak-dulu](adr/ADR-006-monorepo-kontrak-dulu.md) harus dirombak.

### 2. SQL Server: versi berapa, instance mana?

> Instance SQL Server mana yang akan dipakai untuk aplikasi baru ini, dan **versinya tahun berapa**? Boleh minta database + user khusus untuk development?

**Syarat minimum: SQL Server 2017.** Di bawah itu Prisma tidak jalan sama sekali.

⚠️ VersaSRS berjalan di **SQL Server 2014** (`AP14002604`). Kalau instance yang ditawarkan juga 2014, [ADR-002 SQL Server](adr/ADR-002-sql-server.md) gugur.

Lanskap versi per Agustus 2026:

| Versi | Status | Untuk project ini |
|---|---|---|
| 2025 | Rilis 18 Nov 2025, mainstream sampai Jan 2031 | Boleh, baru ~9 bulan |
| **2022** | Didukung sampai 2033 | ✅ **Paling ideal — minta ini** |
| 2019 | Mainstream habis Feb 2025, extended sampai Feb 2030 | Boleh |
| 2017 | Batas minimum Prisma | Mepet, tapi jalan |
| 2016 | Habis 14 Juli 2026 | ❌ Tidak didukung lagi |
| 2014 | Sudah lama habis | ❌ Prisma tidak jalan |

Minta **2022**: sudah teruji bertahun-tahun dan didukung sampai 2033, jauh melewati umur project ini. Penalaran yang sama dengan menolak TypeScript 7 di [ADR-001 Stack dan versi](adr/ADR-001-stack-dan-versi.md) — yang terbaru belum tentu yang paling tepat; untuk database produksi, matang lebih berharga daripada baru.

**Rencana cadangan kalau cuma ada 2014**, berurutan:

1. **Minta instance baru** — Developer Edition gratis untuk dev; produksi perlu lisensi & persetujuan. Argumen yang bisa dipakai: menjalankan database yang sudah bertahun-tahun tanpa patch keamanan itu masalah tim IT juga, bukan cuma masalah kita.
2. **Ganti ORM, tetap SQL Server** — Kysely atau TypeORM mendukung versi lama. Kehilangan migrasi otomatis dan type-safety Prisma.
3. **Balik ke MySQL/PostgreSQL** — ADR-002 gugur.

Sumber: [Microsoft Learn — SQL Server 2025 lifecycle](https://learn.microsoft.com/en-us/lifecycle/products/sql-server-2025), [endoflife.date — Microsoft SQL Server](https://endoflife.date/mssqlserver)

### 3. Node.js boleh dijalankan sebagai Windows Service?

> Aplikasi butuh 2 proses Node berjalan permanen. Boleh dipasang sebagai Windows Service (via NSSM atau sejenisnya)?

## Prioritas sedang — memengaruhi scope

### 4. Seberapa sering minta field baru?

> Selama pakai VersaSRS/osTicket, seberapa sering tim minta ditambahkan field baru di form tiket?

Menentukan apakah modul field kustom layak masuk MVP. Lihat [ADR-003 Field tetap dan kustom](adr/ADR-003-field-tetap-dan-kustom.md).

### 5. Backup lampiran

Lampiran pindah dari database ke filesystem, jadi backup jadi dua bagian: dump database **dan** folder lampiran.

> Bagaimana kebijakan backup untuk folder file di server? Perlu path UNC khusus?

### 6. Mailbox untuk email masuk

> Mailbox mana yang dipakai helpdesk? Protokolnya IMAP atau Exchange/Graph API?

Kalau ternyata Exchange Online dengan Graph API dan bukan IMAP biasa, alur email masuk berubah cukup banyak.

---

## Yang harus diangkat ke pembimbing lapangan

### 7. ⚠️ Gap 2 tahun data yang belum termigrasi

Tercatat di `docs/migrasi-db-versasrs-ke-osticket.md` repo osTicket, dan **belum ditindaklanjuti**:

Server yang dimigrasi (`AP14002604`) **bukan** VersaSRS produksi (`192.168.0.99`). Data di server sumber mentok di CallID 1000014 / 18 Mei 2024, sementara VersaSRS live sudah sampai CallID 1000100+.

**Artinya ada ~2 tahun tiket produksi yang belum termigrasi.** Selama ini tidak diselesaikan, osTicket tidak akan pernah bisa benar-benar menggantikan VersaSRS.

Ini harus diangkat, bukan dibiarkan. Kabar baiknya: sistem baru pakai SQL Server, jadi migrasi susulan jadi SQL Server → SQL Server — jauh lebih mudah.
