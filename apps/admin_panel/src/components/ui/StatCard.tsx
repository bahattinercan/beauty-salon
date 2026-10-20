'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Card } from '@/components/ui/Card';

/**
 * Panelin özet kartı: büyük sayı (tabular-nums), küçük etiket, sağda ikon.
 * `delta` API'de olmayan bir alan için tasarlanmadı — veri varsa gösterilir.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  delta?: number | null;
  hint?: string;
}) {
  const iconTone: Record<string, string> = {
    primary: 'bg-primary/12 text-primary',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/16 text-warning',
    error: 'bg-error/12 text-error',
    info: 'bg-info/12 text-info',
    neutral: 'bg-surface-variant text-fg-muted',
  };
  const positive = typeof delta === 'number' ? delta >= 0 : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-extrabold tnum text-fg sm:text-3xl">{value}</p>
          {hint ? <p className="mt-1 text-xs text-fg-muted">{hint}</p> : null}
          {positive !== null ? (
            <p
              className={cx(
                'mt-2 inline-flex items-center gap-1 text-xs font-bold',
                positive ? 'text-success' : 'text-error'
              )}
            >
              {positive ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              )}
              <span className="tnum">
                {positive ? '+' : ''}
                {delta}%
              </span>
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-field', iconTone[tone])}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
