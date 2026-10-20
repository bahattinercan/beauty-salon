'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isNavActive } from '@/lib/nav';
import { cx } from '@/lib/cx';

/**
 * Mobil gezinme: CA-019'ın yüzen pill nav'ının web karşılığı. Koyu zemin +
 * aktif öğe açık daire (navPill / onNavPill tokenları).
 */
export default function BottomPillNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.primary);

  return (
    <nav
      aria-label="Hızlı gezinme"
      className="fixed inset-x-3 bottom-3 z-40 rounded-pill bg-nav-pill px-2 py-2 shadow-raised lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-pill px-1 text-[11px] font-semibold transition-colors',
                  active ? 'text-on-nav-pill' : 'text-on-nav-pill-muted'
                )}
              >
                <span
                  className={cx(
                    'grid h-9 w-9 place-items-center rounded-pill transition-colors',
                    active ? 'bg-on-nav-pill text-nav-pill' : 'bg-transparent'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-pill px-1 text-[11px] font-semibold text-on-nav-pill-muted"
          >
            <span className="grid h-9 w-9 place-items-center rounded-pill">
              <span className="flex gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-pill bg-current" />
                <span className="h-1.5 w-1.5 rounded-pill bg-current" />
                <span className="h-1.5 w-1.5 rounded-pill bg-current" />
              </span>
            </span>
            <span>Daha fazla</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
