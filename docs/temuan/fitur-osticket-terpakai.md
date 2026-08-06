---
tags: [temuan, osticket, scope]
tanggal: 2026-08-06
---

# Fitur osTicket yang terpakai

Inventaris berdasarkan file seed SQL dan `ost_config` di instalasi Socfindo — bukan berdasarkan daftar fitur osTicket di dokumentasi resminya.

## Hidup — ada data nyata

| Fitur | Bukti |
|---|---|
| Ticketing inti + thread | 56.894 tiket, 279.395 pesan |
| Department bertingkat | 52 (8 induk + 44 anak) |
| Kategori 3 tingkat | 1.056 help topic + scoping per-dept |
| Saved queue / view tersimpan | 232 queue, 189 config kolom, 73 sort |
| Status kustom | 12 (New, WIP, Pending, Re-Opened, Dormant, Dead, dll) |
| Custom field | 6 (Call Type, Closure Type, Location, Urgency, Risk, Solution) |
| Knowledge Base | 11 artikel, `enable_kb=1` |
| Email masuk → tiket | `enable_mail_polling=1` |
| Collaborator (CC) | `add_email_collabs=1` |
| SLA + overdue | 1 SLA plan, alert overdue aktif |
| Role & permission | 4 role |
| Asset Management | 3.004 aset (modul buatan tim ini, bukan bawaan osTicket) |

## Mati — nol data seed

Teams · Canned Responses · Email Filters · Plugins · API Key · Tasks · Organizations · CAPTCHA · Client bisa update tiket (`allow_client_updates=0`)

**Hampir separuh permukaan osTicket tidak terpakai.** Helpdesk baru tidak perlu menyamai osTicket — cukup daftar "hidup" di atas. Ini pemotong scope yang sah dan bisa dipertahankan di sidang.

## Temuan penting: 232 queue itu bukan query builder

Semua 232 queue punya `staff_id = 0` — **tidak ada satu pun queue buatan agent.** Semuanya view sistem berhierarki dengan kriteria yang sangat sederhana:

```
status__id includes [...]
isanswered set / nset
isoverdue set
assignee includes Me
```

Plus pewarnaan baris per status.

**Konsekuensinya:** tidak perlu membangun ulang query-builder osTicket (`class.search.php` + `class.queue.php`) — subsistem paling rumit di seluruh osTicket. Cukup *saved view* berhierarki dengan segelintir predikat tertutup, disimpan sebagai `NVARCHAR` dan di-parse skema Zod.

Selisihnya beberapa minggu kerja.

Terkait: [ADR-002 SQL Server](../adr/ADR-002-sql-server.md)
