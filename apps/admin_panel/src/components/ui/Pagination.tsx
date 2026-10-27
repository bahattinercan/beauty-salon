'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Select } from '@/components/ui/Field';
import Button from '@/components/ui/Button';

/** AP-007 H3: varsayılan sayfa boyutu 20, seçenekler 20/50/100 (API `limit` ≤100). */
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

/**
 * AP-001'den kalma sayaç bloğunun tek hâli; dokunma hedefi ≥44px.
 *
 * AP-007 W2 (D4) — **geriye uyumlu** genişletme: `total`, `pageSize`,
 * `pageSizeOptions`, `onPageSize` hepsi opsiyoneldir. Dördü de verilmezse
 * çıktı eskisiyle birebir aynıdır (users/appointments/reviews sayfaları ve
 * AP-001/AP-004 testleri bu yüzden hiç değişmedi).
 *
 * Yeni davranış:
 * - `total` + `pageSize` → aralık metni "21–40 / 87" (en dash, `tnum`).
 * - `onPageSize` → sayfa boyutu `Select`'i; `totalPages <= 1` olsa bile
 *   görünür kalır (tek sayfada boyutu değiştirebilmek anlamlıdır).
 */
export default function Pagination({
  page,
  totalPages,
  onPage,
  className,
  total,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  className?: string;
  total?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSize?: (size: number) => void;
}) {
  const hasSizeControl = typeof onPageSize === 'function' && pageSizeOptions.length > 0;
  const hasRange = typeof total === 'number' && typeof pageSize === 'number';
  // Eski sözleşme: tek sayfa varsa hiç render yok. Yeni kontrollerden biri
  // istendiyse kabuk basılır (aksi halde boyut seçici kaybolur).
  if (totalPages <= 1 && !hasSizeControl && !hasRange && typeof total !== 'number') return null;

  const size = pageSize ?? pageSizeOptions[0];
  const from = typeof total === 'number' && total === 0 ? 0 : (page - 1) * size + 1;
  const to = typeof total === 'number' ? Math.min(page * size, total) : page * size;

  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3 pt-4', className)}>
      <span className="tnum text-sm text-fg-muted">
        {hasRange
          ? `${from}–${to} / ${total}`
          : typeof total === 'number'
            ? `${total} kayıt`
            : `Sayfa ${page} / ${totalPages}`}
      </span>
      <div className="flex items-center gap-2">
        {hasSizeControl ? (
          <Select
            aria-label="Sayfa başına kayıt"
            className="w-[7.5rem]"
            value={size}
            onChange={(e) => onPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ) : null}
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
