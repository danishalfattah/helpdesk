# Architecture Decision Record (ADR)

Catatan keputusan arsitektur. Tiap berkas mencatat **satu** keputusan beserta
konteks, konsekuensi, dan **alternatif yang ditolak**.

## Kenapa formatnya begini

Bagian "alternatif yang ditolak" itu yang paling berharga. Enam bulan lagi, saat ada
yang bertanya "kenapa tidak pakai X?", jawabannya sudah tertulis — bukan mengarang
ulang dari ingatan.

Untuk laporan PKL, ini bahan langsung bab Perancangan. Penguji hampir pasti bertanya
"kenapa tidak pakai X?" untuk X = Express, Laravel, MySQL, Redis, JWT. Semuanya sudah
terjawab di sini.

## Daftar

| ADR | Keputusan | Status |
|---|---|---|
| [ADR-001](ADR-001-stack-dan-versi.md) | Stack dan versi — kenapa NestJS, kenapa TypeScript 6 bukan 7 | Diterima |
| [ADR-002](ADR-002-sql-server.md) | SQL Server sebagai basis data | Diterima |
| [ADR-003](ADR-003-field-tetap-dan-kustom.md) | Model hibrida: kolom tetap + field kustom | Diterima |
| [ADR-004](ADR-004-tanpa-cache.md) | Tanpa lapisan cache | Diterima |
| [ADR-005](ADR-005-rbac-role.md) | RBAC murni lewat Role | Diterima |
| [ADR-006](ADR-006-monorepo-kontrak-dulu.md) | Monorepo kontrak-dulu | Diterima |

## Menambah ADR baru

Buat saat mengambil keputusan yang:

- sulit dibatalkan nanti (pilihan database, bentuk skema, pola arsitektur), **atau**
- akan ditanyakan orang lain "kenapa begini?"

Jangan buat ADR untuk keputusan sehari-hari — nama variabel, urutan berkas, gaya
penulisan. Itu isinya `CLAUDE.md`.

Salin struktur salah satu berkas di atas: Konteks → Keputusan → Konsekuensi →
Alternatif yang ditolak. Nomor berikutnya berurutan, jangan dipakai ulang walaupun
ada ADR yang nanti dibatalkan — kalau dibatalkan, ubah statusnya jadi "Digantikan
oleh ADR-0NN", jangan dihapus.
