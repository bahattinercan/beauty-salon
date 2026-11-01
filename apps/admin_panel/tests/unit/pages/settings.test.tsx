/**
 * AP i18n — `app/settings/page.tsx`
 *
 * Kapsam: Ayarlar sayfasının dil kartı ve çeviri sözleşmesi —
 *  (a) üç seçenekli dil Select'i `system` ile açılır,
 *  (b) seçim ANINDA uygulanır (başlık/etiketler aktif dile döner),
 *  (c) Kaydet, PUT gövdesine `language: mode` ekler (diğer alanlar korunur),
 *  (d) sunucudaki `language` yalnızca yerel tercih YOKKEN uygulanır,
 *  (e) yerel tercih varsa sunucu değeri onu ezmez.
 *
 * `@/lib/api` mock'lanır (ağ yok). `LocaleProvider`, jsdom'un 'en-US' dilini
 * sabitlemek için `initialMode` ile kullanılır.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiFetch: apiFetchMock, uploadFile: vi.fn() }));

import SettingsPage from '@/app/settings/page';
import LocaleProvider from '@/providers/LocaleProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import { LOCALE_STORAGE_KEY, type LocaleMode } from '@/lib/i18n';

const serverSettings = (overrides: Record<string, unknown> = {}) => ({
  platformName: 'Beauty Salon',
  contactEmail: 'destek@beautysalon.com',
  supportPhone: '+90 212 000 00 00',
  maxLoginAttempts: 5,
  tokenDuration: '30',
  rateLimitingEnabled: true,
  emailNotificationsEnabled: true,
  newSalonNotificationsEnabled: true,
  newReviewNotificationsEnabled: true,
  maintenanceModeEnabled: false,
  language: 'system',
  ...overrides,
});

/** GET ve PUT aynı sahte gövdeyi döner; PUT gövdesi ayrıca assert edilir. */
function mockApi(settings: Record<string, unknown> = serverSettings()) {
  apiFetchMock.mockImplementation(() => Promise.resolve({ success: true, data: settings }));
}

/**
 * `initialMode` verilirse localStorage'a da yazılır: sunucudaki `language`
 * yalnız yerel tercih yokken uygulandığı için testin dili deterministik kalır.
 */
function renderPage(initialMode?: LocaleMode) {
  if (initialMode) localStorage.setItem(LOCALE_STORAGE_KEY, initialMode);
  return render(
    <LocaleProvider initialMode={initialMode}>
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    </LocaleProvider>
  );
}

/** Dil Select'i: etiketi aktif dile göre 'Dil' / 'Language' olur. */
function languageSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: /^(Dil|Language)$/ }) as HTMLSelectElement;
}

function lastPutBody(): Record<string, unknown> {
  const putCall = apiFetchMock.mock.calls.find(
    ([, options]) => (options as RequestInit | undefined)?.method === 'PUT'
  );
  expect(putCall).toBeTruthy();
  const [, options] = putCall as [string, RequestInit];
  return JSON.parse(String(options.body)) as Record<string, unknown>;
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('Ayarlar — dil kartı', () => {
  test('üç seçenekle render edilir ve varsayılan mod "system"dir', async () => {
    // Varsayılan mod 'system'tir; seçenek metinleri aktif dile göre basılır.
    // Test paketinin varsayılan dili Türkçe olduğu için burada tarayıcı dili
    // açıkça 'en-US' sabitlenir (depolama tercihi YAZILMAZ: mod 'system' kalsın).
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      get: () => 'en-US',
    });
    mockApi();
    renderPage();

    const select = languageSelect();
    await waitFor(() => expect(select.value).toBe('system'));
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['system', 'tr', 'en']);
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      'System language',
      'Turkish',
      'English',
    ]);
  });

  test('Türkçe arayüzde seçenek etiketleri Türkçedir', () => {
    mockApi();
    renderPage('tr');

    const select = languageSelect();
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      'Sistem dili',
      'Türkçe',
      'English',
    ]);
    expect(screen.getByText('Dil tercihi bu tarayıcıda saklanır ve sunucu ayarlarına da yazılır.')).toBeTruthy();
  });
});

describe('Ayarlar — dil seçimi anında uygulanır', () => {
  test('"en" seçilince başlık ve alan etiketleri İngilizceye döner', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage('tr');

    expect(screen.getByRole('heading', { name: 'Ayarlar' })).toBeTruthy();
    expect(screen.getByText('Platform adı')).toBeTruthy();

    await user.selectOptions(languageSelect(), 'en');

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByText('Platform name')).toBeTruthy();
    expect(screen.queryByText('Platform adı')).toBeNull();
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  test('dil değişimi yükleme isteğini TEKRARLAMAZ (form sıfırlanmaz)', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage('tr');

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    await user.selectOptions(languageSelect(), 'en');

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Ayarlar — kaydetme', () => {
  test('PUT gövdesinde language:"en" ve diğer ayarlar yer alır', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage('tr');

    await user.selectOptions(languageSelect(), 'en');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => expect(lastPutBody().language).toBe('en'));
    const body = lastPutBody();
    expect(body.platformName).toBe('Beauty Salon');
    expect(body.maxLoginAttempts).toBe(5);
    expect(body.tokenDuration).toBe('30');
    expect(body.maintenanceModeEnabled).toBe(false);
    // Görünüm tercihi sunucuya gönderilmez (tema bu tarayıcıda kalır).
    expect(body).not.toHaveProperty('theme');
  });

  test('başarılı kayıt bildirimi aktif dilde gösterilir', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage('tr');

    await user.click(screen.getByRole('button', { name: 'Ayarları kaydet' }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByText('Ayarlar başarıyla kaydedildi.')).toBeTruthy();
  });
});

describe('Ayarlar — sunucu dili senkronu', () => {
  test('yerel tercih yokken GET /settings language:"en" modu "en" yapar', async () => {
    mockApi(serverSettings({ language: 'en' }));
    renderPage();

    await waitFor(() => expect(languageSelect().value).toBe('en'));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  test('yerel tercih varsa sunucu değeri onu EZMEZ', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'tr');
    mockApi(serverSettings({ language: 'en' }));
    renderPage();

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(languageSelect().value).toBe('tr');
    expect(screen.getByRole('heading', { name: 'Ayarlar' })).toBeTruthy();
  });

  test('sunucu geçersiz dil dönerse mod değişmez', async () => {
    mockApi(serverSettings({ language: 'klingon' }));
    renderPage('tr');

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(languageSelect().value).toBe('tr');
  });
});
