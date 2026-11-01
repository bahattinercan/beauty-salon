/**
 * T11 i18n — `categories` namespace'i (`src/lib/i18n/messages/categories.ts`).
 *
 * Kapsam: (a) tr/en anahtar ağacı eşitliği, (b) iki dilde de boş metin yok ve
 * anahtarlar çözümleniyor, (c) Kategori Yönetimi sayfası / `VideoField` /
 * `categoriesQuery.ts` içinde kullanılan `categories.*` anahtarlarının sözlükte
 * gerçekten var olması ("grep" testi: metin anahtara bağlanmış ama sözlüğe
 * eklenmemişse burada yakalanır), (d) saf modülün (`lib/categoriesQuery.ts`)
 * döndürdüğü `labelKey`/`valueKey`'lerin çözümlenmesi, (e) tr kopyasının bugünkü
 * metinle birebir aynı kalması ve yer tutucuların dolması.
 *
 * Bağımlılık yok: modül saf TS, sayfa/bileşen dosyaları yalnız metin olarak
 * okunur (React/DOM import edilmez), `node --test` ile koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LOCALES, MESSAGES, translate, type MessageTree, type TranslateVars } from '../../src/lib/i18n/index.ts';
import {
  CATEGORY_MEDIA_FILTER_LABEL_KEYS,
  CATEGORY_SORT_OPTIONS,
  CATEGORY_STATUS_FILTER_LABEL_KEYS,
  activeChips,
  normalizeQuery,
  type CategoryChip,
} from '../../src/lib/categoriesQuery.ts';

const categoriesTr = MESSAGES.tr.categories;
const categoriesEn = MESSAGES.en.categories;

/** Ağacı `['filter.view', 'Görünüm']` çiftlerine düzleştirir. */
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

/** Dosyada geçen tüm `categories.*` anahtar literalleri (tek/çift tırnak). */
function keysInSource(relativePath: string): string[] {
  const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
  const matches = source.match(/['"`]categories\.[A-Za-z0-9_.]+['"`]/g) ?? [];
  return [...new Set(matches.map((literal) => literal.slice(1, -1)))].sort();
}

/** Sayfanın chip metnini kurma kuralı: `t(labelKey, { ...vars, label: t(valueKey) })`. */
function chipText(locale: 'tr' | 'en', chip: CategoryChip): string {
  const vars: TranslateVars = {
    ...chip.vars,
    ...(chip.valueKey ? { label: translate(locale, chip.valueKey) } : {}),
  };
  return translate(locale, chip.labelKey, vars);
}

/* ---------- (a) tr/en anahtar ağacı eşitliği ---------- */

test('categories: tr ve en aynı anahtar ağacına sahip', () => {
  const trKeys = flatten(categoriesTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(categoriesEn as MessageTree).map(([key]) => key);

  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile birebir aynı anahtarları içermeli');
  assert.ok(trKeys.length >= 80, `beklenen minimum anahtar sayısı karşılanmadı: ${trKeys.length}`);
});

test('categories: iki dilde de boş metin yok ve eksik anahtar ham anahtar dönmüyor', () => {
  for (const [key, value] of flatten(categoriesTr as MessageTree)) {
    assert.notEqual(value.trim(), '', `tr.${key} boş olmamalı`);
    assert.notEqual(
      translate('tr', `categories.${key}`),
      `categories.${key}`,
      `tr.${key} sözlükte çözümlenmeli`
    );
    assert.notEqual(
      translate('en', `categories.${key}`),
      `categories.${key}`,
      `en.${key} sözlükte çözümlenmeli`
    );
  }
});

/* ---------- (b) kaynak dosyalarda kullanılan anahtarlar sözlükte var ---------- */

for (const [label, relativePath] of [
  ['sayfa', '../../src/app/categories/page.tsx'],
  ['video alanı', '../../src/components/categories/VideoField.tsx'],
  ['sorgu modülü', '../../src/lib/categoriesQuery.ts'],
] as const) {
  test(`${label}: kullanılan categories anahtarları iki dilde de çözümleniyor`, () => {
    const keys = keysInSource(relativePath);
    const leaves = flatten(categoriesTr as MessageTree).map(([key]) => key);

    assert.ok(keys.length > 0, `${relativePath} içinde 'categories.*' anahtarı bulunamadı`);
    for (const key of keys) {
      const bare = key.replace(/^categories\./, '');
      // Dal (branch) anahtarı yaprak değil: `categories.chips` gibi önekler
      // dinamik şablon kurar, yaprakları ayrı test doğrular.
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

test('categories: CATEGORY_SORT_OPTIONS ve filtre etiket anahtarları çözümleniyor', () => {
  for (const option of CATEGORY_SORT_OPTIONS) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, option.labelKey), option.labelKey, option.labelKey);
    }
  }
  for (const key of [
    ...Object.values(CATEGORY_STATUS_FILTER_LABEL_KEYS),
    ...Object.values(CATEGORY_MEDIA_FILTER_LABEL_KEYS),
  ]) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
    }
  }
});

test('categories: chip anahtarları (labelKey/valueKey) iki dilde de çözümleniyor', () => {
  const chips = activeChips(
    normalizeQuery({
      q: 'masaj',
      status: 'aktif',
      media: 'videolu',
      icon: 'spa',
      sort: 'name',
      order: 'desc',
    })
  );

  assert.equal(chips.length, 5);
  for (const chip of chips) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, chip.labelKey), chip.labelKey, chip.labelKey);
      if (chip.valueKey) {
        assert.notEqual(translate(locale, chip.valueKey), chip.valueKey, chip.valueKey);
      }
      assert.ok(!chipText(locale, chip).includes('{'), `${locale}: ${chip.key} yer tutucusu dolmalı`);
    }
  }
});

