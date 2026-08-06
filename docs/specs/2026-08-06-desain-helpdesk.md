# Spesifikasi Desain — Helpdesk Socfindo (Pengganti osTicket)

**Tanggal:** 6 Agustus 2026
**Status:** Disetujui, siap masuk perencanaan implementasi

> Dokumen ini berdiri sendiri. Semua keputusan di sini sudah dibahas dan disetujui —
> tidak perlu membaca riwayat chat untuk memahaminya.
>
> Rujukan berupa path seperti `db/README.md`, `class.ticket.php`, dan
> `docs/migrasi-db-versasrs-ke-osticket.md` menunjuk ke **repo osTicket lama**
> (`helpdesk-ostick`), bukan repo ini.

---

## 1. Konteks

PKL di PT Socfindo, empat mahasiswa FILKOM UB. Dua tahap pekerjaan:

**Tahap 1 (selesai)** — Migrasi VersaSRS (SQL Server 2014) → osTicket v1.18.4:
56.894 tiket, 279.395 pesan thread, 498.609 event riwayat, 94.215 lampiran (13,9 GB),
3.004 aset. Seluruhnya terverifikasi. Lihat `docs/migrasi-db-versasrs-ke-osticket.md`.

**Tahap 2 (dokumen ini)** — Membangun helpdesk baru pengganti osTicket.

### Kenapa membangun ulang

Bukan preferensi, melainkan temuan terukur dari perbandingan langsung dengan repo
resmi `osticket/osticket` tag v1.18.4:

| Indikator | Temuan |
|---|---|
| Dependency management | Tidak ada `composer.json` di root — vendor di-*vendor-in* manual |
| Data access | ORM buatan sendiri **+ 155 pemanggilan `db_query()` SQL mentah** berdampingan |
| Templating | Tanpa template engine — 72 file mencampur logika PHP dan markup HTML |
| Test | 10 file smoke-test instalasi. **Nol unit test untuk logika bisnis** |
| Frontend | jQuery + Redactor, tanpa build step, tanpa module bundler |

Ditambah empat cacat konkret yang ditemukan saat bekerja langsung — lihat §12.

### Pembagian kelompok

Panduan PKL FILKOM membatasi maksimal 3 mahasiswa per kelompok, sehingga empat orang
dihitung sebagai dua kelompok dengan dua laporan terpisah.

- **Kelompok 1** — Bagas & Alia → `apps/api`
- **Kelompok 2** — Danish & Farah → `apps/web`

---

## 2. Tujuan dan batasan

### Termasuk cakupan

Membangun sistem helpdesk yang mencakup **13 fitur osTicket yang terbukti terpakai**,
berjalan dan bisa didemokan dengan data uji.

Daftar fitur ditentukan dari file seed SQL dan `ost_config` instalasi Socfindo —
bukan dari daftar fitur di dokumentasi resmi osTicket:

| Fitur | Bukti pemakaian |
|---|---|
| Ticketing inti + thread percakapan | 56.894 tiket, 279.395 pesan |
| Department bertingkat | 52 (8 induk + 44 anak) |
| Kategori 3 tingkat | 1.056 help topic + pembatasan per department |
| Saved view tersimpan | 232 queue, 189 konfigurasi kolom, 73 aturan sort |
| Status kustom | 12 status |
| Custom field | 6 (Call Type, Closure Type, Location, Urgency, Risk, Solution) |
| Knowledge Base | 11 artikel, `enable_kb=1` |
| Email masuk → tiket | `enable_mail_polling=1` |
| Collaborator (CC) | `add_email_collabs=1` |
| SLA + penanda overdue | 1 SLA plan, alert overdue aktif |
| Role & permission | 4 role |
| Asset Management | 3.004 aset |
| Portal pelapor | `client_registration=public` |

### Di luar cakupan PKL

- **Migrasi 56.894 tiket** ke sistem baru — dinyatakan sebagai pekerjaan lanjutan
- **Cutover produksi** — penggantian osTicket oleh sistem baru diserahkan ke perusahaan
- **Fitur osTicket yang nol data seed**: Teams, Canned Responses, Email Filters,
  Plugins, API Key, Tasks, Organizations, CAPTCHA

Hampir separuh permukaan osTicket tidak terpakai. Ini pemotong cakupan yang sah.

---

## 3. Stack dan versi

Diverifikasi langsung dari registry npm pada 6 Agustus 2026.

