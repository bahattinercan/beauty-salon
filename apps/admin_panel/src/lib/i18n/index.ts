/**
 * i18n çekirdeği — bağımlılık YOK (next-intl / react-i18next kurulmadı).
 *
 * Tasarım: sözlük saf veri (`messages/*`), çözümleme saf fonksiyonlar (bu dosya),
 * React bağlantısı `src/providers/LocaleProvider.tsx`. Böylece dil mantığı
 * `node:test` ile (DOM/React olmadan) doğrulanabilir.
 *
 * NOT: `messages/*` importları bilinçli olarak `.ts` uzantılıdır — aynı modüller
 * `node --test` altında da yüklenir ve Node ESM'i uzantısız göreli yolu çözmez
 * (tsconfig `allowImportingTsExtensions` açık).
 */
import { en as appointmentsEn, tr as appointmentsTr } from './messages/appointments.ts';
import { en as categoriesEn, tr as categoriesTr } from './messages/categories.ts';
import { en as commonEn, tr as commonTr } from './messages/common.ts';
import { en as dashboardEn, tr as dashboardTr } from './messages/dashboard.ts';
import { en as navEn, tr as navTr } from './messages/nav.ts';
import { en as pagesEn, tr as pagesTr } from './messages/pages.ts';
import { en as reviewsEn, tr as reviewsTr } from './messages/reviews.ts';
import { en as salonsEn, tr as salonsTr } from './messages/salons.ts';
import { en as settingsEn, tr as settingsTr } from './messages/settings.ts';
import { en as shellEn, tr as shellTr } from './messages/shell.ts';
import { en as uiEn, tr as uiTr } from './messages/ui.ts';

export type Locale = 'tr' | 'en';
/** `system` = tarayıcı diline uy; `tr` / `en` = kullanıcı seçimi. */
export type LocaleMode = 'system' | 'tr' | 'en';

export const LOCALES: readonly Locale[] = ['tr', 'en'];
export const LOCALE_MODES: readonly LocaleMode[] = ['system', 'tr', 'en'];
/** localStorage anahtarı — tema için `app_theme` deseninin dil karşılığı. */
export const LOCALE_STORAGE_KEY = 'app_locale_mode';
export const DEFAULT_LOCALE_MODE: LocaleMode = 'system';

/**
 * Cookie adı — `LOCALE_STORAGE_KEY` ile **bilinçli olarak aynı** ad: aynı tercih iki
 * yerde durur, sunucu (`next/headers`) ve inline init script aynı anahtarı okur.
 */
export const LOCALE_COOKIE_NAME = LOCALE_STORAGE_KEY;
/** Cookie ömrü (saniye) — 1 yıl; localStorage gibi kalıcı tercih. */
export const LOCALE_COOKIE_MAX_AGE = 31_536_000;

/** Sözlük ağacı: yapraklar çeviri metni, dallar namespace. */
export type MessageTree = { readonly [key: string]: string | MessageTree };
export type TranslateVars = Record<string, string | number>;

/**
 * Namespace'ler: common, nav, shell, settings, dashboard, pages, reviews, salons,
 * appointments, ui, categories.
 */
export const MESSAGES: Record<Locale, MessageTree> = {
  tr: {
    common: commonTr,
    nav: navTr,
    shell: shellTr,
    settings: settingsTr,
    dashboard: dashboardTr,
    pages: pagesTr,
    reviews: reviewsTr,
    salons: salonsTr,
    appointments: appointmentsTr,
    ui: uiTr,
    categories: categoriesTr,
  },
  en: {
    common: commonEn,
    nav: navEn,
    shell: shellEn,
    settings: settingsEn,
    dashboard: dashboardEn,
    pages: pagesEn,
    reviews: reviewsEn,
    salons: salonsEn,
    appointments: appointmentsEn,
    ui: uiEn,
    categories: categoriesEn,
  },
};

/**
 * Tarayıcı dilinden locale türetir: `tr`, `tr-TR`, `tr-*` → 'tr'; diğer/boş → 'en'.
 * Panelin varsayılan dili Türkçe olduğu için bilinmeyen dil İngilizceye düşer.
 */
