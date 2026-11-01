'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

/** localStorage yalnız tarayıcıda okunur (SSR'de `window` yok). */
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

export function LocaleProvider({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode?: LocaleMode;
}) {
  // İlk render sırası: localStorage → initialMode → DEFAULT_LOCALE_MODE.
  const [mode, setModeState] = useState<LocaleMode>(
    () => readStoredMode() ?? initialMode ?? DEFAULT_LOCALE_MODE
  );
  const [systemLocale, setSystemLocale] = useState<Locale>(() =>
    detectSystemLocale(readBrowserLanguage())
  );

  const locale: Locale = mode === 'system' ? systemLocale : mode;

  // Tarayıcı dili değişirse 'system' modu takip eder (kullanıcı seçimi ezilmez).
  useEffect(() => {
    const onLanguageChange = () => setSystemLocale(detectSystemLocale(readBrowserLanguage()));
    window.addEventListener('languagechange', onLanguageChange);
    return () => window.removeEventListener('languagechange', onLanguageChange);
  }, []);

  // Mount ve mod değişiminde <html lang> güncellenir (ekran okuyucu + CSS :lang).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setMode = useCallback((next: LocaleMode) => {
    setModeState(next);
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
