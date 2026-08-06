# Setup di Mesin Sendiri

Dijalankan **oleh tiap orang di laptop masing-masing**, bukan sekali untuk semua.
Database, `.env`, dan instance SQL Server bersifat lokal — tidak ikut git.

Perkiraan waktu: 20–30 menit, sebagian besar menunggu unduhan.

---

## 1. Prasyarat

| Yang dibutuhkan | Versi | Cara cek |
|---|---|---|
| Node.js | 24.x | `node -v` |
| pnpm | 11.x | `pnpm -v` |
| SQL Server | **2017 ke atas** | lihat langkah 3 |
| Git | apa saja | `git --version` |

Kalau Node belum ada, unduh **LTS 24** dari [nodejs.org](https://nodejs.org).
Lalu pasang pnpm:

```bash
npm install -g pnpm@11.20.0
```

**SQL Server**: pakai **Developer Edition** atau **Express Edition** — dua-duanya
gratis, unduh dari
[microsoft.com/sql-server/sql-server-downloads](https://www.microsoft.com/sql-server/sql-server-downloads).
Express cukup untuk pengembangan (batas 10 GB per database, jauh di atas kebutuhan
kita).

Saat instalasi, pilih **Mixed Mode Authentication** kalau ditawarkan — itu menghemat
langkah 3b.

---

## 2. Ambil kode dan pasang dependensi

```bash
git clone https://github.com/danishalfattah/helpdesk.git
cd helpdesk
pnpm install
```

---

## 3. Siapkan SQL Server

⚠️ **Semua perintah di bagian ini butuh PowerShell sebagai Administrator.**

### 3a. Cari nama instance kalian

```powershell
Get-Service | Where-Object { $_.Name -like 'MSSQL*' } | Select-Object Name, Status
```

Hasilnya menentukan dua hal yang dipakai di langkah berikutnya:

| Nama service | Nama instance | Kode versi di registry |
|---|---|---|
| `MSSQLSERVER` | default (kosong) | lihat 3b |
| `MSSQL$SQLEXPRESS` | `SQLEXPRESS` | lihat 3b |

Cek juga versinya:

```powershell
& sqlcmd -S "localhost\SQLEXPRESS" -E -Q "SELECT SERVERPROPERTY('ProductVersion'), SERVERPROPERTY('Edition');" -h -1 -W
```

Angka depan harus **14 atau lebih** (14 = 2017, 15 = 2019, 16 = 2022, 17 = 2025).
Kalau di bawah itu, Prisma tidak akan jalan — pasang versi yang lebih baru.

### 3b. Aktifkan TCP/IP dan Mixed Mode

**Ini langkah yang paling sering bikin orang mentok.** SQL Server bawaannya mematikan
TCP/IP. `sqlcmd` tetap jalan karena memakai Shared Memory, tapi **Prisma butuh TCP** —
dan errornya cuma "Can't reach database server" tanpa petunjuk apa pun.

Ganti `MSSQL16.SQLEXPRESS` sesuai versi dan instance kalian
(`MSSQL15.*` untuk 2019, `MSSQL16.*` untuk 2022, `MSSQL17.*` untuk 2025):

```powershell
$inst = "MSSQL16.SQLEXPRESS"
$base = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$inst\MSSQLServer"

# Aktifkan TCP/IP, kunci ke port 1433
Set-ItemProperty -Path "$base\SuperSocketNetLib\Tcp" -Name Enabled -Value 1
Set-ItemProperty -Path "$base\SuperSocketNetLib\Tcp\IPAll" -Name TcpPort -Value "1433"
Set-ItemProperty -Path "$base\SuperSocketNetLib\Tcp\IPAll" -Name TcpDynamicPorts -Value ""

# Aktifkan Mixed Mode (2 = Windows + SQL login; 1 = Windows saja)
Set-ItemProperty -Path $base -Name LoginMode -Value 2

# Restart supaya berlaku
Restart-Service -Name "MSSQL`$SQLEXPRESS" -Force
```

Buktikan port 1433 benar-benar mendengarkan:

```powershell
Get-NetTCPConnection -LocalPort 1433 -State Listen
```

Harus ada minimal satu baris. Kalau kosong, TCP/IP belum aktif — ulangi dan pastikan
PowerShell dijalankan sebagai Administrator.

### 3c. Buat database dan login

Ganti `PasswordAnda!2026` dengan password kalian sendiri, lalu **catat**.

```powershell
& sqlcmd -S "localhost\SQLEXPRESS" -E -Q "
IF DB_ID('helpdesk_dev') IS NULL CREATE DATABASE helpdesk_dev;
IF SUSER_ID('helpdesk_app') IS NULL
  CREATE LOGIN helpdesk_app WITH PASSWORD = 'PasswordAnda!2026', CHECK_POLICY = OFF;
"
& sqlcmd -S "localhost\SQLEXPRESS" -E -d helpdesk_dev -Q "
IF USER_ID('helpdesk_app') IS NULL CREATE USER helpdesk_app FOR LOGIN helpdesk_app;
ALTER ROLE db_owner ADD MEMBER helpdesk_app;
"
```

`db_owner` diperlukan karena Prisma Migrate membuat dan mengubah tabel.

### 3d. Buktikan koneksi lewat TCP

Ini pembuktian sesungguhnya — `localhost,1433` memaksa lewat TCP, bukan Shared Memory:

```powershell
& sqlcmd -S "localhost,1433" -U helpdesk_app -P "PasswordAnda!2026" -d helpdesk_dev -Q "SELECT DB_NAME();" -h -1 -W
```

Harapan: `helpdesk_dev`

Kalau gagal **"Login failed"** → Mixed Mode belum aktif, ulangi 3b.
Kalau gagal **"could not open a connection"** → TCP/IP belum aktif, ulangi 3b.

---

## 4. Buat berkas `.env`

Salin dari contoh, lalu isi password kalian sendiri:

```bash
cp .env.example .env
```

Isinya:

```
DATABASE_URL="sqlserver://localhost:1433;database=helpdesk_dev;user=helpdesk_app;password=PasswordAnda!2026;encrypt=true;trustServerCertificate=true"
API_PORT=3001
WEB_PORT=3000
WEB_ORIGIN="http://localhost:3000"
```

⚠️ **`.env` tidak boleh di-commit.** Sudah masuk `.gitignore` — jangan dipaksa masuk
dengan `git add -f`. Isinya password, dan password tiap orang berbeda.

---

## 5. Siapkan database

```bash
pnpm --filter @helpdesk/api exec prisma migrate dev
pnpm --filter @helpdesk/api exec tsx prisma/seed.ts
```

Harapan: `Seed selesai. Login: admin@socfindo.co.id / admin12345`

---

## 6. Jalankan

Dua terminal terpisah:

```bash
pnpm --filter @helpdesk/api dev
```

```bash
pnpm --filter @helpdesk/web dev
```

Buka `http://localhost:3000/login`, masuk dengan `admin@socfindo.co.id` /
`admin12345`.

---

## 7. Pastikan semuanya sehat

```bash
pnpm -r test
pnpm -r typecheck
```

Keduanya harus lulus **sebelum** kalian mulai mengerjakan issue. Kalau ada yang merah
di mesin kalian padahal hijau di orang lain, itu masalah setup — selesaikan dulu,
jangan dikerjakan sambil jalan.

---

## Masalah yang sering muncul

| Gejala | Sebab | Perbaikan |
|---|---|---|
| `Can't reach database server` | TCP/IP nonaktif | Ulangi 3b, cek `Get-NetTCPConnection -LocalPort 1433` |
| `Login failed for user 'helpdesk_app'` | Mixed Mode nonaktif | Ulangi 3b, pastikan `LoginMode = 2` lalu restart service |
| `Cannot find module 'reflect-metadata'` | `.npmrc` tidak terbaca | Pastikan ada `node-linker=hoisted`, lalu `pnpm install` ulang |
| Semua test NestJS gagal dengan error DI | Vitest tanpa `unplugin-swc` | Jangan ubah `apps/api/vitest.config.ts` |
| `Environment variable not found: DATABASE_URL` | `.env` belum dibuat | Ulangi langkah 4 |
| Registry SQL Server tidak ketemu | Nama instance salah | Ulangi 3a, sesuaikan `MSSQL16.SQLEXPRESS` |

Kalau mentok lebih dari 30 menit, **jangan diam** — tulis di grup atau buka issue
dengan label `blocked`. Dalam project sebulan, satu hari terbuang itu 5% dari seluruh
waktu.
