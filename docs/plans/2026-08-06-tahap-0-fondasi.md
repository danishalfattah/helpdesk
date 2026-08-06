# Rencana Implementasi — Tahap 0: Fondasi

> **Untuk yang mengerjakan:** Pakai skill `superpowers:subagent-driven-development`
> (disarankan) atau `superpowers:executing-plans` untuk menjalankan rencana ini
> tugas demi tugas. Tiap langkah pakai checkbox (`- [ ]`) untuk penanda.

**Tujuan:** Membangun fondasi teknis Socfindo Helpdesk sampai satu alur benar-benar
tembus ujung-ke-ujung — dari form login di browser, lewat kontrak Zod, ke NestJS,
ke SQL Server, dan kembali lagi.

**Arsitektur:** Monorepo pnpm dengan tiga paket. `packages/contract` berisi skema Zod
yang di-import kedua sisi, sehingga kontrak API tidak bisa melenceng secara struktural.
`apps/api` memakai NestJS + Prisma ke SQL Server. `apps/web` memakai Next.js.

**Stack:** Node 24.13.0 · pnpm 11 · TypeScript 6.0.3 · NestJS 11 · Prisma 7 ·
SQL Server 2022 Express · Zod 4 · Next.js 16 · Vitest 4

**Spesifikasi:** [`docs/specs/2026-08-06-desain-helpdesk.md`](../specs/2026-08-06-desain-helpdesk.md)

---

## Kondisi mesin (sudah diverifikasi 6 Agustus 2026)

| Hal | Kondisi |
|---|---|
| Node.js | 24.13.0 ✅ |
| pnpm | 10.12.1 — **perlu dinaikkan ke 11** |
| SQL Server | 2022 Express (16.0.1000.6), instance `SQLEXPRESS`, **jalan** ✅ |
| Login Windows | `LAPTOP-JHH7DE05\ASUS`, **sysadmin** ✅ |
| TCP/IP SQL Server | **NONAKTIF (`Enabled = 0`)** ⚠️ ditangani Task 3 |
| Named Pipes | nonaktif |
| Mode autentikasi | **Windows only** ⚠️ ditangani Task 3 |
| Root project | `C:\Users\ASUS\Desktop\KULIAH\PKL\helpdesk` |

### Tiga jebakan yang sudah diantisipasi rencana ini

1. **TCP/IP SQL Server nonaktif.** `sqlcmd` berhasil karena memakai Shared Memory,
   tapi Prisma butuh TCP. Tanpa Task 3, error yang muncul cuma
   "Can't reach database server" tanpa petunjuk. Ditangani Task 3.
2. **Vitest tidak bisa `emitDecoratorMetadata`.** Vitest memakai esbuild, dan esbuild
   tidak mendukungnya — padahal dependency injection NestJS bergantung penuh pada itu.
   Tanpa `unplugin-swc`, semua test NestJS gagal dengan error DI yang membingungkan.
   Ditangani Task 4.
3. **Prisma 7 memakai generator `prisma-client`, bukan `prisma-client-js`.** Generator
   lama sudah deprecated, dan yang baru **mewajibkan** `output` — tidak ada lagi
   generate otomatis ke `node_modules`. Ditangani Task 4.

---

## Struktur berkas yang dibangun

```
helpdesk/
├── package.json                       root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json                 opsi TS dipakai bersama
├── .env.example
├── .env                               (tidak di-commit)
│
├── packages/contract/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts                   titik ekspor tunggal
│       ├── error.ts                   bentuk error seragam
│       └── auth/
│           ├── login.ts               LoginRequest, LoginResponse
│           └── login.test.ts
│
├── apps/api/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts               + unplugin-swc
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma          generator + datasource SAJA
│   │   ├── models/
│   │   │   └── agent.prisma       satu domain, satu berkas
│   │   └── seed.ts
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/
│       │   ├── prisma.service.ts
│       │   └── prisma.module.ts
│       ├── common/
│       │   ├── zod-validation.pipe.ts
│       │   ├── zod-validation.pipe.test.ts
│       │   ├── global-exception.filter.ts
│       │   ├── global-exception.filter.test.ts
│       │   └── domain.error.ts
│       └── auth/
│           ├── password.service.ts
│           ├── password.service.test.ts
│           ├── session.service.ts
│           ├── auth.service.ts
│           ├── auth.service.test.ts
│           ├── auth.controller.ts
│           ├── auth.module.ts
│           ├── permission.guard.ts
│           ├── permission.guard.test.ts
│           └── require-permission.decorator.ts
│
└── apps/web/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── login/page.tsx
        │   └── beranda/page.tsx
        └── lib/api.ts
```

**Pembagian kepemilikan:** Task 1–3 dikerjakan **bersama** (fondasi bersama).
Task 4–9 milik **kelompok 1**. Task 10 milik **kelompok 2**.
`packages/contract` (Task 2) milik bersama — perubahannya lewat PR yang di-review
kedua kelompok.

---

## Task 1: Fondasi monorepo

**Berkas:**
- Buat: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.npmrc`, `.env.example`

- [ ] **Langkah 1: Naikkan pnpm ke versi 11**

```bash
npm install -g pnpm@11.20.0
```

- [ ] **Langkah 2: Pastikan versinya benar**

Jalankan: `pnpm -v`
Harapan: `11.20.0`

- [ ] **Langkah 3: Buat `package.json` di root**

```json
{
  "name": "socfindo-helpdesk",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.20.0",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "typescript": "6.0.3"
  }
}
```

- [ ] **Langkah 4: Buat `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Langkah 5: Buat `tsconfig.base.json`**

`strict: true` wajib. `emitDecoratorMetadata` dibutuhkan NestJS.

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Langkah 6: Buat `.npmrc`**

Baris ini wajib. Tanpanya pnpm menyembunyikan dependensi transitif dan NestJS gagal
me-resolve `reflect-metadata`.

```
node-linker=hoisted
strict-peer-dependencies=false
```

- [ ] **Langkah 7: Buat `.env.example`**

```
# Koneksi SQL Server — nilai sesungguhnya ada di .env (tidak di-commit)
DATABASE_URL="sqlserver://localhost:1433;database=helpdesk_dev;user=helpdesk_app;password=GANTI_INI;encrypt=true;trustServerCertificate=true"

# Port aplikasi
API_PORT=3001
WEB_PORT=3000

# Asal yang diizinkan mengakses API (CORS)
WEB_ORIGIN="http://localhost:3000"
```

