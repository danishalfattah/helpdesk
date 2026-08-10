'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAgent } from '@/lib/agent-context';
import { logout } from '@/lib/api';

function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase())
    .join('');
}

export function AppHeader() {
  const agent = useAgent();
  const router = useRouter();
  const [sedangKeluar, setSedangKeluar] = useState(false);

  async function handleLogout() {
    setSedangKeluar(true);
    try {
      await logout();
    } finally {
      // Tetap redirect walau request logout gagal (mis. API sedang down) --
      // cookie httpOnly tidak bisa dihapus dari sini, tapi pengguna tidak
      // boleh terjebak tidak bisa keluar dari halaman.
      router.push('/login');
    }
  }

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{inisial(agent.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{agent.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} disabled={sedangKeluar}>
            <LogOut />
            {sedangKeluar ? 'Keluar…' : 'Keluar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
