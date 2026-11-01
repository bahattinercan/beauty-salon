/**
 * i18n — `ui.*` (ortak bileşen metinleri) ve `categories.*` (kayıtlı, dolu) sözleşmesi.
 *
 * Kapsam: (a) `ui` namespace'inde tr/en anahtar ağacı eşitliği, (b) `components/ui/*`
 * dosyalarında geçen `ui.*` / `common.*` anahtar literallerinin sözlükte gerçekten
 * bulunması ("grep" testi: bileşen metni anahtara bağlanmış ama sözlüğe eklenmemişse
 * burada yakalanır), (c) Badge durum haritalarının (`SALON_STATUS`,
 * `APPOINTMENT_STATUS`, `USER_ROLE`) `labelKey` değerlerinin varlığı, (d) tr
 * kopyasının bugünkü arayüz metniyle birebir aynı kalması, (e) `categories`
 * namespace'inin kayıtlı olması ve tr/en ağacının eşit (dolu) olması.
 *
 * Bağımlılık yok: modül saf TS, `.tsx` dosyaları yalnız METİN olarak okunur
 * (React/DOM import edilmez), `node --test` ile koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES, MESSAGES, translate, type MessageTree } from '../../src/lib/i18n/index.ts';

const uiTr = MESSAGES.tr.ui;
const uiEn = MESSAGES.en.ui;
const categoriesTr = MESSAGES.tr.categories;
const categoriesEn = MESSAGES.en.categories;

/** Ağacı `['pagination.pageSize', 'Sayfa başına kayıt']` çiftlerine düzleştirir. */
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

const uiSourceDir = fileURLToPath(new URL('../../src/components/ui/', import.meta.url));

/** `components/ui/*.tsx` kaynaklarında geçen `ui.*` / `common.*` anahtar literalleri. */
function componentKeys(): Map<string, string[]> {
  const byFile = new Map<string, string[]>();
  for (const file of readdirSync(uiSourceDir).filter((name) => name.endsWith('.tsx'))) {
    const source = readFileSync(uiSourceDir + file, 'utf8');
    const matches = source.match(/['"](?:ui|common)\.[A-Za-z0-9_.]+['"]/g) ?? [];
    byFile.set(
      file,
      [...new Set(matches.map((literal) => literal.slice(1, -1)))].sort()
    );
  }
  return byFile;
}

/* ---------- (a) tr/en anahtar ağacı eşitliği ---------- */

test('ui: tr ve en aynı anahtar ağacına sahip', () => {
  const trKeys = flatten(uiTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(uiEn as MessageTree).map(([key]) => key);

  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile birebir aynı anahtarları içermeli');
  assert.ok(trKeys.length >= 25, `beklenen minimum anahtar sayısı karşılanmadı: ${trKeys.length}`);
});

test('ui: iki dilde de boş metin yok ve eksik anahtar ham anahtar dönmüyor', () => {
  for (const [key, value] of flatten(uiTr as MessageTree)) {
    assert.notEqual(value.trim(), '', `tr.${key} boş olmamalı`);
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, `ui.${key}`), `ui.${key}`, `${locale}: ui.${key} çözümlenmeli`);
    }
  }
});