- [ ] **Langkah 8: Pasang dependensi root**

```bash
pnpm install
```

- [ ] **Langkah 9: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .npmrc .env.example pnpm-lock.yaml
git commit -m "chore: fondasi monorepo pnpm workspace"
```

---

## Task 2: packages/contract — skema Zod pertama

Ini paket milik bersama. Bentuk berkas di sini menjadi contoh untuk semua kontrak
berikutnya, jadi kerjakan dengan cermat.

**Berkas:**
- Buat: `packages/contract/package.json`, `tsconfig.json`, `vitest.config.ts`
- Buat: `packages/contract/src/error.ts`, `src/auth/login.ts`, `src/index.ts`
- Uji: `packages/contract/src/auth/login.test.ts`

- [ ] **Langkah 1: Buat `packages/contract/package.json`**

```json
{
  "name": "@helpdesk/contract",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "4.4.3"
  },
  "devDependencies": {
    "vitest": "4.1.10",
    "typescript": "6.0.3"
  }
}
```

- [ ] **Langkah 2: Buat `packages/contract/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Langkah 3: Buat `packages/contract/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Langkah 4: Tulis test yang gagal**

Berkas: `packages/contract/src/auth/login.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { LoginRequest } from './login.js';

describe('LoginRequest', () => {
  it('menerima email dan password yang valid', () => {
    const hasil = LoginRequest.safeParse({
      email: 'admin@socfindo.co.id',
      password: 'rahasia123',
    });
    expect(hasil.success).toBe(true);
  });

  it('menolak email yang bukan format email', () => {
    const hasil = LoginRequest.safeParse({
      email: 'bukan-email',
      password: 'rahasia123',
    });
    expect(hasil.success).toBe(false);
  });

  it('menolak password di bawah 8 karakter', () => {
    const hasil = LoginRequest.safeParse({
      email: 'admin@socfindo.co.id',
      password: 'pendek',
    });
    expect(hasil.success).toBe(false);
  });

  it('mengubah email jadi huruf kecil dan membuang spasi tepi', () => {
    const hasil = LoginRequest.parse({
      email: '  Admin@Socfindo.co.id  ',
      password: 'rahasia123',
    });
    expect(hasil.email).toBe('admin@socfindo.co.id');
  });
});
```

- [ ] **Langkah 5: Jalankan test, pastikan GAGAL**

```bash
pnpm --filter @helpdesk/contract test
```

Harapan: GAGAL dengan `Cannot find module './login.js'`

- [ ] **Langkah 6: Buat `packages/contract/src/error.ts`**

Bentuk error seragam untuk seluruh API (spec §7).

```ts
import { z } from 'zod';

/**
 * Bentuk error tunggal untuk seluruh API.
 *
 * `code` sengaja berupa string konstan, bukan hanya pesan bahasa Inggris,
 * supaya sisi web memutuskan perilaku berdasarkan kode — bukan mencocokkan teks
 * yang bisa berubah sewaktu-waktu.
 *
 * `fields` memetakan nama field ke pesan error, sehingga form di sisi web bisa
 * menampilkannya langsung tanpa penerjemahan manual.
 */
export const ApiErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;

export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

- [ ] **Langkah 7: Buat `packages/contract/src/auth/login.ts`**

```ts
import { z } from 'zod';

export const LoginRequest = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type LoginRequest = z.infer<typeof LoginRequest>;

export const AgentProfile = z.object({
  id: z.number().int(),
  email: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});

export type AgentProfile = z.infer<typeof AgentProfile>;

export const LoginResponse = z.object({
  agent: AgentProfile,
});

export type LoginResponse = z.infer<typeof LoginResponse>;
```

- [ ] **Langkah 8: Buat `packages/contract/src/index.ts`**

```ts
export * from './error.js';
export * from './auth/login.js';
```

- [ ] **Langkah 9: Jalankan test, pastikan LULUS**

```bash
pnpm --filter @helpdesk/contract test
```

Harapan: LULUS, 4 test.

- [ ] **Langkah 10: Commit**

```bash
git add packages/contract
git commit -m "feat(contract): skema Zod login dan bentuk error seragam"
```

---

## Task 3: Siapkan SQL Server 2022 Express

⚠️ **Semua perintah PowerShell di task ini butuh Run as Administrator.**

Task ini menangani jebakan nomor 1 dan mengaktifkan autentikasi SQL login. Alasan
memakai SQL login, bukan Windows auth: nanti tim IT memberi SQL login untuk produksi,
dan tiap anggota tim memakai akun Windows berbeda — SQL login membuat connection
string sama untuk semua orang.

**Berkas:** tidak ada berkas project yang diubah. Ini konfigurasi mesin.

- [ ] **Langkah 1: Aktifkan TCP/IP dan kunci ke port 1433**

Port 1433 kosong karena instance default (`MSSQLSERVER`) tidak berjalan — hanya
`SQLEXPRESS`. Memakai port tetap membuat SQL Browser tidak diperlukan sama sekali.

```powershell
$base = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer\SuperSocketNetLib"
Set-ItemProperty -Path "$base\Tcp" -Name Enabled -Value 1
Set-ItemProperty -Path "$base\Tcp\IPAll" -Name TcpPort -Value "1433"
Set-ItemProperty -Path "$base\Tcp\IPAll" -Name TcpDynamicPorts -Value ""
```

- [ ] **Langkah 2: Aktifkan Mixed Mode authentication**

Nilai `2` berarti SQL Server menerima Windows auth **dan** SQL login. Nilai `1`
berarti Windows saja — itu kondisi sekarang.

```powershell
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer" -Name LoginMode -Value 2
```

- [ ] **Langkah 3: Restart service SQL Server**

```powershell
Restart-Service -Name "MSSQL`$SQLEXPRESS" -Force
```

- [ ] **Langkah 4: Pastikan port 1433 sudah mendengarkan**

```powershell
Get-NetTCPConnection -LocalPort 1433 -State Listen | Select-Object LocalAddress, LocalPort, State
```

Harapan: ada minimal satu baris dengan `LocalPort 1433` dan `State Listen`.
Kalau kosong, TCP/IP belum aktif — ulangi Langkah 1 dan pastikan PowerShell dijalankan
sebagai Administrator.

- [ ] **Langkah 5: Buat database dan login aplikasi**

Ganti `GantiPasswordIni!2026` dengan password kalian sendiri, lalu **catat** —
akan dipakai di `.env`.

```powershell
& sqlcmd -S "localhost\SQLEXPRESS" -E -Q "
IF DB_ID('helpdesk_dev') IS NULL CREATE DATABASE helpdesk_dev;
IF SUSER_ID('helpdesk_app') IS NULL
  CREATE LOGIN helpdesk_app WITH PASSWORD = 'GantiPasswordIni!2026', CHECK_POLICY = OFF;
