# Glosarium

**Baca ini sebelum menamai apa pun** — tabel, model Prisma, tipe, variabel, atau teks
di layar.

## Kenapa berkas ini ada

Sistem ini adalah keturunan ketiga: **VersaSRS → osTicket → sistem baru**. Tiap sistem
memakai nama berbeda untuk benda yang sama, dan dua di antaranya memakai **nama yang
sama untuk benda yang berbeda**.

Tanpa kesepakatan, empat orang plus AI akan memakai tiga nama untuk satu entitas —
dan itu masuk ke nama tabel, nama variabel, dan teks yang dibaca pengguna.
Memperbaikinya belakangan berarti rename lintas repo.

## Padanan istilah

| VersaSRS | osTicket | **Sistem baru (pakai ini)** | Di layar |
|---|---|---|---|
| Queue | Department (induk) | `Department` | Departemen |
| Group | Department (anak) | `Department` (punya `parentId`) | Departemen |
| Key1 / Key2 / Key3 | Help Topic | `Category` | Kategori |
| User | Staff | `Agent` | Agen |
| Requestor | User | `Requester` | Pelapor |
| Call | Ticket | `Ticket` | Tiket |
| CallID | Ticket number | `Ticket.number` | Nomor Tiket |
| CallAudit (percakapan) | Thread Entry | `ThreadEntry` | Pesan |
| CallAudit (perubahan) | Thread Event | `ThreadEvent` | Riwayat |
| — | Queue (pencarian tersimpan) | `SavedView` | Tampilan |
| — | Collaborator | `Collaborator` | Kolaborator |
| VersaAsset | — | `Asset` | Aset |

## ⚠️ Dua jebakan yang paling sering salah

**1. "Queue" berarti dua hal yang sama sekali berbeda.**

- Di **VersaSRS**, Queue = unit organisasi → sekarang `Department`
- Di **osTicket**, Queue = pencarian tersimpan di sidebar → sekarang `SavedView`

Jangan pernah memakai kata "Queue" di kode baru. Ambigu, dan pasti salah dipahami
oleh siapa pun yang pernah menyentuh salah satu sistem lama.

**2. "User" juga berarti dua hal yang berbeda.**

- Di **VersaSRS**, User = karyawan IT yang mengerjakan tiket → sekarang `Agent`
- Di **osTicket**, User = orang yang melapor → sekarang `Requester`

Jangan memakai `User` sebagai nama model. Selalu `Agent` atau `Requester` secara
eksplisit.

## Istilah yang dipertahankan apa adanya

Enam field warisan Versa tetap memakai nama aslinya karena sudah dikenal pengguna
selama 15 tahun:

| Field | Di layar |
|---|---|
| `callType` | Call Type |
| `closureType` | Closure Type |
| `location` | Lokasi |
| `urgency` | Urgency |
| `risk` | Risk |
| `solution` | Solution |

Jangan "memperbaiki" nama-nama ini jadi lebih Indonesia. Pengguna sudah terbiasa,
dan mengubahnya menambah beban adaptasi yang justru ingin dihindari project ini.

## Aturan penamaan

| Konteks | Bahasa | Contoh |
|---|---|---|
| Model Prisma, tipe, kelas | Inggris, PascalCase | `Ticket`, `SavedView` |
| Variabel, fungsi, field | Inggris, camelCase | `createdAt`, `assignedAgentId` |
| Teks di layar | **Indonesia** | "Tiket", "Pelapor", "Departemen" |
| Komentar kode | **Indonesia** | |
| Pesan commit | **Indonesia** (setelah prefix) | `feat: tambah endpoint daftar tiket` |
| Pesan error di skema Zod | **Indonesia** | `'Password minimal 8 karakter'` |

Jangan mencampur dua bahasa di dalam satu identifier: `daftarTicket` dan `ticketList`
sama-sama bisa dipahami, tapi `daftarTicketBaru` membingungkan. Pilih Inggris untuk
identifier, selalu.

## Status tiket

12 status diwarisi dari osTicket/Versa. Nama di database memakai bahasa Inggris,
tampilan di layar memakai bahasa Indonesia:

| `TicketStatus.name` | Di layar | Keadaan |
|---|---|---|
| `Open` | Terbuka | open |
| `New` | Baru | open |
| `Work In Progress` | Sedang Dikerjakan | open |
| `Pending` | Tertunda | open |
| `Re-Opened` | Dibuka Kembali | open |
| `Current` | Berjalan | open |
| `Resolved` | Terselesaikan | closed |
| `Closed` | Ditutup | closed |
| `Dead` | Mati | closed |
| `Dormant` | Tidak Aktif | closed |
| `Archived` | Diarsipkan | closed |

Status bisa diubah admin, jadi **jangan pernah menuliskan id status secara langsung
di kode**. Cari lewat `name`.
