'use client';

import { cx } from '@/lib/cx';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingBlock } from '@/components/ui/States';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /**
   * Mobil kart modunda nasıl gösterileceği:
   *  'primary' → kartın başlık satırı (kalın), 'meta' → etiket:değer satırı,
   *  false → kartta gösterme (ör. salt-görsel kolonlar).
   */
  mobile?: false | 'primary' | 'meta';
  /** Değeri geniş kolonlarda (ör. açıklama) kartta tam satır yapar. */
  block?: boolean;
  thClassName?: string;
  tdClassName?: string;
}

/**
 * AP-001 WP3 — üç sayfada (salons/users/appointments) kopyalanmış tablonun tek hâli.
 *
 * Dar ekranda tablo yerine satır-başına kart basılır: 6–7 kolonlu bir tablo
 * 390px'e sığmaz (ölçülen: /appointments +930px, /users +785px). Geniş ekranda
 * tablo `overflow-x-auto` içinde gerçek kaydırma yapar — kabuktaki `min-w-0`
 * olmadan bu sarmalayıcı çalışmaz (ölçülen bisect: sarmalayıcının kendi genişliği
 * 807px idi, yani kesmiyordu).
 */
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  emptyTitle = 'Kayıt yok',
  emptyDescription,
  actions,
  minWidthClass = 'min-w-[38rem]',
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: (row: T) => React.ReactNode;
  minWidthClass?: string;
  className?: string;
}) {
  if (loading) {
    return (
      <Card className="p-6">
        <LoadingBlock />
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }

  const alignClass = (align?: string) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  const primary = columns.find((c) => c.mobile === 'primary') ?? columns[0];
  // Varsayılan: kolon kart modunda GÖSTERİLİR (`mobile: false` yalnızca opt-out).
  // Aksi halde mobil kartta alan kaybolurdu (durum/tutar/müşteri gibi).
  const meta = columns.filter((c) => c !== primary && c.mobile !== false);

  return (
    <>
      {/* Geniş ekran: tablo */}
      <Card className={cx('hidden overflow-hidden md:block', className)}>
        <div className="overflow-x-auto">
          <table className={cx('w-full border-collapse text-sm', minWidthClass)}>
            <thead>
              <tr className="bg-surface-variant">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cx(
                      'whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-fg-muted',
                      alignClass(c.align),
                      c.thClassName
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-border transition-colors hover:bg-surface-variant/60">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cx(
                        'px-4 py-3 align-middle text-fg',
                        alignClass(c.align),
                        c.tdClassName
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dar ekran: satır → kart */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)}>
            <Card className="p-4">
              <div className="min-w-0 font-display text-base font-bold text-fg">
                {primary.cell(row)}
              </div>
              <dl className="mt-3 space-y-1.5">
                {meta.map((c) =>
                  c.block ? (
                    <div key={c.key} className="pt-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        {c.header}
                      </dt>
                      <dd className="mt-0.5 text-sm text-fg">{c.cell(row)}</dd>
                    </div>
                  ) : (
                    <div key={c.key} className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        {c.header}
                      </dt>
                      <dd className="min-w-0 text-right text-sm text-fg">{c.cell(row)}</dd>
                    </div>
                  )
                )}
              </dl>
              {actions ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {actions(row)}
                </div>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
