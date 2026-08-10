'use client';

import { useAgent } from '@/lib/agent-context';
import { Badge } from '@/components/ui/badge';

export default function HalamanBeranda() {
  const agent = useAgent();

  return (
    <>
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
    </>
  );
}
