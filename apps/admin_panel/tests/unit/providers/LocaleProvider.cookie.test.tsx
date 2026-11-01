/**
 * AP-011 K2 — `LocaleProvider` cookie sözleşmesi.
 *
 * Üç şeyi kilitler:
 *  1. `setMode` tercihi **cookie**'ye de yazar (tek yazım noktası, tam nitelik metni).
 *  2. İlk render sunucu/cookie değerini kullanır; `localStorage` farkı mount
 *     sonrasında uygulanır ve cookie'ye eşitlenir.
 *  3. Hidrasyon sırasında uyuşmazlık **oluşmaz** (React 19 `console.error`
 *     "hydration" hatası basmamalı) — sunucu HTML'i ile client'ın ilk render'ı
 *     aynı dili üretmeli.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';

import LocaleProvider, { useI18n } from '@/providers/LocaleProvider';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n';

function Probe() {
  const { locale, mode, setMode } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={() => setMode('tr')}>
        tr
      </button>
      <button type="button" onClick={() => setMode('en')}>
        en
      </button>
    </div>
  );
}

/**
 * `document.cookie` yazımlarını yakalar (jsdom gerçek cookie'yi saklar ama
 * yazılan **metni** — path/max-age/samesite nitelikleriyle — görünür kılmaz).
 */
function captureCookieWrites() {
  const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  const written: string[] = [];

  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => (descriptor?.get ? String(descriptor.get.call(document)) : ''),
    set: (value: string) => {
      written.push(String(value));
    },
  });

  return {
    written,
    restore: () => {
      Reflect.deleteProperty(document, 'cookie');
    },
  };
}

let mounted: Root | null = null;

afterEach(() => {
  if (mounted) {
    act(() => mounted?.unmount());
    mounted = null;
  }
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
});

describe('LocaleProvider — cookie yazımı', () => {
  test('setMode modu cookie\'ye tam nitelik metniyle yazar', () => {
    const cookie = captureCookieWrites();
    try {
      render(
        <LocaleProvider initialMode="system" initialSystemLocale="en">
          <Probe />
        </LocaleProvider>
      );

      act(() => {
        screen.getByRole('button', { name: 'tr' }).click();
      });

      expect(cookie.written).toContain(
        'app_locale_mode=tr; path=/; max-age=31536000; samesite=lax'
      );
      // localStorage birincil kaynak olarak korunur.
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('tr');
    } finally {
      cookie.restore();
    }
  });

  test('mount, localStorage tercihini cookie\'ye eşitler (eski ziyaretçi geçişi)', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    const cookie = captureCookieWrites();
    try {
      render(
        <LocaleProvider initialMode="tr" initialSystemLocale="tr">
          <Probe />
        </LocaleProvider>
      );

      expect(cookie.written).toContain(
        'app_locale_mode=en; path=/; max-age=31536000; samesite=lax'
      );
      // Mount sonrası kullanıcı tercihi geçerli (localStorage birincil).
      expect(screen.getByTestId('mode').textContent).toBe('en');
    } finally {
      cookie.restore();
    }
  });

  test('localStorage boşken cookie/sunucu değeri korunur, gereksiz yazım olmaz', () => {
    const cookie = captureCookieWrites();
    try {
      render(
        <LocaleProvider initialMode="tr" initialSystemLocale="en">
          <Probe />
        </LocaleProvider>
      );

      expect(cookie.written).toEqual([]);
      expect(screen.getByTestId('mode').textContent).toBe('tr');
      expect(screen.getByTestId('locale').textContent).toBe('tr');
    } finally {
      cookie.restore();
    }
  });
});

describe('LocaleProvider — hidrasyon', () => {
  test('sunucu HTML\'i ile ilk client render\'ı aynı dili üretir (uyuşmazlık yok)', async () => {
    // Sunucu: cookie 'tr' → initialMode="tr".
    const html = renderToString(
      <LocaleProvider initialMode="tr" initialSystemLocale="en">
        <Probe />
      </LocaleProvider>
    );
    expect(html).toContain('>tr<');

    // Tarayıcıda localStorage 'en' — ama ilk render sunucu değerini kullanmalı.
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // React 19 hidrasyon uyuşmazlığını `onRecoverableError` üzerinden bildirir
    // (dev'de ayrıca konsola basar) — asıl kanıt bu kanaldır.
    const recoverableErrors: unknown[] = [];

    await act(async () => {
      mounted = hydrateRoot(
        container,
        <LocaleProvider initialMode="tr" initialSystemLocale="en">
          <Probe />
        </LocaleProvider>,
        { onRecoverableError: (error) => recoverableErrors.push(error) }
      );
    });

    expect(recoverableErrors).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    // Mount sonrası localStorage farkı uygulanır (SSR HTML'i değişmez).
    expect(container.textContent).toContain('en');

    container.remove();
  });

  test('sunucu "system" + Accept-Language "tr" iken ilk render Türkçe kalır', () => {
    const html = renderToString(
      <LocaleProvider initialMode="system" initialSystemLocale="tr">
        <Probe />
      </LocaleProvider>
    );

    // initialSystemLocale verilmeseydi jsdom'un navigator.language değeri
    // kullanılırdı; sunucu değeri ilk render'ı belirler.
    expect(html).toContain('>system<');
    expect(html).toContain('>tr<');
  });
});
