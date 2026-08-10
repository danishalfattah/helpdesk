'use client';

import { AgentProvider } from '@/lib/agent-context';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

/**
 * Kerangka buat semua halaman yang butuh login: sidebar + header + area
 * konten. AgentProvider yang nge-redirect ke /login kalau sesi tidak valid --
 * halaman di dalam grup ini tidak perlu mengulang logika itu sendiri.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AgentProvider>
  );
}
