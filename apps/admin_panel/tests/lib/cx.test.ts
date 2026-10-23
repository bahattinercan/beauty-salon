/**
 * AP-002 H1 — `src/lib/cx.ts`
 *
 * Kapsam: sınıf birleştiricinin sahte değerleri düşürmesi ve sırayı koruması.
 * Neden kapı: `Badge`, `Button`, `DataTable`, `Pagination`, `States` gibi tüm UI
 * primitifleri sınıf birleştirmesini buradan yapıyor — tek satırlık regresyon
 * 28 bileşende sessiz bozulma üretir.
 *
 * Bağımlılık: yok (saf modül, stub gerekmez).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cx } from '../../src/lib/cx.ts';

test('cx: sahte değerleri (false/null/undefined/"") düşürür', () => {
  assert.equal(cx('a', false, null, undefined, '', 'b'), 'a b');
  assert.equal(cx(false, null, undefined), '');
});

test('cx: argümansız çağrı boş string döner', () => {
  assert.equal(cx(), '');
});

test('cx: verilen sırayı korur ve tek boşlukla birleştirir', () => {
  assert.equal(cx('p-4', 'rounded-lg', 'text-sm'), 'p-4 rounded-lg text-sm');
  assert.equal(cx('a', 'b', 'c').split(' ').length, 3);
});

test('cx: yinelenen sınıfı ELEMEZ (koşullu birleştirici, dedupe değil)', () => {
  // Bu davranış bilinçlidir: çakışma çözümü Tailwind sırasına bırakılır.
  // `''` bekleyen bir assert kapıyı kırmızıya boyar (AP-002 §5 negatif kontrolü).
  assert.equal(cx('a', 'a'), 'a a');
});

test('cx: tek öğeli dizide fazladan boşluk üretmez', () => {
  assert.equal(cx('only'), 'only');
  assert.equal(cx('only').includes('  '), false);
});
