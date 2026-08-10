'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

// ── Tipe lokal ──────────────────────────────────────────────────────────────

type SwatchItem = { label: string; bg: string; fg?: string };

// ── Data token ──────────────────────────────────────────────────────────────

// 8 warna inti dari --color-* di globals.css
const warnaInti: SwatchItem[] = [
  { label: 'primary', bg: 'bg-primary', fg: 'text-primary-foreground' },
  { label: 'secondary', bg: 'bg-secondary', fg: 'text-secondary-foreground' },
  { label: 'muted', bg: 'bg-muted', fg: 'text-muted-foreground' },
  { label: 'accent', bg: 'bg-accent', fg: 'text-accent-foreground' },
  { label: 'destructive', bg: 'bg-destructive', fg: 'text-destructive-foreground' },
  { label: 'warning', bg: 'bg-warning', fg: 'text-warning-foreground' },
  { label: 'background', bg: 'bg-background', fg: 'text-foreground' },
  { label: 'border / input', bg: 'bg-border', fg: 'text-foreground' },
];

// 11 status tiket — disalin persis dari konfigurasi osTicket (lihat globals.css)
const statusList: { label: string; bg: string }[] = [
  { label: 'Baru', bg: 'bg-status-new' },
  { label: 'Terbuka', bg: 'bg-status-open' },
  { label: 'Saat Ini', bg: 'bg-status-current' },
  { label: 'Dalam Proses', bg: 'bg-status-progress' },
  { label: 'Tertunda', bg: 'bg-status-pending' },
  { label: 'Dibuka Ulang', bg: 'bg-status-reopened' },
  { label: 'Terselesaikan', bg: 'bg-status-resolved' },
  { label: 'Ditutup', bg: 'bg-status-closed' },
  { label: 'Mati', bg: 'bg-status-dead' },
  { label: 'Tidak Aktif', bg: 'bg-status-dormant' },
  { label: 'Diarsipkan', bg: 'bg-status-archived' },
];

// 4 lencana severity — dari Format::severityBadge() osTicket
const severityList: { label: string; bg: string; fg: string }[] = [
  { label: 'Rendah', bg: 'bg-severity-low-bg', fg: 'text-severity-low-fg' },
  { label: 'Sedang', bg: 'bg-severity-medium-bg', fg: 'text-severity-medium-fg' },
  { label: 'Tinggi', bg: 'bg-severity-high-bg', fg: 'text-severity-high-fg' },
  { label: 'Kritis', bg: 'bg-severity-critical-bg', fg: 'text-severity-critical-fg' },
];

// Skala tipografi
const tipografiList: { label: string; kelas: string; contoh: string }[] = [
  { label: 'text-xs', kelas: 'text-xs', contoh: 'Teks ekstra kecil — label tabel, badge' },
  { label: 'text-sm', kelas: 'text-sm', contoh: 'Teks kecil — body form, deskripsi' },
  { label: 'text-base', kelas: 'text-base', contoh: 'Teks dasar — konten utama' },
  { label: 'text-lg', kelas: 'text-lg', contoh: 'Teks besar — sub-judul seksi' },
  { label: 'text-xl', kelas: 'text-xl', contoh: 'Teks XL — judul kartu, panel' },
  { label: 'text-2xl', kelas: 'text-2xl font-semibold', contoh: 'Judul halaman' },
  { label: 'text-3xl', kelas: 'text-3xl font-bold', contoh: 'Judul utama' },
];

// ── Komponen pembantu ────────────────────────────────────────────────────────

function Seksi({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold border-b border-border pb-2">{judul}</h2>
      {children}
    </section>
  );
}

function SwatchWarna({ label, bg, fg }: SwatchItem) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`${bg} ${fg ?? 'text-foreground'} h-16 rounded-md flex items-center justify-center text-sm font-medium border border-border`}
      >
        Aa
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

// ── Halaman utama ────────────────────────────────────────────────────────────

