import { Star } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useI18n } from '@/providers/LocaleProvider';

/**
 * Puan göstergesi (AP-010): beş yıldız, `rating` adedi dolu.
 *
 * Çıktı `/reviews` sayfasındaki yerel `Stars` ile **birebir aynıdır** (aynı
 * sınıflar, aynı `aria-label`): kart ve detay modalı aynı puanı gösterirken
 * görsel fark olmaması için tek yere taşındı. Yıldızlar `aria-hidden` —
 * erişilebilir ad `aria-label`dan gelir, ikon adları eklenseydi puan iki kez
 * okunurdu.
 */
export default function Stars({ rating }: { rating: number }) {
  const { t } = useI18n();

  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={t('reviews.rating.stars', { rating })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx('h-4 w-4', i <= rating ? 'fill-warning text-warning' : 'text-border-strong')}
          aria-hidden
        />
      ))}
    </span>
  );
}
