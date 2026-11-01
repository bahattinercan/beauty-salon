/**
 * AP-011 K2 — dil tercihinin cookie taşıyıcısı (`src/lib/i18n/index.ts` içindeki saf
 * yardımcılar).
 *
 * Kapsam: cookie metninin **tam formatı** (path/max-age/samesite), geçersiz cookie
 * değerinin varsayılana düşmesi ve `Accept-Language` başlığından sistem dili
 * tahmini. Ağırlık (`q`) sıralaması test edilir çünkü tarayıcılar `tr-TR,tr;q=0.9`
 * gibi listeler gönderir ve ilk etiket her zaman en çok istenen dil değildir.
 *
 * Bağımlılık yok: modül saf TS, `node --test` ile koşar (AP-002 deseni).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_LOCALE_MODE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  detectSystemLocaleFromAcceptLanguage,
  localeModeCookie,
  normalizeLocaleMode,
  parseLocaleMode,
} from '../../src/lib/i18n/index.ts';

test('cookie adı localStorage anahtarıyla aynı (tek tercih, iki taşıyıcı)', () => {
  assert.equal(LOCALE_COOKIE_NAME, 'app_locale_mode');
  assert.equal(LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY);
});

test('localeModeCookie: cookie metni path/max-age/samesite niteliklerini taşır', () => {
  assert.equal(
    localeModeCookie('tr'),
    `app_locale_mode=tr; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
  );
  assert.equal(LOCALE_COOKIE_MAX_AGE, 31_536_000);
});

test('localeModeCookie: üç mod için de yalnız değer kısmı değişir', () => {
  for (const mode of ['system', 'tr', 'en'] as const) {
    assert.equal(localeModeCookie(mode).split(';')[0], `app_locale_mode=${mode}`);
  }
});

test('normalizeLocaleMode: geçerli değer korunur, geçersiz/boş varsayılana düşer', () => {
  assert.equal(normalizeLocaleMode('tr'), 'tr');
  assert.equal(normalizeLocaleMode('en'), 'en');
  assert.equal(normalizeLocaleMode('system'), 'system');
  assert.equal(normalizeLocaleMode('klingon'), DEFAULT_LOCALE_MODE);
  assert.equal(normalizeLocaleMode(''), DEFAULT_LOCALE_MODE);
  assert.equal(normalizeLocaleMode(null), DEFAULT_LOCALE_MODE);
  assert.equal(normalizeLocaleMode(undefined), DEFAULT_LOCALE_MODE);
  // Cookie değeri kırpılır: `parseLocaleMode` ile aynı sözleşme.
  assert.equal(normalizeLocaleMode(' en '), 'en');
  assert.equal(parseLocaleMode('klingon'), null);
});

test('Accept-Language: ilk etiket tr-* ise sistem dili "tr"', () => {
  assert.equal(detectSystemLocaleFromAcceptLanguage('tr-TR,tr;q=0.9,en-US;q=0.8'), 'tr');
  assert.equal(detectSystemLocaleFromAcceptLanguage('tr'), 'tr');
});

test('Accept-Language: desteklenmeyen dil "en"e düşer', () => {
  assert.equal(detectSystemLocaleFromAcceptLanguage('de-DE,de;q=0.9'), 'en');
  assert.equal(detectSystemLocaleFromAcceptLanguage(''), 'en');
  assert.equal(detectSystemLocaleFromAcceptLanguage(null), 'en');
  assert.equal(detectSystemLocaleFromAcceptLanguage(undefined), 'en');
});

test('Accept-Language: q ağırlığı sıralamayı belirler (ilk yazılan dil kazanmaz)', () => {
  assert.equal(detectSystemLocaleFromAcceptLanguage('en-US;q=0.5,tr-TR;q=0.9'), 'tr');
  assert.equal(detectSystemLocaleFromAcceptLanguage('tr;q=0.3,en;q=1'), 'en');
  // Eşit ağırlıkta yazım sırası korunur (tarayıcı tercihi).
  assert.equal(detectSystemLocaleFromAcceptLanguage('tr;q=0.8,en;q=0.8'), 'tr');
});

test('Accept-Language: bozuk/ayrıştırılamayan girişler çökmez', () => {
  assert.equal(detectSystemLocaleFromAcceptLanguage(';q=abc'), 'en');
  assert.equal(detectSystemLocaleFromAcceptLanguage('tr;q=0'), 'en');
  assert.equal(detectSystemLocaleFromAcceptLanguage(','), 'en');
});