"
& sqlcmd -S "localhost\SQLEXPRESS" -E -d helpdesk_dev -Q "
IF USER_ID('helpdesk_app') IS NULL CREATE USER helpdesk_app FOR LOGIN helpdesk_app;
ALTER ROLE db_owner ADD MEMBER helpdesk_app;
"
```

`db_owner` diperlukan karena Prisma Migrate membuat dan mengubah tabel. Di produksi
nanti hak ini dipersempit.

- [ ] **Langkah 6: Uji koneksi lewat TCP dengan SQL login**

Ini pembuktian sesungguhnya — `-S localhost,1433` memaksa lewat TCP, bukan Shared Memory.

```powershell
& sqlcmd -S "localhost,1433" -U helpdesk_app -P "GantiPasswordIni!2026" -d helpdesk_dev -Q "SELECT DB_NAME() AS db, SUSER_NAME() AS login;" -h -1 -W
```

Harapan: `helpdesk_dev helpdesk_app`

Kalau gagal dengan "Login failed", berarti Mixed Mode belum aktif — ulangi Langkah 2
dan 3.

- [ ] **Langkah 7: Buat berkas `.env` di root project**

Ganti password sesuai yang dibuat di Langkah 5. Berkas ini **tidak di-commit** —
sudah masuk `.gitignore`.

```
DATABASE_URL="sqlserver://localhost:1433;database=helpdesk_dev;user=helpdesk_app;password=GantiPasswordIni!2026;encrypt=true;trustServerCertificate=true"
API_PORT=3001
WEB_PORT=3000
WEB_ORIGIN="http://localhost:3000"
```

`trustServerCertificate=true` diperlukan karena SQL Server Express memakai sertifikat
self-signed. Untuk produksi nanti ganti dengan sertifikat sungguhan.

- [ ] **Langkah 8: Pastikan `.env` tidak akan ter-commit**

```bash
git status --short
```

Harapan: `.env` **tidak** muncul di daftar.

---

## Task 4: apps/api — NestJS dan Prisma tersambung

**Berkas:**
- Buat: `apps/api/package.json`, `tsconfig.json`, `vitest.config.ts`, `nest-cli.json`
- Buat: `apps/api/prisma/schema.prisma`
- Buat: `apps/api/src/main.ts`, `src/app.module.ts`
- Buat: `apps/api/src/prisma/prisma.service.ts`, `src/prisma/prisma.module.ts`

- [ ] **Langkah 1: Buat `apps/api/package.json`**

```json
{
  "name": "@helpdesk/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@helpdesk/contract": "workspace:*",
    "@nestjs/common": "11.1.28",
    "@nestjs/config": "4.0.4",
    "@nestjs/core": "11.1.28",
    "@nestjs/platform-express": "11.1.28",
    "@prisma/client": "7.9.1",
    "argon2": "0.45.1",
    "cookie-parser": "1.4.7",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.2",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.24",
    "@nestjs/testing": "11.1.28",
    "@swc/core": "1.15.47",
    "@types/cookie-parser": "1.4.10",
    "@types/express": "5.0.6",
    "@types/node": "24.13.3",
    "prisma": "7.9.1",
    "tsx": "4.23.8",
    "typescript": "6.0.3",
    "unplugin-swc": "1.5.10",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Langkah 2: Buat `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": "./"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

- [ ] **Langkah 3: Buat `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Langkah 4: Buat `apps/api/vitest.config.ts`**

Ini menangani jebakan nomor 2. `unplugin-swc` menggantikan esbuild sehingga
`emitDecoratorMetadata` benar-benar dihasilkan — tanpa ini, dependency injection
NestJS gagal di semua test.

```ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    root: './',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true },
      },
    }),
  ],
});
```

- [ ] **Langkah 5a: Buat `apps/api/prisma/schema.prisma`**

Skema **dipecah per domain**. Berkas ini hanya berisi `generator` dan `datasource` —
tidak ada model sama sekali.

Alasannya bukan kerapian, melainkan kerja paralel: Bagas dan Alia akan sering
menambah model bersamaan, dan satu berkas skema berarti konflik git berulang.
Satu berkas per domain menghilangkan konflik itu sepenuhnya. Skema multi-berkas
sudah GA di Prisma 7 (bukan preview lagi), dan menerapkannya nanti setelah ada
migrasi jauh lebih repot.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

- [ ] **Langkah 5b: Buat `apps/api/prisma/models/agent.prisma`**

Semua model Tahap 0 masuk satu berkas karena semuanya satu domain (identitas).
Tahap berikutnya menambah `models/ticket.prisma`, `models/department.prisma`, dan
seterusnya — **satu domain, satu berkas.**

Catatan SQL Server: tidak ada `enum` native, jadi Role dan Permission memang tabel
lookup — itu sesuai kebutuhan karena admin bisa mengubahnya (spec §5.1).

```prisma
model Agent {
  id           Int      @id @default(autoincrement())
  email        String   @unique @db.NVarChar(255)
  name         String   @db.NVarChar(128)
  passwordHash String   @db.NVarChar(255)
  isActive     Boolean  @default(true)
  failedLogins Int      @default(0)
  lockedUntil  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  roles    AgentRole[]
  sessions Session[]
}

model Role {
  id          Int     @id @default(autoincrement())
  name        String  @unique @db.NVarChar(64)
  description String? @db.NVarChar(255)

  agents      AgentRole[]
  permissions RolePermission[]
}

model Permission {
  id    Int    @id @default(autoincrement())
  key   String @unique @db.NVarChar(64)
  label String @db.NVarChar(128)

  roles RolePermission[]
}

model AgentRole {
  agentId Int
  roleId  Int

  agent Agent @relation(fields: [agentId], references: [id], onDelete: NoAction)
  role  Role  @relation(fields: [roleId], references: [id], onDelete: NoAction)

  @@id([agentId, roleId])
}

model RolePermission {
  roleId       Int
  permissionId Int

  role       Role       @relation(fields: [roleId], references: [id], onDelete: NoAction)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: NoAction)

  @@id([roleId, permissionId])
}

model Session {
  id        String   @id @db.NVarChar(64)
  agentId   Int
  expiresAt DateTime
  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: NoAction)

  @@index([agentId])
  @@index([expiresAt])
}
```

`onDelete: NoAction` dipakai di semua relasi karena SQL Server tidak mendukung
`RESTRICT` (spec §3).

- [ ] **Langkah 6: Pasang dependensi**

```bash
pnpm install
```

- [ ] **Langkah 7: Jalankan migrasi pertama**

```bash
pnpm --filter @helpdesk/api exec prisma migrate dev --name init
```

Harapan: terbentuk folder `apps/api/prisma/migrations/<timestamp>_init/` dan pesan
`Your database is now in sync with your schema.`

Kalau gagal dengan "Can't reach database server", ulangi Task 3 Langkah 4 dan 6 —
TCP/IP belum aktif.

- [ ] **Langkah 8: Pastikan tabel benar-benar terbentuk**

```powershell
& sqlcmd -S "localhost,1433" -U helpdesk_app -P "GantiPasswordIni!2026" -d helpdesk_dev -Q "SELECT name FROM sys.tables ORDER BY name;" -h -1 -W
```

Harapan: `Agent`, `AgentRole`, `Permission`, `Role`, `RolePermission`, `Session`,
dan `_prisma_migrations`.

- [ ] **Langkah 9: Buat `apps/api/src/prisma/prisma.service.ts`**

URL database diberikan eksplisit dari `ConfigService`, bukan mengandalkan pembacaan
`.env` otomatis — Prisma 7 tidak lagi memuat `.env` saat runtime.

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ datasourceUrl: config.getOrThrow<string>('DATABASE_URL') });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- [ ] **Langkah 10: Buat `apps/api/src/prisma/prisma.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Langkah 11: Buat `apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Langkah 12: Buat `apps/api/src/main.ts`**

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  // credentials: true wajib supaya cookie sesi httpOnly ikut terkirim
  // dari browser ke API yang beda port.
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });

  const port = Number(config.get('API_PORT') ?? 3001);
  await app.listen(port);
  console.log(`API berjalan di http://localhost:${port}/api/v1`);
}

