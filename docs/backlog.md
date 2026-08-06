# Backlog — seluruh project

Daftar **semua** issue dari Tahap 0 sampai 6. Ini peta pekerjaan lengkap sampai
project selesai.

| Berkas | Isinya |
|---|---|
| **`docs/backlog.md`** (ini) | Daftar semua issue: judul, assignee, ketergantungan |
| `docs/issues-tahap-0.md` | Badan issue rinci untuk #1–#11, siap ditempel |
| `docs/plans/...` | Langkah TDD rinci, dibuat **per tahap** menjelang dikerjakan |

**Judul dan ketergantungan di sini stabil. Rincian langkahnya belum** — itu ditulis
saat tahapnya mau dikerjakan, supaya mengacu ke kode yang benar-benar ada, bukan ke
bayangan.

---

## Ringkasan

| Tahap | Isi | Issue | Jumlah |
|---|---|---|---|
| 0 | Fondasi | #1–#11 | 11 |
| 1 | Master data | #12–#22 | 11 |
| 2 | Tiket inti | #23–#35 | 13 |
| 2b | Spike email | #36 | 1 |
| 3 | Daftar tiket & saved view | #37–#42 | 6 |
| 4 | SLA, Knowledge Base, Asset | #43–#49 | 7 |
| 5 | Email masuk, collaborator, portal | #50–#58 | 9 |
| 6 | Field kustom | #59–#61 | 3 |
| | | **Total** | **61** |

### ⚠️ Baca angka ini baik-baik

**61 issue, 4 orang, sisa waktu 1 bulan.** Kalau dihitung ~20 hari kerja, itu
**sekitar 3 issue selesai per hari untuk seluruh tim** — terus-menerus, tanpa hari
libur, tanpa hari yang habis karena satu bug.

Saya tidak mengatakan ini mustahil; vibecoding memang mempercepat. Tapi sekarang
angkanya konkret, bukan perasaan. Gunakan untuk memutuskan, bukan untuk panik.

**Kalau ternyata meleset, gugurkan dari bawah:** Tahap 6 (3 issue) dulu, lalu
sebagian Tahap 5. Urutan tahap memang disusun supaya bisa dipotong dari daun tanpa
meninggalkan sistem setengah jadi.

### Beban per orang

| Orang | Bagian | Issue |
|---|---|---|
| Bagas | `apps/api` | ~18 |
| Alia | `apps/api` | ~18 |
| Danish | `apps/web` | ~13 |
| Farah | `apps/web` | ~10 |

Backend punya 36 issue, frontend 23. **Tapi jumlah issue bukan ukuran usaha** —
satu halaman daftar tiket dengan tabel, filter, dan aksi jauh lebih besar daripada
satu service CRUD. Jangan menyeimbangkan dengan menghitung issue; seimbangkan dengan
melihat siapa yang benar-benar kewalahan.

Tinjau ulang pembagian di awal **Tahap 2** — di situ beban mulai bergeser ke web.

---

## Tahap 0 — Fondasi (#1–#11)

Badan issue lengkapnya di [`issues-tahap-0.md`](issues-tahap-0.md).

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 1 | Fondasi monorepo pnpm workspace | Danish | — |
| 2 | Skema Zod login dan bentuk error seragam | Danish | #1 |
| 3 | Siapkan SQL Server 2022 Express | Alia | — |
| 4 | Bootstrap NestJS dengan Prisma ke SQL Server | Bagas | #1, #2, #3 |
| 5 | Pipe validasi Zod dan filter error global | Alia | #4 |
| 6 | PasswordService dengan argon2id | Alia | #4 |
| 7 | Endpoint login dan logout dengan sesi cookie | Bagas | #5, #6 |
| 8 | PermissionGuard berbasis Role dan /auth/me | Alia | #7 |
| 9 | Seed role Administrator dan agent admin | Bagas | #4 |
| 10 | Halaman login dan beranda (walking skeleton) | Danish | #2, #7, #8 |
| 11 | Halaman /design-system | Farah | #10 |

