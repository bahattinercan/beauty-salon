'use client';

import { X } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * AP-007 W2 — etkin filtrelerin chip listesi (plan §5.1, H2).
 *
 * - Chip'in tamamı düğmedir; erişilebilir ad `<label> filtresini kaldır`
 *   (X ikonu `aria-hidden`, adı çiftlemez).
 * - **Yerleşim (AP-007, 390px kusuru):** liste ile özet/Temizle ayrı flex
 *   öğeleridir — özet metin chip'lerin üzerine binmez. Liste `flex-1 min-w-[12rem]`
 *   + `overflow-x-auto`: yer varken kalan alanı doldurur, darlaşınca yatay kayar;
 *   `min-w-[12rem]` altına inince özet/Temizle grubu `flex-wrap` ile alt satıra
 *   iner. Eski `-mx-1` negatif margin'i (kenardan taşma hilesi) kaldırıldı:
 *   özet metnin üzerine binen 4-10px'lik örtüşmenin kaynağıydı.
 * - Özet metin `aria-live="polite"` ile duyurulur. Bölge **her zaman** DOM'da
 *   kalır (0 filtrede metin boş): bölge ilk chip ile birlikte oluşturulursa
 *   ekran okuyucu ilk duyuruyu kaçırır.
 * - `onClearAll` verilmezse "Temizle" basılmaz (salt-okunur kullanım yok ama
 *   W3'ten önceki çağrılar için sessiz başarısızlık yerine açık tercih).
 */
export default function FilterChips({
  chips,
  onClearAll,
  clearLabel = 'Temizle',
  className,
}: {
  chips: FilterChip[];
  onClearAll?: () => void;
  clearLabel?: string;
  className?: string;
}) {
  const count = chips.length;

  return (
    <div className={cx('flex flex-wrap items-center gap-2', className)}>
      {count > 0 ? (
        <ul
          aria-label="Etkin filtreler"
          className="flex min-w-[12rem] flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => (
            <li key={chip.key} className="shrink-0">
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`${chip.label} filtresini kaldır`}
                className="flex min-h-9 max-w-[16rem] items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="truncate">{chip.label}</span>
                <X className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {/* Canlı bölge her zaman DOM'da kalır (0 filtrede de): kendi flex öğesinde. */}
      <div className="flex shrink-0 items-center gap-2">
        <span aria-live="polite" className="tnum whitespace-nowrap text-sm text-fg-muted">
          {count > 0 ? `${count} filtre etkin` : ''}
        </span>
        {count > 0 && onClearAll ? (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="shrink-0">
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
