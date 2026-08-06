---
tags: [adr, database]
tanggal: 2026-08-06
status: diterima
---

# ADR-002 — SQL Server sebagai basis data

## Konteks

Asumsi awal: pakai MySQL karena osTicket memakai MySQL.

Asumsi itu **keliru**, dan ketahuan saat memeriksa config osTicket:

```
helpdesk_url = http://localhost:8080/osticket/
```

osTicket belum pernah keluar dari localhost XAMPP. MySQL **belum ada** di server perusahaan. Memilih MySQL berarti meminta tim IT mengadopsi engine database baru.

Sementara SQL Server jelas sudah dijalankan perusahaan: `AP14002604` (sumber migrasi) dan `192.168.0.99` (VersaSRS produksi). Sudah berlisensi, sudah di-backup, sudah dikuasai tim IT. Perusahaan ini Microsoft shop — IIS, Windows Server, SQL Server.

## Keputusan

**SQL Server 2022**, lewat Prisma provider `sqlserver`.

Versinya dipatok, bukan sekadar "2017 ke atas". Seluruh tim memakai 2022 supaya perilaku database di empat laptop identik — bug yang hanya muncul di satu mesin karena beda versi adalah yang paling mahal untuk dilacak. Panduan setup juga jadi lebih sederhana karena kode registry `MSSQL16` berlaku untuk semua orang.

SQL Server 2022 didukung sampai 2033, jauh melewati umur project ini. Yang masih perlu dikonfirmasi: apakah server perusahaan juga menjalankan 2022 — lihat [Pertanyaan untuk tim IT](../pertanyaan-tim-it.md).

## Keterbatasan Prisma + SQL Server dan cara menanganinya

Prisma 7 mendukung SQL Server 2017+, status GA.

| Keterbatasan | Penanganan |
|---|---|
| Tidak ada `enum` native | Nol dampak — status/priority memang harus tabel lookup karena bisa diubah admin |
| Tipe `Json` tidak didukung | Kriteria saved view disimpan `NVARCHAR`, di-parse skema Zod |
| Full-text search Prisma tidak dukung SQL Server | Nol dampak di MVP (tanpa migrasi data). Nanti `$queryRaw` + `CONTAINS` |
| `UNIQUE` cuma boleh 1 NULL; tidak ada `RESTRICT` | Filtered index dan `NoAction` |

## Konsekuensi

**Menguntungkan:** sisa data 2 tahun yang belum termigrasi ada di SQL Server (`192.168.0.99`). Migrasi susulan jadi SQL Server → SQL Server, jauh lebih mudah daripada ETL lintas-engine yang sudah dilalui.

**Merugikan:** Prisma + SQL Server lebih jarang dipakai dibanding Postgres/MySQL, jadi contoh di data latihan AI lebih sedikit. Dampaknya terkonsentrasi di 3 titik pada tabel di atas, tidak menyebar.

## Alternatif yang ditolak

**MySQL 8** — ekosistem Prisma paling matang dan full-text search didukung. Ditolak karena meminta tim IT mengadopsi engine baru tanpa manfaat sepadan.

**PostgreSQL** — dukungan Prisma terbaik. Ditolak karena friksi paling besar di lingkungan Microsoft shop.
