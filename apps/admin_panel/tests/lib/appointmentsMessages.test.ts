/**
 * AP i18n — `appointments` namespace'i (`src/lib/i18n/messages/appointments.ts`).
 *
 * Kapsam: (a) tr/en anahtar ağacı eşitliği, (b) randevu sayfası ve randevuya özgü
 * bileşenlerde kullanılan `appointments.*` anahtarlarının sözlükte gerçekten var
 * olması ("grep" testi: ekran metni anahtara bağlanmış ama sözlüğe eklenmemişse
 * burada yakalanır), (c) saf modülün (`lib/appointmentsQuery.ts`) döndürdüğü
 * anahtarların çözümlenmesi, (d) tr kopyasının bugünkü metinle birebir aynı
 * kalması ve yer tutucuların dolması.
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
  APPOINTMENT_SORT_OPTIONS,
  DATE_PRESET_OPTIONS,
  STATUS_LABEL_KEYS,
} from '../../src/lib/appointmentsQuery.ts';

const appointmentsTr = MESSAGES.tr.appointments;
const appointmentsEn = MESSAGES.en.appointments;

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

/** Dosyada geçen tüm `appointments.*` anahtar literalleri (tek/çift tırnak). */
function keysInSource(relativePath: string): string[] {
  const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
  const matches = source.match(/['"`]appointments\.[A-Za-z0-9_.]+['"`]/g) ?? [];
  return [...new Set(matches.map((literal) => literal.slice(1, -1)))].sort();
}

/* ---------- (a) tr/en anahtar ağacı eşitliği ---------- */

test('appointments: tr ve en aynı anahtar ağacına sahip', () => {
  const trKeys = flatten(appointmentsTr as MessageTree).map(([key]) => key);
  const enKeys = flatten(appointmentsEn as MessageTree).map(([key]) => key);

  assert.deepEqual(enKeys, trKeys, 'en ağacı tr ile birebir aynı anahtarları içermeli');
  assert.ok(trKeys.length >= 60, `beklenen minimum anahtar sayısı karşılanmadı: ${trKeys.length}`);
});

test('appointments: iki dilde de boş metin yok ve eksik anahtar ham anahtar dönmüyor', () => {
  for (const [key, value] of flatten(appointmentsTr as MessageTree)) {
    assert.notEqual(value.trim(), '', `tr.${key} boş olmamalı`);
    assert.notEqual(
      translate('tr', `appointments.${key}`),
      `appointments.${key}`,
      `tr.${key} sözlükte çözümlenmeli`
    );
    assert.notEqual(
      translate('en', `appointments.${key}`),
      `appointments.${key}`,
      `en.${key} sözlükte çözümlenmeli`
    );
  }
});

/* ---------- (b) kaynak dosyalarda kullanılan anahtarlar sözlükte var ---------- */

for (const [label, relativePath] of [
  ['sayfa', '../../src/app/appointments/page.tsx'],
  ['aksiyonlar', '../../src/components/appointments/AppointmentActions.tsx'],
  ['detay diyalogu', '../../src/components/appointments/AppointmentDetailDialog.tsx'],
] as const) {
  test(`${label}: kullanılan appointments anahtarları iki dilde de çözümleniyor`, () => {
    const keys = keysInSource(relativePath);
    const leaves = flatten(appointmentsTr as MessageTree).map(([key]) => key);

    assert.ok(keys.length > 0, `${relativePath} içinde 'appointments.*' anahtarı bulunamadı`);
    for (const key of keys) {
      const bare = key.replace(/^appointments\./, '');
      // Dal (branch) anahtarı yaprak değil: `statusActions.cancel` gibi önekler
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

test('appointments: satır aksiyonlarının şablon anahtarları (dinamik `${prefix}`) tam', () => {
  // Sayfa anahtarı `t(`${config.keyPrefix}.title`)` ile kurar; grep testi bunu
  // göremez, bu yüzden dört yaprak burada açıkça doğrulanır.
  for (const action of ['confirm', 'complete', 'noShow', 'cancel']) {
    for (const leaf of ['verb', 'title', 'label', 'success']) {
      const key = `appointments.statusActions.${action}.${leaf}`;
      for (const locale of LOCALES) {
        assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
      }
    }
  }
});

/* ---------- (c) saf modülün döndürdüğü anahtarlar ---------- */

test('appointments: DATE_PRESET_OPTIONS ve APPOINTMENT_SORT_OPTIONS anahtarları çözümleniyor', () => {
  for (const option of DATE_PRESET_OPTIONS) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, option.labelKey), option.labelKey, option.labelKey);
    }
  }
  for (const option of APPOINTMENT_SORT_OPTIONS) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, option.labelKey), option.labelKey, option.labelKey);
    }
  }
});

