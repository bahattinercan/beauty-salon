import { afterEach } from 'vitest';
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

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});
