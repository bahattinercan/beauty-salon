'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';

/** 6 sayfada kopyalanmış sayaç bloğunun tek hâli; dokunma hedefi ≥44px. */
export default function Pagination({
  page,
  totalPages,
  onPage,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className={cx('flex items-center justify-between gap-3 pt-4', className)}>
      <span className="tnum text-sm text-fg-muted">
        Sayfa {page} / {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Önceki sayfa"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Sonraki sayfa"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