| Paket | Versi |
|---|---|
| Node.js | 24.13.0 |
| pnpm | 11.20.0 |
| TypeScript | **6.0.3** (bukan 7.0.2 — lihat di bawah) |
| NestJS | 11.1.28 |
| Prisma | 7.9.1 (provider `sqlserver`) |
| Zod | 4.4.3 |
| Next.js | 16.3.0 |
| React | 19.2.8 |
| TanStack Query | 5.101.4 |
| Tailwind CSS | 4.3.3 |
| react-hook-form | 7.84.0 |
| MSW | 2.15.0 |
| Vitest | 4.1.10 |

### Kenapa TypeScript 6.0.3, bukan 7.0.2

```
typescript-eslint@8.66.0 → peerDependencies: typescript ">=4.8.4 <6.1.0"
```

typescript-eslint belum mendukung TypeScript 7. Memakainya mematikan linting berbasis
tipe — jaring pengaman yang justru paling dibutuhkan saat empat orang men-generate kode
cepat. Naik ke TS 7 dicatat sebagai pengembangan selanjutnya.

### Database: SQL Server

Asumsi awal MySQL **keliru**, ketahuan dari `helpdesk_url = http://localhost:8080/osticket/`
— osTicket belum pernah keluar dari localhost XAMPP, jadi MySQL belum ada di server
perusahaan. Memilih MySQL berarti meminta tim IT mengadopsi engine baru.

SQL Server sudah dijalankan perusahaan (`AP14002604`, `192.168.0.99`), sudah berlisensi
dan di-backup. Perusahaan ini Microsoft shop: IIS, Windows Server, SQL Server.

Bonus: sisa data 2 tahun yang belum termigrasi ada di SQL Server, sehingga migrasi
susulan menjadi SQL Server → SQL Server.

**Versi yang dipakai: SQL Server 2022** (kode internal 16). Ini keputusan, bukan
batas minimum — seluruh tim memakai versi yang sama supaya perilaku database di
empat laptop identik. Bug yang hanya muncul di satu mesin karena beda versi adalah
yang paling melelahkan untuk dilacak.

Prisma sendiri menerima 2017 ke atas, tapi keseragaman lebih berharga daripada
kelonggaran. Yang masih perlu dikonfirmasi: apakah server perusahaan juga
menjalankan 2022 — lihat §13.

Keterbatasan Prisma + SQL Server dan penanganannya:

| Keterbatasan | Penanganan |
|---|---|
| Tidak ada `enum` native | Nol dampak — status/priority memang tabel lookup karena bisa diubah admin |
| Tipe `Json` tidak didukung | Kriteria saved view disimpan `NVARCHAR`, di-parse skema Zod |
| Full-text search tidak didukung | Nol dampak di MVP (tanpa migrasi data). Nanti `$queryRaw` + `CONTAINS` |
| `UNIQUE` hanya 1 NULL; tidak ada `RESTRICT` | Filtered index dan `NoAction` |

---

## 4. Arsitektur

### Struktur monorepo

```
socfindo-helpdesk/
├── packages/contract/     ← skema Zod bersama    [MILIK BERSAMA]
├── apps/api/              ← NestJS + Prisma      [KELOMPOK 1]
└── apps/web/              ← Next.js + React      [KELOMPOK 2]
```

### Kontrak-dulu lewat skema Zod bersama

`packages/contract` berisi skema Zod, **bukan** dokumen OpenAPI terpisah.

- `apps/api` memvalidasi request masuk dengan skema itu (`ZodValidationPipe`, ±10 baris,
  tanpa dependensi tambahan)
- `apps/web` meng-import skema yang sama untuk tipe TypeScript dan validasi form
  (`react-hook-form` + `zodResolver`)

Karena keduanya membaca **berkas yang sama**, kontrak secara struktural tidak bisa
melenceng. Perubahan bentuk response di sisi API langsung ditolak kompilasi TypeScript
di sisi web — bukan ketahuan saat demo. Tanpa langkah codegen, tanpa spec tulisan tangan.

Bentuk berkas kontrak:

```ts
// packages/contract/src/ticket/create.ts
export const CreateTicketRequest = z.object({ ... })
export const CreateTicketResponse = z.object({ ... })
export type CreateTicketRequest = z.infer<typeof CreateTicketRequest>
```

`packages/contract` diubah lewat PR yang **wajib di-review kedua kelompok**. Ini
satu-satunya titik sinkronisasi antar kelompok, dan itu disengaja.

