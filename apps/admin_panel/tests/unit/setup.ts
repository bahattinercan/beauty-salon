import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * AP-003 — jsdom ortamı kurulumu.
 *
 * jsdom `window.matchMedia` sağlamaz (ölçüldü: `undefined`), oysa
 * `ThemeProvider` sistem temasını `matchMedia('(prefers-color-scheme: dark)')`
 * üzerinden okur. Bu yüzden burada yalnız bu global stub'lanır; uygulama kodu
 * DEĞİŞTİRİLMEZ ve ağ çağrısı yapılmaz.
 */
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/**
 * Testlerin varsayılan dili Türkçedir — panelin varsayılan dili de Türkçe.
 *
 * Neden `navigator.language` (localStorage değil): `LocaleProvider` çözümleme
 * sırası localStorage → `initialMode` → varsayılan. Depoya 'tr' yazmak, açıkça
 * `initialMode="en"` kuran testleri (AppointmentActions, appointments sayfası)
 * ve "depolama boş" sözleşmesini ezerdi; tarayıcı dilini 'tr-TR' yapmak yalnız
 * `system` modunun varsayılanını Türkçeye çeker, açık seçimlere dokunmaz.
 * Test kendi dilini `Object.defineProperty` ile sabitlerse o değer geçerlidir.
 */
beforeEach(() => {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => 'tr-TR',
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