void bootstrap();
```

- [ ] **Langkah 13: Jalankan API dan pastikan tersambung ke database**

```bash
pnpm --filter @helpdesk/api dev
```

Harapan: `API berjalan di http://localhost:3001/api/v1` tanpa error koneksi Prisma.
Hentikan dengan Ctrl+C setelah terlihat.

- [ ] **Langkah 14: Commit**

```bash
git add apps/api
git commit -m "feat(api): bootstrap NestJS dengan Prisma ke SQL Server"
```

---

## Task 5: ZodValidationPipe dan GlobalExceptionFilter

**Berkas:**
- Buat: `apps/api/src/common/domain.error.ts`
- Buat: `apps/api/src/common/zod-validation.pipe.ts`
- Uji: `apps/api/src/common/zod-validation.pipe.test.ts`
- Buat: `apps/api/src/common/global-exception.filter.ts`

- [ ] **Langkah 1: Tulis test yang gagal**

Berkas: `apps/api/src/common/zod-validation.pipe.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const Skema = z.object({
  email: z.string().email(),
  umur: z.number().int().min(1),
});

describe('ZodValidationPipe', () => {
  it('meneruskan nilai yang valid setelah di-parse', () => {
    const pipe = new ZodValidationPipe(Skema);
    const hasil = pipe.transform({ email: 'a@b.com', umur: 20 });
    expect(hasil).toEqual({ email: 'a@b.com', umur: 20 });
  });

  it('melempar BadRequestException saat tidak valid', () => {
    const pipe = new ZodValidationPipe(Skema);
    expect(() => pipe.transform({ email: 'salah', umur: 0 })).toThrow(BadRequestException);
  });

  it('menyertakan pesan error per field, dipetakan dengan nama field', () => {
    const pipe = new ZodValidationPipe(Skema);
    try {
      pipe.transform({ email: 'salah', umur: 0 });
      expect.unreachable('seharusnya melempar');
    } catch (e) {
      const respons = (e as BadRequestException).getResponse() as {
        fields: Record<string, string>;
      };
      expect(respons.fields).toHaveProperty('email');
      expect(respons.fields).toHaveProperty('umur');
    }
  });
});
```

- [ ] **Langkah 2: Jalankan test, pastikan GAGAL**

```bash
pnpm --filter @helpdesk/api test
```

Harapan: GAGAL dengan `Cannot find module './zod-validation.pipe.js'`

- [ ] **Langkah 3: Buat `apps/api/src/common/zod-validation.pipe.ts`**

```ts
import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Memvalidasi body request memakai skema Zod dari @helpdesk/contract.
 *
 * Skema yang sama dipakai sisi web untuk validasi form, sehingga aturan validasi
 * hanya ditulis sekali dan tidak bisa berbeda antara kedua sisi.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const hasil = this.schema.safeParse(value);
    if (hasil.success) return hasil.data;

    const fields: Record<string, string> = {};
    for (const issue of hasil.error.issues) {
      const nama = issue.path.join('.') || '_';
      // Ambil pesan pertama saja per field — form hanya menampilkan satu.
      if (!(nama in fields)) fields[nama] = issue.message;
    }

    throw new BadRequestException({ fields });
  }
}
```

- [ ] **Langkah 4: Jalankan test, pastikan LULUS**

```bash
pnpm --filter @helpdesk/api test
```

Harapan: LULUS, 3 test.

- [ ] **Langkah 5: Buat `apps/api/src/common/domain.error.ts`**

```ts
import { ErrorCode } from '@helpdesk/contract';

/**
 * Error aturan bisnis. Dilempar service layer, diterjemahkan jadi HTTP oleh
 * GlobalExceptionFilter — service tidak perlu tahu soal HTTP sama sekali.
 */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status = 409,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

- [ ] **Langkah 6: Buat `apps/api/src/common/global-exception.filter.ts`**

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorCode, type ApiErrorResponse } from '@helpdesk/contract';
import { DomainError } from './domain.error.js';

/**
 * Satu-satunya tempat error diubah jadi response HTTP (spec §9).
 *
 * Stack trace tidak pernah keluar ke klien — hanya masuk log.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      const body: ApiErrorResponse = {
        error: { code: exception.code, message: exception.message },
      };
      res.status(exception.status).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const isi = exception.getResponse();
      const fields =
        typeof isi === 'object' && isi !== null && 'fields' in isi
          ? (isi as { fields: Record<string, string> }).fields
          : undefined;

      const body: ApiErrorResponse = {
        error: {
          code: fields ? ErrorCode.VALIDATION_FAILED : ErrorCode.INTERNAL_ERROR,
          message: exception.message,
          ...(fields ? { fields } : {}),
        },
      };
      res.status(fields ? 422 : exception.getStatus()).json(body);
      return;
    }

    this.logger.error('Error tak tertangani', exception as Error);
    const body: ApiErrorResponse = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Terjadi kesalahan pada server.',
      },
    };
    res.status(500).json(body);
  }
}
```

