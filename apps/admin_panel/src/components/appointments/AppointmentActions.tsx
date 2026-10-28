'use client';

import { CheckCheck, CheckCircle2, Eye, Loader2, UserX, XCircle } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';

export type AppointmentActionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/** Satırda uçuşta olan aksiyon; `null` = hiçbir istek beklemiyor. */
export type AppointmentPendingAction = 'confirm' | 'complete' | 'noShow' | 'cancel' | null;

/**
 * Randevu satırı aksiyonlarının **tek** kaynağı (`/appointments` tablosu).
 *
 * Amaç: `Islemler` kolonu `COMPLETED` / `CANCELLED` / `NO_SHOW` satırlarında
 * boş kalmasın — her satırda en az `Detay` var. Sıra SABİTTİR ve sapmaz:
 * - her durum        → `Detay` (en solda, her zaman),
 * - `PENDING`        → + `Onayla`,
 * - `CONFIRMED`      → + `Tamamla`, `Gelmedi`, `İptal`,
 * - `COMPLETED` / `CANCELLED` / `NO_SHOW` → yalnız `Detay` (geçmiş bir satırda
 *   durum geri alınmaz; salt okunur).
 *
 * Uçuş kuralı (SalonActions ile aynı): buton metni DEĞİŞMEZ (adı değişen kontrol
 * kullanıcıyı şaşırtır), geri bildirim yalnız ikon + `disabled` ile verilir.
 * `disabled` yalnız uçuştaki butona basılır — mesela `İptal` beklerken `Detay`
 * tıklanabilir kalır. Tüm ikonlar `aria-hidden`: erişilebilir ad metinden gelir,
 * ikon adı eklenseydi ad çiftlenirdi.
 */
export default function AppointmentActions({
  status,
  pending = null,
  onDetail,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
  className,
}: {
  status: AppointmentActionStatus;
  pending?: AppointmentPendingAction;
  onDetail: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const confirming = pending === 'confirm';
  const completing = pending === 'complete';
  const markingNoShow = pending === 'noShow';
  const cancelling = pending === 'cancel';

  return (
    <div className={cx('flex flex-wrap items-center justify-end gap-2', className)}>
      <Button variant="outline" size="sm" onClick={onDetail}>
        <Eye className="h-4 w-4" aria-hidden />
        Detay
      </Button>

      {status === 'PENDING' ? (
        <Button variant="primary" size="sm" onClick={onConfirm} disabled={confirming}>
          {confirming ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          )}
          Onayla
        </Button>
      ) : null}

      {status === 'CONFIRMED' ? (
        <>
          <Button variant="primary" size="sm" onClick={onComplete} disabled={completing}>
            {completing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden />
            )}
            Tamamla
          </Button>

          <Button variant="outline" size="sm" onClick={onNoShow} disabled={markingNoShow}>
            {markingNoShow ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <UserX className="h-4 w-4" aria-hidden />
            )}
            Gelmedi
          </Button>

          <Button variant="danger" size="sm" onClick={onCancel} disabled={cancelling}>
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden />
            )}
            İptal
          </Button>
        </>
      ) : null}
    </div>
  );
}
