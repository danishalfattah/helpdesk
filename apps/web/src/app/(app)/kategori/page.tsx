'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Tags,
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import {
  type CategoryResponse,
  CreateCategoryRequest,
  type CreateCategoryRequest as CreateReq,
  UpdateCategoryRequest,
  type UpdateCategoryRequest as UpdateReq,
  type DepartmentDto,
} from '@helpdesk/contract';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// ── Tipe bantu ───────────────────────────────────────────────────────────────

interface CatNode extends CategoryResponse {
  children: CatNode[];
}

type Level = 1 | 2 | 3;

// ── Fungsi bantu ─────────────────────────────────────────────────────────────

/** Susun daftar flat menjadi pohon sampai 3 tingkat. */
function susunPohon(flat: CategoryResponse[]): CatNode[] {
  function anakDari(parentId: number | null): CatNode[] {
    return flat.filter((c) => c.parentId === parentId).map((c) => ({ ...c, children: anakDari(c.id) }));
  }
  return anakDari(null);
}

/**
 * Ratakan pohon jadi daftar {kategori, level} buat opsi induk di form.
 * Kategori tingkat 3 sengaja tidak disertakan -- memilihnya sebagai induk
 * akan membuat hierarki lebih dari 3 tingkat, dan server menolaknya juga
 * (lihat CategoryService.pastikanBolehJadiInduk). Ditolak di sini dulu
 * supaya pengguna tidak perlu submit buat tahu itu tidak valid.
 */
function opsiInduk(nodes: CatNode[], level: Level = 1): { kat: CategoryResponse; level: Level }[] {
  if (level === 3) return [];
  return nodes.flatMap((n) => [
    { kat: n as CategoryResponse, level },
    ...opsiInduk(n.children, (level + 1) as Level),
  ]);
}

// ── Form tambah/ubah (dialog) ──────────────────────────────────────────────

