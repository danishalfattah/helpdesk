# Cara Berkontribusi

Empat orang, dua kelompok, satu repo. Aturan di sini ada supaya kerja paralel tidak
saling menabrak.

## Alur kerja

```
Issue  →  Branch  →  Commit  →  PR  →  Review  →  Merge  →  Issue tertutup
```

**Satu Task di rencana = satu Issue = satu branch = satu PR.** Jangan menggabungkan
dua task ke satu PR — PR besar tidak akan di-review dengan benar, cuma di-approve.

## Issue

Dibuat dari template di `.github/ISSUE_TEMPLATE/`. Salin checkbox langkah dari
`docs/plans/` ke badan issue, supaya progres kelihatan tanpa perlu lapor manual.

Label wajib:

| Label | Arti |
|---|---|
| `kelompok-1` / `kelompok-2` / `bersama` | Siapa yang mengerjakan |
| `tahap-0` … `tahap-6` | Tahap di spec §11 |
| `blocked` | Sedang menunggu sesuatu — **sebutkan menunggu apa di komentar** |

## Siapa mengerjakan apa

**Setiap issue punya satu assignee.** Bukan dua, bukan "kelompok 1" — satu orang
yang bertanggung jawab. Kalau dua orang mengerjakan bersama, tetap satu yang
jadi assignee dan yang lain disebut di komentar.

| Bagian | Orang | Aturan pembagian |
|---|---|---|
| `apps/api` | Bagas, Alia | Bergantian, seimbangkan beban dan tingkat kesulitan |
| `apps/web` | Danish, Farah | Yang lebih sulit ke Danish |
| `packages/contract` | siapa pun | Ditulis satu orang, **di-review satu orang tiap kelompok** |

**Field assignee di GitHub adalah catatan yang berlaku** — bukan tabel di dokumen
mana pun. Kalau pekerjaan berpindah tangan, ubah assignee-nya, jangan mengedit
dokumen.

### Dua hal yang perlu dijaga

**Jangan menumpuk task yang saling bergantung pada satu orang.** Kalau A mengerjakan
issue yang memblokir tiga issue lain, dan ketiganya juga milik A, maka tiga issue itu
antre — padahal bisa dikerjakan orang lain sementara A menyelesaikan yang pertama.
Lihat peta ketergantungan di `docs/issues-tahap-0.md`.

**Perhatikan keseimbangan lintas tahap, bukan per tahap.** Tahap 0 memang berat di
backend — fondasi API, database, autentikasi. Sisi web baru padat mulai Tahap 2.
Yang penting seimbang di akhir, bukan di tiap tahap. Riwayat commit ikut jadi bukti
kontribusi untuk penilaian PKL, jadi ini bukan soal keadilan semata.

## Branch

```
<jenis>/<nomor-issue>-<slug-singkat>
```

Contoh: `feat/12-endpoint-login`, `fix/23-sesi-tidak-terhapus`, `docs/5-glosarium`

Jenis: `feat` · `fix` · `docs` · `chore` · `refactor` · `test`

Branch dibuat dari `main` yang **sudah di-pull terbaru**. Jangan bercabang dari branch
orang lain kecuali memang butuh hasil kerjanya.

## Commit

Conventional commits, pesan dalam bahasa Indonesia:

```
feat(api): tambah endpoint daftar tiket dengan paginasi
fix(web): cookie sesi tidak terkirim karena credentials belum diset
test(api): tambah kasus akun terkunci di AuthService
docs: perbarui glosarium untuk istilah SavedView
```

Scope: `api` · `web` · `contract` · kosong untuk perubahan lintas paket.

**Commit sering.** Satu commit per langkah yang selesai, bukan satu commit raksasa di
akhir hari. Kalau ada yang rusak, commit kecil membuat penyebabnya ketemu dalam menit,
bukan jam.

## Pull Request

Pakai template di `.github/pull_request_template.md`.

| Yang diubah | Butuh review dari |
|---|---|
| `apps/api/**` | 1 orang kelompok 1 |
| `apps/web/**` | 1 orang kelompok 2 |
| **`packages/contract/**`** | **1 orang tiap kelompok** |
| `docs/**`, root | 1 orang siapa pun |

Kenapa kontrak butuh dua reviewer: yang me-review adalah orang yang kodenya akan rusak
kalau kontraknya salah. Ini bukan formalitas.

## Definisi selesai

PR boleh di-merge kalau **semua** terpenuhi:

- [ ] `pnpm -r test` lulus
- [ ] `pnpm -r typecheck` bersih
- [ ] Perilaku barunya punya test yang benar-benar menguji perilaku itu
- [ ] Sudah dicoba manual di browser kalau menyentuh UI
- [ ] Issue dirujuk dengan `Closes #12`
- [ ] Sudah di-review sesuai tabel di atas

## Kerja paralel — tiga titik bentrok

Paralelisme dibatasi **berkas milik bersama**, bukan oleh pembagian tim. Tiga tempat
ini yang akan bikin konflik kalau tidak diatur:

### 1. `packages/contract/**`

**Ubah berkelompok di awal tiap tahap, bukan sambil jalan.** Kedua kelompok duduk
bareng, sepakati seluruh kontrak untuk tahap itu, satu PR, selesai. Mengubah kontrak
di tengah tahap memaksa kedua sisi berhenti dan menyesuaikan.

### 2. `apps/api/prisma/models/*.prisma`

Skema **sudah dipecah per domain** justru untuk ini:

```
prisma/models/
├── agent.prisma        ← satu orang
├── ticket.prisma       ← orang lain
└── department.prisma
```

Dua orang menambah model bersamaan tanpa pernah menyentuh berkas yang sama.
**Satu model baru = satu berkas baru.** Jangan menumpuk banyak model di satu berkas
hanya karena terasa lebih ringkas.

Yang tetap harus hati-hati: **berkas migrasi**. Kalau dua orang menjalankan
`prisma migrate dev` bersamaan di branch berbeda, urutan migrasinya bisa bentrok saat
merge. Kalau itu terjadi: hapus migrasi milik sendiri, pull `main`, buat ulang.

### 3. `apps/api/src/app.module.ts`

Tiap modul baru menambah satu baris di sini, jadi berkas ini sering bentrok.
Konfliknya sepele (dua baris import), tapi sering. Selesaikan manual, jangan pakai
"accept theirs" — yang hilang justru modul orang lain.

## Kalau terhalang

Jangan diam. Beri label `blocked` di issue dan **tulis di komentar sedang menunggu
apa**. Dalam project sebulan, satu hari menunggu tanpa memberi tahu itu 3% dari
seluruh waktu.

Sambil menunggu, kerjakan issue lain yang tidak bergantung padanya. Untuk itulah
kontraknya disepakati di awal — sisi web bisa jalan dengan MSW tanpa menunggu API
sungguhan jadi.
