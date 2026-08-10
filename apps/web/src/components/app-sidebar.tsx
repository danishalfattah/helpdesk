'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Tags, Users, ShieldCheck } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

/**
 * Departemen/Kategori/Agen/Role belum tentu punya halaman jadi saat berkas
 * ini ditulis (Tahap 1 baru dimulai) -- link-nya tetap dipasang karena
 * issue lain di tahap yang sama sedang mengerjakannya paralel. Kalau
 * di-klik sebelum halamannya ada, hasilnya 404 sementara, bukan bug.
 */
const NAV_ITEMS = [
  { href: '/beranda', label: 'Beranda', icon: LayoutDashboard },
  { href: '/departemen', label: 'Departemen', icon: Building2 },
  { href: '/kategori', label: 'Kategori', icon: Tags },
  { href: '/agen', label: 'Agen', icon: Users },
  { href: '/role', label: 'Role', icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
          Socfindo Helpdesk
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href} tooltip={label}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
