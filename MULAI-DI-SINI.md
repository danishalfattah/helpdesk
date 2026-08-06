# Mulai Di Sini

Panduan buat Bagas, Alia, Danish, Farah. Ikuti urutan ini dari atas, terus lompat
ke bagian tugas kamu di paling bawah.

## 1. Baca 3 dokumen ini (± 15 menit)

1. [README.md](README.md) — project ini apa
2. [docs/glosarium.md](docs/glosarium.md) — istilah yang benar. **Wajib**, karena
   "Queue" dan "User" punya 2 arti beda di sistem lama, gampang salah paham
3. [CONTRIBUTING.md](CONTRIBUTING.md) — cara kerja tim: issue → branch → PR

Kalau kerja di `apps/api`, baca juga `apps/api/CLAUDE.md`.
Kalau kerja di `apps/web`, baca juga `apps/web/CLAUDE.md`.

## 2. Setup laptop kamu

Ikuti [docs/setup-lokal.md](docs/setup-lokal.md) dari atas ke bawah, satu-satu.
± 20–30 menit. SQL Server, database, `.env` — semua per laptop, gak bisa dibagi.

Macet? Cek tabel "Masalah yang sering muncul" di bawah dokumen itu dulu sebelum
tanya di grup.

## 3. Cara ngerjain 1 issue

```bash
git checkout -b feat/N-nama-singkat main
# kerjain, commit sering-sering
git push -u origin feat/N-nama-singkat
```

Buka PR, isi templatenya, tulis `Closes #N` (ganti N dengan nomor issue-nya). Minta
1 orang review (2 orang kalau nyentuh `packages/contract`).

## 4. Aturan yang wajib diinget

- Jangan sentuh folder punya kelompok lain (`apps/api` ↔ `apps/web`)
- Jangan commit `.env`
- Jangan pakai `any` di TypeScript
- `packages/contract` cuma diubah bareng-bareng, direview 2 kelompok
- Pakai AI (Claude Code dll)? Dia bakal nanya "kamu siapa" duluan — jawab jujur,
  itu buat mastiin kamu ngerjain issue yang bener

Aturan lengkap ada di `CLAUDE.md`.

## 5. Kalau stuck

Jangan diem sendirian. Kasih label `blocked` di issue-nya, tulis lagi nunggu apa
di komentar, terus kabarin di grup.

Kalau sampai ke issue yang ternyata masih nunggu punya orang lain kelar duluan,
**lompat ke issue berikutnya di daftar kamu** — jangan nganggur nunggu.

---

# Tugas Kamu

Cari nama kamu. Kerjain dari atas ke bawah — urutannya udah ngikutin ketergantungan
antar issue. Centang kalau selesai (checkbox ini cuma buat kamu, assignee di GitHub
tetap yang jadi acuan resmi).

Nomor issue ikut urutan [docs/backlog.md](docs/backlog.md). Kalau nomornya beda di
GitHub, cari pakai judulnya.

## Bagas — `apps/api`, 18 issue

- [ ] #4 Bootstrap NestJS + Prisma ke SQL Server *(paling ribet di Tahap 0, hati-hati 3 jebakan setup di rencana)*
- [ ] #7 Endpoint login & logout
- [ ] #9 Seed role Administrator + agent admin
- [ ] #12 Modul Department (hierarki 2 tingkat)
- [ ] #14 Modul Agent
- [ ] #17 Perpanjang masa berlaku sesi
- [ ] #23 Skema Prisma: Ticket, ThreadEntry, ThreadEvent, Attachment
- [ ] #25 Buat tiket + 6 field Versa
- [ ] #26 Ubah tiket + aturan bisnis warisan osTicket
- [ ] #29 Penugasan tiket
- [ ] #37 Query daftar tiket
- [ ] #42 Pencarian tiket
- [ ] #43 SLA plan
- [ ] #44 Job overdue
- [ ] #52 Karantina email gagal proses
- [ ] #53 Notifikasi email keluar
- [ ] #55 Autentikasi pelapor (Requester)
- [ ] #59 CustomFieldDefinition *(tanya IT dulu — lihat `docs/pertanyaan-tim-it.md`)*

## Alia — `apps/api`, 18 issue

- [ ] #3 Setup SQL Server 2022 (di laptop sendiri)
- [ ] #5 Pipe validasi Zod + filter error global
- [ ] #6 PasswordService (argon2id)
- [ ] #8 PermissionGuard + `/auth/me`
- [ ] #13 Modul Category (hierarki 3 tingkat)
- [ ] #15 Modul Role & Permission
- [ ] #16 Logging pino + requestId
- [ ] #24 Modul TicketStatus & Priority
- [ ] #27 ThreadEntry (balasan & catatan)
- [ ] #28 ThreadEvent (jejak audit otomatis)
- [ ] #30 Unggah/unduh lampiran
- [ ] #36 Spike email — buktikan IMAP bisa konek *(penting, jangan di-skip)*
- [ ] #38 SavedView berhierarki
- [ ] #45 Modul Knowledge Base
- [ ] #46 Modul Asset
- [ ] #50 IMAP polling *(messageId harus UNIQUE, baca catatannya di backlog)*
- [ ] #51 Deteksi balasan email
- [ ] #54 Collaborator / CC tiket

## Danish — `apps/web`, 12 issue

- [x] #1 Fondasi monorepo ✅ *(sudah)*
- [x] #2 Skema Zod login ✅ *(sudah)*
- [ ] #10 Halaman login & beranda
- [ ] #18 Kerangka aplikasi web (layout, sidebar, navigasi)
- [ ] #20 Halaman Category (tampilan pohon)
- [ ] #32 Halaman detail tiket: header, field, aksi
- [ ] #33 Halaman detail tiket: thread + sanitasi HTML *(baca `docs/temuan/cacat-desain-osticket.md` dulu)*
- [ ] #34 Aksi tiket: balas, catatan, tugaskan, ubah status
- [ ] #39 Tabel daftar tiket
- [ ] #48 Halaman Knowledge Base
- [ ] #56 Portal pelapor
- [ ] #61 Render field kustom di detail tiket

## Farah — `apps/web`, 13 issue

- [ ] #11 Halaman /design-system
- [ ] #19 Halaman Department
- [ ] #21 Halaman Agent
- [ ] #22 Halaman Role & Permission
- [ ] #31 Halaman buat tiket
- [ ] #35 Unggah lampiran + pratinjau
- [ ] #40 Sidebar saved view
- [ ] #41 Pewarnaan status + penanda Overdue
- [ ] #47 Halaman SLA
- [ ] #49 Halaman Asset
- [ ] #57 Halaman collaborator
- [ ] #58 Halaman karantina email
- [ ] #60 Halaman admin field kustom
