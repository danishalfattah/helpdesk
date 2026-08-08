---
tags: [temuan, prisma, typescript, tahap-0]
tanggal: 2026-08-08
---

# Jebakan lingkungan yang tidak tertulis di plan Task 4

Ditemukan Bagas saat mengerjakan [#4 — Bootstrap NestJS dengan Prisma ke SQL
Server](../issues-tahap-0.md#4--bootstrap-nestjs-dengan-prisma-ke-sql-server).
Kode di `docs/plans/2026-08-06-tahap-0-fondasi.md` Task 4 sudah benar secara
struktur, tapi versi Prisma dan TypeScript yang ter-install (Prisma 7.9.1,
TypeScript 6.0.3) ternyata punya breaking changes yang belum tercermin di plan
saat itu ditulis. Lima hal ini **akan muncul lagi** untuk siapa pun yang
menjalankan langkah-langkah di Task 4 apa adanya — termasuk Alia di #5, #6, #8.

Semua perbaikan di bawah **sudah diterapkan** di kode `apps/api` yang ter-commit.
Dokumen ini menjelaskan alasannya, supaya tidak ada yang mencoba "membetulkan"
balik ke versi plan yang lama saat menyentuh berkas-berkas ini.

## 1. `datasource.url` di `schema.prisma` sudah tidak didukung

**Gejala:** `prisma migrate dev` gagal dengan `P1012`, pesannya eksplisit minta
pindah ke `prisma.config.ts`.

**Plan lama** (Task 4 Langkah 5a) menulis:
```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

**Yang benar di Prisma 7:** `url` dihapus dari `schema.prisma` sepenuhnya, cukup:
```prisma
datasource db {
  provider = "sqlserver"
}
```
dan connection string dipindah ke berkas baru `apps/api/prisma.config.ts`.

## 2. `prisma.config.ts` wajib dibuat manual — tidak ada di plan sama sekali

Berkas baru ini dibaca oleh Prisma CLI (`migrate`, `generate`), terpisah dari
`ConfigModule` NestJS yang dibaca aplikasi saat runtime. Isinya:

```ts
import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: path.join(__dirname, '..', '..', '.env') });

export default defineConfig({
  schema: 'prisma/',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

⚠️ **`schema: 'prisma/'` bukan opsional.** Tanpa baris ini, Prisma CLI cuma
membaca `schema.prisma` (yang isinya cuma generator + datasource) dan **diam-diam
mengabaikan seluruh isi `prisma/models/`**. Akibatnya `migrate dev` bilang
"Already in sync, no schema change" padahal database masih kosong — kelihatan
seperti berhasil, padahal tidak ada model yang ter-load sama sekali. Ini yang
paling berbahaya karena tidak error, hanya diam.

Butuh package `dotenv` sebagai devDependency — tidak ada di plan awal.

## 3. `PrismaClient({ datasourceUrl })` dihapus total — wajib driver adapter

**Gejala:** kalau tetap pakai kode plan (Langkah 9), error baru muncul saat
`prisma generate` atau runtime: constructor menolak opsi `datasourceUrl`.

**Untuk SQL Server**, gantinya adalah `@prisma/adapter-mssql`:

```ts
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaMssql(config.getOrThrow<string>('DATABASE_URL'));
    super({ adapter });
  }
  // ...
}
```

Package tambahan yang perlu di-install: `@prisma/adapter-mssql`, `mssql`,
`@types/mssql`.

## 4. Login database butuh role `dbcreator`, bukan cuma `db_owner`

**Gejala:** `prisma migrate dev` gagal `P3014` — *"CREATE DATABASE permission
denied in database 'master'"*.

Task 3 cuma memberi `helpdesk_app` role `db_owner` di `helpdesk_dev`. Itu cukup
untuk baca/tulis tabel, tapi **Prisma Migrate butuh bikin shadow database
sementara** di level server tiap kali `migrate dev` jalan, dan itu butuh izin di
atas `db_owner`. Perbaikannya (jalan sekali per mesin, bukan per migrasi):

```powershell
sqlcmd -S localhost -E -Q "ALTER SERVER ROLE dbcreator ADD MEMBER helpdesk_app;"
```

Worth ditambahkan ke `docs/setup-lokal.md` Langkah 3c supaya Alia tidak
mengalami ini lagi saat #3 di-setup ulang di mesin lain, atau siapa pun yang
setup dari nol.

## 5. TypeScript 6 menolak `moduleResolution: "Node"` dan `baseUrl`

**Gejala:** `pnpm --filter @helpdesk/api dev` gagal compile dengan `TS5107` dan
`TS5101`, keduanya bilang opsi itu deprecated dan akan berhenti berfungsi di
TypeScript 7.

**Perbaikan** di `apps/api/tsconfig.json`, tambah satu baris:
```json
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    ...
  }
}
```
Ini bukan solusi jangka panjang — sekadar meredam error sampai konfigurasi
`moduleResolution` dimodernisasi (kemungkinan ke `bundler` atau `nodenext`) di
tahap berikutnya. Dicatat di sini supaya tidak dianggap bug baru kalau muncul
lagi di modul lain.

## Bonus: Vitest gagal kalau nol test file

Bukan soal versi, tapi worth dicatat: `apps/api` belum punya test file sampai
#5/#6 mulai. Tanpa `passWithNoTests: true` di `vitest.config.ts`, `pnpm -r test`
akan **gagal** (exit code 1) untuk modul yang belum ada testnya — bukan cuma
"0 test, 0 gagal". Sudah ditambahkan ke `apps/api/vitest.config.ts`.

## Kalau plan Task 5–9 nanti kena hal serupa

Pola yang muncul di sini: **plan ditulis lebih dulu, dependency ter-install
belakangan dengan versi lebih baru dari yang diasumsikan.** Kalau langkah di
plan Task 5, 6, atau 8 tidak jalan persis seperti yang ditulis, cek dulu apakah
versi package yang ter-install (lihat `apps/api/package.json`) sudah berubah
sejak plan itu ditulis — jangan asumsikan langsung salah ketik atau salah
langkah dari orang yang mengerjakan.
