'use client';

import { useEffect, useState } from 'react';

/**
 * AP-007 W3 — arama girdisi için 300ms debounce (plan §5.2).
 *
 * Değeri geciktirir, isteği değil: sayfa `q`'yu hemen state'e yazar (girdi
 * takılmaz), sunucu isteği yalnız gecikmiş değer değişince atılır. Zamanlayıcı
 * her değişiklikte sıfırlanır; bileşen sökülürse temizlenir.
 */
export default function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