### Kerja paralel tanpa saling blokir

Kontrak disepakati hari 1–2. Kelompok 2 kemudian bekerja dengan MSW (mock diturunkan
dari skema Zod yang sama) sampai API sungguhan siap. Kelompok 2 tidak pernah menunggu
kelompok 1.

### Deployment

```
IIS (ARR reverse proxy)
 ├── /      → Next.js  :3000  (Windows Service)
 └── /api   → NestJS   :3001  (Windows Service)
```

Membutuhkan modul **ARR (Application Request Routing)** dan **URL Rewrite** di IIS.
Lihat §13.

---

## 5. Model data

Delapan modul:

| Modul | Entitas |
|---|---|
| Identitas | `Agent`, `Requester`, `Role`, `Permission`, `Session` |
| Organisasi | `Department` (self-ref, 2 tingkat), `Category` (self-ref, 3 tingkat), `CategoryDepartment` |
| Tiket | `Ticket`, `TicketStatus`, `Priority`, `SlaPlan` |
| Percakapan | `ThreadEntry`, `ThreadEvent`, `Attachment`, `Collaborator` |
| Tampilan | `SavedView` (self-ref berhierarki), `ViewColumn` |
| Pengetahuan | `KbCategory`, `KbArticle` |
| Aset | `Asset`, `AssetType`, `AssetManufacturer`, `AssetStatus` |
| Sistem | `Setting`, `EmailAccount`, `AuditLog`, `CustomFieldDefinition`, `CustomFieldValue`, `EmailIngestFailure` |

### 5.1 Field tetap dan field kustom — model hibrida

osTicket menyimpan **semua** field tiket lewat `DynamicForm`, bahkan subject tiket
sendiri, lalu menambal kelambatannya dengan cache `ost_ticket__cdata`. Ongkos terukur,
tercatat di `db/README.md`:

> tanpa ini, pembuatan tiket baru melambat dari 0,4 detik jadi **12,8 detik**

Model yang dipakai:

```
Ticket
├── 6 kolom tetap        ← jalur panas: terindeks, bisa difilter, dipakai saved view
└── CustomFieldValue     ← jalur dingin: hanya tampil di halaman detail
```

Enam field warisan Versa (Call Type, Closure Type, Location, Urgency, Risk, Solution)
sudah stabil 15 tahun → jadi kolom sungguhan.

Dua entitas untuk field buatan admin:

- `CustomFieldDefinition` — `name`, `label`, `type` (text/textarea/number/date/select/checkbox),
  `required`, `options`, `sortOrder`, `active`
- `CustomFieldValue` — `ticketId` + `fieldId` + `value`, unik per pasangan

**Tiga pagar pembatas** yang membedakan desain ini dari osTicket:

1. **Field kustom tidak pernah masuk daftar tiket** — hanya halaman detail. Ini yang
   menjaga query daftar tetap datar, tanpa join berlebih, tanpa tabel cache.
2. **Field kustom tidak bisa jadi kriteria saved view** di MVP.
3. **Hanya untuk Tiket, tidak untuk Asset** — field Asset sudah diverifikasi stabil
   lewat pengecekan fill-rate terhadap 3.004 baris data Versa.

Yang terbukti stabil dan dipakai memfilter → kolom. Yang eksperimental dan cuma dibaca
→ EAV. osTicket tidak pernah membuat pemisahan itu.

### 5.2 SavedView menyimpan kriteria terbatas, bukan query builder

Seluruh 232 queue di osTicket Socfindo punya `staff_id = 0` — **tidak ada satu pun
queue buatan agent**. Kriterianya hanya empat predikat:

```
status__id includes [...]
isanswered set / nset
isoverdue set
assignee includes Me
```

Plus pewarnaan baris per status.

Karena itu **tidak perlu** membangun ulang query-builder osTicket (`class.search.php` +
`class.queue.php`), subsistem paling rumit di seluruh osTicket. Cukup saved view
berhierarki dengan predikat tertutup, disimpan `NVARCHAR` dan di-parse skema Zod.
Skema Zod itu menjadi definisi resmi predikat yang sah.

### 5.3 `Ticket.number` terpisah dari `Ticket.id`

`id` internal autoincrement; `number` nomor yang dilihat pengguna, lanjut dari 1000015
sesuai keputusan migrasi. osTicket menyamakan keduanya saat migrasi — jalan pintas demi
idempotensi ETL yang tidak boleh diwariskan ke sistem baru.

