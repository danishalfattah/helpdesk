---
tags: [adr, performa]
tanggal: 2026-08-06
status: diterima
---

# ADR-004 — Tanpa lapisan cache

## Konteks

Pertanyaan yang wajar: apakah helpdesk ini butuh Redis atau lapisan cache lain?

Beban kerja sesungguhnya, dihitung dari data migrasi:

| Ukuran | Angka |
|---|---|
| Tiket selama 15 tahun | 56.894 |
| Rata-rata per tahun | ±3.793 |
| **Rata-rata per hari kerja** | **±15 tiket** |
| Agent aktif | 36 |
| Pesan per tiket | ±4,9 |

## Keputusan

**Tidak memakai lapisan cache.** SQL Server dengan indeks yang benar melayani beban ini dalam satuan milidetik.

Menambahkan Redis berarti: satu service lagi untuk dijalankan dan dipantau tim IT, satu mode kegagalan baru, dan invalidasi cache — sumber bug halus yang terkenal — ditukar dengan penghematan yang tidak terukur.

## Satu tempat yang biasanya butuh cache, dan kenapa di sini tidak

Hitungan angka di sidebar (232 saved view × 1 query COUNT) biasanya jadi alasan sah memakai cache. Tapi config osTicket menunjukkan:

```
queue_bucket_counts = 0
```

Fitur itu sudah dimatikan. Kebutuhannya tidak ada.

## Caching yang sudah didapat gratis

TanStack Query melakukan caching, dedupe request, dan background refetch di sisi klien — itu yang benar-benar dirasakan pengguna. Next.js meng-cache di sisi server. Keduanya sudah ada di stack, tanpa menambah infrastruktur.

## Ambang peninjauan ulang

Keputusan ini ditinjau ulang kalau salah satu terjadi:

- ada endpoint yang konsisten di atas ~300 ms **setelah** indeks dibenahi
- tiket per hari naik ke ratusan, bukan belasan
- muncul dashboard agregat lintas 56rb tiket yang di-hit terus-menerus

## Catatan

Masalah 12,8 detik di osTicket **bukan** masalah cache — itu masalah skema, dan osTicket justru mencoba menambalnya dengan cache (`ost_ticket__cdata`). [ADR-003 Field tetap dan kustom](ADR-003-field-tetap-dan-kustom.md) menghapus penyebabnya, bukan menambal gejalanya.
