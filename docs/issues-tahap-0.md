# Issue Tahap 0 — siap ditempel ke GitHub

Sepuluh issue dari `docs/plans/2026-08-06-tahap-0-fondasi.md`.
Langkah rincinya ada di rencana — salin checkbox-nya ke badan issue saat membuat.

## Peta ketergantungan

Ini yang menentukan apa yang bisa dikerjakan bersamaan. **Kolom yang sama = boleh
jalan paralel.**

```
Gelombang 0   [#1 Monorepo]        [#3 SQL Server]      ← paralel, tidak saling butuh
                    │                     │
Gelombang 1   [#2 Contract]               │
                    │                     │
                    └──────┬──────────────┘
                           │
Gelombang 2         [#4 NestJS+Prisma]         [#10 Web: mulai pakai MSW]
                           │                            │
Gelombang 3   [#5 Pipe] [#6 Password] [#9 Seed]         │   ← tiga-tiganya paralel
                  └────────┬───────┘                    │
                           │                            │
Gelombang 4          [#7 Login]                         │
                           │                            │
Gelombang 5          [#8 Guard]                         │
                           └────────────────────────────┤
                                                        │
Gelombang 6                            [#10 Web: sambungkan ke API sungguhan]
```

**Yang perlu diperhatikan:**

- **#3 tidak bergantung pada apa pun.** Kerjakan paling awal bersamaan dengan #1 —
  ini konfigurasi mesin, bukan kode.
- **#10 bisa dimulai sejak #2 selesai**, jauh sebelum API jadi. Kelompok 2 memakai MSW
  yang mock-nya diturunkan dari skema Zod yang sama. Inilah alasan utama memilih
  arsitektur kontrak-dulu — kelompok 2 tidak pernah menunggu.
- **#5, #6, dan #9 tidak saling bergantung.** Kalau Bagas dan Alia kerja bersamaan,
  ini titik paling menguntungkan untuk membagi.

---

## #1 — Fondasi monorepo pnpm workspace

**Label:** `bersama` `tahap-0` · **Rujukan:** Task 1 · **Bergantung:** —

Menyiapkan workspace pnpm supaya ketiga paket bisa saling mengenal.

- Naikkan pnpm ke 11.20.0
- `package.json` root, `pnpm-workspace.yaml`, `tsconfig.base.json`
- `.npmrc` dengan `node-linker=hoisted` — **wajib**, tanpanya NestJS gagal me-resolve `reflect-metadata`
- `.env.example`

---

## #2 — Skema Zod login dan bentuk error seragam

**Label:** `bersama` `tahap-0` · **Rujukan:** Task 2 · **Bergantung:** #1

Paket kontrak dengan skema pertama. Bentuk berkas di sini jadi contoh untuk semua
kontrak berikutnya — kerjakan cermat.

- `packages/contract` + konfigurasi Vitest
- `src/error.ts` — `ApiErrorResponse`, `ErrorCode`
- `src/auth/login.ts` — `LoginRequest`, `LoginResponse`, `AgentProfile`
- 4 test: email valid, email salah, password pendek, transform huruf kecil

⚠️ PR ini butuh review **satu orang dari tiap kelompok**.

---

## #3 — Siapkan SQL Server 2022 Express

**Label:** `bersama` `tahap-0` · **Rujukan:** Task 3 · **Bergantung:** —

Konfigurasi mesin, bukan kode. **Butuh PowerShell sebagai Administrator.**

- Aktifkan TCP/IP (sekarang `Enabled = 0` — Prisma tidak akan bisa konek tanpa ini)
- Kunci ke port 1433, matikan port dinamis
- Aktifkan Mixed Mode (`LoginMode = 2`)
- Restart service, buat database `helpdesk_dev` + login `helpdesk_app`
- Buktikan lewat TCP: `sqlcmd -S "localhost,1433" -U helpdesk_app ...`

---

## #4 — Bootstrap NestJS dengan Prisma ke SQL Server

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 4 · **Bergantung:** #1, #2, #3

- `apps/api` + NestJS + konfigurasi Vitest dengan **`unplugin-swc`**
- Skema Prisma **multi-berkas**: `prisma/schema.prisma` + `prisma/models/*.prisma`
- Model: `Agent`, `Role`, `Permission`, `AgentRole`, `RolePermission`, `Session`
- `PrismaService`, `AppModule`, `main.ts` dengan CORS + cookie-parser
- Migrasi pertama jalan, tabel terbukti terbentuk

