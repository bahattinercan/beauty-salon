'use client';

import { cx } from '@/lib/cx';

/** Mobildeki pill sekmeler; dar ekranda yatay kayar (taşma yapmaz). */
export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        '-mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              'flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-pill border px-4 text-sm font-semibold transition-colors',
              active
                ? 'border-transparent bg-primary-solid text-on-primary'
                : 'border-border bg-surface text-fg-muted hover:bg-surface-variant hover:text-fg'
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cx(
                  'tnum rounded-pill px-1.5 py-0.5 text-xs font-bold',
                  active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-variant text-fg-muted'
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
