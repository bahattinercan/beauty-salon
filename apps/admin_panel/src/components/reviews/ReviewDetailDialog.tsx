'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Stars from '@/components/reviews/Stars';
import type { Locale } from '@/lib/i18n';
import { useI18n } from '@/providers/LocaleProvider';

/**
 * Yorum detay modalı **salt okunurdur** (AP-010): ağ çağrısı, form ve kaydet
 * yoktur. Veri kart satırından gelir (`GET /admin/reviews` satırı), bu yüzden
 * diyalog kendi fetch'ini yapmaz; yanıt düzenleme ve görünürlük işlemleri
 * `ReviewActions` üzerinden sayfada kalır.
 *
 * `review` yoksa (satır seçilmeden kapandıysa) `open` doğru olsa bile **hiçbir
 * şey** basılmaz — yarısı dolu bir modal kullanıcıyı yanıltır.
 */
export interface ReviewDetail {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  salonReply: string | null;
  salonReplyAt: string | null;
  createdAt: string;
  customerName: string;
  salonName: string;
  images?: string[];
}

const EMPTY = '—';

/** ISO tarih → aktif dilde uzun biçim (`20 Eylül 2026` / `September 20, 2026`); bozuksa ham değer basılır. */
function formatDate(value: string, locale: Locale = 'tr'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </>
  );
}

export default function ReviewDetailDialog({
  review,
  open,
  onClose,
}: {
  review: ReviewDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  // Kanca `review` null olsa da çağrılır: koşullu kanca kuralı ihlal edilmez.
  const { locale, t } = useI18n();

  if (!review) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('reviews.detail.title')}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('reviews.detail.close')}
        </Button>
      }
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
        <Row label={t('reviews.detail.customer')}>{review.customerName || EMPTY}</Row>
        <Row label={t('reviews.detail.salon')}>{review.salonName || EMPTY}</Row>
        <Row label={t('reviews.detail.rating')}>
          <Stars rating={review.rating} />
        </Row>
        <Row label={t('reviews.detail.createdAt')}>{formatDate(review.createdAt, locale)}</Row>
        <Row label={t('reviews.detail.visibility')}>
          {/* Rozet rengi de bilgi taşır: görünür yeşil, gizli nötr. */}
          <Badge tone={review.isVisible ? 'success' : 'neutral'}>
            {review.isVisible
              ? t('reviews.visibility.visible')
              : t('reviews.visibility.hidden')}
          </Badge>
        </Row>
      </dl>

      {review.comment ? (
        <p className="mt-4 text-sm leading-relaxed text-fg">{review.comment}</p>
      ) : (
        <p className="mt-4 text-sm italic text-fg-muted">{t('reviews.card.noComment')}</p>
      )}

      {review.images && review.images.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {review.images.map((src, index) => (
            <li key={`${review.id}-img-${index}`}>
              {/* Alt metni zorunlu: ekran okuyucu görselin hangi yoruma ait olduğunu söyler. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- yorum görselleri harici URL'den geliyor; next/image alan adı konfigürasyonu ister (kapsam dışı) */}
              <img
                src={src}
                alt={t('reviews.detail.imageAlt', {
                  customer: review.customerName,
                  index: index + 1,
                })}
                className="h-20 w-20 rounded-field border border-border object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {review.salonReply ? (
        <div className="mt-4 rounded-field border-l-2 border-primary bg-surface-variant p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {t('reviews.card.salonReply')}
          </p>
          <p className="mt-1 text-sm text-fg">{review.salonReply}</p>
          {review.salonReplyAt ? (
            <p className="mt-1 text-xs text-fg-muted">{formatDate(review.salonReplyAt, locale)}</p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
