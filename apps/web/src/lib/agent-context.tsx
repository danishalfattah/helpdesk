'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentProfile } from '@helpdesk/contract';
import { apiFetch } from './api';

const AgentContext = createContext<AgentProfile | null>(null);

/**
 * Ambil `/auth/me` sekali di sini, bukan di tiap halaman -- halaman lain
 * (beranda, department, dst) tinggal panggil useAgent(), tanpa fetch ulang
 * atau nulis ulang logika redirect-kalau-belum-login.
 */
export function AgentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    apiFetch<{ agent: AgentProfile }>('/auth/me')
      .then((r) => setAgent(r.agent))
      .catch(() => router.push('/login'));
  }, [router]);

  if (!agent) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat…</div>;
  }

  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>;
}

/**
 * Cuma dipakai di dalam AgentProvider (lihat app/(app)/layout.tsx). Kalau
 * dipanggil di luar itu, ini nandain ada halaman yang lupa masuk grup rute
 * terlindungi -- sengaja dilempar sebagai error, bukan dikembalikan null diam-diam.
 */
export function useAgent(): AgentProfile {
  const agent = useContext(AgentContext);
  if (!agent) {
    throw new Error('useAgent() dipanggil di luar AgentProvider');
  }
  return agent;
}
