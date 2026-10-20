'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Recharts SVG üretir; `fill="var(--x)"` presentation attribute olarak güvenilir
 * değil, bu yüzden çözülmüş hex gerekir. Ama hex KOPYALANMAZ (eski hali LIGHT/DARK
 * sabitlerinde token'ların kopyasını tutuyordu — tema değişince chart eskide kalırdı).
 * Kaynak tek yerde kalır: globals.css tokenları, burada çalışma zamanında çözülür.
 */
export interface ChartTheme {
  grid: string;
  axis: string;
  surface: string;
  border: string;
  fg: string;
  fgMuted: string;
  bar: string;
  pieStroke: string;
  series: string[];
  tooltip: {
    contentStyle: React.CSSProperties;
    labelStyle: { color: string };
    itemStyle: { color: string };
  };
}

const VARS = [
  '--border',
  '--fg-subtle',
  '--surface',
  '--fg',
  '--fg-muted',
  '--primary-solid',
  '--success',
  '--warning',
  '--info',
  '--error',
  '--accent',
] as const;

const FALLBACK: Record<(typeof VARS)[number], string> = {
  '--border': '#DDD8EA',
  '--fg-subtle': '#6E6785',
  '--surface': '#FFFFFF',
  '--fg': '#1E1B2E',
  '--fg-muted': '#5A5370',
  '--primary-solid': '#6A4CB4',
  '--success': '#2F7D57',
  '--warning': '#8A5A00',
  '--info': '#1F5FA8',
  '--error': '#B32B38',
  '--accent': '#B39DDB',
};

/** Tokenları <html> üzerinden okur; düşen değer olursa açıkça belirtilmiş fallback. */
function readTokens(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  for (const name of VARS) {
    out[name] = cs.getPropertyValue(name).trim() || FALLBACK[name];
  }
  return out;
}

/**
 * Tema sınıfı <html>'de değiştiğinde tokenları yeniden oku — hex kopyası yok.
 * setState kullanılmıyor: snapshot olarak token değerlerinin birleşik metni
 * kullanılır, böylece tema değişimi doğal olarak yeniden render tetikler.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getSnapshot(): string {
  if (typeof document === 'undefined') return '';
  const cs = getComputedStyle(document.documentElement);
  return VARS.map((name) => cs.getPropertyValue(name).trim()).join('|');
}

export function useChartTheme(): ChartTheme {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '');

  return useMemo(() => {
    const tokens = snapshot ? readTokens() : { ...FALLBACK };
    const surface = tokens['--surface'];
    const border = tokens['--border'];
    return {
      grid: border,
      axis: tokens['--fg-subtle'],
      surface,
      border,
      fg: tokens['--fg'],
      fgMuted: tokens['--fg-muted'],
      bar: tokens['--primary-solid'],
      pieStroke: surface,
      series: [
        tokens['--primary-solid'],
        tokens['--success'],
        tokens['--warning'],
        tokens['--info'],
        tokens['--error'],
        tokens['--accent'],
      ],
      tooltip: {
        contentStyle: {
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: 12,
          color: tokens['--fg'],
        },
        labelStyle: { color: tokens['--fg'] },
        itemStyle: { color: tokens['--fg-muted'] },
      },
    };
  }, [snapshot]);
}

export default useChartTheme;
