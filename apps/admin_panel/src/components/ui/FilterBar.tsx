'use client';

import { cx } from '@/lib/cx';

/**
 * AP-007 W2 — tek satır filtre çubuğu kabuğu (plan §5.1, §5.3).
 *
 * Yalnız dizilim bilir, sayfa mantığı bilmez (state/URL/debounce W3'te kalır):
 * - Kök ve tüm doğrudan çocuklar `min-w-0` alır (`min-w-0`, `[&>*]`): flex
 *   öğesinin varsayılan `min-width:auto` değeri daralmayı engelleyip çubuğu
 *   (ve dolayısıyla sayfayı) yatay taşırıyordu.
 * - `leading` arama yuvası: `flex-1` + `min-w-[12rem]` → geniş ekranda kalan
 *   alanı doldurur, dar ekranda 12rem'in altına inmez (sözleşme: FilterBar testi).
 *   İçindeki kontrolün kendi alt sınırı ayrıca geçerlidir (sayfa: `min-w-[8rem]`).
 * - `trailing` sağ grup (select/toggle): `shrink-0` → dar ekranda ezilmez.
 * - `lg:flex-nowrap`: ≥1024px'te tek satır (H1 ölçütü), altında `flex-wrap`
 *   ile sarar — 390px'te kontroller tek satıra sığmaz (kabul istisnası, §5.3).
 *
 * `children` sarmalanmadan basılır: `flex-wrap` modunda her kontrol kendi
 * kendine sarabilsin diye (tek grup olarak sararsa 390px'te taşardı).
 */
export default function FilterBar({
  leading,
  trailing,
  children,
  className,
  ariaLabel = 'Filtre çubuğu',
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx(
        'flex min-w-0 flex-wrap items-center gap-2 [&>*]:min-w-0 lg:flex-nowrap',
        className
      )}
    >
      {leading ? (
        // `[&>*]:min-w-0` alt öğelerde `min-width:0` zorluyor ve yuvanın plan §5.1'deki
        // tabanını (min-w-[12rem]) eziyordu: arama 65px'e çöküp input komşusunun üzerine
        // biniyordu. `!` yuvanın tabanını geri kazandırır; daralma flex-1 ile sürer (AP-007).
        <div className="flex !min-w-[12rem] flex-1 items-center">{leading}</div>
      ) : null}
      {children}
      {trailing ? <div className="flex min-w-0 shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
}
