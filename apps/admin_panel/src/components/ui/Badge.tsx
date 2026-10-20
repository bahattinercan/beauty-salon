import { cx } from '@/lib/cx';

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
// Panelin kendi durum sözlükleri (salons/page.tsx 'onaylı'…; API enum 'PENDING'…).
export const SALON_STATUS: Record<string, { label: string; tone: Tone }> = {
  onaylı: { label: 'Onaylı', tone: 'success' },
  bekliyor: { label: 'Bekliyor', tone: 'warning' },
  pasif: { label: 'Pasif', tone: 'error' },
};

export const APPOINTMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  CONFIRMED: { label: 'Onaylandı', tone: 'info' },
  COMPLETED: { label: 'Tamamlandı', tone: 'success' },
  CANCELLED: { label: 'İptal Edildi', tone: 'error' },
  NO_SHOW: { label: 'Gelmedi', tone: 'neutral' },
};

export const USER_ROLE: Record<string, { label: string; tone: Tone }> = {
  ADMIN: { label: 'Admin', tone: 'info' },
  SALON_OWNER: { label: 'Salon Sahibi', tone: 'neutral' },
  CUSTOMER: { label: 'Müşteri', tone: 'neutral' },
};

export function StatusBadge({
  map,
  value,
  fallbackLabel,
}: {
  map: Record<string, { label: string; tone: Tone }>;
  value: string;
  fallbackLabel?: string;
}) {
  const hit = map[value];
  return <Badge tone={hit?.tone ?? 'neutral'}>{hit?.label ?? fallbackLabel ?? value}</Badge>;
}
