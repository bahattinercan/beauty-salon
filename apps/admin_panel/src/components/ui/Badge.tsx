'use client';

import { cx } from '@/lib/cx';
import { useI18n } from '@/providers/LocaleProvider';

export type Tone = 'success' | 'error' | 'warning' | 'info' | 'neutral';

/**
 * Rozetler tema token'larından türetilir (globals.css @utility badge-*), bu yüzden
 * `dark:` yazılmaz ve durum rengi her iki temada da okunabilir kalır.
 */
const TONES: Record<Tone, string> = {
  success: 'badge-success',
  error: 'badge-error',
  warning: 'badge-warning',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export default function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cx(TONES[tone], className)}>{children}</span>;
}

/* --- Panel durumlarının tek eşlemesi (3 sayfada aynı sözlük tekrarlanmasın) --- */

/**
 * Durum haritası girdisi: **etiket metni değil çeviri anahtarı** + renk tonu.
 * Harita böylece dile bağlı olmayan saf veri kalır; etiketi basan taraf
 * (`StatusBadge` ya da sayfanın kendi `t()` çağrısı) çeviriyi uygular.
 */
export interface StatusMeta {
  labelKey: string;
  tone: Tone;
}

/** Etiketi henüz çözülmemiş durum haritası (paylaşılan sözlükler bu tipte). */
export type StatusMap = Record<string, StatusMeta>;

/** Etiketi sayfada `t()` ile çözülmüş harita (eski `{ label, tone }` biçimi). */
export type LocalizedStatusMap = Record<string, { label: string; tone: Tone }>;

/** `StatusBadge`'in kabul ettiği en geniş biçim: çözülmüş ya da anahtarlı. */
export type StatusMapLike = Record<string, { label?: string; labelKey?: string; tone: Tone }>;

// Panelin kendi durum sözlükleri (salons/page.tsx 'onaylı'…; API enum 'PENDING'…).
export const SALON_STATUS: StatusMap = {
  onaylı: { labelKey: 'ui.badge.salon.approved', tone: 'success' },
  bekliyor: { labelKey: 'ui.badge.salon.pending', tone: 'warning' },
  pasif: { labelKey: 'ui.badge.salon.passive', tone: 'error' },
};

export const APPOINTMENT_STATUS: StatusMap = {
  PENDING: { labelKey: 'ui.badge.appointment.PENDING', tone: 'warning' },
  CONFIRMED: { labelKey: 'ui.badge.appointment.CONFIRMED', tone: 'info' },
  COMPLETED: { labelKey: 'ui.badge.appointment.COMPLETED', tone: 'success' },
  CANCELLED: { labelKey: 'ui.badge.appointment.CANCELLED', tone: 'error' },
  NO_SHOW: { labelKey: 'ui.badge.appointment.NO_SHOW', tone: 'neutral' },
};

export const USER_ROLE: StatusMap = {
  ADMIN: { labelKey: 'ui.badge.role.ADMIN', tone: 'info' },
  SALON_OWNER: { labelKey: 'ui.badge.role.SALON_OWNER', tone: 'neutral' },
  CUSTOMER: { labelKey: 'ui.badge.role.CUSTOMER', tone: 'neutral' },
};

/**
 * Saf yardımcı: anahtarlı haritayı aktif dile çevirir. Sayfalar bunu `useI18n()`
 * ile bir kez (useMemo) üretip `StatusBadge`'e verir; dil değişince harita yenilenir.
 */
export function localizeStatusMap(map: StatusMap, t: (key: string) => string): LocalizedStatusMap {
  const out: LocalizedStatusMap = {};
  for (const value of Object.keys(map)) {
    out[value] = { label: t(map[value].labelKey), tone: map[value].tone };
  }
  return out;
}

export function StatusBadge({
  map,
  value,
  fallbackLabel,
}: {
  map: StatusMapLike;
  value: string;
  fallbackLabel?: string;
}) {
  const { t } = useI18n();
  const hit = map[value];
  // Çözülmüş etiket varsa aynen basılır (prop metni değişmez); yoksa haritanın
  // `labelKey`'i aktif dile çevrilir. Haritada hiç yoksa ham değer görünür.
  const label =
    hit?.label ??
    (hit?.labelKey ? t(hit.labelKey) : undefined) ??
    fallbackLabel ??
    value;

  return <Badge tone={hit?.tone ?? 'neutral'}>{label}</Badge>;
}