---

## 6. Autentikasi dan RBAC

### Autentikasi

Sesi berbasis cookie `httpOnly`, **bukan** JWT di localStorage. Alasan: aplikasi internal
tanpa klien mobile, dan sesi harus bisa dicabut seketika saat agent resign — JWT tidak
bisa. Cookie `httpOnly` juga kebal pencurian token lewat XSS.

Sesi disimpan di tabel `Session` di SQL Server. Konsisten dengan §9 — 36 pengguna tidak
butuh Redis untuk menyimpan sesi.

Password memakai **argon2id**. Kebijakan keamanan diwarisi dari config osTicket, bukan
dikarang baru:

| Setting osTicket | Nilai | Diterapkan sebagai |
|---|---|---|
| `staff_max_logins` | 4 | 4 kali gagal → akun terkunci |
| `staff_login_timeout` | 2 | terkunci 2 menit |
| `staff_session_timeout` | 30 | sesi mati setelah 30 menit idle |

### RBAC murni lewat Role

osTicket punya **dua sistem izin yang tumpang tindih**. Dari `db/README.md`:

> **Permission per-agent, bukan per-Role**: `asset.view`/`asset.manage` dicek lewat
> `Staff::hasPerm($perm)` — membaca kolom `ost_staff.permissions`, **BUKAN** lewat
> Role/department.

Akibatnya izin harus di-`UPDATE` manual untuk 36 agent, dan agent baru tidak otomatis
dapat akses.

Sistem baru memakai satu model:

```
Agent ──< AgentRole >── Role ──< RolePermission >── Permission
  └──< AgentDepartment >── Department
```

**Izin ditentukan hanya lewat Role. Department menentukan cakupan data, bukan kemampuan.**

| Pertanyaan | Dijawab oleh | Bentuk di kode |
|---|---|---|
| Boleh tidak melakukan aksi ini? | Guard | `@RequirePermission('ticket.edit')` |
| Boleh tidak menyentuh baris ini? | Service | filter `departmentId` disuntik ke query |

Konsekuensi: agent yang butuh akses khusus harus dimasukkan ke Role yang sesuai, tidak
bisa diberi tambalan izin pribadi. Ini disengaja — kelenturan itulah yang membuat
osTicket sulit diaudit.

---

## 7. Kontrak API

REST berorientasi resource di `/api/v1`.

- **Paginasi** — `limit` + `offset`, default 25 (mengikuti `max_page_size` osTicket)
- **Bentuk error seragam** — `{ error: { code, message, fields? } }`
- **`fields`** memetakan error Zod ke nama field, sehingga web menampilkannya langsung
  di form tanpa penerjemahan manual
- **`code` berupa string konstan** (`TICKET_CLOSED`, `PERMISSION_DENIED`), bukan hanya
  pesan bahasa Inggris — supaya UI memutuskan perilaku berdasarkan kode, bukan
  mencocokkan teks

---

## 8. Alur kritis

### 8.1 Email masuk → tiket

Polling IMAP dijalankan `@nestjs/schedule` di dalam `apps/api` — tanpa proses cron
terpisah untuk IIS.

```
IMAP unseen → parse (mailparser) → balasan atau tiket baru?
                                      │
        ┌─────────────────────────────┴─────────────────┐
   In-Reply-To / References cocok               tidak cocok
        │                                            │
   ThreadEntry baru di tiket itu            Ticket baru + Requester
```

Empat keputusan yang menentukan fitur ini hidup atau menjadi sumber bug tak berujung:

1. **`messageId` disimpan dengan constraint UNIQUE.** Pengaman terpenting — polling bisa
   mengantar ulang email yang sama. Idempotensi ditegakkan database, bukan logika aplikasi.
2. **Deteksi balasan memakai header `In-Reply-To`/`References` lebih dulu**, nomor tiket
   di subject hanya cadangan. osTicket bertumpu pada penanda teks
   `-- reply above this line --` yang rapuh karena pengguna menghapusnya.
3. **Email gagal proses masuk tabel `EmailIngestFailure`, tidak menghentikan poller.**
   Satu email rusak tidak boleh membekukan seluruh antrean.
4. **Requester dicocokkan lewat email, dibuat kalau belum ada** (`accept_unregistered_email=1`).

### 8.2 Lampiran disimpan di filesystem

