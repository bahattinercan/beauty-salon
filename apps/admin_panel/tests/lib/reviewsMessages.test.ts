/**
 * AP i18n — `reviews` namespace'i (`src/lib/i18n/messages/reviews.ts`).
 *
 * Kapsam: (a) tr/en anahtar ağacı eşitliği, (b) Yorum Yönetimi sayfası ve
 * yoruma özgü bileşenlerde kullanılan `reviews.*` anahtarlarının sözlükte
 * gerçekten var olması ("grep" testi: ekran metni anahtara bağlanmış ama
 * sözlüğe eklenmemişse burada yakalanır), (c) saf modülün
 * (`lib/reviewsQuery.ts`) döndürdüğü anahtarların çözümlenmesi, (d) tr
 * kopyasının bugünkü metinle birebir aynı kalması ve yer tutucuların dolması.
 *
 * Bağımlılık yok: modül saf TS, sayfa/bileşen dosyaları yalnız metin olarak
 * okunur (React/DOM import edilmez), `node --test` ile koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES, MESSAGES, translate, type MessageTree } from '../../src/lib/i18n/index.ts';
import {
  DATE_PRESET_OPTIONS,
  REPLY_LABEL_KEYS,
  REVIEW_SORT_OPTIONS,
  VISIBILITY_LABEL_KEYS,
} from '../../src/lib/reviewsQuery.ts';

const reviewsTr = MESSAGES.tr.reviews;
const reviewsEn = MESSAGES.en.reviews;

/** Ağacı `['page.refresh', 'Yenile']` çiftlerine düzleştirir. */
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

/** Dosyada geçen tüm `reviews.*` anahtar literalleri (tek/çift tırnak). */
function keysInSource(relativePath: string): string[] {
  const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
  const matches = source.match(/['"`]reviews\.[A-Za-z0-9_.]+['"`]/g) ?? [];
  return [...new Set(matches.map((literal) => literal.slice(1, -1)))].sort();
}

/* ---------- (a) tr/en anahtar ağacı eşitliği ---------- */

test('reviews: tr ve en aynı anahtar ağacına sahip', () => {
  const trKeys = flatten(reviewsTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(reviewsEn as MessageTree).map(([key]) => key);

  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile birebir aynı anahtarları içermeli');
  assert.ok(trKeys.length >= 60, `beklenen minimum anahtar sayısı karşılanmadı: ${trKeys.length}`);
});

test('reviews: iki dilde de boş metin yok ve eksik anahtar ham anahtar dönmüyor', () => {
  for (const [key, value] of flatten(reviewsTr as MessageTree)) {
    assert.notEqual(value.trim(), '', `tr.${key} boş olmamalı`);
    assert.notEqual(
      translate('tr', `reviews.${key}`),
      `reviews.${key}`,
      `tr.${key} sözlükte çözümlenmeli`
    );
    assert.notEqual(
      translate('en', `reviews.${key}`),
      `reviews.${key}`,
      `en.${key} sözlükte çözümlenmeli`
    );
  }
});

/* ---------- (b) kaynak dosyalarda kullanılan anahtarlar sözlükte var ---------- */

for (const [label, relativePath] of [
  ['sayfa', '../../src/app/reviews/page.tsx'],
  ['aksiyonlar', '../../src/components/reviews/ReviewActions.tsx'],
  ['detay diyalogu', '../../src/components/reviews/ReviewDetailDialog.tsx'],
  ['yıldız göstergesi', '../../src/components/reviews/Stars.tsx'],
] as const) {
  test(`${label}: kullanılan reviews anahtarları iki dilde de çözümleniyor`, () => {
    const keys = keysInSource(relativePath);
    const leaves = flatten(reviewsTr as MessageTree).map(([key]) => key);

    assert.ok(keys.length > 0, `${relativePath} içinde 'reviews.*' anahtarı bulunamadı`);
    for (const key of keys) {
      const bare = key.replace(/^reviews\./, '');
      // Dal (branch) anahtarı yaprak değil: `reviews.visibility` gibi önekler
      // harita üzerinden kurulur, yaprakları ayrı test doğrular.
      const isBranch = leaves.some((leaf) => leaf.startsWith(`${bare}.`));
      if (isBranch) continue;
      assert.ok(leaves.includes(bare), `${relativePath}: ${key} sözlükte yok`);
      for (const locale of LOCALES) {
        assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
      }
    }
  });
}

/* ---------- (c) saf modülün döndürdüğü anahtarlar ---------- */

test('reviews: REVIEW_SORT_OPTIONS ve DATE_PRESET_OPTIONS anahtarları çözümleniyor', () => {
  for (const option of REVIEW_SORT_OPTIONS) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, option.labelKey), option.labelKey, option.labelKey);
    }
  }
  for (const option of DATE_PRESET_OPTIONS) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, option.labelKey), option.labelKey, option.labelKey);
    }
  }
});

