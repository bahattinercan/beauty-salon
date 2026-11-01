'use client';

import { cx } from '@/lib/cx';
import type { AppointmentStatus, SalonStatus, UserRole } from '@/lib/enums';
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

/**
 * Harita okumasında kabul edilen en geniş biçim: çözülmüş (`label`) ya da
 * anahtarlı (`labelKey`) girdi. Tanımsız anahtar `undefined` döner — bilinmeyen
 * değer uydurulmaz, `resolveStatusLabel` görünür fallback üretir.
 */
export interface StatusMapLike {
  readonly [value: string]: { readonly label?: string; readonly labelKey?: string; readonly tone: Tone } | undefined;
}

/**
 * Haritaların anahtarları kanonik enum tiplerine `satisfies` ile bağlıdır:
 * `src/lib/enums.ts` içine yeni bir değer eklenirse eksik girdi burada
 * **derleme** hatası verir (test kapısına kalmadan).
 */
export const SALON_STATUS = {
  onaylı: { labelKey: 'ui.badge.salon.approved', tone: 'success' },
  bekliyor: { labelKey: 'ui.badge.salon.pending', tone: 'warning' },
  pasif: { labelKey: 'ui.badge.salon.passive', tone: 'error' },
} satisfies Record<SalonStatus, StatusMeta>;

export const APPOINTMENT_STATUS = {
  PENDING: { labelKey: 'ui.badge.appointment.PENDING', tone: 'warning' },
  CONFIRMED: { labelKey: 'ui.badge.appointment.CONFIRMED', tone: 'info' },
  COMPLETED: { labelKey: 'ui.badge.appointment.COMPLETED', tone: 'success' },
  CANCELLED: { labelKey: 'ui.badge.appointment.CANCELLED', tone: 'error' },
  NO_SHOW: { labelKey: 'ui.badge.appointment.NO_SHOW', tone: 'neutral' },
} satisfies Record<AppointmentStatus, StatusMeta>;

export const USER_ROLE = {
  ADMIN: { labelKey: 'ui.badge.role.ADMIN', tone: 'info' },
  SALON_OWNER: { labelKey: 'ui.badge.role.SALON_OWNER', tone: 'neutral' },
  CUSTOMER: { labelKey: 'ui.badge.role.CUSTOMER', tone: 'neutral' },
} satisfies Record<UserRole, StatusMeta>;

/**
 * Rol etiketlerinin sayfa sözlüğü anahtarları (`pages.users.roles.*`). Rozetin
 * kendi anahtarlarından (`ui.badge.role.*`) ayrı tutulur çünkü kullanıcılar
 * sayfası rol adını kendi namespace'inden basar; ikisi de `LabelKey` tipiyle
 * kanonik rol listesine bağlıdır.
 */
export const ROLE_LABEL_KEYS = {
  ADMIN: 'pages.users.roles.admin',
  SALON_OWNER: 'pages.users.roles.salonOwner',
  CUSTOMER: 'pages.users.roles.customer',
} satisfies Record<UserRole, string>;

/** `useI18n().t` ile yapısal olarak aynı imza (harita yardımcıları React'siz kalsın). */
export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Bilinmeyen değerin görünür etiketi: sözlükten gelen ad + **ham değer** parantez
 * içinde. Ham değer tek başına basılmaz (kullanıcı `NO_SHOW` gibi bir enum adı
 * görmesin) ama teşhis için kaybolmaz (`Bilinmiyor (NO_SHOW)`).
 */
function unknownLabel(value: string, t: TranslateFn, fallbackLabel?: string): string {
  return `${fallbackLabel ?? t('ui.badge.unknown')} (${value})`;
}

/** `labelKey` → aktif dildeki metin. Sözlükte yoksa (`translate` anahtarı döner) fallback. */
function labelFromKey(
  labelKey: string | undefined,
  value: string,
  t: TranslateFn,
  fallbackLabel?: string
): string {
  if (labelKey) {
    const label = t(labelKey);
    if (label !== labelKey) return label;
  }
  return unknownLabel(value, t, fallbackLabel);
}

/**
 * Harita + değer → görünen etiket (tek yardımcı; `StatusBadge` ve sayfalar bunu
 * kullanır). Sıra: hazır `label` → `labelKey` çevirisi → `fallbackLabel` →
 * `ui.badge.unknown`. Hiçbir durumda ham değer tek başına dönmez.
 */
export function resolveStatusLabel(
  map: StatusMapLike,
  value: string,
  t: TranslateFn,
  fallbackLabel?: string
): string {
  const meta = map[value];
  if (meta?.label) return meta.label;
  return labelFromKey(meta?.labelKey, value, t, fallbackLabel);
}

/**
 * Saf yardımcı: anahtarlı haritayı aktif dile çevirir. Sayfalar bunu `useI18n()`
 * ile bir kez (useMemo) üretip `StatusBadge`'e verir; dil değişince harita yenilenir.
 *
 * `labelKeys` verilirse etiket **o** sözlükten okunur (ör. kullanıcılar sayfası
 * `pages.users.roles.*`, randevular `appointments.status.*`); böylece sayfa
 * tarafında anahtar başına elle `{ ...MAP.X, label: t(...) }` yazılmaz.
 */
export function localizeStatusMap(
  map: StatusMapLike,
  t: TranslateFn,
  labelKeys?: Readonly<Record<string, string>>
): LocalizedStatusMap {
  const out: LocalizedStatusMap = {};
  for (const value of Object.keys(map)) {
    const meta = map[value];
    if (!meta) continue;
    out[value] = {
      label: labelFromKey(labelKeys?.[value] ?? meta.labelKey, value, t),
      tone: meta.tone,
    };
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
  // Ton haritadan, etiket `resolveStatusLabel`dan: haritada olmayan değer
  // `ui.badge.unknown (değer)` olarak görünür — boş ya da ham değer sızmaz.
  return <Badge tone={map[value]?.tone ?? 'neutral'}>{resolveStatusLabel(map, value, t, fallbackLabel)}</Badge>;
}