osTicket menyimpan biner lampiran **di dalam** database (`ost_file_chunk`), sampai 13,9 GB
harus dipindah ke drive D: lewat `DATA DIRECTORY` — jalan darurat yang penyebabnya justru
keputusan menyimpan biner di database.

Sistem baru: database menyimpan metadata, filesystem menyimpan file.

```
Attachment (database)              Filesystem
├── id, ticketId                   └── <STORAGE_ROOT>/2026/08/<uuid>.pdf
├── namaAsli, mimeType, ukuran
├── path (relatif)
└── checksum SHA-256
```

Path disimpan **relatif** agar `STORAGE_ROOT` bisa dipindah ke NAS/share UNC tanpa
mengubah data. Batas ukuran 32 MB, mengikuti `max_file_size` osTicket.

Tiga konsekuensi yang harus ditangani:

1. **Backup jadi dua bagian yang harus konsisten** — dump database dan folder file
   diambil berpasangan. Restore yang tidak sinkron menghasilkan baris menunjuk file
   tidak ada, atau file yatim.
2. **Hapus tiket tidak otomatis menghapus file** — transaksi database tidak mencakup
   filesystem. Baris ditandai terhapus, lalu job berkala menyapu file yatim.
3. **Folder wajib di luar root web.** Unduhan hanya lewat
   `GET /api/v1/attachments/:id` yang memeriksa izin. Kalau folder bisa diakses langsung,
   siapa pun yang menebak nama file dapat mengunduh lampiran tiket orang lain tanpa login.
   Ini wajib, bukan opsional.

### 8.3 Aturan bisnis yang diwarisi

Bukan fitur baru — aturan yang sudah dibangun dan divalidasi di osTicket. Semuanya
ditegakkan di **service layer**, bukan UI:

| Aturan | Asal |
|---|---|
| Tiket closed tidak bisa dibalas, harus reopen dulu | `class.ticket.php` |
| Assign tiket berstatus default → otomatis jadi Open | commit yang sama |
| Agent yang membalas otomatis jadi assignee | `auto_claim_tickets=1` |
| Overdue = `dueDate < closedAt` (closed) atau `dueDate < now()` (open) | `08_recalc.sql` |
| Setiap perubahan status/assignee/dept menulis `ThreadEvent` | jejak audit Versa |

Alasan harus di service layer, dari komentar tim sendiri di `class.ticket.php`:
*"UI only — enforce it here too so a direct POST can't reply to a ticket marked done."*

---

## 9. Penanganan error dan performa

### Tanpa lapisan cache

Beban kerja sesungguhnya, dihitung dari data migrasi:

| Ukuran | Angka |
|---|---|
| Tiket selama 15 tahun | 56.894 |
| **Rata-rata per hari kerja** | **±15 tiket** |
| Agent aktif | 36 |

SQL Server dengan indeks yang benar melayani ini dalam satuan milidetik. Redis berarti
satu service lagi untuk dipantau tim IT, satu mode kegagalan baru, dan invalidasi cache
— ditukar dengan penghematan yang tidak terukur.

Satu tempat yang biasanya butuh cache — hitungan angka sidebar — tidak berlaku di sini:
`queue_bucket_counts = 0`, fitur itu sudah dimatikan.

Caching yang sudah didapat gratis: TanStack Query (klien) dan Next.js (server).

**Ambang peninjauan ulang:** ada endpoint konsisten di atas ~300 ms setelah indeks
dibenahi; tiket per hari naik ke ratusan; muncul dashboard agregat lintas 56rb tiket
yang di-hit terus-menerus.

Catatan: masalah 12,8 detik di osTicket bukan masalah cache melainkan masalah skema —
dan osTicket justru menambalnya dengan cache. §5.1 menghapus penyebabnya.

### Penanganan error di API

Satu `GlobalExceptionFilter` menjadi satu-satunya tempat error diubah jadi response.

| Jenis | HTTP | Bentuk |
|---|---|---|
| Validasi Zod gagal | 422 | `fields` terisi, langsung dipetakan ke form |
| Aturan bisnis dilanggar | 409 | `code: 'TICKET_CLOSED'` |
| Izin ditolak | 403 | `code: 'PERMISSION_DENIED'` |
| Tak terduga | 500 | pesan generik — **stack trace tidak pernah keluar ke klien** |

Logging terstruktur memakai **pino**, tiap request punya `requestId` yang ikut sampai ke
log error. Laporan "tadi error" jadi bisa ditelusuri lewat satu ID.

