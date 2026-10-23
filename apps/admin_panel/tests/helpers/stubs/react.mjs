/**
 * `react` test-yalnız stub'ı (AP-002 §5 + §10.4).
 *
 * `src/lib/session.ts` ve `src/lib/chartTheme.ts` yalnız iki hook kullanıyor:
 * `useSyncExternalStore` (snapshot okuma) ve `useMemo` (türetme). Node'da React
 * yok; bu stub bu iki hook'un **veri yolunu** taklit eder: snapshot oku, türetmeyi
 * çalıştır, sonucu döndür. Abone olma (subscribe) ve yeniden render KASITLI olarak
 * taklit EDİLMEZ — bu yüzden "tema değişince yeniden render olur" davranışı bu
 * kapıda kanıtlanmaz, yalnız snapshot -> çıktı eşlemesi kanıtlanır.
 *
 * DOM global'leri (window/document/localStorage/getComputedStyle) bu dosyada
 * KURULMAZ; her test kendi ihtiyacı kadarını `tests/helpers/dom.mjs` ile kurar.
 */

/** Snapshot'ı döndürür (sunucu snapshot'ı yok sayılır: test bizde "client" tarafı). */
export function useSyncExternalStore(_subscribe, getSnapshot) {
  return getSnapshot();
}

/** Türetmeyi hemen çalıştırır (memoizasyon yok — her çağrı taze hesap). */
export function useMemo(factory) {
  return factory();
}

export function useState(initial) {
  return [typeof initial === 'function' ? initial() : initial, () => {}];
}

export function useEffect() {}

export function useRef(value) {
  return { current: value };
}

export function useCallback(fn) {
  return fn;
}

const React = { useSyncExternalStore, useMemo, useState, useEffect, useRef, useCallback };

export default React;