---

## Tahap 1 — Master data (#12–#22)

Semua tahap berikutnya bergantung pada ini. Department dan Category punya hierarki
(2 dan 3 tingkat), jadi tidak sesederhana CRUD biasa.

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 12 | Modul Department dengan hierarki 2 tingkat | Bagas | #8 |
| 13 | Modul Category dengan hierarki 3 tingkat + batasan per department | Alia | #8 |
| 14 | Modul Agent: CRUD, aktif/nonaktif, atur Role | Bagas | #8 |
| 15 | Modul Role & Permission: CRUD + daftar izin | Alia | #8 |
| 16 | Logging terstruktur pino + requestId per request | Alia | #8 |
| 17 | Perpanjang masa berlaku sesi tiap request | Bagas | #8 |
| 18 | Kerangka aplikasi web: layout, sidebar, navigasi, logout | Danish | #10 |
| 19 | Halaman Department | Farah | #12, #18 |
| 20 | Halaman Category dengan tampilan pohon | Danish | #13, #18 |
| 21 | Halaman Agent | Farah | #14, #18 |
| 22 | Halaman Role & Permission | Farah | #15, #18 |

**Catatan:** #20 ke Danish karena tampilan pohon 3 tingkat dengan pembatasan per
department adalah UI tersulit di tahap ini.

---

## Tahap 2 — Tiket inti (#23–#35)

Jantung sistem. Tahap terbesar, dan di sinilah aturan bisnis warisan osTicket
ditegakkan.

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 23 | Skema Prisma: Ticket, ThreadEntry, ThreadEvent, Attachment | Bagas | #12, #13 |
| 24 | Modul TicketStatus & Priority (12 status, bisa diubah admin) | Alia | #23 |
| 25 | Buat tiket + 6 field Versa sebagai kolom tetap | Bagas | #23, #24 |
| 26 | Ubah tiket + aturan bisnis warisan (closed tidak bisa dibalas) | Bagas | #25 |
| 27 | ThreadEntry: balasan dan catatan internal | Alia | #25 |
| 28 | ThreadEvent: jejak audit otomatis tiap perubahan | Alia | #26 |
| 29 | Penugasan tiket + auto-claim + status jadi Open | Bagas | #26 |
| 30 | Unggah & unduh lampiran ke filesystem + checksum | Alia | #25 |
| 31 | Halaman buat tiket | Farah | #25, #18 |
| 32 | Halaman detail tiket: header, field, aksi | Danish | #25, #18 |
| 33 | Halaman detail tiket: thread percakapan + sanitasi HTML | Danish | #27, #32 |
| 34 | Aksi tiket: balas, catatan, tugaskan, ubah status | Danish | #26, #29, #32 |
| 35 | Unggah lampiran + pratinjau | Farah | #30, #32 |

**Catatan:** #33 ke Danish — di situ letak sanitasi HTML jalur tampilan, cacat
osTicket yang paling halus (lihat `docs/temuan/cacat-desain-osticket.md`).

---

## Tahap 2b — Spike email (#36)

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 36 | **Spike:** buktikan bisa konek IMAP dan parse 1 email | Alia | #23 |

Bukan fitur — pembuktian teknis singkat. Sengaja dimajukan karena kalau mailbox
Socfindo ternyata Exchange/Graph API dan bukan IMAP biasa, seluruh Tahap 5 berubah
desainnya. Lebih baik tahu sekarang.

**Selesai kalau:** satu email sungguhan berhasil ditarik dan isinya terbaca. Tidak
perlu jadi tiket.

---

## Tahap 3 — Daftar tiket & saved view (#37–#42)

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 37 | Query daftar tiket: paginasi, filter, sort, cakupan department | Bagas | #25 |
| 38 | SavedView berhierarki + kriteria tertutup lewat skema Zod | Alia | #37 |
| 39 | Tabel daftar tiket: kolom, sort, paginasi | Danish | #37, #18 |
| 40 | Sidebar saved view 3 tingkat | Farah | #38, #39 |
| 41 | Pewarnaan baris per status + penanda Overdue | Farah | #39 |
| 42 | Pencarian tiket (API + web) | Bagas | #37 |