function FormKategori({
  schema,
  defaultValues,
  indukOptions,
  departments,
  sedangProses,
  errorGlobal,
  labelSubmit,
  onSubmit,
}: {
  schema: typeof CreateCategoryRequest | typeof UpdateCategoryRequest;
  defaultValues: CreateReq | UpdateReq;
  indukOptions: { kat: CategoryResponse; level: Level }[];
  departments: DepartmentDto[];
  sedangProses: boolean;
  errorGlobal: string;
  labelSubmit: string;
  onSubmit: (data: CreateReq | UpdateReq) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReq | UpdateReq>({ resolver: zodResolver(schema), defaultValues });

  const departmentIds = watch('departmentIds') ?? [];

  function toggleDept(id: number) {
    const next = departmentIds.includes(id) ? departmentIds.filter((d) => d !== id) : [...departmentIds, id];
    setValue('departmentIds', next, { shouldDirty: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cat-name">Nama Kategori</Label>
        <Input id="cat-name" {...register('name')} placeholder="Mis. Jaringan" />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="cat-parent">Kategori Induk (opsional)</Label>
        <select
          id="cat-parent"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('parentId', {
            // Field yang tidak pernah disentuh user dapat nilai mentah dari
            // defaultValues (null), bukan string DOM (''). `null === ''` itu
            // false, jadi tanpa cek `v == null` di sini akan jatuh ke
            // `Number(null)` yang hasilnya 0 -- bukan null -- dan salah
            // dikira "induk id 0" oleh server.
            setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
          })}
        >
          <option value="">— Tanpa induk (tingkat 1) —</option>
          {indukOptions.map(({ kat, level }) => (
            <option key={kat.id} value={kat.id}>
              {'— '.repeat(level - 1)}
              {kat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Berlaku untuk Department</Label>
        <p className="text-xs text-muted-foreground">Kosongkan semua supaya berlaku di semua department.</p>
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-input p-2">
          {departments.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">Belum ada department.</p>
          )}
          {departments.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <Checkbox checked={departmentIds.includes(d.id)} onCheckedChange={() => toggleDept(d.id)} />
              {d.name}
            </label>
          ))}
        </div>
      </div>

      {errorGlobal && (
        <p role="alert" className="text-sm text-destructive">
          {errorGlobal}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={sedangProses}>
          {sedangProses && <Loader2 className="mr-2 size-4 animate-spin" />}
          {labelSubmit}
        </Button>
      </div>
    </form>
  );
}

// ── Baris kategori (rekursif, sampai 3 tingkat) ────────────────────────────

function BarisKategori({
  kat,
  level,
  departmentMap,
  onUbah,
  onHapus,
  onToggle,
}: {
  kat: CatNode;
  level: Level;
  departmentMap: Map<number, string>;
  onUbah: (k: CategoryResponse) => void;
  onHapus: (k: CategoryResponse) => void;
  onToggle: (k: CategoryResponse) => void;
}) {
  const [terbuka, setTerbuka] = useState(true);
  const punyaAnak = kat.children.length > 0;

  const labelDepartment =
    kat.departmentIds.length === 0
      ? 'Semua Department'
      : kat.departmentIds.length === 1
        ? (departmentMap.get(kat.departmentIds[0]!) ?? '1 department')
        : `${kat.departmentIds.length} department`;

  return (
    <div>
      <div
        className={['flex items-center gap-2 px-4 py-3 transition-colors hover:bg-accent/50', !kat.isActive && 'opacity-50']
          .filter(Boolean)
          .join(' ')}
        style={{ paddingLeft: `${1 + (level - 1) * 1.5}rem` }}
      >
        {punyaAnak ? (
          <button
            type="button"
            onClick={() => setTerbuka((t) => !t)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={terbuka ? 'Tutup' : 'Buka'}
          >
            {terbuka ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        <Tags className={['size-4 shrink-0', level === 1 ? 'text-primary' : 'text-muted-foreground'].join(' ')} />

        <span className={['flex-1 text-sm', level === 1 && 'font-medium'].filter(Boolean).join(' ')}>{kat.name}</span>

        <Badge variant="outline" className="hidden shrink-0 text-xs sm:inline-flex">
          {labelDepartment}
        </Badge>

        <Badge variant={kat.isActive ? 'secondary' : 'outline'} className="shrink-0 text-xs">
          {kat.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(kat)}
            title={kat.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            className="size-8 p-0"
          >
            {kat.isActive ? (
              <ToggleRight className="size-4 text-primary" />
            ) : (
              <ToggleLeft className="size-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUbah(kat)} title="Ubah" className="size-8 p-0">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHapus(kat)}
            title={punyaAnak ? 'Punya anak, hapus anaknya dulu' : 'Hapus'}
            disabled={punyaAnak}
            className="size-8 p-0 text-destructive hover:text-destructive disabled:text-muted-foreground"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {punyaAnak && terbuka && (
        <div className="divide-y divide-border border-t border-border">
          {kat.children.map((anak) => (
            <BarisKategori
              key={anak.id}
              kat={anak}
              level={(level + 1) as Level}
              departmentMap={departmentMap}
              onUbah={onUbah}
              onHapus={onHapus}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Halaman utama ───────────────────────────────────────────────────────────

export default function HalamanKategori() {
  const [pohon, setPohon] = useState<CatNode[]>([]);
  const [semua, setSemua] = useState<CategoryResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [dialogTambah, setDialogTambah] = useState(false);
  const [dialogUbah, setDialogUbah] = useState<CategoryResponse | null>(null);
  const [sedangProses, setSedangProses] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  async function muat() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const [kategoriRes, deptRes] = await Promise.all([
        apiFetch<CategoryResponse[]>('/categories'),
        apiFetch<{ departments: DepartmentDto[] }>('/departments'),
      ]);
      setSemua(kategoriRes);
      setPohon(susunPohon(kategoriRes));
      setDepartments(deptRes.departments.filter((d) => d.isActive));
    } catch {
      setErrorMuat('Gagal memuat daftar kategori. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    void muat();
  }, []);

  async function handleTambah(data: CreateReq | UpdateReq) {
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
      setDialogTambah(false);
      await muat();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSedangProses(false);
    }
  }

  async function handleUbah(data: CreateReq | UpdateReq) {
    if (!dialogUbah) return;
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch(`/categories/${dialogUbah.id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setDialogUbah(null);
      await muat();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSedangProses(false);
    }
  }

  async function handleToggleAktif(kat: CategoryResponse) {
    try {
      await apiFetch(`/categories/${kat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !kat.isActive }),
      });
      await muat();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal mengubah status.');
    }
  }

  async function handleHapus(kat: CategoryResponse) {
    if (!confirm(`Hapus kategori "${kat.name}"?`)) return;
    try {
      await apiFetch(`/categories/${kat.id}`, { method: 'DELETE' });
      await muat();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal menghapus kategori.');
    }
  }

  const departmentMap = new Map(departments.map((d) => [d.id, d.name] as const));
  const pilihanIndukTambah = opsiInduk(pohon);
  const pilihanIndukUbah = dialogUbah
    ? opsiInduk(pohon).filter(({ kat }) => kat.id !== dialogUbah.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Tags className="size-6" />
            Kategori
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola hierarki kategori (maks. 3 tingkat) dan department yang berlaku
          </p>
        </div>
        <Button
          onClick={() => {
            setErrorForm('');
            setDialogTambah(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Tambah Kategori
        </Button>
      </div>

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Memuat…
        </div>
      ) : errorMuat ? (
        <div className="space-y-2 py-12 text-center text-destructive">
          <p>{errorMuat}</p>
          <Button variant="outline" onClick={muat}>
            Coba Lagi
          </Button>
        </div>
      ) : pohon.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          Belum ada kategori. Tambahkan kategori pertama.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {pohon.map((induk) => (
            <BarisKategori
              key={induk.id}
              kat={induk}
              level={1}
              departmentMap={departmentMap}
              onUbah={(k) => {
                setErrorForm('');
                setDialogUbah(k);
              }}
              onHapus={handleHapus}
              onToggle={handleToggleAktif}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogTambah} onOpenChange={setDialogTambah}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>Buat kategori baru, opsional taruh di bawah kategori lain.</DialogDescription>
          </DialogHeader>
          <FormKategori
            schema={CreateCategoryRequest}
            defaultValues={{ name: '', parentId: null, departmentIds: [] }}
            indukOptions={pilihanIndukTambah}
            departments={departments}
            sedangProses={sedangProses}
            errorGlobal={errorForm}
            labelSubmit="Tambah"
            onSubmit={handleTambah}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogUbah} onOpenChange={(o) => !o && setDialogUbah(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Kategori</DialogTitle>
            <DialogDescription>Ubah nama, induk, atau department yang berlaku.</DialogDescription>
          </DialogHeader>
          {dialogUbah && (
            <FormKategori
              schema={UpdateCategoryRequest}
              defaultValues={{
                name: dialogUbah.name,
                parentId: dialogUbah.parentId,
                departmentIds: dialogUbah.departmentIds,
              }}
              indukOptions={pilihanIndukUbah}
              departments={departments}
              sedangProses={sedangProses}
              errorGlobal={errorForm}
              labelSubmit="Simpan"
              onSubmit={handleUbah}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
