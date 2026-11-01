/**
 * AP i18n — `src/providers/LocaleProvider.tsx`
 *
 * Kapsam: dil provider'ının sözleşmesi — ilk çözümleme sırası (localStorage →
 * `initialMode` → varsayılan), `setMode`'ın state + localStorage + `<html lang>`
 * üçlüsünü birlikte güncellemesi, `system` modunun `navigator.language`'a uyması
 * ve provider dışında `useI18n()`'in hata atmadan varsayılana düşmesi.
 *
 * jsdom'un `navigator.language` değeri 'en-US'tur; Türkçe bekleyen testler
 * `initialMode="tr"` ile sabitlenir.
 */
import { describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import LocaleProvider, { useI18n } from '@/providers/LocaleProvider';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n';

/** jsdom'da salt-okunur olan tarayıcı dilini test başına sabitler. */
function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => language,
  });
}

function Probe() {
  const { locale, mode, systemLocale, setMode, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="system-locale">{systemLocale}</span>
      <span data-testid="label">{t('nav.panel')}</span>
      <button type="button" onClick={() => setMode('tr')}>
        tr
      </button>
      <button type="button" onClick={() => setMode('system')}>
        system
      </button>
    </div>
  );
}

function renderWithProvider(initialMode?: 'system' | 'tr' | 'en') {
  return render(
    <LocaleProvider initialMode={initialMode}>
      <Probe />
    </LocaleProvider>
  );
}

describe('LocaleProvider — ilk çözümleme', () => {
  test('depolama ve initialMode yokken varsayılan mod "system", dil tarayıcıdan gelir', () => {
    setNavigatorLanguage('en-US');
    renderWithProvider();

    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('label').textContent).toBe('Dashboard');
  });

  test('initialMode="tr" ilk render\'da Türkçeyi sabitler', () => {
    setNavigatorLanguage('en-US');
    renderWithProvider('tr');

    expect(screen.getByTestId('mode').textContent).toBe('tr');
    expect(screen.getByTestId('locale').textContent).toBe('tr');
    expect(screen.getByTestId('label').textContent).toBe('Panel');
  });

  test('localStorage değeri initialMode\'u ezer (kullanıcı seçimi önceliklidir)', () => {
    setNavigatorLanguage('en-US');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    renderWithProvider('tr');

    expect(screen.getByTestId('mode').textContent).toBe('en');
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('label').textContent).toBe('Dashboard');
  });

  test('geçersiz localStorage değeri yok sayılır, initialMode geçerli olur', () => {
    setNavigatorLanguage('en-US');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'klingon');
    renderWithProvider('tr');

    expect(screen.getByTestId('mode').textContent).toBe('tr');
  });
});

describe('LocaleProvider — mod değişimi', () => {
  test('setMode modu değiştirir ve localStorage\'a yazar', () => {
    setNavigatorLanguage('en-US');
    renderWithProvider('en');

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBeNull();
    act(() => {
      screen.getByRole('button', { name: 'tr' }).click();
    });

    expect(screen.getByTestId('mode').textContent).toBe('tr');
    expect(screen.getByTestId('locale').textContent).toBe('tr');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('tr');
  });

  test('mount\'ta ve setMode sonrasında documentElement.lang güncellenir', () => {
    setNavigatorLanguage('en-US');
    document.documentElement.lang = 'tr';

    renderWithProvider('en');
    expect(document.documentElement.lang).toBe('en');

    act(() => {
      screen.getByRole('button', { name: 'tr' }).click();
    });
    expect(document.documentElement.lang).toBe('tr');
  });
});

describe('LocaleProvider — "system" modu', () => {
  test('navigator.language "tr-TR" iken Türkçeye çözülür', () => {
    setNavigatorLanguage('tr-TR');
    renderWithProvider();

    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('system-locale').textContent).toBe('tr');
    expect(screen.getByTestId('locale').textContent).toBe('tr');
    expect(screen.getByTestId('label').textContent).toBe('Panel');
    expect(document.documentElement.lang).toBe('tr');
  });

  test('açık seçimden "system" moduna dönüş tarayıcı diline geri döner', () => {
    setNavigatorLanguage('tr-TR');
    renderWithProvider('en');

    act(() => {
      screen.getByRole('button', { name: 'system' }).click();
    });

    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('locale').textContent).toBe('tr');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('system');
  });
});

describe('useI18n — provider dışında', () => {
  test('hata atmaz; varsayılan moda göre çözülmüş değer döner', () => {
    setNavigatorLanguage('en-US');
    const spy = vi.spyOn(console, 'error');

    render(<Probe />);

    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('label').textContent).toBe('Dashboard');
    // Fallback setMode sessizdir (state yok): çağrı patlamamalı.
    expect(() => {
      act(() => {
        screen.getByRole('button', { name: 'tr' }).click();
      });
    }).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
