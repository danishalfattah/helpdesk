'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldPlus,
  ShieldMinus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  type AgentDto,
  type AgentRoleInfo,
  CreateAgentRequest,
  type CreateAgentRequest as CreateReq,
  UpdateAgentRequest,
  type UpdateAgentRequest as UpdateReq,
  type UpdateAgentResponse,
} from '@helpdesk/contract';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// ── Tipe lokal ────────────────────────────────────────────────────────────────

interface RoleOption {
  id: number;
  name: string;
}

// ── Komponen dialog ───────────────────────────────────────────────────────────

function Modal({
  judul,
  onTutup,
  children,
}: {
  judul: string;
  onTutup: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onTutup}
    >
      <div
        className="bg-card text-card-foreground rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{judul}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Form Tambah Agent ─────────────────────────────────────────────────────────

function FormTambahAgent({
  roleOptions,
  sedangProses,
  errorGlobal,
  onSubmit,
  onBatal,
}: {
  roleOptions: RoleOption[];
  sedangProses: boolean;
  errorGlobal: string;
  onSubmit: (data: CreateReq) => void;
  onBatal: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateReq>({ resolver: zodResolver(CreateAgentRequest) });

  // roleIds dikelola terpisah dari react-hook-form, bukan lewat register().
  // Checkbox HTML senama selalu memberi string ke RHF, dan setValueAs tidak
  // sempat jalan sebelum zodResolver membaca nilai mentahnya saat submit —
  // roleIds selalu ditolak sebagai "expected number, received string" tanpa
  // pesan error yang tertampil (submit terlihat seperti tidak terjadi apa-apa).
  const [roleIds, setRoleIds] = useState<number[]>([]);

  function toggleRole(id: number) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, roleIds }))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="agent-email">Email</Label>
        <Input id="agent-email" type="email" {...register('email')} placeholder="nama@socfindo.co.id" />
        {errors.email && <p role="alert" className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="agent-name">Nama</Label>
        <Input id="agent-name" {...register('name')} placeholder="Nama lengkap" />
        {errors.name && <p role="alert" className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="agent-password">Password</Label>
        <Input id="agent-password" type="password" {...register('password')} placeholder="Minimal 8 karakter" />
        {errors.password && <p role="alert" className="text-destructive text-sm">{errors.password.message}</p>}
      </div>

      {roleOptions.length > 0 && (
        <div className="space-y-1">
          <Label>Role (opsional)</Label>
          <div className="border border-input rounded-md p-3 space-y-2 max-h-36 overflow-y-auto">
            {roleOptions.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={roleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {errorGlobal && <p role="alert" className="text-destructive text-sm">{errorGlobal}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onBatal} disabled={sedangProses}>Batal</Button>
        <Button type="submit" disabled={sedangProses}>
          {sedangProses && <Loader2 className="size-4 mr-2 animate-spin" />}
          Tambah
        </Button>
      </div>
    </form>
  );
}

// ── Form Ubah Agent ───────────────────────────────────────────────────────────

function FormUbahAgent({
  agent,
  sedangProses,
  errorGlobal,
  onSubmit,
  onBatal,
}: {
  agent: AgentDto;
  sedangProses: boolean;
  errorGlobal: string;
  onSubmit: (data: UpdateReq) => void;
  onBatal: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateReq>({
    resolver: zodResolver(UpdateAgentRequest),
    defaultValues: { name: agent.name },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="ubah-name">Nama</Label>
        <Input id="ubah-name" {...register('name')} />
        {errors.name && <p role="alert" className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      {errorGlobal && <p role="alert" className="text-destructive text-sm">{errorGlobal}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onBatal} disabled={sedangProses}>Batal</Button>
        <Button type="submit" disabled={sedangProses}>
          {sedangProses && <Loader2 className="size-4 mr-2 animate-spin" />}
          Simpan
        </Button>
      </div>
    </form>
  );
}

// ── Baris Agent ───────────────────────────────────────────────────────────────

function BarisAgent({
  agent,
  expandedId,
  roleOptions,
  onToggleExpand,
  onUbah,
  onToggleAktif,
  onAssignRole,
  onHapusRole,
}: {
  agent: AgentDto;
  expandedId: number | null;
  roleOptions: RoleOption[];
  onToggleExpand: () => void;
  onUbah: () => void;
  onToggleAktif: () => void;
  onAssignRole: (roleId: number) => void;
  onHapusRole: (roleId: number) => void;
}) {
  const expanded = expandedId === agent.id;
  const roleYangBelumDimiliki = roleOptions.filter(
    (r) => !agent.roles.some((ar) => ar.id === r.id),
  );

  return (
    <div className={!agent.isActive ? 'opacity-60' : ''}>
      {/* Baris utama */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? 'Tutup detail' : 'Buka detail'}
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {/* Info agent */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
        </div>

        {/* Role badges */}
        <div className="hidden sm:flex items-center gap-1 flex-wrap max-w-48">
          {agent.roles.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">Tanpa role</span>
          ) : (
            agent.roles.map((r) => (
              <Badge key={r.id} variant="secondary" className="text-xs">
                {r.name}
              </Badge>
            ))
          )}
        </div>

        {/* Status badge */}
        <Badge variant={agent.isActive ? 'secondary' : 'outline'} className="text-xs shrink-0">
          {agent.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>

        {/* Aksi */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={onToggleAktif} title={agent.isActive ? 'Nonaktifkan' : 'Aktifkan'} className="size-8 p-0">
            {agent.isActive
              ? <ToggleRight className="size-4 text-primary" />
              : <ToggleLeft className="size-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onUbah} title="Ubah nama" className="size-8 p-0">
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>

      {/* Panel role (expanded) */}
      {expanded && (
        <div className="px-12 pb-4 space-y-2 bg-accent/20 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground pt-3">Kelola Role</p>

          {/* Role yang dimiliki */}
          <div className="flex flex-wrap gap-2">
            {agent.roles.map((r) => (
              <div key={r.id} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs">
                {r.name}
                <button
                  onClick={() => onHapusRole(r.id)}
                  title={`Hapus role ${r.name}`}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <ShieldMinus className="size-3" />
                </button>
              </div>
            ))}
            {agent.roles.length === 0 && (
              <span className="text-xs text-muted-foreground italic">Belum punya role</span>
            )}
          </div>

          {/* Assign role baru */}
          {roleYangBelumDimiliki.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {roleYangBelumDimiliki.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onAssignRole(r.id)}
                  className="flex items-center gap-1 text-xs border border-dashed border-primary/50 text-primary rounded-full px-3 py-1 hover:bg-primary/10 transition-colors"
                >
                  <ShieldPlus className="size-3" />
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Halaman utama ─────────────────────────────────────────────────────────────

export default function HalamanAgen() {
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMuat, setErrorMuat] = useState('');

  const [dialogTambah, setDialogTambah] = useState(false);
  const [dialogUbah, setDialogUbah] = useState<AgentDto | null>(null);
  const [sedangProses, setSedangProses] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Muat data ────────────────────────────────────────────────────────────────

  async function muat() {
    setMemuat(true);
    setErrorMuat('');
    try {
      const [resAgents, resRoles] = await Promise.all([
        apiFetch<{ agents: AgentDto[] }>('/agents'),
        apiFetch<Array<{ id: number; name: string }>>('/roles'),
      ]);
      setAgents(resAgents.agents);
      setRoleOptions(resRoles);
    } catch {
      setErrorMuat('Gagal memuat data. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => { void muat(); }, []);

  // ── Tambah ────────────────────────────────────────────────────────────────────

  async function handleTambah(data: CreateReq) {
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch('/agents', { method: 'POST', body: JSON.stringify(data) });
      setDialogTambah(false);
      await muat();
    } catch (e) {
      setErrorForm(e instanceof ApiError ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSedangProses(false);
    }
  }

  // ── Ubah nama ────────────────────────────────────────────────────────────────

  async function handleUbah(data: UpdateReq) {
    if (!dialogUbah) return;
    setSedangProses(true);
    setErrorForm('');
    try {
      await apiFetch(`/agents/${dialogUbah.id}`, {
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

  // ── Toggle aktif ──────────────────────────────────────────────────────────────

  async function handleToggleAktif(agent: AgentDto) {
    try {
      // Tempel langsung baris yang berubah dari response PATCH, bukan muat()
      // ulang seluruh daftar — supaya toggle terasa instan tanpa kedip "Memuat…".
      const res = await apiFetch<UpdateAgentResponse>(`/agents/${agent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !agent.isActive }),
      });
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? res.agent : a)));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal mengubah status.');
    }
  }

  // ── Assign role ───────────────────────────────────────────────────────────────

  async function handleAssignRole(agentId: number, roleId: number) {
    try {
      // Endpoint ini cuma balas { ok: true }, bukan agent terbaru — role-nya
      // ditempel dari roleOptions yang sudah ada di memori, tanpa muat() ulang.
      await apiFetch(`/agents/${agentId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
      });
      const role = roleOptions.find((r) => r.id === roleId);
      if (!role) return;
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId && !a.roles.some((r) => r.id === roleId)
            ? { ...a, roles: [...a.roles, role] }
            : a,
        ),
      );
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal menambah role.');
    }
  }

  // ── Hapus role ────────────────────────────────────────────────────────────────

  async function handleHapusRole(agentId: number, roleId: number) {
    try {
      await apiFetch(`/agents/${agentId}/roles/${roleId}`, { method: 'DELETE' });
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, roles: a.roles.filter((r) => r.id !== roleId) } : a)),
      );
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Gagal menghapus role.');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            Agen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun agent dan pemberian role
          </p>
        </div>
        <Button onClick={() => { setErrorForm(''); setDialogTambah(true); }}>
          <Plus className="size-4 mr-2" />
          Tambah Agen
        </Button>
      </div>

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
      ) : agents.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center border border-dashed rounded-lg">
          Belum ada agent. Tambahkan agent pertama.
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {agents.map((agent) => (
            <BarisAgent
              key={agent.id}
              agent={agent}
              expandedId={expandedId}
              roleOptions={roleOptions}
              onToggleExpand={() => setExpandedId((prev) => (prev === agent.id ? null : agent.id))}
              onUbah={() => { setErrorForm(''); setDialogUbah(agent); }}
              onToggleAktif={() => handleToggleAktif(agent)}
              onAssignRole={(roleId) => handleAssignRole(agent.id, roleId)}
              onHapusRole={(roleId) => handleHapusRole(agent.id, roleId)}
            />
          ))}
        </div>
      )}

      {/* Ringkasan */}
      {agents.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {agents.filter((a) => a.isActive).length} aktif dari {agents.length} agent
        </p>
      )}

      {/* Dialog Tambah */}
      {dialogTambah && (
        <Modal judul="Tambah Agen" onTutup={() => setDialogTambah(false)}>
          <FormTambahAgent
            roleOptions={roleOptions}
            sedangProses={sedangProses}
            errorGlobal={errorForm}
            onSubmit={handleTambah}
            onBatal={() => setDialogTambah(false)}
          />
        </Modal>
      )}

      {/* Dialog Ubah */}
      {dialogUbah && (
        <Modal judul="Ubah Agen" onTutup={() => setDialogUbah(null)}>
          <FormUbahAgent
            agent={dialogUbah}
            sedangProses={sedangProses}
            errorGlobal={errorForm}
            onSubmit={handleUbah}
            onBatal={() => setDialogUbah(null)}
          />
        </Modal>
      )}
    </div>
  );
}
