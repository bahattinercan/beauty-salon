'use client';

import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-field bg-surface-variant', className)} />;
}

export function LoadingBlock({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-fg-muted">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-pill bg-surface-variant text-fg-muted">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <p className="font-display font-bold text-fg">{title}</p>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-error/30 bg-error/8 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-fg">Veri alınamadı</p>
          <p className="mt-1 text-sm text-fg-muted">{message}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Yeniden dene
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