### Penanganan error di web

Error field tampil inline di form (langsung dari `fields`), error mutasi tampil sebagai
toast, error pemuatan halaman ditangani error boundary TanStack Query dengan tombol
coba lagi.

---

## 10. Pengujian

**Kelompok 1 (`apps/api`)** — Vitest. Yang diuji bukan semua hal, melainkan yang paling
mahal kalau salah:

- Lima aturan bisnis warisan di §8.3 — masukan jelas, keluaran pasti, dan semuanya sudah
  terbukti pernah salah di osTicket
- Idempotensi email masuk: kirim `messageId` sama dua kali, tiket tetap satu
- Guard RBAC: agent tanpa permission ditolak, agent di luar department tidak melihat baris

**Kelompok 2 (`apps/web`)** — Vitest + Testing Library, dengan MSW sebagai API tiruan.

**Jangan mengejar persentase coverage.** Angka tinggi dengan tes yang menguji getter dan
setter menipu diri sendiri. Uji aturan bisnis dan jalur error.

---

## 11. Urutan pengerjaan

Prinsip: **urutkan menurut ketergantungan, potong dari daun, majukan yang berisiko.**

| Tahap | Isi | Catatan |
|---|---|---|
| **0** | Fondasi: monorepo, kerangka `contract`, skema Prisma, auth + RBAC, **satu endpoint tembus ujung-ke-ujung** | Hari 1–2, kedua kelompok bareng |
| **1** | Master data: Department, Category, Agent, Role | Semua bergantung pada ini |
| **2** | Tiket inti: CRUD, ThreadEntry, status, penugasan, 6 field, lampiran | Jantung sistem |
| **2b** | **Spike email masuk** — buktikan bisa konek IMAP & parse 1 email | Sengaja dimajukan |
| **3** | Daftar tiket, saved view berhierarki, pewarnaan status | |
| **4** | SLA & overdue, Knowledge Base, Asset | |
| **5** | Email masuk penuh, collaborator, portal pelapor | |
| **6** | Field kustom | Daun — digugurkan pertama kalau waktu habis |

**Tahap 0 wajib menghasilkan satu endpoint yang benar-benar tembus** — dari form di
browser, lewat kontrak Zod, ke NestJS, ke SQL Server, dan kembali. Gunanya bukan
fiturnya, melainkan membuktikan seluruh rantai teknis berjalan sebelum 13 fitur menumpuk
di atasnya. Kalau ARR bermasalah atau Prisma tidak mau konek ke SQL Server, itu ketahuan
di hari kedua, bukan hari kedua puluh lima.

**Spike email dimajukan ke tahap 2b.** Email masuk adalah fitur paling berisiko: parsing
email nyata selalu lebih kotor dari dugaan, dan kalau mailbox ternyata Exchange/Graph API
dan bukan IMAP biasa, desainnya berubah. Risiko yang ditemukan di minggu 1 masih bisa
disiasati; di minggu 4 sudah tidak.

**Tahap 6 sengaja di daun.** Tidak ada fitur lain yang bergantung padanya, sehingga
satu-satunya yang bisa gugur tanpa meninggalkan sistem setengah jadi.

---

## 12. Cacat osTicket yang diperbaiki

Ringkasan pemetaan temuan → penanganan:

| Cacat osTicket | Penanganan di sistem baru |
|---|---|
| Dynamic form untuk semua hal → butuh tabel cache `cdata` (0,4 → 12,8 detik) | §5.1 model hibrida |
| Dua sistem izin tumpang tindih (Role vs kolom JSON per-agent) | §6 RBAC murni lewat Role |
| Sanitasi HTML hanya di jalur input, tidak di jalur tampilan | Sanitasi wajib di **jalur tampilan** (lihat di bawah) |
| Lampiran 13,9 GB di dalam database | §8.2 filesystem + metadata |
| Query builder rumit padahal hanya 4 predikat terpakai | §5.2 saved view berkriteria tertutup |

Catatan tentang cacat sanitasi: `Format::safe_html()` hanya berjalan saat input
(`getClean()`). Body yang ditulis langsung ke database — seperti ~152rb entry hasil
migrasi — tidak pernah melewatinya, dan jalur tampilan tidak menyanitasi. Akibat nyata:
email dari Word/Outlook membawa blok `<style>` tidak ter-scope yang mengubah gaya seluruh
link di halaman tiket. Ditambal tim ini lewat `stripDocumentSections()`.

