/**
 * AP-008 W3 — `app/appointments/page.tsx`
 *
 * Sayfanın sözleşmesi (plan §5.2/§5.3): filtreler **sunucuya** gider (`search`,
 * `status`, `salonId`, `staffId`, `dateFrom`/`dateTo`, `sort`, `order`, `limit`,
 * `page`), filtre değişimi `page=1`'e döner, arama 300ms debounce'ludur, chip
 * kaldırma / Temizle URL'i sıfırlar, sayfa boyutu `limit`'e yansır ve
 * `localStorage`'a yazılır, onay isteyen durum geçişleri (Tamamla/Gelmedi/İptal)
 * onaylanmadan PATCH atmaz.
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

import AppointmentsPage from '@/app/appointments/page';

const baseAppointment = {
  date: '2026-09-30',
  startTime: '10:00:00',
  endTime: '10:45:00',
  customer: { fullName: 'Zeynep Kaya', email: 'zeynep@test.com' },
  salon: { name: 'Elegance Beauty' },
  staff: { fullName: 'Merve Demir' },
  service: { name: 'Saç Kesimi', price: 750 },
  note: 'Kısa kesim istendi',
  cancellationReason: null,
  createdAt: '2026-09-20T08:30:00.000Z',
};

const apiAppointments = [
  { ...baseAppointment, id: 'apt-completed', status: 'COMPLETED' },
  {
    ...baseAppointment,
    id: 'apt-pending',
    status: 'PENDING',
    date: '2026-10-01',
    customer: { fullName: 'Elif Şahin', email: 'elif@test.com' },
  },
  {
    ...baseAppointment,
    id: 'apt-confirmed',
    status: 'CONFIRMED',
    date: '2026-10-02',
    customer: { fullName: 'Ayşe Yılmaz', email: 'ayse@test.com' },
  },
];

const meta = {
  total: 45,
  page: 1,
  limit: 20,
  totalPages: 3,
  counts: { 'tümü': 45, PENDING: 12, CONFIRMED: 9, COMPLETED: 20, CANCELLED: 3, NO_SHOW: 1 },
  salons: [
    { id: 'salon-1', name: 'Elegance Beauty' },
    { id: 'salon-2', name: 'Bella Güzellik' },
  ],
  staff: [{ id: 'staff-1', fullName: 'Merve Demir' }],
};

const respond = (rows: unknown[] = apiAppointments, metaOverride = meta) =>
  apiFetchMock.mockResolvedValue({ success: true, data: { data: rows, meta: metaOverride } });

const lastParams = (): URLSearchParams => {
  const [path] = apiFetchMock.mock.calls.at(-1) as [string, RequestInit];
  return new URLSearchParams(path.split('?')[1]);
};

const lastPath = (): string => (apiFetchMock.mock.calls.at(-1) as [string, RequestInit])[0];

const lastCallCount = () => apiFetchMock.mock.calls.length;

const replacedUrls = (): string[] => replaceMock.mock.calls.map(([url]) => String(url));

const patchCalls = () =>
  apiFetchMock.mock.calls
    .map((call) => call as [string, RequestInit | undefined])
    .filter(([, init]) => init?.method === 'PATCH');

const tableRows = (): HTMLElement[] =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1) as unknown as HTMLElement[];

const localDate = (offsetDays = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

describe('AppointmentsPage', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'tok-123');
    localStorage.removeItem('appointments_page_size');
    window.history.replaceState({}, '', '/appointments');
    apiFetchMock.mockReset();
    replaceMock.mockReset();
    respond();
  });

  test('ilk yüklemede istek varsayılanlarla gider ve tablo satırları basılır', async () => {
    render(<AppointmentsPage />);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const params = lastParams();
    expect(lastPath().startsWith('/admin/appointments?')).toBe(true);
    expect(params.get('page')).toBe('1');
    expect(params.get('limit')).toBe('20');
    expect(params.get('sort')).toBe('createdAt');
    expect(params.get('order')).toBe('desc');
    // Varsayılanlar sunucuya gereksiz parametre olarak gitmez.
    expect(params.has('search')).toBe(false);
    expect(params.has('status')).toBe(false);
    expect(params.has('salonId')).toBe(false);
    expect(params.has('staffId')).toBe(false);
    expect(params.has('dateFrom')).toBe(false);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Zeynep Kaya')).toBeTruthy();
    // Salon adı her satırda aynı (fixture): varlığı yeter.
    expect(within(table).getAllByText('Elegance Beauty')).toHaveLength(3);
    expect(screen.getByText('1–20 / 45')).toBeTruthy();
  });

  test('arama 300ms debounce edilir: yazarken değil, sonra tek istek', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByLabelText('Randevu ara'), 'zeynep');
    // Debounce dolmadan yeni istek yok.
    expect(lastCallCount()).toBe(1);

    await waitFor(() => expect(lastCallCount()).toBe(2));
    expect(lastParams().get('search')).toBe('zeynep');
    expect(lastParams().get('page')).toBe('1');
  });

  test('durum filtresi status olarak gider ve sayfayı 1e döndürür', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByLabelText('Sonraki sayfa'));
    await waitFor(() => expect(lastParams().get('page')).toBe('2'));

    await userEvent.selectOptions(screen.getByLabelText('Durum'), 'COMPLETED');

    await waitFor(() => expect(lastParams().get('status')).toBe('COMPLETED'));
    expect(lastParams().get('page')).toBe('1');
  });

  test('salon, personel ve tarih presetleri sunucu parametrelerine dönüşür', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Salon'), 'salon-2');
    await waitFor(() => expect(lastParams().get('salonId')).toBe('salon-2'));

    await userEvent.selectOptions(screen.getByLabelText('Personel'), 'staff-1');
    await waitFor(() => expect(lastParams().get('staffId')).toBe('staff-1'));

    await userEvent.selectOptions(screen.getByLabelText('Tarih'), 'bugün');
    await waitFor(() => expect(lastParams().get('dateFrom')).toBe(localDate()));
    // "bugün" tek günlük aralık: iki parametre aynı günü gösterir.
    expect(lastParams().get('dateTo')).toBe(localDate());
  });

  test('chip kaldırma filtreyi düşürür, Temizle tüm filtreleri sıfırlar (router.replace)', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Durum'), 'COMPLETED');
    await waitFor(() => expect(lastParams().get('status')).toBe('COMPLETED'));
    // URL tek kaynaktan yazılır.
    await waitFor(() => expect(replacedUrls().some((url) => url.includes('durum=COMPLETED'))).toBe(true));

    await userEvent.click(screen.getByRole('button', { name: 'Durum: Tamamlandı filtresini kaldır' }));
    await waitFor(() => expect(lastParams().has('status')).toBe(false));
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/appointments'));

    await userEvent.selectOptions(screen.getByLabelText('Salon'), 'salon-2');
    await waitFor(() => expect(lastParams().get('salonId')).toBe('salon-2'));
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/appointments?salon=salon-2'));

    await userEvent.click(screen.getByRole('button', { name: 'Temizle' }));
    await waitFor(() => expect(lastParams().has('salonId')).toBe(false));
    expect(lastParams().has('search')).toBe(false);
    expect(lastParams().has('status')).toBe(false);
    expect(lastParams().get('page')).toBe('1');
    expect(lastParams().get('limit')).toBe('20');
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/appointments'));
  });

  test('sayfa boyutu limit olarak gider ve localStoragea yazılır', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Sayfa başına kayıt'), { target: { value: '50' } });

    await waitFor(() => expect(lastParams().get('limit')).toBe('50'));
    expect(lastParams().get('page')).toBe('1');
    expect(localStorage.getItem('appointments_page_size')).toBe('50');
  });

  test('satır aksiyonları duruma göre değişir (Detay her satırda)', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const rows = tableRows();
    const labels = (row: HTMLElement) =>
      within(row)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim());

    expect(labels(rows[0])).toEqual(['Detay']); // COMPLETED
    expect(labels(rows[1])).toEqual(['Detay', 'Onayla']); // PENDING
    expect(labels(rows[2])).toEqual(['Detay', 'Tamamla', 'Gelmedi', 'İptal']); // CONFIRMED
  });

  test('Detay randevu bilgileriyle diyaloğu açar', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(within(tableRows()[0]).getByRole('button', { name: 'Detay' }));

    const dialog = screen.getByRole('dialog', { name: 'Randevu detayı' });
    expect(dialog.textContent).toContain('Zeynep Kaya');
    expect(dialog.textContent).toContain('Elegance Beauty');
    expect(dialog.textContent).toContain('Saç Kesimi');
    expect(dialog.textContent).toContain('Merve Demir');
    expect(dialog.textContent).toContain('750');
  });

  test('İptal önce onay ister; Vazgeç PATCH atmaz, onay CANCELLED gönderir', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(within(tableRows()[2]).getByRole('button', { name: 'İptal' }));

    const dialog = screen.getByRole('dialog', { name: 'Randevuyu iptal et' });
    expect(dialog.textContent).toContain('Emin misiniz?');
    expect(dialog.textContent).toContain('Ayşe Yılmaz');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('dialog', { name: 'Randevuyu iptal et' })).toBeNull();
    expect(patchCalls()).toHaveLength(0);

    await userEvent.click(within(tableRows()[2]).getByRole('button', { name: 'İptal' }));
    const confirmDialog = screen.getByRole('dialog', { name: 'Randevuyu iptal et' });
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'İptal et' }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    const [path, init] = patchCalls()[0];
    expect(path).toBe('/appointments/apt-confirmed/status');
    expect(JSON.parse(String(init?.body))).toEqual({ status: 'CANCELLED' });
    // Başarılı geçiş satırı lokal günceller: CONFIRMED satırında İptal kalmaz.
    await waitFor(() =>
      expect(
        within(tableRows()[2])
          .getAllByRole('button')
          .map((button) => button.textContent?.trim())
      ).toEqual(['Detay'])
    );
  });

  test('meta.counts değerleri durum seçeneklerinde ve alt başlıkta görünür', async () => {
    render(<AppointmentsPage />);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const statusSelect = screen.getByLabelText('Durum');
    expect(within(statusSelect).getByRole('option', { name: 'Tümü (45)' })).toBeTruthy();
    expect(within(statusSelect).getByRole('option', { name: 'Bekliyor (12)' })).toBeTruthy();
    expect(within(statusSelect).getByRole('option', { name: 'Onaylandı (9)' })).toBeTruthy();
    expect(within(statusSelect).getByRole('option', { name: 'Tamamlandı (20)' })).toBeTruthy();
    expect(within(statusSelect).getByRole('option', { name: 'İptal Edildi (3)' })).toBeTruthy();
    expect(within(statusSelect).getByRole('option', { name: 'Gelmedi (1)' })).toBeTruthy();
    expect(screen.getByText('45 randevu · 12 bekliyor')).toBeTruthy();
  });

  test('tablo boş + filtre etkin ise "Eşleşme yok" gösterir', async () => {
    respond([], { ...meta, total: 0, totalPages: 1 });
    render(<AppointmentsPage />);

    await waitFor(() => expect(screen.getByText('Randevu yok')).toBeTruthy());

    await userEvent.type(screen.getByLabelText('Randevu ara'), 'xyz');

    await waitFor(() => expect(screen.getByText('Eşleşme yok')).toBeTruthy());
    expect(screen.queryByText('Randevu yok')).toBeNull();
  });
});