**Catatan:** #38 hanya perlu 4 predikat (`status in`, `isAnswered`, `isOverdue`,
`assignee = me`) — bukan query builder. Lihat
`docs/temuan/fitur-osticket-terpakai.md`.

---

## Tahap 4 — SLA, Knowledge Base, Asset (#43–#49)

Tiga modul yang saling bebas — paling mudah dikerjakan paralel.

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 43 | SLA plan + hitung due date otomatis | Bagas | #25 |
| 44 | Job terjadwal penanda overdue | Bagas | #43 |
| 45 | Modul Knowledge Base: kategori + artikel | Alia | #8 |
| 46 | Modul Asset + 3 daftar lookup | Alia | #8 |
| 47 | Halaman SLA | Farah | #43, #18 |
| 48 | Halaman Knowledge Base | Danish | #45, #18 |
| 49 | Halaman Asset | Farah | #46, #18 |

---

## Tahap 5 — Email masuk, collaborator, portal pelapor (#50–#58)

Tahap paling berisiko. Jangan mulai sebelum #36 terbukti.

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 50 | IMAP polling + idempotensi lewat messageId UNIQUE | Alia | #36, #27 |
| 51 | Deteksi balasan lewat In-Reply-To → thread yang benar | Alia | #50 |
| 52 | Karantina email gagal proses tanpa menghentikan poller | Bagas | #50 |
| 53 | Notifikasi email keluar (tiket baru, balasan, overdue) | Bagas | #50 |
| 54 | Collaborator / CC pada tiket | Alia | #27 |
| 55 | Autentikasi pelapor (Requester) terpisah dari Agent | Bagas | #8 |
| 56 | Portal pelapor: buat tiket dan lihat tiket sendiri | Danish | #55, #25 |
| 57 | Halaman collaborator di detail tiket | Farah | #54, #32 |
| 58 | Halaman karantina email untuk admin | Farah | #52 |

**Catatan:** `messageId` dengan constraint UNIQUE di #50 adalah pengaman terpenting
seluruh tahap ini — tanpanya polling menghasilkan tiket ganda tanpa jejak.

---

## Tahap 6 — Field kustom (#59–#61)

**Daun.** Tidak ada yang bergantung pada tahap ini, jadi inilah yang digugurkan
pertama kalau waktu habis — tanpa meninggalkan sistem setengah jadi.

| # | Judul | Assignee | Bergantung |
|---|---|---|---|
| 59 | CustomFieldDefinition + CustomFieldValue | Bagas | #25 |
| 60 | Halaman admin kelola field kustom | Farah | #59, #18 |
| 61 | Render field kustom di detail tiket | Danish | #59, #32 |

⚠️ Sebelum mengerjakan tahap ini, **pastikan dulu ke tim IT seberapa sering mereka
minta field baru** (pertanyaan #4 di `docs/pertanyaan-tim-it.md`). Kalau jawabannya
"hampir tidak pernah", tahap ini sebaiknya dikeluarkan dan waktunya dipakai
memperkuat 12 fitur lain.

---

## Cara memakai backlog ini

1. **Buat semua 61 issue di GitHub sekaligus** — supaya seluruh pekerjaan terlihat
   dan bisa difilter per label tahap.
2. **Isi badan issue secara rinci hanya untuk tahap yang sedang dikerjakan.** Untuk
   tahap jauh, judul + ketergantungan + assignee sudah cukup.
3. **Menjelang tiap tahap dimulai**, buat `docs/plans/...-tahap-N-....md` berisi
   langkah TDD rinci, lalu salin checkbox-nya ke badan issue.

**Nomor issue di sini adalah dugaan.** Kalau GitHub memberi nomor berbeda (misalnya
karena ada issue bug di tengah), yang berlaku nomor GitHub — perbarui tabel di sini
sekali saja saat itu terjadi, lalu jangan disentuh lagi.
