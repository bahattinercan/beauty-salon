/**
 * `src/lib/chartTheme.ts` — AP-002 §5 kapsam genişletmesi (5. modül).
 *
 * Kapsam: (a) sunucu snapshot'ı boşken AÇIKÇA belirtilmiş `FALLBACK` hex tablosu
 * kullanılır (grid/axis/surface/border/fg/bar/series/tooltip eşlemesi),
 * (b) `getComputedStyle` token döndürdüğünde token değeri kazanır, döndürmediğinde
 * o token için fallback'e düşer, (c) tooltip stilleri surface/border/fg'den türetilir.
 *
 * Neden kapı: bu dosya geçmişte LIGHT/DARK hex KOPYALARI tutuyordu ve tema
 * değişince grafik eskide kalıyordu; yani hex tablosu ve eşleme gerçek bir
 * regresyon yüzeyi.
 *
 * Stub notu (AP-002 §10.4): `react` gerçek değil (`tests/helpers/stubs/react.mjs`);
 * `useSyncExternalStore` snapshot'ı okur, `useMemo` türetmeyi hemen çalıştırır.
 * Bu kapı yeniden render / tema değişimi aboneliğini KANITLAMAZ.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { installDom } from '../helpers/dom.mjs';
// Hook'lar önce kaydedilmeli: `react` stub'ı olmadan `chartTheme.ts` yüklenemez.
import '../helpers/node-hooks.mjs';

type ChartThemeModule = typeof import('../../src/lib/chartTheme.ts');

const chartThemeModule: Promise<ChartThemeModule> = import('../../src/lib/chartTheme.ts');

test('useChartTheme: DOM yokken açık fallback tablosu kullanılır', async () => {
  const { useChartTheme } = await chartThemeModule;
  assert.equal(typeof globalThis.document, 'undefined');
  const theme = useChartTheme();
  assert.equal(theme.grid, '#DDD8EA');
  assert.equal(theme.surface, '#FFFFFF');
  assert.equal(theme.bar, '#6A4CB4');
  assert.equal(theme.fg, '#1E1B2E');
  assert.equal(theme.fgMuted, '#5A5370');
});

test('useChartTheme: series 6 renk ve ilk renk primary-solid', async () => {
  const { useChartTheme } = await chartThemeModule;
  const theme = useChartTheme();
  assert.equal(theme.series.length, 6);
  assert.equal(theme.series[0], '#6A4CB4');
  assert.equal(theme.series[1], '#2F7D57');
  assert.deepEqual(new Set(theme.series).size, 6);
});

test('useChartTheme: pieStroke surface ile aynı (dilim ayırıcı zemini)', async () => {
  const { useChartTheme } = await chartThemeModule;
  const theme = useChartTheme();
  assert.equal(theme.pieStroke, theme.surface);
  assert.equal(theme.grid, theme.border);
});

test('useChartTheme: tooltip stilleri surface/border/fg\'den türetilir', async () => {
  const { useChartTheme } = await chartThemeModule;
  const theme = useChartTheme();
  assert.equal(theme.tooltip.contentStyle.background, theme.surface);
  assert.equal(theme.tooltip.contentStyle.border, `1px solid ${theme.border}`);
  assert.equal(theme.tooltip.contentStyle.color, theme.fg);
  assert.equal(theme.tooltip.labelStyle.color, theme.fg);
  assert.equal(theme.tooltip.itemStyle.color, theme.fgMuted);
});

test('useChartTheme: getComputedStyle token döndürürse token kazanır', async () => {
  const { useChartTheme } = await chartThemeModule;
  const dom = installDom({ tokens: { '--primary-solid': '#123456', '--surface': '#0A0A0A' } });
  try {
    const theme = useChartTheme();
    assert.equal(theme.bar, '#123456');
    assert.equal(theme.surface, '#0A0A0A');
    assert.equal(theme.pieStroke, '#0A0A0A');
    assert.equal(theme.series[0], '#123456');
  } finally {
    dom.restore();
  }
});

test('useChartTheme: boş token için o değişkende fallback kullanılır', async () => {
  const { useChartTheme } = await chartThemeModule;
  // Yalnız bir token veriliyor; kalanlar `getPropertyValue` -> '' döner.
  const dom = installDom({ tokens: { '--border': '#010203' } });
  try {
    const theme = useChartTheme();
    assert.equal(theme.grid, '#010203');
    // Hiç verilmeyen token fallback'ten gelir.
    assert.equal(theme.bar, '#6A4CB4');
    assert.equal(theme.fg, '#1E1B2E');
  } finally {
    dom.restore();
  }
});
