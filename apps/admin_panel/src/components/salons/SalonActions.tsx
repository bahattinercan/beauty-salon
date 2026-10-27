'use client';

import { CheckCircle, Loader2, Pencil, Power, XCircle } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';

export type SalonActionStatus = 'onaylı' | 'bekliyor' | 'pasif';

/** Satırda uçuşta olan aksiyon: `verify` (Onayla) veya `toggle` (Pasife al / Etkinleştir). */
export type SalonPendingAction = 'verify' | 'toggle' | null;

/**
 * AP-007 W3 — salon satırı/kartı aksiyonlarının **tek** kaynağı (plan §5.4).
 *
 * Sıra sabittir: `Düzenle` en solda, ardından duruma göre durum aksiyonu.
 * Kullanıcı kararı (plan §5.4 tablosu, "tek buton" cümlesi geçersiz):
 * - `bekliyor` → Düzenle + Onayla + Pasife al (üç buton; bekleyen salonu
 *   reddetmek gerçek bir ihtiyaç, kaldırılırsa yetenek kaybı olur),
 * - `onaylı`   → Düzenle + Pasife al,
 * - `pasif`    → Düzenle + Etkinleştir.
 *
 * Buton metni uçuş sırasında DEĞİŞMEZ (adı değişen kontrol kullanıcıyı
 * şaşırtır); geri bildirim ikon + `disabled` ile verilir. Tablo ve kart aynı
 * bileşeni kullanır → çift render yok.
 */
export default function SalonActions({
  status,
  pending = null,
  onEdit,
  onVerify,
  onDeactivate,
  onActivate,
  className,
}: {
  status: SalonActionStatus;
  pending?: SalonPendingAction;
  onEdit: () => void;
  onVerify: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  className?: string;
}) {
  const verifying = pending === 'verify';
  const toggling = pending === 'toggle';

  return (
    <div className={cx('flex flex-wrap items-center justify-end gap-2', className)}>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="h-4 w-4" aria-hidden />
        Düzenle
      </Button>

      {status === 'bekliyor' ? (
        <Button variant="primary" size="sm" onClick={onVerify} disabled={verifying}>
          {verifying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="h-4 w-4" aria-hidden />
          )}
          Onayla
        </Button>
      ) : null}

      {status === 'pasif' ? (
        <Button variant="outline" size="sm" onClick={onActivate} disabled={toggling}>
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Power className="h-4 w-4" aria-hidden />
          )}
          Etkinleştir
        </Button>
      ) : (
        <Button variant="danger" size="sm" onClick={onDeactivate} disabled={toggling}>
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden />
          )}
          Pasife al
        </Button>
      )}
    </div>
  );
}
