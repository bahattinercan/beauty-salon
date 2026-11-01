'use client';

import { Eye, EyeOff, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { cx } from '@/lib/cx';
import Button from '@/components/ui/Button';
import { useI18n } from '@/providers/LocaleProvider';

/** Satırda uçuşta olan aksiyon; `null` = hiçbir istek beklemiyor. */
export type ReviewPendingAction = 'reply' | 'visibility' | 'delete' | null;

/**
 * Yorum satırı aksiyonlarının **tek** kaynağı (AP-010, `/reviews` kartları).
 *
 * Sıra SABİTTİR ve sapmaz:
 * - `Detay` (outline, Eye) — her zaman ilk,
 * - `Yanıtla` (outline, MessageSquare) — yanıt varsa metin `Yanıtı düzenle`,
 * - `Gizle` / `Görünür yap` (outline, EyeOff / Eye) — `isVisible` neyse o,
 * - `Sil` (danger, Trash2) — her zaman son.
 *
 * Uçuş kuralı (AppointmentActions ile aynı): buton metni DEĞİŞMEZ (adı değişen
 * kontrol kullanıcıyı şaşırtır), geri bildirim yalnız ikon + `disabled` ile
 * verilir. `disabled` yalnız uçuştaki butona basılır — mesela görünürlük
 * beklerken `Detay` tıklanabilir kalır. Tüm ikonlar `aria-hidden`: erişilebilir
 * ad metinden gelir, ikon adı eklenseydi ad çiftlenirdi.
 */
export default function ReviewActions({
  isVisible,
  hasReply,
  pending = null,
  onDetail,
  onReply,
  onToggleVisibility,
  onDelete,
  className,
}: {
  isVisible: boolean;
  hasReply: boolean;
  pending?: ReviewPendingAction;
  onDetail: () => void;
  onReply: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const replying = pending === 'reply';
  const toggling = pending === 'visibility';
  const deleting = pending === 'delete';

  return (
    <div className={cx('flex flex-wrap items-center justify-end gap-2', className)}>
      <Button variant="outline" size="sm" onClick={onDetail}>
        <Eye className="h-4 w-4" aria-hidden />
        {t('reviews.actions.detail')}
      </Button>

      <Button variant="outline" size="sm" onClick={onReply} disabled={replying}>
        {replying ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <MessageSquare className="h-4 w-4" aria-hidden />
        )}
        {hasReply ? t('reviews.actions.editReply') : t('reviews.actions.reply')}
      </Button>

      <Button variant="outline" size="sm" onClick={onToggleVisibility} disabled={toggling}>
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : isVisible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
        {isVisible ? t('reviews.actions.hide') : t('reviews.actions.makeVisible')}
      </Button>

      <Button variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden />
        )}
        {t('reviews.actions.delete')}
      </Button>
    </div>
  );
}