- [ ] **Langkah 7: Daftarkan filter di `main.ts`**

Ubah `apps/api/src/main.ts`, tambahkan import dan satu baris setelah `app.use(cookieParser())`:

```ts
import { GlobalExceptionFilter } from './common/global-exception.filter.js';
```

```ts
  app.useGlobalFilters(new GlobalExceptionFilter());
```

- [ ] **Langkah 8: Jalankan seluruh test**

```bash
pnpm --filter @helpdesk/api test
```

Harapan: LULUS, 3 test.

- [ ] **Langkah 9: Commit**

```bash
git add apps/api/src/common apps/api/src/main.ts
git commit -m "feat(api): pipe validasi Zod dan filter error global"
```

---

## Task 6: PasswordService dengan argon2

**Berkas:**
- Buat: `apps/api/src/auth/password.service.ts`
- Uji: `apps/api/src/auth/password.service.test.ts`

- [ ] **Langkah 1: Tulis test yang gagal**

Berkas: `apps/api/src/auth/password.service.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('menghasilkan hash yang berbeda dari password aslinya', async () => {
    const hash = await service.hash('rahasia123');
    expect(hash).not.toBe('rahasia123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('menghasilkan hash berbeda untuk password sama (salt acak)', async () => {
    const a = await service.hash('rahasia123');
    const b = await service.hash('rahasia123');
    expect(a).not.toBe(b);
  });

  it('memverifikasi password yang benar', async () => {
    const hash = await service.hash('rahasia123');
    expect(await service.verify(hash, 'rahasia123')).toBe(true);
  });

  it('menolak password yang salah', async () => {
    const hash = await service.hash('rahasia123');
    expect(await service.verify(hash, 'salah-total')).toBe(false);
  });

  it('mengembalikan false untuk hash yang rusak, bukan melempar', async () => {
    expect(await service.verify('bukan-hash-valid', 'apa-saja')).toBe(false);
  });
});
```

- [ ] **Langkah 2: Jalankan test, pastikan GAGAL**

```bash
pnpm --filter @helpdesk/api test password
```

Harapan: GAGAL dengan `Cannot find module './password.service.js'`

- [ ] **Langkah 3: Buat `apps/api/src/auth/password.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /**
   * Mengembalikan false untuk hash rusak, bukan melempar — hash yang tidak
   * terbaca artinya password tidak cocok, dan kegagalan login tidak boleh
   * bocor jadi error 500 yang membedakan akun ada atau tidak.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
```

- [ ] **Langkah 4: Jalankan test, pastikan LULUS**

```bash
pnpm --filter @helpdesk/api test password
```

Harapan: LULUS, 5 test.

- [ ] **Langkah 5: Commit**

```bash
git add apps/api/src/auth/password.service.ts apps/api/src/auth/password.service.test.ts
git commit -m "feat(api): PasswordService memakai argon2id"
```

---

## Task 7: Login dan sesi cookie

Kebijakan penguncian akun diwarisi dari config osTicket (spec §6):
4 kali gagal → terkunci 2 menit. Sesi mati setelah 30 menit.

**Berkas:**
- Buat: `apps/api/src/auth/session.service.ts`
- Buat: `apps/api/src/auth/auth.service.ts`
- Uji: `apps/api/src/auth/auth.service.test.ts`
- Buat: `apps/api/src/auth/auth.controller.ts`, `src/auth/auth.module.ts`

- [ ] **Langkah 1: Buat `apps/api/src/auth/session.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export const SESSION_COOKIE = 'helpdesk_session';
export const SESSION_TTL_MENIT = 30;

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(agentId: number): Promise<string> {
    const id = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MENIT * 60_000);
    await this.prisma.session.create({ data: { id, agentId, expiresAt } });
    return id;
  }

  async destroy(id: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id } });
  }
}
```

- [ ] **Langkah 2: Tulis test yang gagal**

Berkas: `apps/api/src/auth/auth.service.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, MAKS_GAGAL, KUNCI_MENIT } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { DomainError } from '../common/domain.error.js';
import { ErrorCode } from '@helpdesk/contract';

function buatPrismaPalsu(agent: unknown) {
  return {
    agent: {
      findUnique: vi.fn().mockResolvedValue(agent),
      update: vi.fn().mockResolvedValue(undefined),
    },
  };
}

const sessionPalsu = { create: vi.fn().mockResolvedValue('sesi-abc') };

describe('AuthService.login', () => {
  const password = new PasswordService();
  let hash: string;

  beforeEach(async () => {
    hash = await password.hash('rahasia123');
    sessionPalsu.create.mockClear();
  });

  it('mengembalikan profil agent dan id sesi saat kredensial benar', async () => {
    const prisma = buatPrismaPalsu({
      id: 1,
      email: 'admin@socfindo.co.id',
      name: 'Admin',
      passwordHash: hash,
      isActive: true,
      failedLogins: 0,
      lockedUntil: null,
      roles: [{ role: { permissions: [{ permission: { key: 'ticket.view' } }] } }],
    });

    const service = new AuthService(prisma as never, password, sessionPalsu as never);
    const hasil = await service.login('admin@socfindo.co.id', 'rahasia123');

    expect(hasil.agent.email).toBe('admin@socfindo.co.id');
    expect(hasil.agent.permissions).toEqual(['ticket.view']);
    expect(hasil.sessionId).toBe('sesi-abc');
  });

  it('menolak password salah dengan INVALID_CREDENTIALS', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: true, failedLogins: 0, lockedUntil: null, roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'salah-total')).rejects.toThrow(DomainError);
  });

  it('memakai INVALID_CREDENTIALS juga untuk email tidak dikenal', async () => {
    const prisma = buatPrismaPalsu(null);
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('tidakada@b.com', 'apa-saja')).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('menolak akun yang sedang terkunci dengan ACCOUNT_LOCKED', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: true, failedLogins: MAKS_GAGAL,
      lockedUntil: new Date(Date.now() + KUNCI_MENIT * 60_000), roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'rahasia123')).rejects.toMatchObject({
      code: ErrorCode.ACCOUNT_LOCKED,
    });
  });

  it('menolak agent nonaktif', async () => {
    const prisma = buatPrismaPalsu({
      id: 1, email: 'a@b.com', name: 'A', passwordHash: hash,
      isActive: false, failedLogins: 0, lockedUntil: null, roles: [],
    });
    const service = new AuthService(prisma as never, password, sessionPalsu as never);

    await expect(service.login('a@b.com', 'rahasia123')).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });
});
```

