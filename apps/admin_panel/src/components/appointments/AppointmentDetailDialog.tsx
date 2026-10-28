'use client';

import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { StatusBadge, APPOINTMENT_STATUS } from '@/components/ui/Badge';

/**
 * Randevu detay modalı **salt okunurdur**: ağ çağrısı, form ve kaydet yoktur.
 * Veri zaten tablo satırından gelir (`GET /admin/appointments` satırı), bu yüzden
 * diyalog kendi fetch'ini yapmaz.
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

function money(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * DATEONLY alanları (`YYYY-MM-DD`) **yerel** güne çevrilir: `new Date('2026-09-30')`
 * UTC gece yarısı okur ve negatif saat dilimlerinde bir gün geriye kayar.
 */
function formatDate(value: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Randevu detayı"
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Kapat
        </Button>
      }
    >
      {appointment ? (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          <Row label="Müşteri">
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
          <Row label="Salon">{appointment.salon?.name ?? EMPTY}</Row>
          <Row label="Hizmet">{appointment.service?.name ?? EMPTY}</Row>
          <Row label="Personel">{appointment.staff?.fullName ?? EMPTY}</Row>
          <Row label="Tarih / Saat">
            {`${formatDate(appointment.date)} ${appointment.startTime.slice(0, 5)}–${appointment.endTime.slice(0, 5)}`}
          </Row>
          <Row label="Tutar">
            {typeof appointment.service?.price === 'number' ? money(appointment.service.price) : EMPTY}
          </Row>
          <Row label="Durum">
            <StatusBadge map={APPOINTMENT_STATUS} value={appointment.status} />
          </Row>
          <Row label="Not">{appointment.note ?? EMPTY}</Row>
          {appointment.status === 'CANCELLED' ? (
            <Row label="İptal nedeni">{appointment.cancellationReason ?? EMPTY}</Row>
          ) : null}
          <Row label="Oluşturma">
            {appointment.createdAt ? formatDate(appointment.createdAt) : EMPTY}
          </Row>
        </dl>
      ) : null}
    </Dialog>
  );
}