export function detectSystemLocale(navigatorLanguage: string | null | undefined): Locale {
  const raw = (navigatorLanguage ?? '').trim().toLowerCase();
  if (raw === '') return 'en';
  return raw === 'tr' || raw.startsWith('tr-') ? 'tr' : 'en';
}

/** Saklanan değeri doğrular; geçersiz/boş değer `null` (çağıran varsayılana düşer). */
export function parseLocaleMode(value: string | null | undefined): LocaleMode | null {
  const raw = (value ?? '').trim();
  return (LOCALE_MODES as readonly string[]).includes(raw) ? (raw as LocaleMode) : null;
}

/**
 * Cookie/localStorage değerini moda indirger: geçerli değer kendisi, geçersiz/boş
 * değer `DEFAULT_LOCALE_MODE`. Sunucu (`src/lib/i18n/server.ts`) ve istemci
 * (`LocaleProvider`) aynı fonksiyonu kullanır, böylece ikisi aynı varsayılana düşer.
 */
export function normalizeLocaleMode(value: string | null | undefined): LocaleMode {
  return parseLocaleMode(value) ?? DEFAULT_LOCALE_MODE;
}

/**
 * Dil modu cookie'sinin `Set-Cookie` eşdeğeri metni — **tek yazım noktası**
 * (`LocaleProvider` `setMode` bu metni `document.cookie`'ye atar). `httpOnly` yok:
 * istemci de aynı değeri okuyup yazabilsin (localStorage birincil kaynak kalır).
 */
export function localeModeCookie(mode: LocaleMode): string {
  return `${LOCALE_COOKIE_NAME}=${mode}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * `Accept-Language` başlığından locale türetir — sunucunun `system` modu için
 * tarayıcı dili tahmini. `q` ağırlığına göre sıralanır (desteklenmeyen diller de
 * sıralamaya girer, ilk etiket yine de `detectSystemLocale` ile indirgenir).
 * Boş/bozuk başlık → `detectSystemLocale(null)` = `'en'`.
 */
export function detectSystemLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): Locale {
  const header = (acceptLanguage ?? '').trim();
  if (header === '') return detectSystemLocale(null);

  const ranked = header
    .split(',')
    .map((entry, index) => {
      const [tag = '', ...params] = entry.split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = qParam === undefined ? 1 : Number.parseFloat(qParam.slice(2));
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag !== '' && entry.weight > 0)
    .sort((a, b) => (b.weight === a.weight ? a.index - b.index : b.weight - a.weight));

  return detectSystemLocale(ranked[0]?.tag ?? null);
}

/** Modu somut locale'e indirger: 'system' tarayıcı diline bakar, diğerleri kendisidir. */
export function resolveLocale(
  mode: LocaleMode,
  navigatorLanguage: string | null | undefined
): Locale {
  return mode === 'system' ? detectSystemLocale(navigatorLanguage) : mode;
}

/** Nokta yolunu ('nav.aria.main') ağaçta gezer; yaprak değilse `null`. */
function lookup(locale: Locale, key: string): string | null {
  const segments = key.split('.');
  let node: string | MessageTree | undefined = MESSAGES[locale];

  for (const segment of segments) {
    if (segment === '' || typeof node !== 'object') return null;
    node = node[segment];
  }

  return typeof node === 'string' ? node : null;
}

/**
 * Anahtarı metne çevirir. Eksik anahtar HATA ATMAZ: anahtarın kendisi döner, böylece
 * eksik çeviri arayüzde görünür olur ve sayfa çökmez. `{ad}` yer tutucuları `vars`
 * ile değiştirilir; verilmeyen yer tutucu olduğu gibi kalır.
 */
export function translate(locale: Locale, key: string, vars?: TranslateVars): string {
  const template = lookup(locale, key);
  if (template === null) return key;
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = vars[name];
    return value === undefined ? placeholder : String(value);
  });
}