test('reviews: VISIBILITY_LABEL_KEYS ve REPLY_LABEL_KEYS tüm filtre değerlerini kapsıyor', () => {
  assert.deepEqual(Object.keys(VISIBILITY_LABEL_KEYS).sort(), ['gizli', 'görünür', 'tümü']);
  assert.deepEqual(Object.keys(REPLY_LABEL_KEYS).sort(), ['tümü', 'yanıtlı', 'yanıtsız']);
  for (const key of [...Object.values(VISIBILITY_LABEL_KEYS), ...Object.values(REPLY_LABEL_KEYS)]) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
    }
  }
});

/* ---------- (d) tr kopyası birebir + yer tutucular ---------- */

test('reviews: tr metinleri bugünkü kopyayla birebir aynı', () => {
  assert.equal(translate('tr', 'reviews.page.title'), 'Yorum Yönetimi');
  assert.equal(translate('tr', 'reviews.page.refresh'), 'Yenile');
  assert.equal(translate('tr', 'reviews.page.searchAriaLabel'), 'Yorum ara');
  assert.equal(
    translate('tr', 'reviews.page.searchPlaceholder'),
    'Müşteri, salon veya yorum metni ara…'
  );
  assert.equal(translate('tr', 'reviews.page.visibilityFilter'), 'Görünüm');
  assert.equal(translate('tr', 'reviews.page.allSalons'), 'Tüm salonlar');
  assert.equal(translate('tr', 'reviews.page.allRatings'), 'Tüm puanlar');
  assert.equal(translate('tr', 'reviews.actions.detail'), 'Detay');
  assert.equal(translate('tr', 'reviews.actions.editReply'), 'Yanıtı düzenle');
  assert.equal(translate('tr', 'reviews.actions.makeVisible'), 'Görünür yap');
  assert.equal(translate('tr', 'reviews.card.guest'), 'Misafir');
  assert.equal(translate('tr', 'reviews.card.noComment'), 'Yorum yazılmamış.');
  assert.equal(translate('tr', 'reviews.card.salonReply'), 'Salon yanıtı');
  assert.equal(translate('tr', 'reviews.detail.title'), 'Yorum detayı');
  assert.equal(translate('tr', 'reviews.detail.createdAt'), 'Yorum tarihi');
  assert.equal(translate('tr', 'reviews.replyDialog.title'), 'Yorumu yanıtla');
  assert.equal(translate('tr', 'reviews.replyDialog.back'), 'Vazgeç');
  assert.equal(
    translate('tr', 'reviews.replyDialog.errorLength'),
    'Yanıt 1-2000 karakter arasında olmalıdır'
  );
  assert.equal(translate('tr', 'reviews.deleteDialog.title'), 'Yorumu sil');
  assert.equal(
    translate('tr', 'reviews.deleteDialog.message'),
    'Yorum kalıcı olarak silinecek. Bu işlem geri alınamaz.'
  );
  assert.equal(translate('tr', 'reviews.empty.filteredTitle'), 'Eşleşme yok');
  assert.equal(translate('tr', 'reviews.empty.noneTitle'), 'Yorum bulunamadı');
  assert.equal(translate('tr', 'reviews.notice.loadError'), 'Yorumlar yüklenemedi');
  assert.equal(translate('tr', 'reviews.notice.replySaved'), 'Yanıt kaydedildi');
  assert.equal(translate('tr', 'reviews.notice.madeVisible'), 'Yorum görünür yapıldı');
  assert.equal(translate('tr', 'reviews.notice.deleted'), 'Yorum silindi');
});

test('reviews: çip şablonları {label}/{rating}/{name}/{query} yer tutucularını taşır', () => {
  assert.equal(
    translate('tr', 'reviews.chips.visibility', {
      label: translate('tr', VISIBILITY_LABEL_KEYS['görünür']),
    }),
    'Görünüm: Görünür'
  );
  assert.equal(
    translate('tr', 'reviews.chips.reply', {
      label: translate('tr', REPLY_LABEL_KEYS['yanıtsız']),
    }),
    'Yanıt: Yanıtsız'
  );
  assert.equal(translate('tr', 'reviews.chips.rating', { rating: 5 }), 'Puan: 5 yıldız');
  assert.equal(
    translate('tr', 'reviews.chips.salon', { name: 'Kuaför Yıldız' }),
    'Salon: Kuaför Yıldız'
  );
  assert.equal(translate('en', 'reviews.chips.search', { query: 'skin' }), 'Search: "skin"');
});

test('reviews: yer tutucular sayaç/puan/karakter/kapat ile doluyor', () => {
  assert.equal(translate('tr', 'reviews.page.subtitle', { count: 9 }), '9 yorum');
  assert.equal(translate('en', 'reviews.page.subtitle', { count: 1 }), '1 reviews');
  assert.equal(
    translate('tr', 'reviews.option', { label: translate('tr', 'reviews.rating.stars', { rating: 5 }), count: 5 }),
    '5 yıldız (5)'
  );
  assert.equal(
    translate('tr', 'reviews.replyDialog.hint', { count: 12, max: 2000 }),
    '12/2000 karakter'
  );
  assert.equal(
    translate('tr', 'reviews.detail.imageAlt', { customer: 'Zeynep Kaya', index: 1 }),
    'Zeynep Kaya yorum görseli 1'
  );
});