⚠️ `unplugin-swc` wajib — Vitest memakai esbuild yang tidak mendukung
`emitDecoratorMetadata`, padahal DI NestJS bergantung penuh padanya.

---

## #5 — Pipe validasi Zod dan filter error global

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 5 · **Bergantung:** #4

- `ZodValidationPipe` — memetakan error Zod ke `fields` per nama field
- `DomainError` — error aturan bisnis, tanpa tahu soal HTTP
- `GlobalExceptionFilter` — satu-satunya tempat error jadi response HTTP
- 3 test

Stack trace tidak boleh pernah keluar ke klien.

---

## #6 — PasswordService dengan argon2id

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 6 · **Bergantung:** #4

Bisa dikerjakan bersamaan dengan #5 dan #9.

- `hash()` dan `verify()`
- 5 test, termasuk: hash rusak mengembalikan `false`, bukan melempar

---

## #7 — Endpoint login dan logout dengan sesi cookie

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 7 · **Bergantung:** #5, #6

- `SessionService` — sesi disimpan di tabel, TTL 30 menit
- `AuthService.login()` dengan penguncian akun: 4 gagal → terkunci 2 menit
- `AuthController` — cookie `httpOnly`
- 5 test

Kebijakan penguncian **diwarisi dari config osTicket** (`staff_max_logins = 4`,
`staff_login_timeout = 2`), bukan dikarang.

Pesan error harus sama untuk email tidak dikenal, password salah, dan akun nonaktif —
supaya tidak bisa dipakai menebak email mana yang terdaftar.

---

## #8 — PermissionGuard berbasis Role dan endpoint /auth/me

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 8 · **Bergantung:** #7

- `@RequirePermission('...')` + `PermissionGuard`
- `GET /auth/me` yang dijaga guard
- 5 test

Guard menjawab "boleh tidak melakukan aksi ini". Pertanyaan "boleh tidak menyentuh
baris ini" dijawab service lewat filter `departmentId` — dua pertanyaan berbeda, dua
mekanisme berbeda (spec §6).

---

## #9 — Seed role Administrator dan agent admin

**Label:** `kelompok-1` `tahap-0` · **Rujukan:** Task 9 · **Bergantung:** #4

Bisa dikerjakan bersamaan dengan #5 dan #6.

- 5 permission awal, role Administrator, agent `admin@socfindo.co.id`
- Seluruhnya `upsert` — aman dijalankan berulang

---

## #10 — Halaman login dan beranda (walking skeleton)

**Label:** `kelompok-2` `tahap-0` · **Rujukan:** Task 10 · **Bergantung:** #2 (mulai), #7 + #8 (selesai)

Ini yang membuktikan seluruh rantai teknis jalan.

- `apps/web` + Next.js 16 + Tailwind 4
- `lib/api.ts` — `credentials: 'include'` **wajib**, tanpanya cookie sesi tidak terkirim
- Halaman login dengan `react-hook-form` + `zodResolver` memakai skema dari `@helpdesk/contract`
- Halaman beranda memanggil `/auth/me`

**Boleh dimulai segera setelah #2 selesai** dengan MSW sebagai API tiruan. Sambungkan
ke API sungguhan setelah #7 dan #8 jadi.

### Tabel uji penerimaan

| Uji | Membuktikan |
|---|---|
| Email `bukan-email` ditolak **tanpa memanggil API** | Skema Zod yang sama dipakai kedua sisi |
| Password salah 4× → "Akun terkunci sementara" | Aturan warisan ditegakkan di server |
| Login benar → pindah ke `/beranda`, 5 izin tampil | Guard dan sesi bekerja |
| Refresh `/beranda` tetap tampil | Cookie sesi bertahan |

Kalau tabel ini lulus semua, **Tahap 0 selesai.**

---

## #11 — Halaman /design-system

**Label:** `kelompok-2` `tahap-0` · **Rujukan:** Task 11 · **Bergantung:** #10 (setelah shadcn siap)

Panduan gaya hidup yang merender komponen sungguhan dengan token sungguhan.

- 8 warna inti, 11 lencana status, 4 lencana severity, skala tipografi
- Diperiksa di mode terang **dan** gelap

Token warnanya sudah ada di `apps/web/src/app/globals.css` — hijau `#116936` dan
kuning `#fecf08` dari logo Socfindo, plus 11 warna status yang disalin persis dari
konfigurasi osTicket.

Halaman ini tinggal di-screenshot untuk bab perancangan antarmuka di laporan
kelompok 2. Bedanya dengan berkas desain: halaman ini tidak bisa basi, karena
memakai kode yang sama dengan halaman lain.