test('categories: chip metinleri bugünkü Türkçe kopyayla birebir aynı', () => {
  const chips = activeChips(
    normalizeQuery({
      q: 'masaj',
      status: 'aktif',
      media: 'videolu',
      icon: 'spa',
      sort: 'name',
      order: 'desc',
    })
  );

  assert.deepEqual(
    chips.map((chip) => chipText('tr', chip)),
    ['Durum: Aktif', 'Medya: Videolu', 'İkon: spa', 'Arama: "masaj"', 'Sıralama: İsim (Z-A)']
  );
  assert.deepEqual(
    chips.map((chip) => chipText('en', chip)),
    ['Status: Active', 'Media: With video', 'Icon: spa', 'Search: "masaj"', 'Sort: Name (Z-A)']
  );
});

/* ---------- (d) tr kopyası birebir + yer tutucular ---------- */

test('categories: tr metinleri bugünkü kopyayla birebir aynı', () => {
  assert.equal(translate('tr', 'categories.filter.view'), 'Görünüm');
  assert.equal(translate('tr', 'categories.filter.viewTable'), 'Tablo');
  assert.equal(translate('tr', 'categories.filter.viewCards'), 'Kartlar');
  assert.equal(translate('tr', 'categories.filter.refresh'), 'Yenile');
  assert.equal(translate('tr', 'categories.filter.newCategory'), 'Yeni kategori');
  assert.equal(
    translate('tr', 'categories.filter.searchPlaceholder'),
    'Kategori adı veya açıklamada ara'
  );
  assert.equal(translate('tr', 'categories.filter.search'), 'Kategori ara');
  assert.equal(translate('tr', 'categories.filter.status'), 'Durum filtresi');
  assert.equal(translate('tr', 'categories.filter.media'), 'Medya filtresi');
  assert.equal(translate('tr', 'categories.filter.icon'), 'İkon filtresi');
  assert.equal(translate('tr', 'categories.filter.iconAll'), 'Tüm ikonlar');
  assert.equal(translate('tr', 'categories.filter.sort'), 'Sıralama');
  assert.equal(translate('tr', 'categories.filter.sortDefault'), 'Sıra (varsayılan)');
  assert.equal(translate('tr', 'categories.statusFilter.all'), 'Tümü');
  assert.equal(translate('tr', 'categories.statusFilter.active'), 'Aktif');
  assert.equal(translate('tr', 'categories.statusFilter.passive'), 'Pasif');
  assert.equal(translate('tr', 'categories.mediaFilter.withImage'), 'Görselli');
  assert.equal(translate('tr', 'categories.mediaFilter.withVideo'), 'Videolu');
  assert.equal(translate('tr', 'categories.mediaFilter.withoutMedia'), 'Medyasız');
  assert.equal(translate('tr', 'categories.columns.name'), 'Kategori');
  assert.equal(translate('tr', 'categories.columns.description'), 'Açıklama');
  assert.equal(translate('tr', 'categories.columns.media'), 'Medya');
  assert.equal(translate('tr', 'categories.columns.serviceCount'), 'Hizmet');
  assert.equal(translate('tr', 'categories.columns.status'), 'Durum');
  assert.equal(translate('tr', 'categories.columns.actions'), 'İşlemler');
  assert.equal(translate('tr', 'categories.cells.video'), 'Video');
  assert.equal(translate('tr', 'categories.empty.noneTitle'), 'Kategori yok');
  assert.equal(
    translate('tr', 'categories.empty.noneDescription'),
    'Hizmetlerin bağlanacağı kategorileri oluşturun.'
  );
  assert.equal(translate('tr', 'categories.empty.filteredTitle'), 'Eşleşme yok');
  assert.equal(
    translate('tr', 'categories.empty.filteredDescription'),
    'Filtreleri temizleyip tekrar deneyin.'
  );
  assert.equal(translate('tr', 'categories.empty.createFirst'), 'İlk kategoriyi oluştur');
  assert.equal(translate('tr', 'categories.actions.edit'), 'Düzenle');
  assert.equal(translate('tr', 'categories.actions.delete'), 'Kategoriyi sil');
  assert.equal(translate('tr', 'categories.actions.save'), 'Kaydet');
  assert.equal(translate('tr', 'categories.actions.create'), 'Oluştur');
  assert.equal(translate('tr', 'categories.actions.cancel'), 'Vazgeç');
  assert.equal(translate('tr', 'categories.dialog.editTitle'), 'Kategoriyi düzenle');
  assert.equal(translate('tr', 'categories.dialog.createTitle'), 'Yeni kategori');
  assert.equal(translate('tr', 'categories.dialog.nameLabel'), 'Kategori adı');
  assert.equal(translate('tr', 'categories.dialog.namePlaceholder'), 'Örn. Saç');
  assert.equal(translate('tr', 'categories.dialog.descriptionLabel'), 'Açıklama');
  assert.equal(
    translate('tr', 'categories.dialog.descriptionHint'),
    'Müşteri uygulamasında kısa metin olarak görünür.'
  );
  assert.equal(translate('tr', 'categories.dialog.iconLabel'), 'İkon');
  assert.equal(translate('tr', 'categories.dialog.activeLabel'), 'Aktif');
  assert.equal(
    translate('tr', 'categories.dialog.activeHint'),
    'Pasif kategori müşteri uygulamasında görünmez.'
  );
  assert.equal(translate('tr', 'categories.dialog.activeToggle'), 'Kategori aktif');
  assert.equal(translate('tr', 'categories.dialog.imageLabel'), 'Kategori görseli');
  assert.equal(translate('tr', 'categories.dialog.videoLabel'), 'Kategori videosu');
  assert.equal(translate('tr', 'categories.icons.hair'), 'Saç');
  assert.equal(translate('tr', 'categories.icons.nail'), 'Tırnak');
  assert.equal(translate('tr', 'categories.icons.skin'), 'Cilt Bakımı');
  assert.equal(translate('tr', 'categories.icons.makeup'), 'Makyaj');
  assert.equal(translate('tr', 'categories.icons.epilation'), 'Epilasyon');
  assert.equal(translate('tr', 'categories.icons.spa'), 'SPA & Masaj');
  assert.equal(
    translate('tr', 'categories.confirm.delete'),
    'Bu kategoriyi silmek istediğinize emin misiniz?'
  );
  assert.equal(translate('tr', 'categories.notice.loadError'), 'Kategoriler yüklenemedi');
  assert.equal(translate('tr', 'categories.notice.saveError'), 'Kategori kaydedilemedi');
  assert.equal(translate('tr', 'categories.notice.deleteError'), 'Kategori silinemedi');
  assert.equal(
    translate('tr', 'categories.videoField.hint'),
    'MP4, WebM, OGG veya MOV — en fazla 50 MB'
  );
  assert.equal(translate('tr', 'categories.videoField.chooseFile'), 'Dosya seç');
  assert.equal(translate('tr', 'categories.videoField.remove'), 'Kaldır');
  assert.equal(translate('tr', 'categories.videoField.urlPlaceholder'), '/uploads/… veya https://…');
  assert.equal(translate('tr', 'categories.videoField.useUrl'), 'URL kullan');
  assert.equal(translate('tr', 'categories.videoField.uploading'), 'Video yükleniyor');
  assert.equal(
    translate('tr', 'categories.videoField.missingUrl'),
    'Yükleme yanıtında video yolu yok'
  );
  assert.equal(translate('tr', 'categories.videoField.uploadError'), 'Video yüklenemedi');
});

