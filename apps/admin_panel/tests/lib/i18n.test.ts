/**
 * AP i18n — `src/lib/i18n/index.ts` sözleşmesi.
 *
 * Kapsam: dil algılama (tarayıcı dilinden), mod ayrıştırma/çözümleme, sözlükten
 * çeviri (nokta yolu, yer tutucu, eksik anahtar) ve **tr/en anahtar parity**'si.
 * Parity testi yeni bir metnin yalnız tek dile eklenmesini yakalar: `en` eksik
 * kalırsa arayüzde ham anahtar görünür.
 *
 * Bağımlılık yok: modül saf TS (React/DOM import etmez), `node --test` ile koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_LOCALE_MODE,
  LOCALES,
  LOCALE_MODES,
  LOCALE_STORAGE_KEY,
  MESSAGES,
  detectSystemLocale,
  parseLocaleMode,
  pluralCategory,
  resolveLocale,
  resolveTemplate,
  translate,
  type MessageSource,
  type MessageTree,
} from '../../src/lib/i18n/index.ts';

/** Ağacı `['nav.aria.main', 'Ana gezinme']` çiftlerine düzleştirir. */
function flatten(tree: MessageTree, prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  for (const key of Object.keys(tree)) {
    const node = tree[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof node === 'string') out.push([path, node]);
    else out.push(...flatten(node, path));
  }
  return out;
}

/* ---------- detectSystemLocale ---------- */

test('detectSystemLocale: "tr" Türkçe döner', () => {
  assert.equal(detectSystemLocale('tr'), 'tr');
});

test('detectSystemLocale: "tr-TR" ve "tr-*" Türkçe döner', () => {
  assert.equal(detectSystemLocale('tr-TR'), 'tr');
  assert.equal(detectSystemLocale('tr-CY'), 'tr');
  assert.equal(detectSystemLocale('TR-tr'), 'tr');
});

test('detectSystemLocale: "en-US" İngilizce döner', () => {
  assert.equal(detectSystemLocale('en-US'), 'en');
  assert.equal(detectSystemLocale('de-DE'), 'en');
});

test('detectSystemLocale: boş string ve yalnız boşluk İngilizceye düşer', () => {
  assert.equal(detectSystemLocale(''), 'en');
  assert.equal(detectSystemLocale('   '), 'en');
});

test('detectSystemLocale: null/undefined İngilizceye düşer', () => {
  assert.equal(detectSystemLocale(null), 'en');
  assert.equal(detectSystemLocale(undefined), 'en');
});

/* ---------- parseLocaleMode ---------- */

test('parseLocaleMode: geçerli üç modu kabul eder', () => {
  assert.equal(parseLocaleMode('system'), 'system');
  assert.equal(parseLocaleMode('tr'), 'tr');
  assert.equal(parseLocaleMode('en'), 'en');
});

test('parseLocaleMode: geçersiz ve boş değerlerde null döner', () => {
  assert.equal(parseLocaleMode('de'), null);
  assert.equal(parseLocaleMode('TR'), null);
  assert.equal(parseLocaleMode(''), null);
  assert.equal(parseLocaleMode(null), null);
  assert.equal(parseLocaleMode(undefined), null);
});

/* ---------- resolveLocale ---------- */

test('resolveLocale: "system" tarayıcı diline uyar', () => {
  assert.equal(resolveLocale('system', 'tr-TR'), 'tr');
  assert.equal(resolveLocale('system', 'en-US'), 'en');
  assert.equal(resolveLocale('system', null), 'en');
});

test('resolveLocale: açık seçim tarayıcı dilini ezer', () => {
  assert.equal(resolveLocale('tr', 'en-US'), 'tr');
  assert.equal(resolveLocale('en', 'tr-TR'), 'en');
});

/* ---------- translate ---------- */

test('translate: nokta yolundaki iç içe anahtarı çözer', () => {
  assert.equal(translate('tr', 'nav.panel'), 'Panel');
  assert.equal(translate('en', 'nav.panel'), 'Dashboard');
  assert.equal(translate('tr', 'nav.aria.main'), 'Ana gezinme');
  assert.equal(translate('en', 'nav.aria.main'), 'Main navigation');
  assert.equal(translate('tr', 'settings.sections.general'), 'Genel Ayarlar');
});

test('translate: {ad} biçimli yer tutucuları değişkenden doldurur', () => {
  assert.equal(
    translate('tr', 'dashboard.hero.pendingHeadline', { count: 3 }),
    '3 salon başvurusu onay bekliyor'
  );
  assert.equal(
    translate('en', 'dashboard.hero.pendingHeadline', { count: 3 }),
    '3 salon applications are awaiting approval'
  );
  assert.equal(translate('tr', 'settings.fields.tokenDurationOption', { value: 30 }), '30 dakika');
});

