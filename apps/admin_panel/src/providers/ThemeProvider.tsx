'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
  /** SSR/hydration sırasında false; tema-bağımlı UI bunu beklemeli. */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** salon_app (lib/core/theme/theme_provider.dart) ile aynı anahtar. */
export const THEME_STORAGE_KEY = 'app_theme';
/** Aynı sekmede localStorage değişimi `storage` event'i tetiklemez → kendi event'imiz. */
const THEME_EVENT = 'admin-theme-change';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function isTheme(v: string | null): v is Theme {
  return v === 'light' || v === 'dark' || v === 'system';
}

/* ---------- useSyncExternalStore kaynakları ---------- */

function subscribeNothing() {
  return () => {};
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function subscribeSystemDark(onChange: () => void) {
  const mq = window.matchMedia(MEDIA_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSystemDark(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

const isMounted = () => true;
const isNotMounted = () => false;
const serverTheme = () => 'system' as Theme;
const serverSystemDark = () => false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, serverTheme);
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDark,
    serverSystemDark
  );
  const mounted = useSyncExternalStore(subscribeNothing, isMounted, isNotMounted);

  const resolved: Resolved =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Yalnızca dış sistemi (DOM) günceller; state yazmaz.
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved, mounted]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* private mode / storage kapalı */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, mounted }),
    [theme, resolved, setTheme, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeProvider;