- [ ] **Langkah 3: Jalankan test, pastikan GAGAL**

```bash
pnpm --filter @helpdesk/api test auth.service
```

Harapan: GAGAL dengan `Cannot find module './auth.service.js'`

- [ ] **Langkah 4: Buat `apps/api/src/auth/auth.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { ErrorCode, type AgentProfile } from '@helpdesk/contract';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';
import { DomainError } from '../common/domain.error.js';

/** Diwarisi dari config osTicket: staff_max_logins = 4 */
export const MAKS_GAGAL = 4;
/** Diwarisi dari config osTicket: staff_login_timeout = 2 (menit) */
export const KUNCI_MENIT = 2;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly session: SessionService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ agent: AgentProfile; sessionId: string }> {
    const agent = await this.prisma.agent.findUnique({
      where: { email },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });

    // Pesan yang sama untuk email tidak dikenal, password salah, dan akun
    // nonaktif — supaya tidak bisa dipakai menebak email mana yang terdaftar.
    if (!agent || !agent.isActive) {
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Email atau password salah.', 401);
    }

    if (agent.lockedUntil && agent.lockedUntil > new Date()) {
      throw new DomainError(
        ErrorCode.ACCOUNT_LOCKED,
        `Akun terkunci sementara. Coba lagi dalam ${KUNCI_MENIT} menit.`,
        423,
      );
    }

    const cocok = await this.password.verify(agent.passwordHash, password);
    if (!cocok) {
      const gagal = agent.failedLogins + 1;
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: {
          failedLogins: gagal,
          lockedUntil: gagal >= MAKS_GAGAL ? new Date(Date.now() + KUNCI_MENIT * 60_000) : null,
        },
      });
      throw new DomainError(ErrorCode.INVALID_CREDENTIALS, 'Email atau password salah.', 401);
    }

    if (agent.failedLogins > 0 || agent.lockedUntil) {
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }

    const permissions = agent.roles.flatMap((ar) =>
      ar.role.permissions.map((rp) => rp.permission.key),
    );

    return {
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        permissions: [...new Set(permissions)],
      },
      sessionId: await this.session.create(agent.id),
    };
  }
}
```

- [ ] **Langkah 5: Jalankan test, pastikan LULUS**

```bash
pnpm --filter @helpdesk/api test auth.service
```

Harapan: LULUS, 5 test.

- [ ] **Langkah 6: Buat `apps/api/src/auth/auth.controller.ts`**

```ts
import { Body, Controller, Post, Req, Res, UsePipes } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginRequest, type LoginResponse } from '@helpdesk/contract';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { SessionService, SESSION_COOKIE, SESSION_TTL_MENIT } from './session.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly session: SessionService,
  ) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginRequest))
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { agent, sessionId } = await this.auth.login(body.email, body.password);

    // httpOnly: tidak bisa dibaca JavaScript, jadi kebal pencurian lewat XSS.
    // sameSite lax: cukup untuk aplikasi internal, tetap menahan CSRF dasar.
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // di produksi (HTTPS) ubah jadi true
      maxAge: SESSION_TTL_MENIT * 60_000,
      path: '/',
    });

    return { agent };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const id = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (id) await this.session.destroy(id);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }
}
```

- [ ] **Langkah 7: Buat `apps/api/src/auth/auth.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService],
  exports: [SessionService],
})
export class AuthModule {}
```

- [ ] **Langkah 8: Daftarkan AuthModule di `app.module.ts`**

Ubah `apps/api/src/app.module.ts` menjadi:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Langkah 9: Jalankan seluruh test**

```bash
pnpm --filter @helpdesk/api test
```

Harapan: LULUS, 13 test.

- [ ] **Langkah 10: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts
git commit -m "feat(api): endpoint login dan logout dengan sesi cookie httpOnly"
```

---

## Task 8: PermissionGuard

Ini menegakkan pemisahan spec §6: Guard menjawab "boleh tidak melakukan aksi ini",
service menjawab "boleh tidak menyentuh baris ini".

**Berkas:**
- Buat: `apps/api/src/auth/require-permission.decorator.ts`
- Buat: `apps/api/src/auth/permission.guard.ts`
- Uji: `apps/api/src/auth/permission.guard.test.ts`

- [ ] **Langkah 1: Buat `apps/api/src/auth/require-permission.decorator.ts`**

```ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
```

- [ ] **Langkah 2: Tulis test yang gagal**

Berkas: `apps/api/src/auth/permission.guard.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from './permission.guard.js';

