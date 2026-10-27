/**
 * AP-007 W3 — `app/salons/page.tsx`
 *
 * Sayfanın sözleşmesi (plan §5.2): filtreler **sunucuya** gider (`search`,
 * `status`, `city`, `minRating`, `sort`, `order`, `limit`, `page`), filtre
 * değişimi `page=1`'e döner (R2), arama 300ms debounce'ludur, chip kaldırma /
 * Temizle URL'i sıfırlar, sayfa boyutu `limit`'e yansır ve `localStorage`'a
 * yazılır, Pasife al onayı iptal edilirse istek atılmaz (R7).
 *
 * `@/lib/api` ve `next/navigation` mock'lanır; `src/**` değişmez.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { apiFetchMock, replaceMock, pushMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: apiFetchMock, uploadFile: vi.fn() }));
// Router nesnesi modül kapsamında bir kez üretilir: her render'da yeni nesne
// dönmek `useEffect([router])` bağımlılığını her render'da değiştirir ve gerçek
// `next/navigation` davranışından sapar (sonsuz döngü).
vi.mock('next/navigation', () => {
  const router = { push: pushMock, replace: replaceMock };
  return { useRouter: () => router };
});

import SalonsPage from '@/app/salons/page';

const apiSalon = {
  id: 'salon-1',
  name: 'Élégance Beauty',
  phone: '+902161234567',
  description: 'Saç ve cilt bakımı',
  address: 'Bağdat Cad. No:12',
  city: 'İstanbul',
  district: 'Kadıköy',
  latitude: 40.99,
  longitude: 29.03,
  workingHours: { monday: { open: '09:00', close: '18:00' } },
  galleryImages: [],
  isActive: true,
  isVerified: false,
  ratingAvg: 4.6,
  reviewCount: 12,
  createdAt: '2026-10-01T10:00:00.000Z',
  owner: { fullName: 'Ayşe Yılmaz', email: 'salon@beautysalon.com' },
};

const respond = () =>
  apiFetchMock.mockResolvedValue({
    success: true,
    data: {
      data: [apiSalon],
      meta: {
        total: 45,
        page: 1,
        limit: 20,
        totalPages: 3,
        counts: { 'tümü': 45, 'onaylı': 20, 'bekliyor': 5, 'pasif': 20 },
        cities: ['Ankara', 'İstanbul'],
      },
    },
  });

const lastParams = (): URLSearchParams => {
  const [path] = apiFetchMock.mock.calls.at(-1) as [string, RequestInit];
  return new URLSearchParams(path.split('?')[1]);
};

const lastCallCount = () => apiFetchMock.mock.calls.length;

describe('SalonsPage', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'tok-123');
    window.history.replaceState({}, '', '/salons');
    apiFetchMock.mockReset();
    replaceMock.mockReset();
    respond();
  });

  test('ilk yüklemede filtreleri sunucuya varsayılanlarla gönderir', async () => {
    render(<SalonsPage />);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const params = lastParams();
    expect(params.get('page')).toBe('1');
    expect(params.get('limit')).toBe('20');
    expect(params.get('sort')).toBe('createdAt');
    expect(params.get('order')).toBe('desc');
    // Varsayılanlar sunucuya gereksiz parametre olarak gitmez.
    expect(params.has('status')).toBe(false);
    expect(params.has('search')).toBe(false);
    expect(params.has('city')).toBe(false);
    expect(params.has('minRating')).toBe(false);

    // Sayfa 1'de "Önceki sayfa" pasif; aralık metni meta'dan gelir.
    expect((screen.getByLabelText('Önceki sayfa') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('1–20 / 45')).toBeTruthy();
  });

  test('durum filtresi sunucuya status olarak gider ve sayfayı 1e döndürür', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByLabelText('Sonraki sayfa'));
    await waitFor(() => expect(lastParams().get('page')).toBe('2'));

    await userEvent.click(screen.getByRole('tab', { name: /Onaylı/ }));

    await waitFor(() => expect(lastParams().get('status')).toBe('onaylı'));
    // R2: filtre değişti, sayfa 1'e döndü.
    expect(lastParams().get('page')).toBe('1');
  });

  test('arama 300ms debounce edilir: yazarken değil, sonra tek istek', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByLabelText('Salon ara'), 'kuaför');
    // Debounce dolmadan yeni istek yok.
    expect(lastCallCount()).toBe(1);

    await waitFor(() => expect(lastCallCount()).toBe(2));
    expect(lastParams().get('search')).toBe('kuaför');
    expect(lastParams().get('page')).toBe('1');
  });

  test('sayfa boyutu limit olarak gider ve localStoragea yazılır', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Sayfa başına kayıt'), { target: { value: '50' } });

    await waitFor(() => expect(lastParams().get('limit')).toBe('50'));
    expect(lastParams().get('page')).toBe('1');
    expect(localStorage.getItem('salons_page_size')).toBe('50');
  });

  test('chip kaldırma filtreyi sıfırlar ve sayfayı 1e döndürür', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('tab', { name: /Onaylı/ }));
    await waitFor(() => expect(lastParams().get('status')).toBe('onaylı'));

    await userEvent.click(screen.getByRole('button', { name: 'Durum: Onaylı filtresini kaldır' }));

    await waitFor(() => expect(lastParams().has('status')).toBe(false));
    expect(lastParams().get('page')).toBe('1');
    expect(screen.queryByRole('button', { name: /filtresini kaldır/ })).toBeNull();
  });

  test('Temizle tüm filtreleri sıfırlar, limit ve görünüm korunur', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('tab', { name: /Onaylı/ }));
    await userEvent.selectOptions(screen.getByLabelText('Şehir'), 'İstanbul');
    await waitFor(() => expect(lastParams().get('city')).toBe('İstanbul'));

    await userEvent.click(screen.getByRole('button', { name: 'Temizle' }));

    await waitFor(() => expect(lastParams().has('city')).toBe(false));
    expect(lastParams().has('status')).toBe(false);
    expect(lastParams().has('search')).toBe(false);
    expect(lastParams().has('minRating')).toBe(false);
    expect(lastParams().get('page')).toBe('1');
    expect(lastParams().get('limit')).toBe('20');
  });

  test('Pasife al onayı iptal edilirse istek atılmaz (R7)', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const table = screen.getByRole('table');
    await userEvent.click(within(table).getByRole('button', { name: 'Pasife al' }));

    const dialog = screen.getByRole('dialog', { name: 'Salonu pasife al' });
    expect(dialog.textContent).toContain('mevcut randevular silinmez');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));

    expect(screen.queryByRole('dialog', { name: 'Salonu pasife al' })).toBeNull();
    expect(lastCallCount()).toBe(1);
  });

  test('bekliyor satırında Düzenle + Onayla + Pasife al; Düzenle diyaloğu açar', async () => {
    render(<SalonsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const table = screen.getByRole('table');
    expect(within(table).getByRole('button', { name: 'Düzenle' })).toBeTruthy();
    expect(within(table).getByRole('button', { name: 'Onayla' })).toBeTruthy();
    expect(within(table).getByRole('button', { name: 'Pasife al' })).toBeTruthy();

    await userEvent.click(within(table).getByRole('button', { name: 'Düzenle' }));

    const dialog = screen.getByRole('dialog', { name: 'Salonu düzenle' });
    expect((within(dialog).getByLabelText(/^Salon adı/) as HTMLInputElement).value).toBe(
      'Élégance Beauty'
    );
  });
});
