/**
 * AP i18n — `pages` namespace'i (`src/lib/i18n/messages/pages.ts`).
 *
 * Kapsam: (a) tr/en anahtar ağacı eşitliği, (b) `app/login/page.tsx` ve
 * `app/users/page.tsx` içinde kullanılan `pages.*` anahtarlarının sözlükte
 * gerçekten var olması ("grep" testi: ekran metni anahtara bağlanmış ama
 * sözlüğe eklenmemişse burada yakalanır), (c) tr kopyasının bugünkü sayfa
 * metniyle birebir aynı kalması ve yer tutucuların dolması.
 *
 * Bağımlılık yok: modül saf TS, sayfa dosyaları yalnız metin olarak okunur
 * (React/DOM import edilmez), `node --test` ile koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES, MESSAGES, translate, type MessageTree } from '../../src/lib/i18n/index.ts';

const pagesTr = MESSAGES.tr.pages;
const pagesEn = MESSAGES.en.pages;

/** Ağacı `['login.title', 'Admin Girişi']` çiftlerine düzleştirir. */
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

/** Sayfa kaynağında geçen tüm `pages.*` anahtar literalleri (tek/çift tırnak). */
function keysInSource(relativePath: string): string[] {
  const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
  const matches = source.match(/['"]pages\.[A-Za-z0-9_.]+['"]/g) ?? [];
  return [...new Set(matches.map((literal) => literal.slice(1, -1)))].sort();
}

/* ---------- (a) tr/en anahtar ağacı eşitliği ---------- */

test('pages: tr ve en aynı anahtar ağacına sahip', () => {
  const trKeys = flatten(pagesTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(pagesEn as MessageTree).map(([key]) => key);

  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile birebir aynı anahtarları içermeli');
  assert.ok(trKeys.length >= 30, `beklenen minimum anahtar sayısı karşılanmadı: ${trKeys.length}`);
});

test('pages: iki dilde de boş metin yok ve eksik anahtar ham anahtar dönmüyor', () => {
  for (const [key, value] of flatten(pagesTr as MessageTree)) {
    assert.notEqual(value.trim(), '', `tr.${key} boş olmamalı`);
    assert.notEqual(
      translate('tr', `pages.${key}`),
      `pages.${key}`,
      `tr.${key} sözlükte çözümlenmeli`
    );
    assert.notEqual(
      translate('en', `pages.${key}`),
      `pages.${key}`,
      `en.${key} sözlükte çözümlenmeli`
    );
  }
});

/* ---------- (b) sayfalarda kullanılan anahtarlar sözlükte var ---------- */

for (const [label, relativePath, namespace] of [
  ['login', '../../src/app/login/page.tsx', 'login.'],
  ['users', '../../src/app/users/page.tsx', 'users.'],
  ['salons (PageHeader)', '../../src/app/salons/page.tsx', 'salons.'],
  ['appointments (PageHeader)', '../../src/app/appointments/page.tsx', 'appointments.'],
  ['categories (PageHeader)', '../../src/app/categories/page.tsx', 'categories.'],
] as const) {
  test(`${label}: kullanılan pages anahtarları iki dilde de çözümleniyor`, () => {
    const keys = keysInSource(relativePath);

    assert.ok(keys.length > 0, `${relativePath} içinde 'pages.*' anahtarı bulunamadı`);
    for (const key of keys) {
      assert.ok(
        key.startsWith(`pages.${namespace}`),
        `${label}: beklenmeyen namespace — ${key} (pages.${namespace}* olmalı)`
      );
      for (const locale of LOCALES) {
        assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
      }
    }
  });
}

/* ---------- (c) tr kopyası birebir + yer tutucular ---------- */

test('pages: tr metinleri bugünkü kopyayla birebir aynı', () => {
  assert.equal(translate('tr', 'pages.login.title'), 'Admin Girişi');
  assert.equal(translate('tr', 'pages.login.subtitle'), 'Beauty Salon Yönetim Paneli');
  assert.equal(translate('tr', 'pages.login.submit'), 'Giriş yap');
  assert.equal(translate('tr', 'pages.login.errorAdminOnly'), 'Bu panele yalnızca Admin rolündeki kullanıcılar erişebilir');
  assert.equal(translate('tr', 'pages.users.title'), 'Kullanıcı Yönetimi');
  assert.equal(translate('tr', 'pages.users.searchPlaceholder'), 'İsim, e-posta veya telefon ara…');
  assert.equal(translate('tr', 'pages.users.emptyTitle'), 'Kullanıcı bulunamadı');
  assert.equal(translate('tr', 'pages.users.roles.salonOwner'), 'Salon Sahibi');
  assert.equal(translate('tr', 'pages.users.filterSalonOwners'), 'Salon Sahipleri');
  assert.equal(translate('tr', 'pages.salons.title'), 'Salon Yönetimi');
  assert.equal(translate('tr', 'pages.appointments.title'), 'Randevu Yönetimi');
  assert.equal(translate('tr', 'pages.categories.title'), 'Kategori Yönetimi');
});

test('pages: alt başlık yer tutucuları sayaçlarla doluyor', () => {
  assert.equal(
    translate('tr', 'pages.salons.subtitle', { count: 45, pending: 5 }),
    '45 salon · 5 onay bekliyor'
  );
  assert.equal(
    translate('tr', 'pages.appointments.subtitle', { count: 45, pending: 12 }),
    '45 randevu · 12 bekliyor'
  );
  assert.equal(
    translate('tr', 'pages.categories.subtitle', { count: 7, active: 4 }),
    '7 kategori · 4 aktif'
  );
  assert.equal(
    translate('en', 'pages.users.subtitle', { count: 3 }),
    '3 users'
  );
});
