'use client';

import { cx } from '@/lib/cx';
import { Input, Toggle } from '@/components/ui/Field';
import { useI18n } from '@/providers/LocaleProvider';

export type WorkingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DayHours {
  open: string;
  close: string;
}

/**
 * Veri biçimi seed ile birebir aynıdır (`apps/api/src/seeders/seed.js:77`):
 * `{ monday: { open: '09:00', close: '18:00' }, … }`. Kapalı gün anahtar
 * olarak **yazılmaz** — API tarafında "o gün hiç çalışmıyor" demek.
 */
export type WorkingHours = Partial<Record<WorkingDay, DayHours>>;

/**
 * Gün listesi: `key` veri anahtarı (API/seed), `labelKey` görünen adın sözlük anahtarı
 * (`salons.workingHours.days.*`). Metin bileşende `t()` ile basılır; `SalonEditDialog`
 * doğrulama mesajları da aynı anahtarı kullanır.
 */
export const WORKING_DAYS: { key: WorkingDay; labelKey: string }[] = [
  { key: 'monday', labelKey: 'salons.workingHours.days.monday' },
  { key: 'tuesday', labelKey: 'salons.workingHours.days.tuesday' },
  { key: 'wednesday', labelKey: 'salons.workingHours.days.wednesday' },
  { key: 'thursday', labelKey: 'salons.workingHours.days.thursday' },
  { key: 'friday', labelKey: 'salons.workingHours.days.friday' },
  { key: 'saturday', labelKey: 'salons.workingHours.days.saturday' },
  { key: 'sunday', labelKey: 'salons.workingHours.days.sunday' },
];

/** Anahtarı yeni açılan günün varsayılanı (plan §5.1). */
export const DEFAULT_DAY_HOURS: DayHours = { open: '09:00', close: '18:00' };

const TIME_COLUMN = 'w-[7.5rem] shrink-0';

/**
 * AP-007 W2 — 7 gün × (kapalı anahtarı + açılış/kapanış saati).
 *
 * Kontrollü bileşen: kendi state'i yok, her değişiklik `onChange` ile bir
 * üstteki forma (SalonEditDialog) bildirilir. `value` hiç değiştirilmez;
 * her çağrıda yeni nesne döner (React state ezilmesini önler).
 */
export default function WorkingHoursEditor({
  value,
  onChange,
  className,
}: {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
  className?: string;
}) {
  const patchDay = (day: WorkingDay, next: DayHours | null) => {
    const copy: WorkingHours = { ...value };
    if (next) copy[day] = next;
    else delete copy[day];
    onChange(copy);
  };

  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('salons.workingHours.group')}
      className={cx('space-y-1', className)}
    >
      <div className="flex items-center gap-2 px-1 text-xs font-semibold text-fg-muted">
        <span className="min-w-0 flex-1">{t('salons.workingHours.day')}</span>
        <span className="w-14 text-center">{t('salons.workingHours.open')}</span>
        <span className={cx(TIME_COLUMN, 'text-center')}>{t('salons.workingHours.opens')}</span>
        <span className={cx(TIME_COLUMN, 'text-center')}>{t('salons.workingHours.closes')}</span>
      </div>
      {WORKING_DAYS.map(({ key, labelKey }) => {
        const label = t(labelKey);
        const hours = value[key];
        const open = Boolean(hours);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-fg">{label}</span>
            <Toggle
              checked={open}
              onChange={(next) => patchDay(key, next ? (hours ?? DEFAULT_DAY_HOURS) : null)}
              label={t('salons.workingHours.dayToggle', { day: label })}
            />
            <Input
              type="time"
              className={TIME_COLUMN}
              aria-label={t('salons.workingHours.openTime', { day: label })}
              value={hours?.open ?? ''}
              disabled={!open}
              onChange={(e) => patchDay(key, { open: e.target.value, close: hours?.close ?? DEFAULT_DAY_HOURS.close })}
            />
            <Input
              type="time"
              className={TIME_COLUMN}
              aria-label={t('salons.workingHours.closeTime', { day: label })}
              value={hours?.close ?? ''}
              disabled={!open}
              onChange={(e) => patchDay(key, { open: hours?.open ?? DEFAULT_DAY_HOURS.open, close: e.target.value })}
            />
          </div>
        );
      })}
    </div>
  );
}
