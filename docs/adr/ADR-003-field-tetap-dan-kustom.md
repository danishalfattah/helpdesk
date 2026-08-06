---
tags: [adr, model-data]
tanggal: 2026-08-06
status: diterima
---

# ADR-003 — Field tetap dan field kustom (model hibrida)

## Konteks

osTicket menyimpan **semua** field tiket lewat `DynamicForm` — bahkan *subject* tiket sendiri. Alurnya: `ost_form_entry` → `ost_form_entry_values`. Karena daftar tiket jadi lambat, osTicket menambalnya dengan tabel cache `ost_ticket__cdata`.

Ongkosnya terukur, dicatat di `db/README.md` repo osTicket:

> tanpa ini, pembuatan tiket baru melambat dari 0,4 detik jadi **12,8 detik**

Enam field warisan Versa (Call Type, Closure Type, Location, Urgency, Risk, Solution) sudah stabil selama 15 tahun.

## Keputusan

Model **hibrida**, dengan batas yang tegas:

```
Ticket
├── 6 kolom tetap        ← jalur panas: terindeks, bisa difilter, dipakai saved view
└── CustomFieldValue     ← jalur dingin: hanya tampil di halaman detail
```

Dua entitas baru: `CustomFieldDefinition` (name, label, type, required, options, sortOrder, active) dan `CustomFieldValue` (ticketId + fieldId + value, unik per pasangan).

## Tiga pagar pembatas

Inilah yang membedakan desain ini dari osTicket:

1. **Field kustom tidak pernah masuk daftar tiket** — hanya halaman detail. Ini yang menjaga query daftar tetap datar, tanpa join berlebih, tanpa tabel cache.
2. **Field kustom tidak bisa jadi kriteria saved view** di MVP.
3. **Hanya untuk Tiket, tidak untuk Asset** — field Asset sudah diverifikasi stabil lewat pengecekan fill-rate terhadap 3.004 baris data Versa.

Yang terbukti stabil dan dipakai memfilter → kolom. Yang eksperimental dan cuma dibaca → EAV. **osTicket tidak pernah membuat pemisahan itu.**

## Konsekuensi

Menambah field ke-7 sebagai kolom tetap: satu migrasi Prisma (di SQL Server, menambah kolom nullable itu operasi metadata — instan) + satu baris di skema Zod. Form di web menyesuaikan otomatis karena diturunkan dari skema yang sama.

Asimetri yang disengaja:

```
Mulai dari kolom → butuh dynamic form  = menambah, tanpa membongkar
Mulai dari dynamic form → mau balik    = bongkar total, semua query terlanjur bayar
```

Modul field kustom ditaruh **paling akhir dalam urutan pengerjaan** — tidak ada fitur lain yang bergantung padanya, jadi satu-satunya yang bisa gugur tanpa meninggalkan sistem setengah jadi.

## Yang belum diketahui

Seberapa sering tim IT Socfindo sebenarnya minta field baru — belum pernah ditanyakan. Kalau ternyata sangat jarang, modul ini kandidat pertama yang dikeluarkan dari MVP. Lihat [Pertanyaan untuk tim IT](../pertanyaan-tim-it.md).