Pelajarannya: **sanitasi harus ada di jalur tampilan, bukan hanya jalur input**, karena
data bisa masuk lewat pintu lain.

Penerapannya konkret:

- Body `ThreadEntry` disimpan **apa adanya** di database — jangan pernah menyanitasi saat
  simpan. Data mentah dipertahankan supaya bisa diperiksa ulang kalau aturan sanitasi
  berubah, dan supaya migrasi tidak merusak isi asli.
- Sanitasi dilakukan **setiap kali dirender**, di satu fungsi tunggal di `apps/web`
  (memakai DOMPurify), dengan allowlist tag dan atribut.
- Tag `<style>`, `<head>`, `<script>`, dan komentar kondisional Outlook (`<![if !mso]>`)
  dibuang seluruhnya — inilah yang bocor di osTicket.
- Tidak ada jalur render alternatif. Kalau ada dua tempat yang merender body thread,
  keduanya wajib memanggil fungsi yang sama. Satu pintu, bukan dua.

---

## 13. Ketergantungan terbuka dan risiko

Semua ini **memblokir keputusan desain** dan harus ditanyakan di minggu pertama.

| # | Pertanyaan | Kalau jawabannya buruk |
|---|---|---|
| 1 | IIS punya modul **ARR + URL Rewrite**? Boleh dipasang? | §4 deployment harus dirombak |
| 2 | SQL Server **versi berapa**? Minimum 2017, diminta 2022 | Kalau 2014: ganti ORM atau ganti database |
| 3 | Node.js boleh jalan sebagai **Windows Service**? | Perlu cara lain menjaga proses tetap hidup |
| 4 | Seberapa sering tim IT minta **field baru**? | Kalau sangat jarang, tahap 6 dikeluarkan dari MVP |
| 5 | Kebijakan **backup folder file** di server? | §8.2 perlu penyesuaian |
| 6 | Mailbox helpdesk pakai **IMAP atau Exchange/Graph API**? | §8.1 berubah cukup banyak |

### Risiko utama: cakupan versus waktu

Sisa waktu PKL satu bulan, dengan 13 fitur dan tambahan modul field kustom. Ini
disampaikan ke tim dan tim tetap memilih cakupan penuh. Mitigasinya adalah urutan
pengerjaan di §11: kalau waktu habis, yang jadi adalah sistem utuh yang lebih kecil,
bukan 13 fitur yang setengah jadi semua.

### Temuan lama yang belum ditindaklanjuti

Tercatat di `docs/migrasi-db-versasrs-ke-osticket.md` dan **masih menggantung**:

Server yang dimigrasi (`AP14002604`) bukan VersaSRS produksi (`192.168.0.99`). Data
sumber mentok di CallID 1000014 / 18 Mei 2024, sementara VersaSRS live sudah mencapai
CallID 1000100+. **Ada ~2 tahun tiket produksi yang belum termigrasi.**

Selama ini tidak diselesaikan, osTicket tidak akan pernah benar-benar menggantikan
VersaSRS. Harus diangkat ke pembimbing lapangan.

---

## 14. Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| **Express** sebagai framework API | Tidak punya opini soal struktur. Empat orang men-generate kode cepat akan menghasilkan pola berbeda-beda — persis penyakit osTicket, dengan sintaks lebih baru |
| **Laravel + Inertia + Vue** | Tetap PHP dan jalan native di IIS, tapi melemahkan premis laporan padahal Node sudah diizinkan |
| **Next.js full-stack dibagi per domain** | Lebih cepat sampai garis akhir, tapi mengaburkan batas kontribusi antar kelompok — justru yang diminta pembimbing. Tetap menjadi rencana cadangan kalau timeline terbukti terlalu ketat |
| **MySQL 8** | Ekosistem Prisma paling matang, tapi meminta tim IT mengadopsi engine baru tanpa manfaat sepadan |
| **PostgreSQL** | Dukungan Prisma terbaik, tapi friksi paling besar di lingkungan Microsoft shop |
| **Redis / lapisan cache** | Beban terukur 15 tiket/hari tidak membenarkan tambahan infrastruktur. Lihat ambang peninjauan di §9 |
| **JWT di localStorage** | Tidak bisa dicabut seketika; rentan pencurian token lewat XSS |
| **TypeScript 7.0.2** | typescript-eslint belum mendukung — linting berbasis tipe mati |