function buatContext(cookies: Record<string, string>) {
  const req: Record<string, unknown> = { cookies };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function buatReflector(permission: string | undefined) {
  return { getAllAndOverride: vi.fn().mockReturnValue(permission) };
}

function buatPrisma(sesi: unknown) {
  return { session: { findUnique: vi.fn().mockResolvedValue(sesi) } };
}

const sesiValid = (permissions: string[]) => ({
  expiresAt: new Date(Date.now() + 60_000),
  agent: {
    id: 1, email: 'a@b.com', name: 'A', isActive: true,
    roles: [{ role: { permissions: permissions.map((k) => ({ permission: { key: k } })) } }],
  },
});

describe('PermissionGuard', () => {
  it('meloloskan endpoint tanpa @RequirePermission asalkan sudah login', async () => {
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(sesiValid([])) as never);
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).resolves.toBe(true);
  });

  it('menolak tanpa cookie sesi', async () => {
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(null) as never);
    await expect(guard.canActivate(buatContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it('menolak sesi yang sudah kedaluwarsa', async () => {
    const kedaluwarsa = { ...sesiValid([]), expiresAt: new Date(Date.now() - 1000) };
    const guard = new PermissionGuard(buatReflector(undefined) as never, buatPrisma(kedaluwarsa) as never);
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).rejects.toThrow(UnauthorizedException);
  });

  it('meloloskan agent yang punya permission yang diminta', async () => {
    const guard = new PermissionGuard(
      buatReflector('ticket.edit') as never,
      buatPrisma(sesiValid(['ticket.view', 'ticket.edit'])) as never,
    );
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).resolves.toBe(true);
  });

  it('menolak agent yang tidak punya permission yang diminta', async () => {
    const guard = new PermissionGuard(
      buatReflector('ticket.delete') as never,
      buatPrisma(sesiValid(['ticket.view'])) as never,
    );
    await expect(guard.canActivate(buatContext({ helpdesk_session: 'abc' }))).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Langkah 3: Jalankan test, pastikan GAGAL**

```bash
pnpm --filter @helpdesk/api test permission.guard
```

Harapan: GAGAL dengan `Cannot find module './permission.guard.js'`

- [ ] **Langkah 4: Buat `apps/api/src/auth/permission.guard.ts`**

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { SESSION_COOKIE } from './session.service.js';
import { PERMISSION_KEY } from './require-permission.decorator.js';

/**
 * Menjawab satu pertanyaan saja: boleh tidak agent ini melakukan aksi ini?
 *
 * Pertanyaan "boleh tidak menyentuh baris ini" dijawab service layer lewat
 * filter departmentId — dua pertanyaan berbeda, dua mekanisme berbeda (spec §6).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!sessionId) throw new UnauthorizedException('Belum login.');

    const sesi = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        agent: {
          include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
        },
      },
    });

    if (!sesi || sesi.expiresAt <= new Date() || !sesi.agent.isActive) {
      throw new UnauthorizedException('Sesi tidak berlaku lagi.');
    }

    const permissions = new Set(
      sesi.agent.roles.flatMap((ar) => ar.role.permissions.map((rp) => rp.permission.key)),
    );

    // Ditempelkan supaya controller dan service tidak perlu query ulang.
    (req as Request & { agent?: unknown }).agent = {
      id: sesi.agent.id,
      email: sesi.agent.email,
      name: sesi.agent.name,
      permissions: [...permissions],
    };

    const diminta = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!diminta) return true;
    if (permissions.has(diminta)) return true;

    throw new ForbiddenException(`Butuh izin: ${diminta}`);
  }
}
```

- [ ] **Langkah 5: Jalankan test, pastikan LULUS**

```bash
pnpm --filter @helpdesk/api test permission.guard
```

Harapan: LULUS, 5 test.

- [ ] **Langkah 6: Tambahkan endpoint `GET /auth/me` yang dijaga guard**

Tambahkan ke `apps/api/src/auth/auth.controller.ts` — tambahkan import:

```ts
import { Get, UseGuards } from '@nestjs/common';
import type { AgentProfile } from '@helpdesk/contract';
import { PermissionGuard } from './permission.guard.js';
```

dan method ini di dalam class `AuthController`:

```ts
  @Get('me')
  @UseGuards(PermissionGuard)
  me(@Req() req: Request): { agent: AgentProfile } {
    return { agent: (req as Request & { agent: AgentProfile }).agent };
  }
```

- [ ] **Langkah 7: Daftarkan PermissionGuard sebagai provider**

Ubah `providers` di `apps/api/src/auth/auth.module.ts`:

```ts
  providers: [AuthService, PasswordService, SessionService, PermissionGuard],
```

dan tambahkan import:

```ts
import { PermissionGuard } from './permission.guard.js';
```

- [ ] **Langkah 8: Jalankan seluruh test**

```bash
pnpm --filter @helpdesk/api test
```

Harapan: LULUS, 18 test.

- [ ] **Langkah 9: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(api): PermissionGuard berbasis Role dan endpoint /auth/me"
```

---

## Task 9: Seed agent admin

**Berkas:**
- Buat: `apps/api/prisma/seed.ts`

- [ ] **Langkah 1: Buat `apps/api/prisma/seed.ts`**

```ts
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

/** Izin awal. Bertambah seiring modul baru dibangun. */
const PERMISSIONS = [
  { key: 'ticket.view', label: 'Lihat tiket' },
  { key: 'ticket.edit', label: 'Ubah tiket' },
  { key: 'department.manage', label: 'Kelola department' },
  { key: 'category.manage', label: 'Kelola kategori' },
  { key: 'agent.manage', label: 'Kelola agent' },
];

async function main(): Promise<void> {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
  }

  const admin = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator', description: 'Akses penuh ke seluruh sistem' },
  });

  const semua = await prisma.permission.findMany();
  for (const p of semua) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: p.id } },
      update: {},
      create: { roleId: admin.id, permissionId: p.id },
    });
  }

  const email = 'admin@socfindo.co.id';
  const agent = await prisma.agent.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Administrator',
      passwordHash: await argon2.hash('admin12345', { type: argon2.argon2id }),
    },
  });

  await prisma.agentRole.upsert({
    where: { agentId_roleId: { agentId: agent.id, roleId: admin.id } },
    update: {},
    create: { agentId: agent.id, roleId: admin.id },
  });

  console.log(`Seed selesai. Login: ${email} / admin12345`);
  console.log('GANTI PASSWORD INI sebelum dipakai di server perusahaan.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
```

- [ ] **Langkah 2: Jalankan seed**

```bash
pnpm --filter @helpdesk/api exec tsx prisma/seed.ts
```

Harapan: `Seed selesai. Login: admin@socfindo.co.id / admin12345`

- [ ] **Langkah 3: Pastikan datanya benar-benar masuk**

```powershell
& sqlcmd -S "localhost,1433" -U helpdesk_app -P "GantiPasswordIni!2026" -d helpdesk_dev -Q "SELECT COUNT(*) AS agent FROM Agent; SELECT COUNT(*) AS permission FROM Permission;" -h -1 -W
```

Harapan: `1` agent dan `5` permission.

- [ ] **Langkah 4: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed role Administrator dan agent admin awal"
```

---

## Task 10: apps/web — halaman login (walking skeleton)

Ini yang membuktikan seluruh rantai teknis jalan: browser → kontrak Zod → NestJS →
SQL Server → kembali. Milik **kelompok 2**.

**Berkas:**
- Buat: `apps/web/package.json`, `next.config.ts`, `tsconfig.json`
- Buat: `apps/web/src/lib/api.ts`
- Buat: `apps/web/src/app/layout.tsx`, `globals.css`, `login/page.tsx`, `beranda/page.tsx`

- [ ] **Langkah 1: Buat `apps/web/package.json`**

```json
{
  "name": "@helpdesk/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@helpdesk/contract": "workspace:*",
    "@hookform/resolvers": "5.7.1",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-hook-form": "7.84.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "24.13.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    "tailwindcss": "4.3.3",
    "typescript": "6.0.3"
  }
}
```

- [ ] **Langkah 2: Buat `apps/web/next.config.ts`**

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@helpdesk/contract'],
};

