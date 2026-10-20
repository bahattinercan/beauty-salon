'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NAV_ITEMS, isNavActive } from '@/lib/nav';
import { clearSession, useStoredUser } from '@/lib/session';
import { cx } from '@/lib/cx';
import ThemeToggle from '@/components/ThemeToggle';

function initials(fullName?: string) {
  return (fullName ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Geniş ekran gezinmesi: mobil pill nav'ın (CA-019) dikey karşılığı — koyu ray.
 * `fixed` yerine `sticky` kullanılır: 390px'te sabit 256px'lik ray içeriği eziyordu.
 */
export default function SideRail() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useStoredUser();

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-nav-pill text-on-nav-pill lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-primary-solid text-on-primary">
          <span className="font-display text-sm font-extrabold">BS</span>
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-base font-extrabold">Beauty Salon</div>
          <div className="truncate text-xs text-on-nav-pill-muted">Admin Panel</div>
        </div>
      </div>

      <nav aria-label="Ana gezinme" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'relative flex min-h-11 items-center gap-3 rounded-field px-3 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-on-nav-pill/12 text-on-nav-pill'
                      : 'text-on-nav-pill-muted hover:bg-on-nav-pill/8 hover:text-on-nav-pill'
                  )}
                >
                  {/* Aktif işaret: mobil pill'deki gibi vurgu rengi */}
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-pill bg-accent-lime" />
                  ) : null}
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-on-nav-pill/12 p-3">
        <ThemeToggle className="mb-3 w-full" />
        <div className="flex items-center gap-3 rounded-field px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-primary-solid text-on-primary">
            <span className="text-xs font-bold">{initials(user?.fullName)}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user?.fullName ?? 'Admin'}</div>
            <div className="truncate text-xs text-on-nav-pill-muted">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Çıkış yap"
            aria-label="Çıkış yap"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-field text-on-nav-pill-muted transition-colors hover:bg-error/20 hover:text-error"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
