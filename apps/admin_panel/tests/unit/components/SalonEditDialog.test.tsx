/**
 * AP-007 W3 — `components/salons/SalonEditDialog.tsx`
 *
 * Sözleşme (plan §5.1, §5.4, R6): kaydet → `PATCH /salons/:id`; `workingHours`
 * **nesne** olarak gider (çift stringify yok), kapalı gün anahtar olarak
 * yazılmaz, **e-posta gövdeye girmez** (OTP akışı), geçersiz form istek atmaz.
 *
 * `@/lib/api` mock'lanır: diyalog kendi ağ katmanını çağırır, test gövdeyi
 * doğrudan okur. `next/navigation` gerekmez (diyalog yönlendirme yapmaz).
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SalonEditDialog, { type SalonEditSource } from '@/components/salons/SalonEditDialog';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiFetch: apiFetchMock, uploadFile: vi.fn() }));

const salon: SalonEditSource = {
  id: 'salon-1',
  name: 'Élégance Beauty',
  phone: '+902161234567',
  description: 'Saç ve cilt bakımı',
  address: 'Bağdat Cad. No:12',
  city: 'İstanbul',
  district: 'Kadıköy',
  latitude: 40.9905,
  longitude: 29.027,
  workingHours: {
    monday: { open: '09:00', close: '18:00' },
    sunday: { open: '10:00', close: '16:00' },
  },
  logoUrl: '/uploads/logo.png',
  coverImageUrl: null,
  galleryImages: ['/uploads/galeri-1.png'],
};

function renderDialog(overrides: Partial<SalonEditSource> = {}) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(
    <SalonEditDialog
      open
      salon={{ ...salon, ...overrides }}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
  return { onSaved, onClose };
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

/** `Field` etiketi `required` iken " *" ekler → metin eşleşmesi baştan aranır. */
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;

const lastBody = (): Record<string, unknown> => {
  const call = apiFetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(String(call[1].body)) as Record<string, unknown>;
};

describe('SalonEditDialog', () => {
  beforeEach(() => {
    apiFetchMock.mockResolvedValue({ success: true, data: { id: salon.id } });
  });

  test('satırın değerleriyle dolar ve e-posta alanı İÇERMEZ', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Salonu düzenle' })).toBeTruthy();
    expect(field(/^Salon adı/).value).toBe('Élégance Beauty');
    expect(field(/^Telefon/).value).toBe('+902161234567');
    expect(field(/^Adres/).value).toBe('Bağdat Cad. No:12');
    expect(field(/^Şehir/).value).toBe('İstanbul');
    expect(field(/^İlçe/).value).toBe('Kadıköy');
    expect(field(/^Enlem/).value).toBe('40.9905');
    expect(field(/^Boylam/).value).toBe('29.027');

    // E-posta OTP akışında; bu formda bilinçli olarak yok (plan §10).
    expect(screen.queryByLabelText(/e-?posta/i)).toBeNull();
    expect(screen.queryByLabelText(/email/i)).toBeNull();
  });

  test('kaydet → PATCH /salons/:id ve gövdede temel alanlar (e-posta yok)', async () => {
    renderDialog();

    await userEvent.clear(field(/^Salon adı/));
    await userEvent.type(field(/^Salon adı/), 'Élégance Beauty Kadıköy');
    await save();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = apiFetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/salons/salon-1');
    expect(init.method).toBe('PATCH');

    const body = lastBody();
    expect(body.name).toBe('Élégance Beauty Kadıköy');
    expect(body.phone).toBe('+902161234567');
    expect(body.address).toBe('Bağdat Cad. No:12');
    expect(body.city).toBe('İstanbul');
    expect(body.district).toBe('Kadıköy');
    expect(body.latitude).toBe(40.9905);
    expect(body.longitude).toBe(29.027);
    expect(body.galleryImages).toEqual(['/uploads/galeri-1.png']);
    expect('email' in body).toBe(false);
    expect(JSON.stringify(body).includes('email')).toBe(false);
  });

  test('workingHours nesne olarak gider; kapatılan gün anahtar olarak yazılmaz', async () => {
    renderDialog();

    // Pazar gününü kapat (toggle) ve Pazartesi kapanışını değiştir.
    await userEvent.click(screen.getByRole('switch', { name: 'Pazar açık' }));
    fireEvent.change(screen.getByLabelText('Pazartesi kapanış saati'), {
      target: { value: '20:00' },
    });
    await save();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const workingHours = lastBody().workingHours as Record<string, { open: string; close: string }>;

    // Nesne (string değil) — model setter'ı JSON string de kabul ediyor ama çift
    // stringify riski burada kapanır (plan R6).
    expect(typeof workingHours).toBe('object');
    expect(workingHours.monday).toEqual({ open: '09:00', close: '20:00' });
    expect('sunday' in workingHours).toBe(false);
  });

  test('geçersiz ad istek atmaz, alan bazlı hata gösterir', async () => {
    renderDialog();

    await userEvent.clear(field(/^Salon adı/));
    await save();

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('Salon adı 2-100 karakter olmalıdır')).toBeTruthy();
    expect(field(/^Salon adı/).getAttribute('aria-invalid')).toBe('true');
  });

  test('açılış kapanıştan sonra olursa istek atmaz (HH:MM + open<close)', async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('Pazartesi kapanış saati'), {
      target: { value: '08:00' },
    });
    await save();

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('Pazartesi: açılış saati kapanıştan önce olmalıdır')).toBeTruthy();
  });

  test('galeriye eklenen görsel gövdeye girer', async () => {
    renderDialog();

    const galleryUrl = screen.getByLabelText('Galeri görseli URL');
    await userEvent.type(galleryUrl, '/uploads/galeri-2.png');
    // Üç görsel alanı da "URL kullan" basıyor → düğme kendi satırından seçilir.
    await userEvent.click(
      within(galleryUrl.parentElement as HTMLElement).getByRole('button', { name: 'URL kullan' })
    );

    const list = screen.getByRole('list', { name: 'Galeri görselleri' });
    expect(within(list).getByText('/uploads/galeri-2.png')).toBeTruthy();

    await save();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(lastBody().galleryImages).toEqual([
      '/uploads/galeri-1.png',
      '/uploads/galeri-2.png',
    ]);
  });

  test('başarılı kayıtta onSaved(id, payload) çağrılır (kapanışı sayfa yapar)', async () => {
    const { onSaved, onClose } = renderDialog();

    await save();

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const [id, payload] = onSaved.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe('salon-1');
    expect(payload.name).toBe('Élégance Beauty');
    expect(payload.workingHours).toEqual(salon.workingHours);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('API hatası formda role=alert ile okunur, onSaved çağrılmaz', async () => {
    apiFetchMock.mockRejectedValue(new Error('Telefon numarası zaten kayıtlı'));
    const { onSaved } = renderDialog();

    await save();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Telefon numarası zaten kayıtlı');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