test('translate: verilmeyen yer tutucu olduğu gibi kalır (hata atmaz)', () => {
  assert.equal(translate('tr', 'dashboard.hero.pendingHeadline'), '{count} salon başvurusu onay bekliyor');
  assert.equal(translate('tr', 'dashboard.stats.recentAppointmentsHint', { other: 1 }), '{count} son 30 gün');
});

test('translate: eksik anahtar anahtarın kendisini döner', () => {
  assert.equal(translate('tr', 'nav.yok'), 'nav.yok');
  assert.equal(translate('en', 'settings.fields.yok'), 'settings.fields.yok');
  assert.equal(translate('tr', 'nav.aria.main.fazla'), 'nav.aria.main.fazla');
  assert.equal(translate('tr', ''), '');
});

/* ---------- çoğul (plural) — AP-011 K4 ---------- */

/** Çoğul çifti taşıması beklenen gerçek anahtarlar (en az 5, en fazla 10). */
const PLURAL_KEYS = [
  'reviews.page.subtitle',
  'pages.users.subtitle',
  'pages.salons.subtitle',
  'pages.appointments.subtitle',
  'ui.pagination.total',
  'categories.card.serviceCount',
  'dashboard.hero.pendingHeadline',
  'settings.fields.tokenDurationOption',
] as const;

test('plural: en sayıya göre tekil/çoğul seçer, {count} korunur', () => {
  assert.equal(translate('en', 'reviews.page.subtitle', { count: 1 }), '1 review');
  assert.equal(translate('en', 'reviews.page.subtitle', { count: 2 }), '2 reviews');
  assert.equal(translate('en', 'reviews.page.subtitle', { count: 0 }), '0 reviews');
  assert.equal(translate('en', 'ui.pagination.total', { count: 1 }), '1 record');
  assert.equal(translate('en', 'ui.pagination.total', { count: 25 }), '25 records');
  assert.equal(translate('en', 'categories.card.serviceCount', { count: 1 }), '1 service');
  assert.equal(translate('en', 'categories.card.serviceCount', { count: 4 }), '4 services');
  assert.equal(translate('en', 'pages.users.subtitle', { count: 1 }), '1 user');
  assert.equal(translate('en', 'pages.users.subtitle', { count: 3 }), '3 users');
  assert.equal(
    translate('en', 'pages.salons.subtitle', { count: 1, pending: 2 }),
    '1 salon · 2 awaiting approval'
  );
  assert.equal(
    translate('en', 'pages.salons.subtitle', { count: 5, pending: 2 }),
    '5 salons · 2 awaiting approval'
  );
  assert.equal(
    translate('en', 'pages.appointments.subtitle', { count: 1, pending: 1 }),
    '1 appointment · 1 pending'
  );
  assert.equal(
    translate('en', 'dashboard.hero.pendingHeadline', { count: 1 }),
    '1 salon application is awaiting approval'
  );
  assert.equal(
    translate('en', 'dashboard.hero.pendingHeadline', { count: 2 }),
    '2 salon applications are awaiting approval'
  );
  // `{value}` sayıyı basar, `count` yalnız varyantı seçer (taban anahtar korunur).
  assert.equal(
    translate('en', 'settings.fields.tokenDurationOption', { value: 1, count: 1 }),
    '1 minute'
  );
  assert.equal(
    translate('en', 'settings.fields.tokenDurationOption', { value: 30, count: 30 }),
    '30 minutes'
  );
});

test('plural: tr iki sayıda da aynı metni taşır (çekim yok)', () => {
  for (const key of PLURAL_KEYS) {
    assert.equal(
      translate('tr', `${key}_one`),
      translate('tr', `${key}_other`),
      `tr ${key}: _one ve _other aynı metni taşımalı`
    );
  }
  assert.equal(translate('tr', 'reviews.page.subtitle', { count: 1 }), '1 yorum');
  assert.equal(translate('tr', 'reviews.page.subtitle', { count: 2 }), '2 yorum');
  assert.equal(translate('tr', 'ui.pagination.total', { count: 1 }), '1 kayıt');
  assert.equal(
    translate('tr', 'pages.salons.subtitle', { count: 1, pending: 0 }),
    '1 salon · 0 onay bekliyor'
  );
  assert.equal(
    translate('tr', 'settings.fields.tokenDurationOption', { value: 15, count: 15 }),
    '15 dakika'
  );
});

test('plural: çifti olmayan anahtar eski davranışta kalır (geriye dönük uyum)', () => {
  // Yer tutucu adı `{count}` değilse de `count` çoğul seçmez, yalnız yer tutucu dolar.
  assert.equal(translate('en', 'reviews.rating.stars', { count: 5, rating: 5 }), '5 stars');
  assert.equal(translate('tr', 'reviews.chips.salon', { count: 5, name: 'Kuaför' }), 'Salon: Kuaför');
  assert.equal(translate('tr', 'nav.yok', { count: 2 }), 'nav.yok');
  // `count` verilmezse çoğul anahtar bile taban metni basar.
  assert.equal(translate('en', 'reviews.page.subtitle'), '{count} reviews');
  // Sayı olmayan `count` çoğul seçmez: yer tutucu eskisi gibi değişir.
  assert.equal(translate('en', 'reviews.page.subtitle', { count: '1' }), '1 reviews');
});

