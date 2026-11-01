/**
 * AP-011 K2 — dil tercihinin **cookie** ayağı (istemci tarafı).
 *
 * Neden var: `localStorage` sunucuda okunamaz, bu yüzden SSR her zaman varsayılan
 * dille kuruluyordu. `setMode` aynı tercihi cookie'ye de yazar; kök layout
 * (`src/lib/i18n/server.ts`) onu okuyup `LocaleProvider`'a `initialMode` verir.
 * Böylece ilk boyama doğru dilde gelir.
 *
 * Tek yazım noktası: bu dosyadaki `writeLocaleModeCookie`. Metin formatı
 * `localeModeCookie()` içinde (`src/lib/i18n/index.ts`) — saf, `node:test` ile
 * doğrulanır.
 *
 * Not: `localStorage` **birincil** kaynak kalır (theme `app_theme` deseninin dil
 * karşılığı); cookie yalnız sunucuya taşınan kopyadır.
 */
import { localeModeCookie, type LocaleMode } from './index.ts';

/** Tarayıcıda dil modunu cookie'ye yazar. Sunucuda (SSR) sessizce no-op. */
export function writeLocaleModeCookie(mode: LocaleMode): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = localeModeCookie(mode);
  } catch {
    /* cookie kapalı / document kısıtlı: localStorage + state yeterli */
  }
}
