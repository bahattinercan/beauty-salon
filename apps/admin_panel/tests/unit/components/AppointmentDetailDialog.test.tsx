/**
 * AP-008 W2 — `components/appointments/AppointmentDetailDialog.tsx`
 *
 * Sözleşme: diyalog **salt okunurdur** — ağ çağrısı, form, kaydet yoktur.
 * Bu yüzden burada `@/lib/api` mock'lanmaz; testin kanıtı, render edilen
 * etiket/değer çiftleri ve tek eylem olan "Kapat"ın `onClose` çağırmasıdır.
 *
 * `İptal nedeni` satırı yalnız `status === 'CANCELLED'` iken basılır.
 * Para biriminde tam sembol iddia edilmez (ICU sürümüne göre değişir), yalnız
 * sayının kendisi (`750`) aranır.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AppointmentDetailDialog, {
  type AppointmentDetail,
} from '@/components/appointments/AppointmentDetailDialog';

const appointment: AppointmentDetail = {
  id: 'appointment-1',
  date: '2026-09-30',
  startTime: '10:00:00',
  endTime: '10:45:00',
  status: 'COMPLETED',
  customer: { fullName: 'Zeynep Kaya', email: 'customer@test.com' },
  salon: { name: 'Elegance Beauty Studio' },
  staff: { fullName: 'Merve Demir' },
  service: { name: 'Saç Kesimi', price: 750 },
  note: 'Kısa kesim istendi',
  cancellationReason: null,
  createdAt: '2026-09-20T08:30:00.000Z',
};

function renderDialog(overrides: Partial<AppointmentDetail> = {}, open = true) {
  const onClose = vi.fn();
  const utils = render(
    <AppointmentDetailDialog
      open={open}
      appointment={{ ...appointment, ...overrides }}
      onClose={onClose}
    />
  );
  return { onClose, ...utils };
}

const valueOf = (label: string) => {
  const dt = screen.getByText(label);
  expect(dt.tagName).toBe('DT');
  return dt.nextElementSibling?.textContent ?? '';
};

describe('AppointmentDetailDialog — kapalıyken', () => {
  test('open=false iken hiçbir düğüm basmaz', () => {
    const { container } = renderDialog({}, false);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('Randevu detayı')).toBeNull();
  });
});

describe('AppointmentDetailDialog — açıkken', () => {
  test('randevu yoksa gövde boş basılır, diyalog patlamaz', () => {
    render(<AppointmentDetailDialog open appointment={null} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Randevu detayı' })).toBeTruthy();
    expect(document.querySelector('dl')).toBeNull();
    expect(screen.queryByText('Müşteri')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Kapat' })).toHaveLength(3);
  });

  test('tam randevuda tüm etiketler ve değerler görünür', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Randevu detayı' })).toBeTruthy();
    const labels = [
      'Müşteri',
      'Salon',
      'Hizmet',
      'Personel',
      'Tarih / Saat',
      'Tutar',
      'Durum',
      'Not',
      'Oluşturma',
    ];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeTruthy();
    }

    expect(valueOf('Müşteri')).toContain('Zeynep Kaya');
    expect(valueOf('Müşteri')).toContain('customer@test.com');
    expect(valueOf('Salon')).toBe('Elegance Beauty Studio');
    expect(valueOf('Hizmet')).toBe('Saç Kesimi');
    expect(valueOf('Personel')).toBe('Merve Demir');
    expect(valueOf('Tarih / Saat')).toContain('30 Eyl 2026');
    expect(valueOf('Tarih / Saat')).toContain('10:00–10:45');
    expect(valueOf('Tutar')).toContain('750');
    expect(valueOf('Not')).toBe('Kısa kesim istendi');
    expect(valueOf('Oluşturma')).toBe('20 Eyl 2026');
  });

  test('durum rozeti APPOINTMENT_STATUS sözlüğünü kullanır', () => {
    const { unmount } = renderDialog({ status: 'COMPLETED' });
    expect(valueOf('Durum')).toBe('Tamamlandı');
    unmount();

    renderDialog({ status: 'NO_SHOW' });
    expect(valueOf('Durum')).toBe('Gelmedi');
  });

  test('not null ise Not satırında tire basılır', () => {
    renderDialog({ note: null });

    expect(valueOf('Not')).toBe('—');
  });

  test('İptal nedeni yalnız CANCELLED durumunda basılır', () => {
    const { unmount } = renderDialog({
      status: 'CANCELLED',
      cancellationReason: 'Müşteri talebiyle iptal edildi',
    });
    expect(screen.getByText('İptal nedeni')).toBeTruthy();
    expect(valueOf('İptal nedeni')).toBe('Müşteri talebiyle iptal edildi');
    unmount();

    renderDialog({ status: 'COMPLETED', cancellationReason: 'Müşteri talebiyle iptal edildi' });
    expect(screen.queryByText('İptal nedeni')).toBeNull();
  });

  test('Kapat düğmesi onClose çağırır', async () => {
    const { onClose } = renderDialog();
    const user = userEvent.setup();

    // scrim + başlıktaki X + footer'daki "Kapat": üçü de aynı erişilebilir ada sahip.
    const buttons = screen.getAllByRole('button', { name: 'Kapat' });
    expect(buttons).toHaveLength(3);
    await user.click(buttons[2]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