test('categories: yer tutucular sayaç/etiket/etiket metni ile doluyor', () => {
  assert.equal(translate('tr', 'categories.card.serviceCount', { count: 12 }), '12 hizmet');
  assert.equal(translate('en', 'categories.card.serviceCount', { count: 12 }), '12 services');
  assert.equal(
    translate('tr', 'categories.card.imageAlt', { name: 'SPA & Masaj' }),
    'SPA & Masaj görseli'
  );
  assert.equal(
    translate('tr', 'categories.videoField.noVideo', { label: 'Kategori videosu' }),
    'Kategori videosu: video yok'
  );
  assert.equal(
    translate('tr', 'categories.videoField.removeLabel', { label: 'Kategori videosu' }),
    'Kategori videosu videosunu kaldır'
  );
  assert.equal(
    translate('tr', 'categories.videoField.urlLabel', { label: 'Kategori videosu' }),
    'Kategori videosu URL'
  );
  assert.equal(
    translate('tr', 'categories.chips.q', { q: 'cilt' }),
    'Arama: "cilt"'
  );
  assert.equal(translate('en', 'categories.chips.q', { q: 'skin' }), 'Search: "skin"');
  assert.equal(translate('tr', 'categories.chips.icon', { icon: 'spa' }), 'İkon: spa');
  assert.equal(translate('en', 'categories.chips.status', { label: 'Passive' }), 'Status: Passive');
});
