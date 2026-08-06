Closes #

<!-- Isi baris ini HANYA kalau yang mengerjakan bukan assignee issue-nya sendiri,
     misalnya membantu pekerjaan teman. Kosongkan/hapus kalau assignee dan
     pengerja sama. Jangan mengubah identitas commit untuk berpura-pura jadi
     assignee — lihat CLAUDE.md bagian "Sebelum mulai mengerjakan apa pun". -->
Dikerjakan oleh: <!-- nama --> · membantu issue milik: <!-- nama assignee -->

## Apa yang berubah

<!-- Satu-dua kalimat. Apa yang sekarang bisa dilakukan yang sebelumnya tidak? -->

## Kenapa begini

<!-- Kalau ada keputusan yang tidak terlihat jelas dari kode, jelaskan di sini.
     Kalau memilih satu pendekatan padahal ada alternatif, sebutkan alternatifnya
     dan kenapa tidak dipakai. Reviewer tidak bisa membaca pikiran. -->

## Cara mengujinya

<!-- Langkah konkret supaya reviewer bisa membuktikan sendiri, bukan sekadar percaya.
     Contoh:
     1. pnpm --filter @helpdesk/api dev
     2. Buka http://localhost:3000/login
     3. Login dengan password salah 4x → muncul "Akun terkunci sementara" -->

## Definisi selesai

- [ ] `pnpm -r test` lulus
- [ ] `pnpm -r typecheck` bersih
- [ ] Perilaku baru punya test yang benar-benar menguji perilaku itu
- [ ] Sudah dicoba manual di browser (kalau menyentuh UI)
- [ ] Komentar menjelaskan **kenapa**, bukan **apa**

## Kalau menyentuh `packages/contract/`

- [ ] Sudah disepakati kedua kelompok
- [ ] Di-review 1 orang dari tiap kelompok
- [ ] Tidak ada field yang dihapus atau berubah tipe tanpa kesepakatan
