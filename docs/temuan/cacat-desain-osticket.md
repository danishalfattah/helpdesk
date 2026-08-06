---
tags: [temuan, osticket, arsitektur]
tanggal: 2026-08-06
---

# Cacat desain osTicket

Temuan dari perbandingan langsung antara `helpdesk-ostick` (hasil modifikasi tim) dan repo resmi `osticket/osticket` tag v1.18.4.

Ini bahan untuk bab **Latar Belakang** laporan — argumen "osTicket tidak maintainable" perlu bukti, bukan opini.

## Indikator arsitektur

| Indikator | Temuan |
|---|---|
| Dependency management | Tidak ada `composer.json` di root — vendor di-*vendor-in* manual ke `include/` |
| Data access | ORM buatan sendiri **+ 155 pemanggilan `db_query()` SQL mentah** berdampingan |
| Templating | Tanpa template engine — 72 file `include/staff/*.inc.php` mencampur logika PHP dan markup HTML |
| Test | Hanya 10 file di `setup/test/`, semuanya smoke-test instalasi. **Nol unit test untuk logika bisnis** |
| Frontend | jQuery + Redactor, tanpa build step, tanpa module bundler |

Ini arsitektur PHP era ~2010 yang terus di-maintain, bukan aplikasi modern.

## Empat cacat konkret yang ditemukan saat bekerja

### 1. Dynamic form untuk semua hal → butuh tabel cache

Subject tiket pun disimpan lewat `DynamicForm`. Daftar tiket jadi lambat, ditambal dengan cache `ost_ticket__cdata`. Ongkos terukur: pembuatan tiket melambat dari **0,4 detik jadi 12,8 detik** tanpa cache itu.

Ditangani di [ADR-003 Field tetap dan kustom](../adr/ADR-003-field-tetap-dan-kustom.md).

### 2. Dua sistem izin yang tumpang tindih

Permission dicek per-agent lewat kolom JSON `ost_staff.permissions`, **bukan** lewat Role — padahal Role juga ada. Akibatnya izin harus di-`UPDATE` manual untuk 36 agent, dan agent baru tidak otomatis dapat akses.

Ditangani di [ADR-005 RBAC lewat Role](../adr/ADR-005-rbac-role.md).

### 3. Sanitasi HTML hanya di jalur input

`Format::safe_html()` hanya jalan saat input (`getClean()`). Body yang ditulis langsung ke database — seperti ~152rb entry hasil migrasi — tidak pernah melewatinya, dan jalur tampilan tidak menyanitasi.

Akibat nyata: email dari Word/Outlook membawa blok `<style>` berisi `a:link { color:blue }` yang **tidak ter-scope** — begitu dirender, seluruh link di halaman tiket ikut berubah gaya. Ditambal tim ini lewat `stripDocumentSections()` di `class.thread.php`.

Pelajarannya: **sanitasi harus di jalur tampilan, bukan hanya jalur input** — karena data bisa masuk lewat pintu lain.

### 4. Lampiran 13,9 GB disimpan di dalam database

`ost_file_chunk` menyimpan biner lampiran di MySQL, sampai harus dipindah ke drive D: lewat `DATA DIRECTORY`. Sistem baru menyimpan lampiran di filesystem, database hanya metadata + path.

## Yang justru bagus dan layak diwarisi

Beberapa aturan bisnis osTicket (setelah ditambal tim ini) memang benar dan harus ikut pindah:

- Tiket closed tidak bisa dibalas tanpa reopen — **ditegakkan di service layer, bukan hanya UI**
- Assign tiket berstatus default → otomatis jadi Open
- Setiap perubahan status/assignee/dept menulis event audit

Catatan tim sendiri di `class.ticket.php` menjelaskan kenapa harus di server: *"UI only — enforce it here too so a direct POST can't reply to a ticket marked done."*

Terkait: [Fitur osTicket yang terpakai](fitur-osticket-terpakai.md)
