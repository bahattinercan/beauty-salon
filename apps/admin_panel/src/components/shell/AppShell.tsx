'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import SideRail from '@/components/shell/SideRail';
import BottomPillNav from '@/components/shell/BottomPillNav';
import MobileDrawer from '@/components/shell/MobileDrawer';
import ThemeToggle from '@/components/ThemeToggle';
import { DashboardProvider } from '@/providers/DashboardProvider';

/**
 * AP-001 WP2 — kabuk. İki kritik düzeltme:
 *  1) içerik kolonu `min-w-0`: flex item varsayılan olarak min-width:auto ile
 *     tablonun min-content'ini emer ve belge yataya taşıyordu (ölçülen: /users
 *     390px'te +785px, /appointments +930px). `overflow-x-auto` bu yüzden
 *     çalışmıyordu.
 *  2) padding yalnızca kabukta: sayfaların kendi `min-h-screen … p-8` katmanı
 *     çift dolgu yapıyordu (dashboard + settings ölçüldü).
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (pathname === '/login') {
    return <main className="min-h-dvh bg-background">{children}</main>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex min-h-dvh">
        <SideRail />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={drawerOpen}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-field text-fg hover:bg-surface-variant"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-primary-solid text-on-primary">
              <span className="font-display text-[11px] font-extrabold">BS</span>
            </span>
            <span className="min-w-0 truncate font-display text-sm font-extrabold text-fg">
              Beauty Salon
            </span>
            <span className="ml-auto">
              <ThemeToggle />
            </span>
          </header>

          <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">{
            <DashboardProvider>{children}</DashboardProvider>
          }</main>
        </div>
      </div>

      <BottomPillNav onMore={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
