---
tags: [adr, keamanan]
tanggal: 2026-08-06
status: diterima
---

# ADR-005 — RBAC murni lewat Role

## Konteks

osTicket punya **dua sistem izin yang tumpang tindih**, dan tim ini menabraknya sendiri saat membangun modul Asset. Dari `db/README.md` repo osTicket:

> **Permission per-agent, bukan per-Role**: berbeda dari asumsi awal desain, `asset.view`/`asset.manage` dicek lewat `Staff::hasPerm($perm)` dengan `$global=true` — ini membaca kolom `ost_staff.permissions`, **BUKAN** lewat Role/department.

Akibat nyatanya: izin harus di-`UPDATE` ke kolom JSON untuk 36 agent satu per satu, dan **agent baru tidak otomatis dapat akses** — harus dicentang manual.

Itu bukan kesalahan tim, melainkan cacat desain osTicket. Lihat [Cacat desain osTicket](../temuan/cacat-desain-osticket.md).

## Keputusan

Satu model saja:

```
Agent ──< AgentRole >── Role ──< RolePermission >── Permission
  └──< AgentDepartment >── Department
```

**Izin ditentukan hanya lewat Role. Department menentukan cakupan data, bukan kemampuan.**

Dua pertanyaan berbeda, dua mekanisme berbeda, tanpa tumpang tindih:

| Pertanyaan | Dijawab oleh | Bentuk di kode |
|---|---|---|
| Boleh tidak melakukan aksi ini? | Guard | `@RequirePermission('ticket.edit')` |
| Boleh tidak menyentuh baris ini? | Service | filter `departmentId` disuntik ke query |

## Autentikasi

Sesi berbasis cookie `httpOnly`, bukan JWT di localStorage. Alasannya: aplikasi internal tanpa klien mobile, dan sesi harus bisa dicabut seketika saat agent resign — JWT tidak bisa. Cookie `httpOnly` juga kebal pencurian token lewat XSS.

Sesi disimpan di tabel `Session` di SQL Server — konsisten dengan [ADR-004 Tanpa cache](ADR-004-tanpa-cache.md), 36 pengguna tidak butuh Redis untuk sesi.

Password pakai **argon2id**. Kebijakan keamanan diwarisi dari config osTicket, bukan dikarang baru:

| Setting osTicket | Nilai | Diterapkan sebagai |
|---|---|---|
| `staff_max_logins` | 4 | 4 kali gagal → terkunci |
| `staff_login_timeout` | 2 | terkunci 2 menit |
| `staff_session_timeout` | 30 | sesi mati setelah 30 menit idle |

## Konsekuensi

Lebih bersih, tapi sedikit kurang lentur: agent yang butuh akses khusus harus dimasukkan ke Role yang sesuai, tidak bisa diberi tambalan izin pribadi. Ini disengaja — kelenturan itulah yang bikin osTicket sulit diaudit.