export default config;
```

`transpilePackages` wajib — tanpanya Next.js tidak mau mengompilasi TypeScript dari
paket workspace lain dan build gagal.

- [ ] **Langkah 3: Buat `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "declaration": false,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Langkah 4: Buat `apps/web/postcss.config.mjs`**

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

- [ ] **Langkah 5: Buat `apps/web/src/app/globals.css`**

```css
@import "tailwindcss";
```

- [ ] **Langkah 6: Buat `apps/web/src/lib/api.ts`**

```ts
import { ApiErrorResponse } from '@helpdesk/contract';

const BASE = 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * credentials: 'include' wajib supaya cookie sesi httpOnly ikut terkirim —
 * tanpa ini login berhasil tapi setiap permintaan berikutnya dianggap belum login.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = ApiErrorResponse.safeParse(body);
    if (parsed.success) {
      throw new ApiError(parsed.data.error.code, parsed.data.error.message, parsed.data.error.fields);
    }
    throw new ApiError('INTERNAL_ERROR', `Permintaan gagal (${res.status})`);
  }

  return body as T;
}
```

- [ ] **Langkah 7: Buat `apps/web/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Socfindo Helpdesk',
  description: 'Sistem helpdesk PT Socfindo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Langkah 8: Buat `apps/web/src/app/login/page.tsx`**

Skema Zod yang sama dengan yang dipakai API — inilah bukti kontrak-dulu bekerja.

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { LoginRequest, type LoginResponse } from '@helpdesk/contract';
import { apiFetch, ApiError } from '@/lib/api';

export default function HalamanLogin() {
  const router = useRouter();
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(LoginRequest) });

  async function onSubmit(data: LoginRequest) {
    setErrorUmum(null);
    try {
      await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      router.push('/beranda');
    } catch (e) {
      if (e instanceof ApiError) {
        // Error per field dari API dipetakan langsung ke form — inilah gunanya
        // `fields` di bentuk error seragam.
        if (e.fields) {
          for (const [nama, pesan] of Object.entries(e.fields)) {
            setError(nama as keyof LoginRequest, { message: pesan });
          }
        } else {
          setErrorUmum(e.message);
        }
      } else {
        setErrorUmum('Tidak dapat menghubungi server.');
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-xl font-semibold">Socfindo Helpdesk</h1>

        {errorUmum && (
          <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
            {errorUmum}
          </p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            {...register('email')}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Langkah 9: Buat `apps/web/src/app/beranda/page.tsx`**

Halaman ini memanggil `/auth/me`, yang dijaga `PermissionGuard` — jadi kalau tampil,
berarti cookie sesi benar-benar bekerja.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentProfile } from '@helpdesk/contract';
import { apiFetch } from '@/lib/api';

export default function HalamanBeranda() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    apiFetch<{ agent: AgentProfile }>('/auth/me')
      .then((r) => setAgent(r.agent))
      .catch(() => router.push('/login'));
  }, [router]);

  if (!agent) return <main className="p-8">Memuat…</main>;

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Halo, {agent.name}</h1>
      <p className="text-slate-600">{agent.email}</p>
      <h2 className="mt-4 font-medium">Izin yang dimiliki</h2>
      <ul className="list-inside list-disc text-slate-700">
        {agent.permissions.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Langkah 10: Pasang dependensi**

```bash
pnpm install
```

- [ ] **Langkah 11: Jalankan API dan web bersamaan**

Di terminal pertama:

```bash
pnpm --filter @helpdesk/api dev
```

Di terminal kedua:

```bash
pnpm --filter @helpdesk/web dev
```

- [ ] **Langkah 12: Uji alur tembus ujung-ke-ujung di browser**

Buka `http://localhost:3000/login`, lalu periksa berurutan:

| Uji | Harapan |
|---|---|
| Isi email `bukan-email`, submit | Pesan "Format email tidak valid" muncul di bawah field — **divalidasi di browser**, tanpa memanggil API |
| Isi email benar, password `salah` (6 huruf) | Pesan "Password minimal 8 karakter" |
| Email `admin@socfindo.co.id`, password `salahsemua` | Pesan "Email atau password salah." — **dari API** |
| Ulangi 4 kali berturut-turut | Berubah jadi "Akun terkunci sementara. Coba lagi dalam 2 menit." |
| Tunggu 2 menit, login `admin@socfindo.co.id` / `admin12345` | Berpindah ke `/beranda`, nama dan 5 izin tampil |
| Refresh halaman `/beranda` | Tetap tampil — sesi bertahan lewat cookie |

Kalau tabel ini lulus semua, **Tahap 0 selesai**: kontrak Zod terbukti dipakai kedua
sisi, sesi cookie bekerja, guard bekerja, dan Prisma benar-benar menulis ke SQL Server.

- [ ] **Langkah 13: Commit**

```bash
git add apps/web
git commit -m "feat(web): halaman login dan beranda sebagai walking skeleton"
```

---

## Definisi selesai Tahap 0

- [ ] `pnpm -r test` lulus seluruhnya (18 test di api, 4 di contract)
- [ ] `pnpm -r typecheck` bersih
- [ ] Tabel uji di Task 10 Langkah 12 lulus semuanya
- [ ] `.env` tidak pernah masuk git — periksa dengan `git log --all --full-history -- .env` (harus kosong)

## Yang sengaja belum dikerjakan

| Hal | Kapan |
|---|---|
| Department, Category, Agent, Role (master data) | Tahap 1 — rencana terpisah |
| Refresh masa berlaku sesi tiap request | Tahap 1, saat pola request sudah jelas |
| Logging pino + requestId | Tahap 1 |
| Halaman logout di web | Tahap 1 |
| Rate limit tingkat IP | Setelah aplikasi keluar dari localhost |

Penguncian akun sudah ada di Tahap 0 karena itu aturan bisnis warisan osTicket
(spec §6), bukan pengerasan keamanan tambahan.
