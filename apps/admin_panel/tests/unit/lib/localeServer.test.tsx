/**
 * AP-011 K2 — sunucu tarafı dil çözümlemesi (`src/lib/i18n/server.ts`).
 *
 * Kök layout (`src/app/layout.tsx`) sunucu bileşeninde `readLocalePreferences()`
 * çağırır ve sonucu `LocaleProvider`'a `initialMode` / `initialSystemLocale` olarak
 * geçer. Burada `next/headers` mock'lanır: testin kanıtladığı şey, **cookie'deki
 * modun SSR dilini belirlemesi** ve cookie yok/geçersizken varsayılana düşülmesi.
 *
 * `cookies()` / `headers()` Next'in request-time API'leridir; gerçek bir istek
 * olmadan çalışmadıkları için mock zorunludur (jsdom'da `next/headers` yok).
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const request = vi.hoisted(() => ({
  cookieMode: undefined as string | undefined,
  acceptLanguage: undefined as string | undefined,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      request.cookieMode === undefined ? undefined : { name, value: request.cookieMode },
  }),
  headers: async () => ({
    get: (name: string) =>
      name.toLowerCase() === 'accept-language' ? (request.acceptLanguage ?? null) : null,
  }),
}));

import { readLocalePreferences, serverLocale } from '@/lib/i18n/server';

beforeEach(() => {
  request.cookieMode = undefined;
  request.acceptLanguage = undefined;
});

describe('readLocalePreferences — cookie → mod', () => {
  test('cookie "tr" iken SSR dili Türkçe olur', async () => {
    request.cookieMode = 'tr';
    request.acceptLanguage = 'en-US,en;q=0.9';

    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('tr');
    // Açık seçim Accept-Language'ı ezer.
    expect(serverLocale(preferences)).toBe('tr');
  });

  test('cookie "en" iken Türkçe tarayıcıda bile SSR dili İngilizce olur', async () => {
    request.cookieMode = 'en';
    request.acceptLanguage = 'tr-TR,tr;q=0.9';

    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('en');
    expect(serverLocale(preferences)).toBe('en');
  });

  test('cookie yoksa varsayılan mod "system", dil Accept-Language\'dan gelir', async () => {
    request.acceptLanguage = 'tr-TR,tr;q=0.9,en;q=0.5';

    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('system');
    expect(preferences.systemLocale).toBe('tr');
    expect(serverLocale(preferences)).toBe('tr');
  });

  test('cookie yok ve Accept-Language yoksa "system" + "en" (tarayıcı dili bilinmiyor)', async () => {
    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('system');
    expect(preferences.systemLocale).toBe('en');
    expect(serverLocale(preferences)).toBe('en');
  });

  test('geçersiz cookie değeri yok sayılır, varsayılan moda düşülür', async () => {
    request.cookieMode = 'klingon';
    request.acceptLanguage = 'tr-TR';

    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('system');
    expect(serverLocale(preferences)).toBe('tr');
  });

  test('cookie "system" ise mod system kalır (kullanıcı seçimi bilinçli olarak sistem)', async () => {
    request.cookieMode = 'system';
    request.acceptLanguage = 'en-GB,en;q=0.9';

    const preferences = await readLocalePreferences();

    expect(preferences.mode).toBe('system');
    expect(serverLocale(preferences)).toBe('en');
  });
});
