import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import HalamanAgen from './page';

const API = 'http://localhost:3001/api/v1';

const roleAdmin = { id: 1, name: 'Administrator', description: null, permissions: [] };
const roleAgen = { id: 2, name: 'Agen Lapangan', description: null, permissions: [] };

const agentBudi = {
  id: 10,
  email: 'budi@socfindo.co.id',
  name: 'Budi',
  isActive: true,
  roles: [roleAdmin].map(({ id, name }) => ({ id, name })),
};

const agentSiti = {
  id: 11,
  email: 'siti@socfindo.co.id',
  name: 'Siti',
  isActive: true,
  roles: [],
};

function mockDaftarAwal(agents: unknown[] = [agentBudi]) {
  server.use(
    http.get(`${API}/agents`, () => HttpResponse.json({ agents })),
    http.get(`${API}/roles`, () => HttpResponse.json([roleAdmin, roleAgen])),
  );
}

describe('HalamanAgen', () => {
  it('menampilkan daftar agent beserta role-nya setelah dimuat', async () => {
    mockDaftarAwal();
    render(<HalamanAgen />);

    expect(await screen.findByText('Budi')).toBeInTheDocument();
    expect(screen.getByText('budi@socfindo.co.id')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('menampilkan pesan error dan tombol coba lagi kalau gagal memuat', async () => {
    server.use(
      http.get(`${API}/agents`, () => HttpResponse.error()),
      http.get(`${API}/roles`, () => HttpResponse.json([])),
    );
    render(<HalamanAgen />);

    expect(await screen.findByText('Gagal memuat data. Coba lagi.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();
  });

  it('berhasil menambah agent baru lewat form', async () => {
    const user = userEvent.setup();
    mockDaftarAwal([]);
    let dibuat: Record<string, unknown> | null = null;

    server.use(
      http.post(`${API}/agents`, async ({ request }) => {
        dibuat = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ agent: agentSiti }, { status: 201 });
      }),
    );

    render(<HalamanAgen />);
    await waitFor(() => expect(screen.getByText(/Belum ada agent/)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Tambah Agen' }));

    await user.type(screen.getByLabelText('Email'), agentSiti.email);
    await user.type(screen.getByLabelText('Nama'), agentSiti.name);
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByLabelText(roleAdmin.name));

    // Setelah submit, halaman memuat ulang daftar agent — sediakan hasil terbaru.
    server.use(http.get(`${API}/agents`, () => HttpResponse.json({ agents: [agentSiti] })));

    await user.click(screen.getByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText('Siti')).toBeInTheDocument();
    expect(dibuat).toMatchObject({ email: agentSiti.email, name: agentSiti.name, roleIds: [roleAdmin.id] });
  });

  it('menambah dan menghapus role agent dari panel detail', async () => {
    const user = userEvent.setup();
    mockDaftarAwal([agentSiti]);

    let permintaanAssign: { agentId: string; roleId: unknown } | null = null;
    server.use(
      http.post(`${API}/agents/:id/roles`, async ({ params, request }) => {
        permintaanAssign = { agentId: params.id as string, roleId: (await request.json() as { roleId: unknown }).roleId };
        return HttpResponse.json({ ok: true });
      }),
    );

    render(<HalamanAgen />);
    expect(await screen.findByText('Siti')).toBeInTheDocument();

    // Buka panel detail.
    await user.click(screen.getByRole('button', { name: 'Buka detail' }));

    // Assign role "Agen Lapangan" — tanpa muat() ulang, panel ditempel dari
    // roleOptions yang sudah ada di memori (lihat handleAssignRole di page.tsx).
    await user.click(screen.getByRole('button', { name: roleAgen.name }));

    await waitFor(() => expect(permintaanAssign).toMatchObject({ agentId: '11', roleId: roleAgen.id }));

    const panel = await screen.findByText('Kelola Role');
    const panelContainer = panel.parentElement as HTMLElement;
    expect(within(panelContainer).getByText(roleAgen.name)).toBeInTheDocument();

    // Hapus role yang baru saja di-assign — juga tanpa muat() ulang.
    let permintaanHapus: { agentId: string; roleId: string } | null = null;
    server.use(
      http.delete(`${API}/agents/:id/roles/:roleId`, ({ params }) => {
        permintaanHapus = { agentId: params.id as string, roleId: params.roleId as string };
        return HttpResponse.json({ ok: true });
      }),
    );

    await user.click(screen.getByTitle(`Hapus role ${roleAgen.name}`));

    await waitFor(() => expect(permintaanHapus).toMatchObject({ agentId: '11', roleId: String(roleAgen.id) }));
    // Role kembali ke daftar "belum dimiliki" — tombol hapusnya sudah tidak ada.
    expect(screen.queryByTitle(`Hapus role ${roleAgen.name}`)).not.toBeInTheDocument();
  });
});
