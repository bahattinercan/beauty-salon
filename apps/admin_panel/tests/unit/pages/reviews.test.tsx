/**
 * AP-010 §E — `app/reviews/page.tsx`
 *
 * Sayfanın sözleşmesi: filtreler **sunucuya** gider (`search`, `rating`,
 * `visibility`, `replied`, `salonId`, `dateFrom`/`dateTo`, `sort`, `order`,
 * `limit`, `page`), filtre değişimi `page=1`'e döner, arama 300ms debounce'ludur,
 * chip kaldırma / Temizle URL'i sıfırlar, sayfa boyutu `limit`'e yansır ve
 * `localStorage`'a (`reviews_page_size`) yazılır, kart işlemleri doğru uçlara
 * gider: Detay **ağ isteği yapmaz**, Yanıtla → `PATCH /admin/reviews/:id/reply`,
 * Görünürlük → `PATCH /reviews/:id/toggle-visibility`, Sil → onaydan sonra
 * `DELETE /admin/reviews/:id` + refetch.
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

import ReviewsPage from '@/app/reviews/page';
import LocaleProvider from '@/providers/LocaleProvider';

/**
 * Sayfa metinleri `useI18n()`den gelir; testler bugünkü Türkçe kopyayı
 * doğruladığından dil `initialMode="tr"` ile sabitlenir (jsdom
 * `navigator.language` = 'en-US').
 */
const renderPage = () =>
  render(
    <LocaleProvider initialMode="tr">
      <ReviewsPage />
    </LocaleProvider>
  );

const apiReviews = [
  {
    id: 'rev-visible',
    rating: 5,
    comment: 'Harika deneyimdi!',
    isVisible: true,
    salonReply: 'Teşekkürler!',
    salonReplyAt: '2026-10-20T09:15:00.000Z',
    images: [],
    createdAt: '2026-10-19T08:30:00.000Z',
    customer: { fullName: 'Zeynep Kaya' },
    salon: { name: 'Elegance Beauty' },
  },
  {
    id: 'rev-hidden',
    rating: 3,
    comment: null,
    isVisible: false,
    salonReply: null,
    salonReplyAt: null,
    images: null,
    createdAt: '2026-10-18T08:30:00.000Z',
    customer: { fullName: 'Elif Şahin' },
    salon: { name: 'Bella Güzellik' },
  },
];

const meta = {
  total: 9,
  page: 1,
  limit: 20,
  totalPages: 1,
  counts: { all: 9, visible: 7, hidden: 2, replied: 4, unreplied: 5 },
  ratings: { '1': 0, '2': 0, '3': 1, '4': 3, '5': 5 },
  salons: [
    { id: 'salon-1', name: 'Elegance Beauty' },
    { id: 'salon-2', name: 'Bella Güzellik' },
  ],
};

/**
 * Yol/metoda göre cevap: liste isteği fixture'ı döner, yanıt/silme uçları kendi
 * gövdelerini yansıtır (sayfa `salonReply`i cevaptan okuyor).
 */
const respond = (rows: unknown[] = apiReviews, metaOverride = meta) =>
  apiFetchMock.mockImplementation(async (path: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') return { success: true, data: { id: 'deleted' } };
    if (init?.method === 'PATCH' && path.endsWith('/reply')) {
      const body = JSON.parse(String(init.body)) as { reply: string };
      const id = path.split('/')[3];
      return {
        success: true,
        data: { id, salonReply: body.reply, salonReplyAt: '2026-10-28T10:00:00.000Z' },
      };
    }
    if (init?.method === 'PATCH') return { success: true, data: { id: 'toggled', isVisible: true } };
    return { success: true, data: { data: rows, meta: metaOverride } };
  });

const lastParams = (): URLSearchParams => {
  const [path] = apiFetchMock.mock.calls.at(-1) as [string, RequestInit];
  return new URLSearchParams(path.split('?')[1]);
};

const lastPath = (): string => (apiFetchMock.mock.calls.at(-1) as [string, RequestInit])[0];

const lastCallCount = () => apiFetchMock.mock.calls.length;

const getCalls = () =>
  apiFetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === undefined);

const replacedUrls = (): string[] => replaceMock.mock.calls.map(([url]) => String(url));

