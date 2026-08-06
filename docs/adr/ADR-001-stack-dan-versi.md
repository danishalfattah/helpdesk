---
tags: [adr, stack]
tanggal: 2026-08-06
status: diterima
---

# ADR-001 — Stack dan versi

## Konteks

osTicket berbasis PHP dengan arsitektur era ~2010: tanpa `composer.json` di root, ORM buatan sendiri berdampingan dengan 155 pemanggilan `db_query()` SQL mentah, 72 file mencampur logika dan markup HTML, dan tidak ada unit test untuk logika bisnis. Lihat [Cacat desain osTicket](../temuan/cacat-desain-osticket.md).

Tim IT mengizinkan runtime Node.js di server IIS.

## Keputusan

Versi diverifikasi langsung dari registry npm pada 6 Agustus 2026, bukan dari ingatan.

| Paket | Versi |
|---|---|
| Node.js | 24.13.0 |
| pnpm | 11.20.0 |
| TypeScript | **6.0.3** |
| NestJS | 11.1.28 |
| Prisma | 7.9.1 |
| Zod | 4.4.3 |
| Next.js | 16.3.0 |
| React | 19.2.8 |
| TanStack Query | 5.101.4 |
| Tailwind CSS | 4.3.3 |
| react-hook-form | 7.84.0 |
| MSW | 2.15.0 |
| Vitest | 4.1.10 |

## Kenapa TypeScript 6.0.3, bukan 7.0.2

TypeScript 7.0.2 adalah versi terbaru, tapi:

```
typescript-eslint@8.66.0 → peerDependencies: typescript ">=4.8.4 <6.1.0"
```

typescript-eslint belum mendukung TypeScript 7. Memakai TS 7 mematikan linting berbasis tipe — jaring pengaman yang justru paling dibutuhkan saat empat orang men-generate kode cepat.

**Pelajaran yang layak masuk laporan:** "terbaru" dan "siap pakai" bukan hal yang sama. Keputusan teknik yang baik memilih berdasarkan bukti kompatibilitas, bukan nomor versi terbesar.

Naik ke TS 7 dicatat sebagai pengembangan selanjutnya, setelah typescript-eslint mendukung.

## Konsekuensi

- Satu bahasa (TypeScript) dari database sampai antarmuka
- Kualitas keluaran AI konsisten karena NestJS memaksakan struktur — lihat [ADR-006 Monorepo kontrak-dulu](ADR-006-monorepo-kontrak-dulu.md)
- Perlu memantau rilis typescript-eslint untuk naik ke TS 7

## Alternatif yang ditolak

**Express** — tidak punya opini soal struktur. Saat empat orang men-generate kode cepat selama sebulan, tiap sesi akan mengarang strukturnya sendiri. Itu persis penyakit osTicket (ORM dan SQL mentah hidup berdampingan), cuma dengan sintaks lebih baru.

**Laravel + Inertia + Vue** — tetap PHP, jalan native di IIS, dan pengetahuan osTicket langsung terpakai. Ditolak karena melemahkan premis laporan (pindah ke stack modern) padahal Node sudah diizinkan.