test('plural: her `_one` çiftinin `_other` ve taban anahtarı var', () => {
  for (const locale of LOCALES) {
    const leaves = flatten(MESSAGES[locale]).map(([key]) => key);
    const oneKeys = leaves.filter((key) => key.endsWith('_one'));
    assert.ok(oneKeys.length >= 5, `beklenen minimum çoğul çifti karşılanmadı: ${oneKeys.length}`);
    assert.ok(oneKeys.length <= 10, `çoğul çifti üst sınırı aşıldı: ${oneKeys.length}`);
    for (const key of oneKeys) {
      const base = key.slice(0, -'_one'.length);
      assert.ok(leaves.includes(base), `${locale}: eksik taban anahtar ${base}`);
      assert.ok(leaves.includes(`${base}_other`), `${locale}: eksik ${base}_other`);
    }
  }
});

test('pluralCategory: en ve tr kategori seçimi (0/1/2)', () => {
  assert.equal(pluralCategory('en', 0), 'other');
  assert.equal(pluralCategory('en', 1), 'one');
  assert.equal(pluralCategory('en', 2), 'other');
  assert.equal(pluralCategory('tr', 0), 'other');
  assert.equal(pluralCategory('tr', 1), 'one');
  assert.equal(pluralCategory('tr', 2), 'other');
  // Intl `one` dışındaki her kategori `_other`'a düşer (1.5 gibi).
  assert.equal(pluralCategory('en', 1.5), 'other');
});

test('resolveTemplate: _one var _other yok → tekil çözülür, çoğulda tabana düşer', () => {
  const partial: MessageSource = {
    tr: { t: { x: '{count} taban', x_one: '{count} tekil' } },
    en: { t: { x: '{count} base', x_one: '{count} single' } },
  };
  assert.equal(resolveTemplate(partial, 'en', 't.x', { count: 1 }), '{count} single');
  assert.equal(resolveTemplate(partial, 'en', 't.x', { count: 2 }), '{count} base');
  assert.equal(resolveTemplate(partial, 'en', 't.x'), '{count} base');

  // Taban anahtar da yoksa `null` — çağıran (translate) anahtarın kendisini basar.
  const oneOnly: MessageSource = {
    tr: { t: { y_one: 'y' } },
    en: { t: { y_one: 'y' } },
  };
  assert.equal(resolveTemplate(oneOnly, 'tr', 't.y', { count: 1 }), 'y');
  assert.equal(resolveTemplate(oneOnly, 'tr', 't.y', { count: 2 }), null);
});

/* ---------- sözlük bütünlüğü ---------- */

test('MESSAGES: tr ve en anahtar ağacı birebir eşittir (anahtar parity)', () => {
  const trKeys = flatten(MESSAGES.tr).map(([key]) => key).sort();
  const enKeys = flatten(MESSAGES.en).map(([key]) => key).sort();
  assert.deepEqual(enKeys, trKeys, 'en sözlüğü tr ile aynı anahtarları taşımalı');
});

test('MESSAGES: her iki dilde de boş olmayan metinler var ve namespace\'ler tam', () => {
  for (const locale of LOCALES) {
    const leaves = flatten(MESSAGES[locale]);
    assert.equal(leaves.length > 0, true);
    for (const [key, value] of leaves) {
      assert.equal(value.trim().length > 0, true, `boş çeviri: ${locale} ${key}`);
    }
    for (const namespace of ['common', 'nav', 'shell', 'settings', 'dashboard']) {
      assert.equal(typeof MESSAGES[locale][namespace], 'object', `eksik namespace: ${namespace}`);
    }
  }
});

test('MESSAGES: nav namespace\'i 7 menü öğesinin tamamını taşır', () => {
  for (const key of [
    'nav.panel',
    'nav.salons',
    'nav.appointments',
    'nav.users',
    'nav.reviews',
    'nav.categories',
    'nav.settings',
  ]) {
    assert.notEqual(translate('tr', key), key, `eksik anahtar: ${key}`);
    assert.notEqual(translate('en', key), key, `eksik anahtar: ${key}`);
  }
});

/* ---------- sabitler ---------- */

test('sabitler: depolama anahtarı, locale listeleri ve varsayılan mod', () => {
  assert.equal(LOCALE_STORAGE_KEY, 'app_locale_mode');
  assert.deepEqual([...LOCALES], ['tr', 'en']);
  assert.deepEqual([...LOCALE_MODES], ['system', 'tr', 'en']);
  assert.equal(DEFAULT_LOCALE_MODE, 'system');
});
