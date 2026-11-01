'use client';

import { useMemo } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { StatusBadge, APPOINTMENT_STATUS, localizeStatusMap } from '@/components/ui/Badge';
import type { Locale } from '@/lib/i18n';
import { useI18n } from '@/providers/LocaleProvider';

/**
 * Randevu detay modalı **salt okunurdur**: ağ çağrısı, form ve kaydet yoktur.
 * Veri zaten tablo satırından gelir (`GET /admin/appointments` satırı), bu yüzden
 * diyalog kendi fetch'ini yapmaz.
 *
 * Etiketler `appointments.detail.*`, durum rozeti `ui.badge.appointment.*`
 * anahtarlarından çevrilir; renk tonu paylaşılan `APPOINTMENT_STATUS` haritasında kalır.
 * Harita `localizeStatusMap` ile üretilir: değer başına elle girdi yok, bilinmeyen
 * değer `resolveStatusLabel` üzerinden görünür fallback'e düşer.
 */
export interface AppointmentDetail {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customer?: { fullName: string; email: string };
  salon?: { name: string };
  staff?: { fullName: string };
  service?: { name: string; price: number };
  note?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
}

const EMPTY = '—';

function money(value: number, locale: Locale = 'tr'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * DATEONLY alanları (`YYYY-MM-DD`) **yerel** güne çevrilir: `new Date('2026-09-30')`
 * UTC gece yarısı okur ve negatif saat dilimlerinde bir gün geriye kayar.
 */
function formatDate(value: string, locale: Locale = 'tr'): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </>
  );
}

export default function AppointmentDetailDialog({
  open,
  appointment,
  onClose,
}: {
  open: boolean;
  appointment: AppointmentDetail | null;
  onClose: () => void;
}) {
  const { locale, t } = useI18n();
  // Rozet etiketi aktif dile çevrilir, ton paylaşılan haritadan gelir (Badge değişmez).
  const statusMap = useMemo(() => localizeStatusMap(APPOINTMENT_STATUS, t), [t]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('appointments.detail.title')}
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('appointments.detail.close')}
        </Button>
      }
    >
      {appointment ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          <Row label={t('appointments.detail.customer')}>
            {appointment.customer ? (
              <>
                <span>{appointment.customer.fullName}</span>
                <span className="block text-sm font-normal text-fg-muted">
                  {appointment.customer.email}
                </span>
              </>
            ) : (
              EMPTY
            )}
          </Row>
          <Row label={t('appointments.detail.salon')}>{appointment.salon?.name ?? EMPTY}</Row>
          <Row label={t('appointments.detail.service')}>{appointment.service?.name ?? EMPTY}</Row>
          <Row label={t('appointments.detail.staff')}>{appointment.staff?.fullName ?? EMPTY}</Row>
          <Row label={t('appointments.detail.when')}>
            {`${formatDate(appointment.date, locale)} ${appointment.startTime.slice(0, 5)}–${appointment.endTime.slice(0, 5)}`}
          </Row>
          <Row label={t('appointments.detail.price')}>
            {typeof appointment.service?.price === 'number' ? money(appointment.service.price, locale) : EMPTY}
          </Row>
          <Row label={t('appointments.detail.status')}>
            <StatusBadge map={statusMap} value={appointment.status} />
          </Row>
          <Row label={t('appointments.detail.note')}>{appointment.note ?? EMPTY}</Row>
          {appointment.status === 'CANCELLED' ? (
            <Row label={t('appointments.detail.cancellationReason')}>{appointment.cancellationReason ?? EMPTY}</Row>
          ) : null}
          <Row label={t('appointments.detail.createdAt')}>
            {appointment.createdAt ? formatDate(appointment.createdAt, locale) : EMPTY}
          </Row>
        </dl>
      ) : null}
    </Dialog>
  );
}
