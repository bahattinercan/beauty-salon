'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { NAV_ITEMS, isNavActive } from '@/lib/nav';
import { clearSession, useStoredUser } from '@/lib/session';
import { cx } from '@/lib/cx';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * Dar ekranda tam liste. Erişilebilirlik: role=dialog + aria-modal, Esc ile kapanır,
 * odak tuzağı, scrim tıklaması, yol değişince kapanır, arka plan kilidi.
 */
export default function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const user = useStoredUser();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose(); // yol değişince kapanır
  }, [pathname, onClose]);

  if (!open) return null;

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Menüyü kapat"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-fg/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Gezinme menüsü"
        className={cx(
          'absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-nav-pill text-on-nav-pill shadow-raised'
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="truncate font-display text-base font-extrabold">Beauty Salon</div>
            <div className="truncate text-xs text-on-nav-pill-muted">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-11 w-11 place-items-center rounded-field text-on-nav-pill-muted hover:bg-on-nav-pill/10 hover:text-on-nav-pill"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav aria-label="Tüm gezinme" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex min-h-11 items-center gap-3 rounded-field px-3 py-2 text-sm font-semibold',
                      active
                        ? 'bg-on-nav-pill/12 text-on-nav-pill'
                        : 'text-on-nav-pill-muted hover:bg-on-nav-pill/8 hover:text-on-nav-pill'
                    )}
                  >
                    {active ? (
                      <span className="h-6 w-1 shrink-0 rounded-pill bg-accent-lime" />
                    ) : (
                      <span className="h-6 w-1 shrink-0" />
                    )}
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
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-3 rounded-field px-3 text-sm font-semibold text-on-nav-pill-muted hover:bg-error/20 hover:text-error"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            Çıkış yap
          </button>
        </div>
      </div>
    </div>
  );
}
