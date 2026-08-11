'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import {
  type DepartmentDto,
  CreateDepartmentRequest,
  type CreateDepartmentRequest as CreateReq,
  UpdateDepartmentRequest,
  type UpdateDepartmentRequest as UpdateReq,
} from '@helpdesk/contract';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ── Tipe bantu ───────────────────────────────────────────────────────────────

interface DeptNode extends DepartmentDto {
  children: DepartmentDto[];
}

// ── Fungsi bantu ─────────────────────────────────────────────────────────────

/** Susun daftar flat menjadi pohon 2 tingkat. */
function susunPohon(depts: DepartmentDto[]): DeptNode[] {
  const induk = depts.filter((d) => d.parentId === null);
  return induk.map((p) => ({
    ...p,
    children: depts.filter((d) => d.parentId === p.id),
  }));
}

// ── Komponen form tambah/ubah ─────────────────────────────────────────────────

function FormDepartment({
  schema,
  defaultValues,
  indukOptions,
  sedangProses,
  errorGlobal,
  labelSubmit,
  onSubmit,
  onBatal,
}: {
  schema: typeof CreateDepartmentRequest | typeof UpdateDepartmentRequest;
  defaultValues: CreateReq | UpdateReq;
  indukOptions: DepartmentDto[];
  sedangProses: boolean;
  errorGlobal: string;
  labelSubmit: string;
  onSubmit: (data: CreateReq | UpdateReq) => void;
  onBatal: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReq | UpdateReq>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const parentId = watch('parentId') ?? null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Nama */}
      <div className="space-y-1">
        <Label htmlFor="dept-name">Nama Department</Label>
        <Input id="dept-name" {...register('name')} placeholder="Mis. Teknologi Informasi" />
        {errors.name && (
          <p role="alert" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Induk (opsional) */}
      <div className="space-y-1">
        <Label htmlFor="dept-parent">Department Induk (opsional)</Label>
        <Select
          value={parentId == null ? 'none' : String(parentId)}
          onValueChange={(v) => setValue('parentId', v === 'none' ? null : Number(v), { shouldDirty: true })}
        >
          <SelectTrigger id="dept-parent" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Tanpa induk (department utama) —</SelectItem>
            {indukOptions.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error global */}
      {errorGlobal && (
        <p role="alert" className="text-destructive text-sm">
          {errorGlobal}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onBatal} disabled={sedangProses}>
          Batal
        </Button>
        <Button type="submit" disabled={sedangProses}>
          {sedangProses && <Loader2 className="size-4 mr-2 animate-spin" />}
          {labelSubmit}
        </Button>
      </div>
    </form>
  );
}

// ── Halaman utama ─────────────────────────────────────────────────────────────

export default function HalamanDepartemen() {
  const [pohon, setPohon] = useState<DeptNode[]>([]);
  const [semua, setSemua] = useState<DepartmentDto[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  // Dialog state
  const [dialogTambah, setDialogTambah] = useState(false);
  const [dialogUbah, setDialogUbah] = useState<DepartmentDto | null>(null);
  const [dialogHapus, setDialogHapus] = useState<DepartmentDto | null>(null);
  const [sedangProses, setSedangProses] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [errorAksi, setErrorAksi] = useState('');

  // ── Muat data ──────────────────────────────────────────────────────────────

  async function muat() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const res = await apiFetch<{ departments: DepartmentDto[] }>('/departments');
      setSemua(res.departments);
      setPohon(susunPohon(res.departments));
    } catch {
      setErrorMuat('Gagal memuat daftar department. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => { void muat(); }, []);

  // ── Tambah ─────────────────────────────────────────────────────────────────

  async function handleTambah(data: CreateReq | UpdateReq) {
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setDialogTambah(false);
      await muat();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSedangProses(false);
    }
  }

  // ── Ubah ───────────────────────────────────────────────────────────────────

  async function handleUbah(data: CreateReq | UpdateReq) {
    if (!dialogUbah) return;
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch(`/departments/${dialogUbah.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setDialogUbah(null);
      await muat();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSedangProses(false);
    }
  }

  // ── Toggle aktif/nonaktif ──────────────────────────────────────────────────

  async function handleToggleAktif(dept: DepartmentDto) {
    setErrorAksi('');
    try {
      await apiFetch(`/departments/${dept.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !dept.isActive }),
      });
      await muat();
    } catch (e) {
      setErrorAksi(e instanceof ApiError ? e.message : 'Gagal mengubah status.');
    }
  }

  // ── Hapus ──────────────────────────────────────────────────────────────────

  async function handleHapus() {
    if (!dialogHapus) return;
    setErrorAksi('');
    try {
      await apiFetch(`/departments/${dialogHapus.id}`, { method: 'DELETE' });
      setDialogHapus(null);
      await muat();
    } catch (e) {
      setErrorAksi(e instanceof ApiError ? e.message : 'Gagal menghapus department.');
    }
  }

  // ── Induk yang boleh dipilih ───────────────────────────────────────────────

  // Hanya department tanpa induk (tingkat 1) yang boleh jadi induk baru
  const pilihanInduk = semua.filter((d) => d.parentId === null);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="size-6" />
            Departemen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola hierarki department (maks. 2 tingkat)
          </p>
        </div>
        <Button onClick={() => { setErrorForm(''); setDialogTambah(true); }}>
          <Plus className="size-4 mr-2" />
          Tambah Department
        </Button>
      </div>

      {errorAksi && (
        <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorAksi}
        </p>
      )}

      {/* Isi */}
      {memuat ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="size-5 animate-spin" />
          Memuat…
        </div>
      ) : errorMuat ? (
        <div className="text-destructive py-12 text-center space-y-2">
          <p>{errorMuat}</p>
          <Button variant="outline" onClick={muat}>Coba Lagi</Button>
        </div>
      ) : pohon.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center border border-dashed rounded-lg">
          Belum ada department. Tambahkan department pertama.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {pohon.map((induk) => (
            <div key={induk.id}>
              {/* Baris induk */}
              <BarisDepartment
                dept={induk}
                level={0}
                onUbah={() => { setErrorForm(''); setDialogUbah(induk); }}
                onHapus={() => { setErrorAksi(''); setDialogHapus(induk); }}
                onToggle={() => handleToggleAktif(induk)}
              />
              {/* Baris anak */}
              {induk.children.map((anak) => (
                <BarisDepartment
                  key={anak.id}
                  dept={anak}
                  level={1}
                  onUbah={() => { setErrorForm(''); setDialogUbah(anak); }}
                  onHapus={() => { setErrorAksi(''); setDialogHapus(anak); }}
                  onToggle={() => handleToggleAktif(anak)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Dialog Tambah */}
      <Dialog open={dialogTambah} onOpenChange={setDialogTambah}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Department</DialogTitle>
            <DialogDescription>Buat department baru, opsional taruh di bawah department lain.</DialogDescription>
          </DialogHeader>
          <FormDepartment
            schema={CreateDepartmentRequest}
            defaultValues={{ name: '', parentId: null }}
            indukOptions={pilihanInduk}
            sedangProses={sedangProses}
            errorGlobal={errorForm}
            labelSubmit="Tambah"
            onSubmit={handleTambah}
            onBatal={() => setDialogTambah(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah */}
      <Dialog open={!!dialogUbah} onOpenChange={(o) => !o && setDialogUbah(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Department</DialogTitle>
            <DialogDescription>Ubah nama, induk, atau status aktif department.</DialogDescription>
          </DialogHeader>
          {dialogUbah && (
            <FormDepartment
              schema={UpdateDepartmentRequest}
              defaultValues={{
                name: dialogUbah.name,
                parentId: dialogUbah.parentId,
                isActive: dialogUbah.isActive,
              }}
              indukOptions={pilihanInduk.filter((d) => d.id !== dialogUbah.id)}
              sedangProses={sedangProses}
              errorGlobal={errorForm}
              labelSubmit="Simpan"
              onSubmit={handleUbah}
              onBatal={() => setDialogUbah(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!dialogHapus} onOpenChange={(o) => !o && setDialogHapus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus department?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogHapus && `Department "${dialogHapus.name}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHapus}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Komponen baris department ─────────────────────────────────────────────────

function BarisDepartment({
  dept,
  level,
  onUbah,
  onHapus,
  onToggle,
}: {
  dept: DepartmentDto;
  level: 0 | 1;
  onUbah: () => void;
  onHapus: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors',
        !dept.isActive && 'opacity-50',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Indentasi anak */}
      {level === 1 && (
        <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-4" />
      )}
      {level === 0 && <Building2 className="size-4 text-primary shrink-0" />}

      {/* Nama */}
      <span className={['flex-1 text-sm', level === 0 && 'font-medium'].filter(Boolean).join(' ')}>
        {dept.name}
      </span>

      {/* Badge status */}
      <Badge variant={dept.isActive ? 'secondary' : 'outline'} className="text-xs shrink-0">
        {dept.isActive ? 'Aktif' : 'Nonaktif'}
      </Badge>

      {/* Aksi */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          title={dept.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          className="size-8 p-0"
        >
          {dept.isActive ? (
            <ToggleRight className="size-4 text-primary" />
          ) : (
            <ToggleLeft className="size-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUbah}
          title="Ubah"
          className="size-8 p-0"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHapus}
          title="Hapus"
          className="size-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
