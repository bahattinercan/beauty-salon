'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE_MODE,
  LOCALE_STORAGE_KEY,
  detectSystemLocale,
  parseLocaleMode,
  resolveLocale,
  translate,
  type Locale,
  type LocaleMode,
  type TranslateVars,
} from '@/lib/i18n';
import { writeLocaleModeCookie } from '@/lib/i18n/localeCookie';

export interface I18nContextValue {
  /** Somut dil: 'tr' | 'en'. */
  locale: Locale;
  /** Kullanıcı tercihi: 'system' | 'tr' | 'en'. */
  mode: LocaleMode;
  setMode: (next: LocaleMode) => void;
  t: (key: string, vars?: TranslateVars) => string;
  /** 'system' modunda çözümlemenin dayandığı tarayıcı dili. */
  systemLocale: Locale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * localStorage yalnız tarayıcıda okunur (SSR'de `window` yok).
 *
 * Bu değer, `useSyncExternalStore`'un **client** anlık görüntüsüdür; ilk
 * (hidrasyon) render'ında React sunucu anlık görüntüsünü (`null`) kullanır,
 * dolayısıyla SSR HTML'i ile client'ın ilk render'ı aynı dili üretir.
 */
function readStoredMode(): LocaleMode | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseLocaleMode(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    /* private mode / storage kapalı: varsayılana düş */
    return null;
  }
}

function readBrowserLanguage(): string | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.language ?? null;
}

/** Başka sekmede yapılan dil değişikliği bu sekmeye de yansır. */
function subscribeToStorage(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LOCALE_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** `system` modu tarayıcı dili değişince takip eder (kullanıcı seçimi ezilmez). */
function subscribeToLanguage(onStoreChange: () => void): () => void {
  window.addEventListener('languagechange', onStoreChange);
  return () => window.removeEventListener('languagechange', onStoreChange);
}

export function LocaleProvider({
  children,
  initialMode,
  initialSystemLocale,
}: {
  children: ReactNode;
  /** Sunucunun cookie'den okuduğu mod — ilk render'ı ve SSR HTML'ini eşitler. */
  initialMode?: LocaleMode;
  /** Sunucunun `Accept-Language` tahmini — `system` modunda ilk render için. */
  initialSystemLocale?: Locale;
}) {
  // Kullanıcının bu oturumdaki seçimi; `null` = henüz seçmedi (depo/sunucu geçerli).
  const [chosenMode, setChosenMode] = useState<LocaleMode | null>(null);
  // Hidrasyonda sunucu anlık görüntüsü (`null`) kullanılır → SSR ile aynı dil.
  const storedMode = useSyncExternalStore(subscribeToStorage, readStoredMode, () => null);
  const browserLanguage = useSyncExternalStore(subscribeToLanguage, readBrowserLanguage, () => null);

  // Öncelik: bu oturumdaki seçim → localStorage → sunucu (cookie) → varsayılan.
  const mode: LocaleMode = chosenMode ?? storedMode ?? initialMode ?? DEFAULT_LOCALE_MODE;
  const systemLocale: Locale =
    browserLanguage === null
      ? (initialSystemLocale ?? detectSystemLocale(null))
      : detectSystemLocale(browserLanguage);
  const locale: Locale = mode === 'system' ? systemLocale : mode;

  // Sunucu tercihi cookie'den okur; localStorage'da kalmış eski tercih sunucuya
  // kopyalanır ki bir sonraki istek de aynı dili üretsin (geçiş yolu).
  useEffect(() => {
    if (storedMode !== null) writeLocaleModeCookie(storedMode);
  }, [storedMode]);

  // Mount ve mod değişiminde <html lang> güncellenir (ekran okuyucu + CSS :lang).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setMode = useCallback((next: LocaleMode) => {
    setChosenMode(next);
    // Cookie tek yazım noktası: SSR bir sonraki istekte aynı dili üretir.
    writeLocaleModeCookie(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* private mode / storage kapalı: oturum boyunca state yeterli */
    }
    // Effect'i beklemeden yaz: aynı tıklamada <html lang> tutarlı kalsın.
    document.documentElement.lang = resolveLocale(next, readBrowserLanguage());
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, mode, setMode, t, systemLocale }),
    [locale, mode, setMode, t, systemLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Provider dışında da çalışır: varsayılan moda göre çözülmüş bir değer döner,
 * hata fırlatmaz (tek başına render edilen bileşen/test patlamasın).
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;

  const systemLocale = detectSystemLocale(readBrowserLanguage());
  const locale = resolveLocale(DEFAULT_LOCALE_MODE, readBrowserLanguage());

  return {
    locale,
    mode: DEFAULT_LOCALE_MODE,
    setMode: () => {},
    t: (key: string, vars?: TranslateVars) => translate(locale, key, vars),
    systemLocale,
  };
}

export default LocaleProvider;
