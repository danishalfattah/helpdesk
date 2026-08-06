# Socfindo Helpdesk

Sistem helpdesk pengganti osTicket untuk PT Socfindo. Dikerjakan 4 mahasiswa PKL
FILKOM UB dalam 2 kelompok.

**Bahasa:** komunikasi, komentar kode, pesan commit, dan teks di layar memakai
**bahasa Indonesia**. Nama variabel, fungsi, dan tipe memakai **bahasa Inggris**
(`ticket`, `createdAt`) — jangan campur di dalam satu identifier.

## Sebelum mulai mengerjakan apa pun

Tim ini berisi 4 orang: **Bagas, Alia, Danish, Farah**. Sebelum menyentuh kode atau
membuka issue mana pun, tanyakan lebih dulu:

> "Sebelum mulai, kamu siapa — Bagas, Alia, Danish, atau Farah?"

Jangan lewati ini walaupun terasa berbasa-basi. Ini yang mencegah seseorang tanpa
sadar mengerjakan issue milik orang lain, dan riwayat commit dipakai sebagai bukti
kontribusi untuk penilaian PKL — salah kerja tanpa disadari berarti kontribusi salah
tercatat.

**Begitu tahu issue mana yang akan dikerjakan** (nomor issue disebut, atau lewat nama
branch `feat/12-...`), cek assignee-nya sebelum menulis kode:

```bash
gh issue view <nomor> --repo danishalfattah/helpdesk --json title,assignees
```

Kalau `gh` tidak terpasang atau belum login, minta pengguna menyebutkan assignee-nya
dari tampilan GitHub — jangan lanjut tanpa tahu.

| Kondisi | Yang dilakukan |
|---|---|
| Assignee cocok dengan nama yang disebutkan | Lanjut seperti biasa |
| Assignee **tidak cocok** | Berhenti. Sampaikan jelas: "Issue #N ditugaskan ke **X**, tapi kamu bilang **Y**." Tanyakan apakah ini salah nomor issue, atau memang sengaja membantu pekerjaan X. |
| Sengaja membantu pekerjaan teman | Boleh dilanjutkan — tapi **jangan diam-diam**. Tulis di badan PR: `Dikerjakan oleh <nama sebenarnya>, membantu issue milik <assignee>.` |

**Jangan pernah mengubah identitas commit (`git config user.name`/`user.email`) untuk
berpura-pura jadi orang lain.** Kalau Farah membantu mengerjakan issue Bagas, commit
tetap tercatat atas nama Farah — kejujuran soal siapa yang benar-benar mengerjakan
lebih penting daripada rapi-rapi assignee. PR description-lah yang menjelaskan
konteksnya, bukan identitas git yang dipalsukan.

Ini bergantung pada `gh` CLI terpasang dan sudah `gh auth login` di tiap laptop, dan
hanya berfungsi kalau yang dipakai memang Claude Code (atau AI lain yang membaca
`CLAUDE.md` secara otomatis) — bukan pengaman teknis yang memaksa, melainkan langkah
yang membuat kesalahan tidak sengaja jauh lebih jarang terjadi.

## Dokumen wajib baca

| Dokumen | Isi |
|---|---|
| `docs/specs/2026-08-06-desain-helpdesk.md` | Seluruh keputusan arsitektur + alasannya |
| `docs/glosarium.md` | **Nama entitas yang benar.** Baca sebelum menamai apa pun |
| `docs/adr/` | Keputusan arsitektur satuan |
| `CONTRIBUTING.md` | Alur issue → branch → PR |

## Struktur

```
packages/contract/   skema Zod bersama    [MILIK BERSAMA — lihat CLAUDE.md di dalamnya]
apps/api/            NestJS + Prisma      [KELOMPOK 1: Bagas, Alia]
apps/web/            Next.js + React      [KELOMPOK 2: Danish, Farah]
```

Tiap direktori punya `CLAUDE.md` sendiri berisi konvensi spesifiknya. Baca yang
sesuai dengan tempat kamu bekerja.

## Perintah

```bash
pnpm install                              # pasang semua dependensi
pnpm --filter @helpdesk/api dev           # jalankan API   (:3001)
pnpm --filter @helpdesk/web dev           # jalankan web   (:3000)
pnpm --filter @helpdesk/api test          # test backend
pnpm --filter @helpdesk/contract test     # test kontrak
pnpm -r test                              # semua test
pnpm -r typecheck                         # semua typecheck
```

Migrasi database:

```bash
pnpm --filter @helpdesk/api exec prisma migrate dev --name <nama-perubahan>
pnpm --filter @helpdesk/api exec tsx prisma/seed.ts
```

## Larangan

Ini bukan preferensi gaya. Melanggarnya merusak pekerjaan orang lain.

1. **Jangan mengedit paket milik kelompok lain.** Butuh perubahan di sana? Buka issue.
2. **Jangan mengubah `packages/contract` sendirian.** Lihat `packages/contract/CLAUDE.md`.
3. **Jangan pakai `any`.** Kalau tipenya benar-benar tidak diketahui, pakai `unknown`
   lalu persempit. `strict: true` menyala dan tidak boleh dimatikan.
4. **Jangan commit `.env`** atau kredensial apa pun. Kalau terlanjur, lapor segera —
   riwayat git harus dibersihkan, bukan sekadar dihapus di commit berikutnya.
5. **Jangan menonaktifkan test** untuk membuat CI hijau. Test merah artinya ada yang
   rusak, bukan ada yang mengganggu.
6. **Jangan menaikkan versi dependensi** tanpa alasan yang ditulis di PR. Versi di
   `package.json` sudah diverifikasi kecocokannya (lihat spec §3).

## Definisi selesai

Sebuah task selesai kalau **semuanya** terpenuhi:

- [ ] `pnpm -r test` lulus
- [ ] `pnpm -r typecheck` bersih
- [ ] Perilaku barunya punya test yang benar-benar menguji perilaku itu
- [ ] Komentar kode menjelaskan **kenapa**, bukan **apa**
- [ ] Sudah dicoba manual di browser kalau menyentuh UI
- [ ] Issue yang bersangkutan dirujuk di PR

## Cara menulis komentar

Contoh yang benar diambil dari osTicket lama — komentar yang menjelaskan alasan:

```ts
// Pesan yang sama untuk email tidak dikenal, password salah, dan akun nonaktif
// — supaya tidak bisa dipakai menebak email mana yang terdaftar.
```

Yang tidak berguna:

```ts
// Cek apakah agent ada
if (!agent) ...
```

Kode sudah mengatakan itu. Komentar harus mengatakan yang tidak terlihat dari kode.

## Konteks sejarah

Sistem ini menggantikan osTicket yang menggantikan VersaSRS. Banyak aturan bisnis
diwarisi dan **sengaja dipertahankan** — bukan hasil karangan. Kalau menemukan aturan
yang terlihat aneh, cek spec §8.3 sebelum mengubahnya; kemungkinan besar itu perilaku
yang memang diminta pengguna selama 15 tahun.
