'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentProfile } from '@helpdesk/contract';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export default function HalamanBeranda() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    apiFetch<{ agent: AgentProfile }>('/auth/me')
      .then((r) => setAgent(r.agent))
      .catch(() => router.push('/login'));
  }, [router]);

  if (!agent) {
    return <main className="p-8 text-muted-foreground">Memuat…</main>;
  }

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Halo, {agent.name}</h1>
      <p className="text-muted-foreground">{agent.email}</p>

      <h2 className="mt-6 mb-2 text-sm font-medium">Izin yang dimiliki</h2>
      <div className="flex flex-wrap gap-2">
        {agent.permissions.map((p) => (
          <Badge key={p} variant="secondary">
            {p}
          </Badge>
        ))}
      </div>
    </main>
  );
}