test('appointments: STATUS_LABEL_KEYS altı filtre değerini kapsıyor ve çözümleniyor', () => {
  assert.deepEqual(Object.keys(STATUS_LABEL_KEYS).sort(), [
    'CANCELLED',
    'COMPLETED',
    'CONFIRMED',
    'NO_SHOW',
    'PENDING',
    'tümü',
  ]);
  for (const key of Object.values(STATUS_LABEL_KEYS)) {
    for (const locale of LOCALES) {
      assert.notEqual(translate(locale, key), key, `${locale}: ${key} sözlükte yok`);
    }
  }
});

test('appointments: çip şablonları {label}/{name}/{query} yer tutucularını taşır', () => {
  assert.equal(
    translate('tr', 'appointments.chips.status', {
      label: translate('tr', STATUS_LABEL_KEYS.PENDING),
    }),
    'Durum: Bekliyor'
  );
  assert.equal(
    translate('en', 'appointments.chips.salon', { name: 'Elegance Beauty' }),
    'Salon: Elegance Beauty'
  );
  assert.equal(translate('tr', 'appointments.chips.search', { query: 'cilt' }), 'Arama: "cilt"');
  assert.equal(translate('en', 'appointments.chips.search', { query: 'skin' }), 'Search: "skin"');
});

/* ---------- (d) tr kopyası birebir + yer tutucular ---------- */

test('appointments: tr metinleri bugünkü kopyayla birebir aynı', () => {
  assert.equal(translate('tr', 'appointments.page.refresh'), 'Yenile');
  assert.equal(translate('tr', 'appointments.page.searchAriaLabel'), 'Randevu ara');
  assert.equal(
    translate('tr', 'appointments.page.searchPlaceholder'),
    'Müşteri, salon, personel veya hizmet ara…'
  );
  assert.equal(translate('tr', 'appointments.page.allSalons'), 'Tüm salonlar');
  assert.equal(translate('tr', 'appointments.page.allStaff'), 'Tüm personel');
  assert.equal(translate('tr', 'appointments.status.all'), 'Tümü');
  assert.equal(translate('tr', 'appointments.status.CANCELLED'), 'İptal Edildi');
  assert.equal(translate('tr', 'appointments.columns.salonService'), 'Salon / Hizmet');
  assert.equal(translate('tr', 'appointments.columns.when'), 'Tarih / Saat');
  assert.equal(translate('tr', 'appointments.columns.actions'), 'İşlem');
  assert.equal(translate('tr', 'appointments.empty.filteredTitle'), 'Eşleşme yok');
  assert.equal(translate('tr', 'appointments.empty.filteredDescription'), 'Filtreleri temizleyip tekrar deneyin.');
  assert.equal(translate('tr', 'appointments.empty.noneTitle'), 'Randevu yok');
  assert.equal(translate('tr', 'appointments.actions.detail'), 'Detay');
  assert.equal(translate('tr', 'appointments.actions.noShow'), 'Gelmedi');
  assert.equal(translate('tr', 'appointments.detail.title'), 'Randevu detayı');
  assert.equal(translate('tr', 'appointments.detail.cancellationReason'), 'İptal nedeni');
  assert.equal(translate('tr', 'appointments.confirm.back'), 'Vazgeç');
  assert.equal(translate('tr', 'appointments.statusActions.cancel.title'), 'Randevuyu iptal et');
  assert.equal(translate('tr', 'appointments.statusActions.cancel.label'), 'İptal et');
  assert.equal(translate('tr', 'appointments.notice.loadError'), 'Randevular yüklenemedi');
  assert.equal(translate('tr', 'appointments.notice.actionError'), 'İşlem başarısız');
});

test('appointments: yer tutucular sayaç/etiket/tarih ile doluyor', () => {
  assert.equal(
    translate('tr', 'appointments.statusOption', {
      label: translate('tr', STATUS_LABEL_KEYS.PENDING),
      count: 12,
    }),
    'Bekliyor (12)'
  );
  assert.equal(
    translate('en', 'appointments.statusOption', {
      label: translate('en', STATUS_LABEL_KEYS['tümü']),
      count: 45,
    }),
    'All (45)'
  );
  assert.equal(
    translate('tr', 'appointments.confirm.message', {
      customer: 'Ayşe Yılmaz',
      date: '2 Eki 2026',
      verb: translate('tr', 'appointments.statusActions.cancel.verb'),
    }),
    'Ayşe Yılmaz — 2 Eki 2026 randevusu iptal edilecek. Emin misiniz?'
  );
  assert.equal(
    translate('en', 'appointments.confirm.message', {
      customer: 'Ayşe Yılmaz',
      date: 'Oct 2, 2026',
      verb: translate('en', 'appointments.statusActions.cancel.verb'),
    }),
    'Ayşe Yılmaz — the appointment on Oct 2, 2026 will be cancelled. Are you sure?'
  );
});