export default function HalamanDesignSystem() {
  const [modusGelap, setModusGelap] = useState(false);

  return (
    // Menerapkan class `dark` ke container supaya bisa toggle per-halaman
    <div className={modusGelap ? 'dark' : ''}>
      <div className="bg-background text-foreground min-h-screen">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Design System</h1>
            <p className="text-sm text-muted-foreground">
              Token warna &amp; tipografi Socfindo Helpdesk — sumber kebenaran tunggal
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModusGelap((p) => !p)}
            aria-label={modusGelap ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {modusGelap ? (
              <Sun className="size-4 mr-2" />
            ) : (
              <Moon className="size-4 mr-2" />
            )}
            {modusGelap ? 'Mode Terang' : 'Mode Gelap'}
          </Button>
        </header>

        {/* ── Konten ─────────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">

          {/* 1. Warna inti */}
          <Seksi judul="Warna Inti (8 token)">
            <p className="text-sm text-muted-foreground">
              Hijau <code className="font-mono">#116936</code> dan Kuning{' '}
              <code className="font-mono">#fecf08</code> dari logo resmi Socfindo.
              Gunakan token, bukan nilai hex langsung.
            </p>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
              {warnaInti.map((w) => (
                <SwatchWarna key={w.label} {...w} />
              ))}
            </div>
          </Seksi>

          {/* 2. Lencana status */}
          <Seksi judul="Lencana Status Tiket (11 status)">
            <p className="text-sm text-muted-foreground">
              Disalin persis dari konfigurasi queue osTicket. Agen sudah mengenali
              warna-warna ini — mengubahnya berarti memaksa 36 orang belajar ulang.
            </p>
            <div className="flex flex-wrap gap-2">
              {statusList.map((s) => (
                <span
                  key={s.label}
                  className={`${s.bg} text-status-foreground text-sm font-medium px-3 py-1 rounded-full`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </Seksi>

          {/* 3. Lencana severity */}
          <Seksi judul="Lencana Severity (4 tingkat)">
            <p className="text-sm text-muted-foreground">
              Dari <code className="font-mono">Format::severityBadge()</code> osTicket.
              Pasangan latar/teks sudah diperiksa kontrasnya.
            </p>
            <div className="flex flex-wrap gap-2">
              {severityList.map((s) => (
                <Badge
                  key={s.label}
                  className={`${s.bg} ${s.fg} border-0 text-sm font-medium`}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </Seksi>

          {/* 4. Skala tipografi */}
          <Seksi judul="Skala Tipografi">
            <p className="text-sm text-muted-foreground">
              Pakai class Tailwind standar. Font heading dan sans mengikuti variabel
              <code className="font-mono"> --font-sans</code>.
            </p>
            <div className="space-y-3 border border-border rounded-lg p-6">
              {tipografiList.map((t) => (
                <div key={t.label} className="flex items-baseline gap-4">
                  <code className="text-xs text-muted-foreground w-28 shrink-0 font-mono">
                    {t.label}
                  </code>
                  <span className={t.kelas}>{t.contoh}</span>
                </div>
              ))}
            </div>
          </Seksi>

          {/* 5. Token overdue */}
          <Seksi judul="Penanda Overdue">
            <p className="text-sm text-muted-foreground">
              Merah dari <code className="font-mono">OverdueTextDecoration</code>{' '}
              osTicket. Dipakai di tabel tiket untuk baris yang melewati SLA.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-overdue font-semibold text-sm">
                #2024-0042 — Printer Lantai 3 Tidak Bisa Print
              </span>
              <Badge className="bg-destructive text-destructive-foreground border-0 text-xs">
                Terlambat
              </Badge>
            </div>
          </Seksi>

          {/* 6. Komponen UI */}
          <Seksi judul="Komponen shadcn/ui">
            <p className="text-sm text-muted-foreground">
              Komponen dasar yang tersedia. Tambahkan via{' '}
              <code className="font-mono">
                pnpm --filter @helpdesk/web exec shadcn@latest add ...
              </code>
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button>Tombol Utama</Button>
              <Button variant="secondary">Sekunder</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Hapus</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="sm">Kecil</Button>
              <Button disabled>Nonaktif</Button>
            </div>
          </Seksi>

        </main>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          Halaman ini memakai token yang sama dengan halaman lain — tidak bisa basi.
          Screenshot untuk bab perancangan antarmuka laporan.
        </footer>
      </div>
    </div>
  );
}