test('categories: iki dilde de kayıtlı ve tr/en ağacı eşit (dolu)', () => {
  assert.ok(categoriesTr, 'MESSAGES.tr.categories kayıtlı olmalı');
  assert.ok(categoriesEn, 'MESSAGES.en.categories kayıtlı olmalı');
  // T11 skeleton'ı doldurdu: ağaç boş değil ve iki dil aynı anahtarları taşır.
  // Ayrıntılı parity/kopya sözleşmesi `tests/lib/categoriesMessages.test.ts`.
  const trKeys = flatten(categoriesTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(categoriesEn as MessageTree).map(([key]) => key);
  assert.ok(trKeys.length > 0, 'tr categories dolu olmalı');
  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile aynı anahtarları içermeli');
});

/* ---------- (b) bileşenlerde kullanılan anahtarlar sözlükte var ---------- */

test('ui: components/ui içinde kullanılan anahtarlar iki dilde de çözümleniyor', () => {
  const byFile = componentKeys();
  let seen = 0;

  for (const [file, keys] of byFile) {
    for (const key of keys) {
      seen += 1;
      for (const locale of LOCALES) {
        assert.notEqual(
          translate(locale, key),
          key,
          `${file}: ${locale} sözlüğünde ${key} yok`
        );
      }
    }
  }

  assert.ok(seen >= 20, `beklenen minimum kullanım sayısı karşılanmadı: ${seen}`);
});

/* ---------- (c) Badge durum haritalarının anahtarları ---------- */

test('ui.badge: SALON_STATUS / APPOINTMENT_STATUS / USER_ROLE anahtarları sözlükte var', () => {
  const badgeSource = readFileSync(uiSourceDir + 'Badge.tsx', 'utf8');
  const keys = [...badgeSource.matchAll(/'ui\.badge\.[A-Za-z0-9_.]+'/g)].map((match) =>
    match[0].slice(1, -1)
  );

  assert.ok(keys.length >= 11, `Badge.tsx içinde 11 anahtar bekleniyordu, bulunan: ${keys.length}`);

  for (const required of [
    'ui.badge.salon.approved',
    'ui.badge.salon.pending',
    'ui.badge.salon.passive',
    'ui.badge.appointment.PENDING',
    'ui.badge.appointment.CONFIRMED',
    'ui.badge.appointment.COMPLETED',
    'ui.badge.appointment.CANCELLED',
    'ui.badge.appointment.NO_SHOW',
    'ui.badge.role.ADMIN',
    'ui.badge.role.SALON_OWNER',
    'ui.badge.role.CUSTOMER',
  ]) {
    assert.ok(keys.includes(required), `Badge.tsx içinde ${required} eksik`);
  }

  for (const key of keys) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
    }
  }
});

test('ui.badge: tr etiketleri bugünkü rozet metinleriyle aynı', () => {
  assert.equal(translate('tr', 'ui.badge.salon.approved'), 'Onaylı');
  assert.equal(translate('tr', 'ui.badge.salon.pending'), 'Bekliyor');
  assert.equal(translate('tr', 'ui.badge.salon.passive'), 'Pasif');
  assert.equal(translate('tr', 'ui.badge.appointment.PENDING'), 'Bekliyor');
  assert.equal(translate('tr', 'ui.badge.appointment.CONFIRMED'), 'Onaylandı');
  assert.equal(translate('tr', 'ui.badge.appointment.COMPLETED'), 'Tamamlandı');
  assert.equal(translate('tr', 'ui.badge.appointment.CANCELLED'), 'İptal Edildi');
  assert.equal(translate('tr', 'ui.badge.appointment.NO_SHOW'), 'Gelmedi');
  assert.equal(translate('tr', 'ui.badge.role.SALON_OWNER'), 'Salon Sahibi');
});

/* ---------- (d) tr kopyası birebir + yer tutucular ---------- */

test('ui: tr metinleri bugünkü kopyayla birebir aynı', () => {
  assert.equal(translate('tr', 'ui.pagination.pageSize'), 'Sayfa başına kayıt');
  assert.equal(translate('tr', 'ui.pagination.previous'), 'Önceki sayfa');
  assert.equal(translate('tr', 'ui.pagination.next'), 'Sonraki sayfa');
  assert.equal(translate('tr', 'ui.filterBar.label'), 'Filtre çubuğu');
  assert.equal(translate('tr', 'ui.filterChips.activeFilters'), 'Etkin filtreler');
  assert.equal(translate('tr', 'ui.dialog.close'), 'Kapat');
  assert.equal(translate('tr', 'ui.dataTable.emptyTitle'), 'Kayıt yok');
  assert.equal(translate('tr', 'ui.states.loading'), 'Yükleniyor…');
  assert.equal(translate('tr', 'ui.states.errorTitle'), 'Veri alınamadı');
  assert.equal(translate('tr', 'ui.states.retry'), 'Yeniden dene');
});

test('ui: yer tutucular verilen değerlerle doluyor', () => {
  assert.equal(
    translate('tr', 'ui.pagination.range', { from: 21, to: 40, total: 87 }),
    '21–40 / 87'
  );
  assert.equal(translate('tr', 'ui.pagination.total', { count: 250 }), '250 kayıt');
  assert.equal(
    translate('tr', 'ui.pagination.pageOf', { page: 2, totalPages: 5 }),
    'Sayfa 2 / 5'
  );
  assert.equal(translate('tr', 'ui.filterChips.count', { count: 2 }), '2 filtre etkin');
  assert.equal(
    translate('tr', 'ui.filterChips.remove', { label: 'Şehir: İstanbul' }),
    'Şehir: İstanbul filtresini kaldır'
  );
  assert.equal(
    translate('en', 'ui.pagination.pageOf', { page: 2, totalPages: 5 }),
    'Page 2 / 5'
  );
});
