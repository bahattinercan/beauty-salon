'use client';

import { useMemo, useSyncExternalStore } from 'react';

export interface StoredUser {
  fullName?: string;
  email?: string;
  role?: string;
}

const subscribeNoop = () => () => {};
const getEmptySnapshot = () => '';

/**
 * localStorage'daki oturucu kullaniciyi hydration'siz okur.
 * Render sirasinda dogrudan localStorage okumak SSR/CSR metin farki yaratir;
 * useEffect ile state'e kopyalamak da react-hooks/set-state-in-effect kuralina
 * takiilir. useSyncExternalStore + sabit sunucu snapshot'i ikisini de cozer.
 */
export function useStoredUser(): StoredUser | null {
  const raw = useSyncExternalStore(
    subscribeNoop,
    () => (typeof window === 'undefined' ? '' : localStorage.getItem('user') ?? ''),
    getEmptySnapshot
  );
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, [raw]);
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}
