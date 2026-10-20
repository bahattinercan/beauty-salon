'use client';

import { Star, Store, MapPin } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Card } from '@/components/ui/Card';
import { SALON_STATUS, StatusBadge } from '@/components/ui/Badge';

/**
 * Foto yokken tasarım "bitmemiş" görünmemeli (CA-019 WP0 dersi). Renk id hash'i
 * ile deterministiktir; hex yazılmaz, token karışımı kullanılır → her iki temada
 * da okunur kalır.
 */
function hashInt(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function SalonMedia({
  id,
  src,
  alt,
  className,
}: {
  id: string;
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- API göreli /uploads yolu dönebiliyor; next/image konfigürasyonu kapsam dışı
    return <img src={src} alt={alt} loading="lazy" className={cx('h-full w-full object-cover', className)} />;
  }
  const hueMix = 12 + (hashInt(id) % 5) * 9; // 12..48
  return (
    <div
      role="img"
      aria-label={`${alt} — görsel yok`}
      className={cx('flex h-full w-full items-center justify-center', className)}
      style={{
        background:
          `linear-gradient(135deg, color-mix(in srgb, var(--primary) ${hueMix}%, var(--hero-surface))),` +
          `var(--hero-surface)`,
      }}
    >
      <Store className="h-10 w-10 text-primary/60" aria-hidden />
    </div>
  );
}

export default function SalonCard({
  salon,
  actions,
}: {
  salon: {
    id: string;
    name: string;
    status: string;
    city?: string | null;
    district?: string | null;
    rating?: number | null;
    reviewCount?: number;
    coverImageUrl?: string | null;
    logoUrl?: string | null;
    /** Sayfa tarafında hesaplanır — render sırasında Date.now() saf değildir. */
    isNew?: boolean;
    owner?: string;
  };
  actions?: React.ReactNode;
}) {
  const where = [salon.district, salon.city].filter(Boolean).join(', ');
  const isNew = !!salon.isNew;
  const rating = typeof salon.rating === 'number' ? salon.rating : null;

  return (
    <Card as="article" className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full">
        <SalonMedia
          id={salon.id}
          src={salon.coverImageUrl || salon.logoUrl}
          alt={salon.name}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {where ? (
            <span className="chip-dark">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              <span className="max-w-[10rem] truncate">{where}</span>
            </span>
          ) : null}
          {isNew ? (
            // Lime yalnızca dolgudur; üstünde koyu token metin var.
            <span className="badge-lime">Yeni</span>
          ) : null}
        </div>
        {rating !== null ? (
          <span className="chip-dark absolute bottom-3 right-3">
            <Star className="h-3.5 w-3.5" aria-hidden />
            <span className="tnum">{rating.toFixed(1)}</span>
            {salon.reviewCount ? (
              <span className="text-on-nav-pill-muted">({salon.reviewCount})</span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold text-fg">{salon.name}</h3>
          {salon.owner ? (
            <p className="mt-0.5 truncate text-sm text-fg-muted">{salon.owner}</p>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <StatusBadge map={SALON_STATUS} value={salon.status} />
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </Card>
  );
}