const callsByMethod = (method: string) =>
  apiFetchMock.mock.calls
    .map((call) => call as [string, RequestInit | undefined])
    .filter(([, init]) => init?.method === method);

const cards = (): HTMLElement[] => screen.getAllByRole('article');

const localDate = (offsetDays = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
};

describe('ReviewsPage', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'tok-123');
    localStorage.removeItem('reviews_page_size');
    window.history.replaceState({}, '', '/reviews');
    apiFetchMock.mockReset();
    replaceMock.mockReset();
    pushMock.mockReset();
    respond();
  });

  test('ilk yüklemede istek varsayılanlarla gider, kartlar ve sayaçlar basılır', async () => {
    renderPage();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const params = lastParams();
    expect(lastPath().startsWith('/admin/reviews?')).toBe(true);
    expect(params.get('page')).toBe('1');
    expect(params.get('limit')).toBe('20');
    expect(params.get('sort')).toBe('createdAt');
    expect(params.get('order')).toBe('desc');
    // Varsayılanlar sunucuya gereksiz parametre olarak gitmez.
    expect(params.has('search')).toBe(false);
    expect(params.has('visibility')).toBe(false);
    expect(params.has('rating')).toBe(false);
    expect(params.has('replied')).toBe(false);
    expect(params.has('salonId')).toBe(false);
    expect(params.has('dateFrom')).toBe(false);

    expect(screen.getByText('Zeynep Kaya')).toBeTruthy();
    expect(screen.getByText('Elif Şahin')).toBeTruthy();
    expect(screen.getByText('Harika deneyimdi!')).toBeTruthy();
    expect(screen.getByText('19 Ekim 2026')).toBeTruthy();
    // Yorum metni yoksa yer tutucu basılır.
    expect(screen.getByText('Yorum yazılmamış.')).toBeTruthy();
    expect(screen.getByText('1–9 / 9')).toBeTruthy();
    expect(screen.getByText('9 yorum')).toBeTruthy();
  });

  test('sayaçlar meta.counts/meta.ratings içinden seçenek etiketlerine yazılır', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const visibility = screen.getByLabelText('Görünüm');
    expect(within(visibility).getByRole('option', { name: 'Tümü (9)' })).toBeTruthy();
    expect(within(visibility).getByRole('option', { name: 'Görünür (7)' })).toBeTruthy();
    expect(within(visibility).getByRole('option', { name: 'Gizli (2)' })).toBeTruthy();

    const reply = screen.getByLabelText('Yanıt');
    expect(within(reply).getByRole('option', { name: 'Tümü (9)' })).toBeTruthy();
    expect(within(reply).getByRole('option', { name: 'Yanıtlı (4)' })).toBeTruthy();
    expect(within(reply).getByRole('option', { name: 'Yanıtsız (5)' })).toBeTruthy();

    const rating = screen.getByLabelText('Puan');
    expect(within(rating).getByRole('option', { name: '5 yıldız (5)' })).toBeTruthy();
    expect(within(rating).getByRole('option', { name: '3 yıldız (1)' })).toBeTruthy();
    expect(within(rating).getByRole('option', { name: 'Tüm puanlar' })).toBeTruthy();

    const salon = screen.getByLabelText('Salon');
    expect(within(salon).getByRole('option', { name: 'Tüm salonlar' })).toBeTruthy();
    expect(within(salon).getByRole('option', { name: 'Bella Güzellik' })).toBeTruthy();
  });

  test('arama 300ms debounce edilir: yazarken değil, sonra tek istek + page=1', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.type(screen.getByLabelText('Yorum ara'), 'zeynep');
    // Debounce dolmadan yeni istek yok.
    expect(lastCallCount()).toBe(1);

    await waitFor(() => expect(lastCallCount()).toBe(2));
    expect(lastParams().get('search')).toBe('zeynep');
    expect(lastParams().get('page')).toBe('1');
    // URL tek kaynaktan yazılır.
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews?q=zeynep'));
  });

  test('Görünüm/Puan/Yanıt filtreleri API parametrelerine dönüşür ve sayfayı 1e döndürür', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Görünüm'), 'gizli');
    await waitFor(() => expect(lastParams().get('visibility')).toBe('hidden'));

    await userEvent.selectOptions(screen.getByLabelText('Puan'), '5');
    await waitFor(() => expect(lastParams().get('rating')).toBe('5'));

    await userEvent.selectOptions(screen.getByLabelText('Yanıt'), 'yanıtsız');
    await waitFor(() => expect(lastParams().get('replied')).toBe('unreplied'));
    expect(lastParams().get('page')).toBe('1');
  });

  test('Salon ve Tarih filtreleri salonId + dateFrom/dateTo üretir', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Salon'), 'salon-2');
    await waitFor(() => expect(lastParams().get('salonId')).toBe('salon-2'));

    await userEvent.selectOptions(screen.getByLabelText('Tarih'), 'bugün');
    await waitFor(() => expect(lastParams().get('dateFrom')).toBe(localDate()));
    // "bugün" tek günlük aralık: iki parametre aynı günü gösterir.
    expect(lastParams().get('dateTo')).toBe(localDate());
  });

  test('chip kaldırma yalnız o filtreyi sıfırlar, Temizle hepsini sıfırlar', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Görünüm'), 'görünür');
    await userEvent.selectOptions(screen.getByLabelText('Salon'), 'salon-2');
    await waitFor(() => expect(lastParams().get('salonId')).toBe('salon-2'));
    expect(lastParams().get('visibility')).toBe('visible');

    // Chip etiketi salon adını gösterir (kimlik değil).
    await userEvent.click(
      screen.getByRole('button', { name: 'Salon: Bella Güzellik filtresini kaldır' })
    );
    await waitFor(() => expect(lastParams().has('salonId')).toBe(false));
    // Diğer filtre korunur.
    expect(lastParams().get('visibility')).toBe('visible');

    await userEvent.click(
      screen.getByRole('button', { name: 'Görünüm: Görünür filtresini kaldır' })
    );
    await waitFor(() => expect(lastParams().has('visibility')).toBe(false));
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews'));

    await userEvent.selectOptions(screen.getByLabelText('Puan'), '4');
    await waitFor(() => expect(lastParams().get('rating')).toBe('4'));

    await userEvent.click(screen.getByRole('button', { name: 'Temizle' }));
    await waitFor(() => expect(lastParams().has('rating')).toBe(false));
    expect(lastParams().has('search')).toBe(false);
    expect(lastParams().get('page')).toBe('1');
    expect(lastParams().get('limit')).toBe('20');
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews'));
  });

  test('Sıralama Selecti dört seçenekle basılır ve varsayılan En yeni seçilidir', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const sort = screen.getByLabelText('Sıralama') as HTMLSelectElement;
    expect(sort.tagName).toBe('SELECT');
    expect(
      within(sort)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['En yeni', 'En eski', 'Yüksek puan', 'Düşük puan']);
    expect(sort.value).toBe('createdAt:desc');
    // Sıralama bir filtre değil: chip üretmez.
    expect(screen.queryByText('Sıralama: En yeni')).toBeNull();
  });

  test('Sıralama seçimi isteği sort/order ile gönderir, URL sirala taşır, Temizle varsayılana döner', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.selectOptions(screen.getByLabelText('Sıralama'), 'rating:desc');
    await waitFor(() => expect(lastParams().get('sort')).toBe('rating'));
    expect(lastParams().get('order')).toBe('desc');
    // Filtre sayfası 1'e döner.
    expect(lastParams().get('page')).toBe('1');
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews?sirala=rating%3Adesc'));
    // Sıralama chip'lerde GÖRÜNMEZ (randevu sayfasıyla aynı davranış).
    expect(screen.queryByRole('button', { name: /Sıralama/ })).toBeNull();

    await userEvent.selectOptions(screen.getByLabelText('Sıralama'), 'createdAt:asc');
    await waitFor(() => expect(lastParams().get('sort')).toBe('createdAt'));
    expect(lastParams().get('order')).toBe('asc');
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews?sirala=createdAt%3Aasc'));

    // Temizle varsayılana (En yeni) döndürür ve URL'den sirala düşer.
    await userEvent.selectOptions(screen.getByLabelText('Puan'), '4');
    await waitFor(() => expect(lastParams().get('rating')).toBe('4'));
    await userEvent.click(screen.getByRole('button', { name: 'Temizle' }));
    await waitFor(() => expect(lastParams().get('sort')).toBe('createdAt'));
    expect(lastParams().get('order')).toBe('desc');
    expect(lastParams().has('rating')).toBe(false);
    await waitFor(() => expect(replacedUrls().at(-1)).toBe('/reviews'));
    expect((screen.getByLabelText('Sıralama') as HTMLSelectElement).value).toBe('createdAt:desc');
  });

  test('sıralama derin bağlantısı (sirala) yenilemede korunur ve ilk istekte uygulanır', async () => {
    window.history.replaceState({}, '', '/reviews?sirala=rating%3Aasc');
    renderPage();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(lastParams().get('sort')).toBe('rating');
    expect(lastParams().get('order')).toBe('asc');
    expect((screen.getByLabelText('Sıralama') as HTMLSelectElement).value).toBe('rating:asc');
  });

  test('sayfa boyutu limit olarak gider ve localStoragea yazılır', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Sayfa başına kayıt'), { target: { value: '50' } });

    await waitFor(() => expect(lastParams().get('limit')).toBe('50'));
    expect(lastParams().get('page')).toBe('1');
    expect(localStorage.getItem('reviews_page_size')).toBe('50');
  });

  test('her kartta dört işlem vardır ve Detay ağ isteği yapmaz', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [first, second] = cards();
    expect(
      within(first)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim())
    ).toEqual(['Detay', 'Yanıtı düzenle', 'Gizle', 'Sil']);
    expect(
      within(second)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim())
    ).toEqual(['Detay', 'Yanıtla', 'Görünür yap', 'Sil']);

    const callsBefore = lastCallCount();
    await userEvent.click(within(first).getByRole('button', { name: 'Detay' }));

    const dialog = screen.getByRole('dialog', { name: 'Yorum detayı' });
    expect(dialog.textContent).toContain('Zeynep Kaya');
    expect(dialog.textContent).toContain('Elegance Beauty');
    expect(dialog.textContent).toContain('Harika deneyimdi!');
    expect(dialog.textContent).toContain('Teşekkürler!');
    // Detay satır verisiyle açılır: yeni istek yok.
    expect(lastCallCount()).toBe(callsBefore);
  });

  test('Yanıtla diyaloğu mevcut yanıtla açılır ve PATCH /admin/reviews/:id/reply gönderir', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [first, second] = cards();
    // Filtre çubuğundaki `Yanıt` select'i ile aynı ada sahip: alan diyalog içinde aranır.
    const replyField = () =>
      within(screen.getByRole('dialog', { name: 'Yorumu yanıtla' })).getByLabelText(
        'Yanıt'
      ) as HTMLTextAreaElement;

    // Mevcut yanıt textarea'ya dolu gelir.
    await userEvent.click(within(first).getByRole('button', { name: 'Yanıtı düzenle' }));
    expect(replyField().value).toBe('Teşekkürler!');
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));

    await userEvent.click(within(second).getByRole('button', { name: 'Yanıtla' }));
    const textarea = replyField();
    expect(textarea.value).toBe('');

    // Boş yanıt gönderilemez.
    expect((screen.getByRole('button', { name: 'Kaydet' }) as HTMLButtonElement).disabled).toBe(
      true
    );

    await userEvent.type(textarea, 'Geri bildiriminiz için teşekkürler');
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(callsByMethod('PATCH')).toHaveLength(1));
    const [path, init] = callsByMethod('PATCH')[0];
    expect(path).toBe('/admin/reviews/rev-hidden/reply');
    expect(JSON.parse(String(init?.body))).toEqual({
      reply: 'Geri bildiriminiz için teşekkürler',
    });
    // Başarı satırı lokal günceller + canlı bölgede duyurulur.
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Yanıt kaydedildi'));
    expect(screen.queryByRole('dialog', { name: 'Yorumu yanıtla' })).toBeNull();
    expect(screen.getByText('Geri bildiriminiz için teşekkürler')).toBeTruthy();
  });

  test('Görünür yap/Gizle mevcut toggle-visibility ucunu çağırır ve iyimser günceller', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [first] = cards();
    await userEvent.click(within(first).getByRole('button', { name: 'Gizle' }));

    await waitFor(() => expect(callsByMethod('PATCH')).toHaveLength(1));
    expect(callsByMethod('PATCH')[0][0]).toBe('/reviews/rev-visible/toggle-visibility');
    // İyimser güncelleme: rozet ve buton metni anında değişir.
    await waitFor(() =>
      expect(within(cards()[0]).getByRole('button', { name: 'Görünür yap' })).toBeTruthy()
    );
    expect(within(cards()[0]).getByText('Gizli')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Yorum gizlendi');
  });

  test('Sil önce onay ister: Vazgeç DELETE atmaz, onay DELETE + refetch yapar', async () => {
    renderPage();
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    await userEvent.click(within(cards()[0]).getByRole('button', { name: 'Sil' }));

    const dialog = screen.getByRole('dialog', { name: 'Yorumu sil' });
    expect(dialog.textContent).toContain('Yorum kalıcı olarak silinecek');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Vazgeç' }));
    expect(screen.queryByRole('dialog', { name: 'Yorumu sil' })).toBeNull();
    expect(callsByMethod('DELETE')).toHaveLength(0);

    const getCallsBefore = getCalls().length;
    await userEvent.click(within(cards()[0]).getByRole('button', { name: 'Sil' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Yorumu sil' })).getByRole('button', { name: 'Sil' })
    );

    await waitFor(() => expect(callsByMethod('DELETE')).toHaveLength(1));
    expect(callsByMethod('DELETE')[0][0]).toBe('/admin/reviews/rev-visible');
    // Silme sonrası liste tazelenir.
    await waitFor(() => expect(getCalls().length).toBe(getCallsBefore + 1));
    expect(screen.getByRole('status').textContent).toContain('Yorum silindi');
  });

  test('yükleme hatası ErrorState basar, Yeniden dene tekrar ister', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('Sunucu hatası'));
    renderPage();

    await waitFor(() => expect(screen.getByText('Veri alınamadı')).toBeTruthy());
    expect(screen.getByText('Sunucu hatası')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Yeniden dene' }));
    await waitFor(() => expect(getCalls().length).toBe(2));
    await waitFor(() => expect(screen.queryByText('Veri alınamadı')).toBeNull());
  });

  test('401 hatasında login sayfasına yönlendirir', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('API error 401'));
    renderPage();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('Veri alınamadı')).toBeNull();
  });

  test('boş sonuç EmptyState basar; filtre etkinken metin değişir', async () => {
    respond([], { ...meta, total: 0, totalPages: 1 });
    renderPage();

    await waitFor(() => expect(screen.getByText('Yorum bulunamadı')).toBeTruthy());

    await userEvent.type(screen.getByLabelText('Yorum ara'), 'xyz');

    await waitFor(() => expect(screen.getByText('Eşleşme yok')).toBeTruthy());
    expect(screen.queryByText('Yorum bulunamadı')).toBeNull();
  });

  test('URL derin bağlantısı okunur (gorunum/puan/sayfa) ve ilk istekte uygulanır', async () => {
    window.history.replaceState({}, '', '/reviews?gorunum=gizli&puan=4&sayfa=2');
    renderPage();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(lastParams().get('visibility')).toBe('hidden');
    expect(lastParams().get('rating')).toBe('4');
    expect(lastParams().get('page')).toBe('2');
    // Select'ler URL değerini gösterir.
    expect((screen.getByLabelText('Görünüm') as HTMLSelectElement).value).toBe('gizli');
    expect((screen.getByLabelText('Puan') as HTMLSelectElement).value).toBe('4');
  });

  test('dil en olunca kart tarihleri ve metinler İngilizceye döner', async () => {
    render(
      <LocaleProvider initialMode="en">
        <ReviewsPage />
      </LocaleProvider>
    );

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('heading', { name: 'Review Management' })).toBeTruthy();
    expect(screen.getByText('9 reviews')).toBeTruthy();
    expect(screen.getByText('October 19, 2026')).toBeTruthy();
    expect(screen.getByText('October 18, 2026')).toBeTruthy();
    expect(screen.queryByText('19 Ekim 2026')).toBeNull();
  });
});
