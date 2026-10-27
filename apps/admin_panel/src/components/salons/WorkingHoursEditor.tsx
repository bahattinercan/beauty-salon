'use client';

import { cx } from '@/lib/cx';
import { Input, Toggle } from '@/components/ui/Field';

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

export const WORKING_DAYS: { key: WorkingDay; label: string }[] = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
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

  return (
    <div
      role="group"
      aria-label="Çalışma saatleri"
      className={cx('space-y-1', className)}
    >
      <div className="flex items-center gap-2 px-1 text-xs font-semibold text-fg-muted">
        <span className="min-w-0 flex-1">Gün</span>
        <span className="w-14 text-center">Açık</span>
        <span className={cx(TIME_COLUMN, 'text-center')}>Açılış</span>
        <span className={cx(TIME_COLUMN, 'text-center')}>Kapanış</span>
      </div>
      {WORKING_DAYS.map(({ key, label }) => {
        const hours = value[key];
        const open = Boolean(hours);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-fg">{label}</span>
            <Toggle
              checked={open}
              onChange={(next) => patchDay(key, next ? (hours ?? DEFAULT_DAY_HOURS) : null)}
              label={`${label} açık`}
            />
            <Input
              type="time"
              className={TIME_COLUMN}
              aria-label={`${label} açılış saati`}
              value={hours?.open ?? ''}
              disabled={!open}
              onChange={(e) => patchDay(key, { open: e.target.value, close: hours?.close ?? DEFAULT_DAY_HOURS.close })}
            />
            <Input
              type="time"
              className={TIME_COLUMN}
              aria-label={`${label} kapanış saati`}
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
