/**
 * AP-011 K2 — dil tercihinin **sunucu** ayağı.
 *
 * `cookies()` / `headers()` birer request-time API'sidir: kök layout bunları
 * okuduğu için rotalar statik prerender yerine dinamik render edilir (ölçüm ve
 * gerekçe: `plans/admin/AP-011-i18n-language.md` §10 K2). Bunun karşılığında
 * sunucu HTML'i ziyaretçinin dilinde üretilir — `localStorage`'ın yol açtığı
 * ilk boyama dil atlaması (flash) ortadan kalkar.
 *
 * Bu dosya yalnız sunucuda yüklenir (`next/headers` import eder); saf mantık
 * `src/lib/i18n/index.ts` içinde durur ve `node:test` ile ayrıca doğrulanır.
 */
import { cookies, headers } from 'next/headers';
import {
  detectSystemLocaleFromAcceptLanguage,
  normalizeLocaleMode,
  LOCALE_COOKIE_NAME,
  type Locale,
  type LocaleMode,
} from './index.ts';

export interface LocalePreferences {
  /** Cookie'den gelen mod; cookie yok/geçersizse `DEFAULT_LOCALE_MODE`. */
  mode: LocaleMode;
  /** `mode === 'system'` iken sunucunun `Accept-Language` tahmini. */
  systemLocale: Locale;
}

/**
 * Sunucu HTML'inin somut dili: açık seçim kendisidir, `system` modunda
 * `Accept-Language` tahminine düşer. `LocaleProvider` ilk render'da aynı değeri
 * üretir, böylece hidrasyon uyuşmazlığı oluşmaz.
 */
export function serverLocale(preferences: LocalePreferences): Locale {
  return preferences.mode === 'system' ? preferences.systemLocale : preferences.mode;
}

/** İstek başına dil tercihleri: cookie (mod) + `Accept-Language` (sistem dili). */
export async function readLocalePreferences(): Promise<LocalePreferences> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  return {
    mode: normalizeLocaleMode(cookieStore.get(LOCALE_COOKIE_NAME)?.value),
    systemLocale: detectSystemLocaleFromAcceptLanguage(headerStore.get('accept-language')),
  };
}
