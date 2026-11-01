/**
 * AP-011 K3 — kanonik enum kaynağı ve `labelKey` sözlük kapısı (`node:test`, ağsız).
 *
 * Kapsam:
 * (a) `src/lib/enums.ts` değer listeleri beklenen API enum'larıyla birebir,
 * (b) filtre listeleri (`APPOINTMENT_STATUS_FILTERS`, `SALON_STATUS_FILTERS`) kanonik
 *     listelerden TÜRETİLİR — ikinci kez elle yazılmaz,
 * (c) `src` altında kanonik değerleri tekrar eden bir `type X = 'A' | 'B'` birleşimi
 *     kalmadı (tek kaynak kanıtı; vitest karşılığı: `tests/unit/components/StatusMaps.test.tsx`),
 * (d) `src/lib/*Query.ts` ve `src/lib/nav.ts` içindeki tüm `labelKey` sözlükleri tr ve
 *     en'de çözümleniyor ve kanonik değerleri eksiksiz kapsıyor.
 *
 * Saf modüller import edilir (React/DOM yok), `.tsx` dosyaları yalnız METİN olarak
 * taranır — bu yüzden `node --test` ile DOM'suz koşar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPOINTMENT_STATUSES, SALON_STATUSES, USER_ROLES } from '../../src/lib/enums.ts';
import { LOCALES, translate } from '../../src/lib/i18n/index.ts';
import {
  APPOINTMENT_SORT_OPTIONS,
  APPOINTMENT_STATUS_FILTERS,
  DATE_PRESET_LABEL_KEYS,
  STATUS_LABEL_KEYS,
} from '../../src/lib/appointmentsQuery.ts';
import {
  SALON_SORT_OPTIONS,
  SALON_STATUS_CHIP_LABEL_KEYS,
  SALON_STATUS_FILTER_LABEL_KEYS,
  SALON_STATUS_FILTERS,
} from '../../src/lib/salonsQuery.ts';
import {
  CATEGORY_MEDIA_FILTER_LABEL_KEYS,
  CATEGORY_SORT_OPTIONS,
  CATEGORY_STATUS_FILTER_LABEL_KEYS,
} from '../../src/lib/categoriesQuery.ts';
import { NAV_ITEMS } from '../../src/lib/nav.ts';

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));
const ENUMS_FILE = join(SRC_DIR, 'lib', 'enums.ts');

const CANONICAL_VALUES: readonly string[] = [
  ...APPOINTMENT_STATUSES,
  ...USER_ROLES,
  ...SALON_STATUSES,
];

/** `src` altındaki tüm `.ts` / `.tsx` dosyaları (mutlak yol). */
function sourceFiles(dir = SRC_DIR): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/* ---------- (a) kanonik listeler ---------- */

test('enums: kanonik değer listeleri API enum sözleşmesiyle birebir', () => {
  assert.deepEqual([...APPOINTMENT_STATUSES], [
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]);
  assert.deepEqual([...USER_ROLES], ['ADMIN', 'SALON_OWNER', 'CUSTOMER']);
  assert.deepEqual([...SALON_STATUSES], ['onaylı', 'bekliyor', 'pasif']);
});

test('enums: değerler tekil ve boş değil', () => {
  for (const values of [APPOINTMENT_STATUSES, USER_ROLES, SALON_STATUSES]) {
    assert.ok(values.length > 0);
    assert.equal(new Set(values).size, values.length, 'aynı değer iki kez yazılmamalı');
    for (const value of values) assert.ok(value.trim() !== '', 'boş enum değeri olamaz');
  }
});

/* ---------- (b) filtre listeleri türetilir ---------- */

test('enums: APPOINTMENT_STATUS_FILTERS kanonik listeden türetilir', () => {
  assert.deepEqual(APPOINTMENT_STATUS_FILTERS, ['tümü', ...APPOINTMENT_STATUSES]);
});

test('enums: SALON_STATUS_FILTERS kanonik listeden türetilir', () => {
  assert.deepEqual(SALON_STATUS_FILTERS, ['tümü', ...SALON_STATUSES]);
});

/* ---------- (c) tek kaynak: src'de kopya birleşim yok ---------- */

const TYPE_ALIAS = /type\s+\w+\s*=\s*([^;]+);/g;

/** Bir `type X = ...` gövdesinde geçen kanonik değerler (tırnaklı literal olarak). */
function canonicalValuesIn(body: string): string[] {
  return CANONICAL_VALUES.filter((value) =>
    new RegExp(`['"\`]${value}['"\`]`).test(body)
  );
}

test("enums: kanonik değerleri tekrar eden birleşim bildirimi yalnız enums.ts'te yok", () => {
  const violations: string[] = [];

  for (const file of sourceFiles()) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(TYPE_ALIAS)) {
      const found = canonicalValuesIn(match[1]);
      // 1 değer meşru (`'tümü' | SalonStatus`); 2+ değer kopya listedir.
      if (found.length >= 2) violations.push(`${file}: ${match[0].slice(0, 90)}`);
    }
  }

  assert.deepEqual(violations, [], 'enum değer listeleri src/lib/enums.ts dışında tekrarlanmamalı');
});

test('enums: kanonik değerlerin tamamı enums.ts içinde bildirilir', () => {
  const source = readFileSync(ENUMS_FILE, 'utf8');
  for (const value of CANONICAL_VALUES) {
    assert.ok(source.includes(`'${value}'`), `enums.ts içinde ${value} eksik`);
  }
});

/* ---------- (d) labelKey sözlükleri ---------- */

const LABEL_KEY_DICTS: { name: string; keys: readonly string[] }[] = [
  { name: 'STATUS_LABEL_KEYS', keys: Object.values(STATUS_LABEL_KEYS) },
  { name: 'DATE_PRESET_LABEL_KEYS', keys: Object.values(DATE_PRESET_LABEL_KEYS) },
  { name: 'SALON_STATUS_FILTER_LABEL_KEYS', keys: Object.values(SALON_STATUS_FILTER_LABEL_KEYS) },
  { name: 'SALON_STATUS_CHIP_LABEL_KEYS', keys: Object.values(SALON_STATUS_CHIP_LABEL_KEYS) },
  { name: 'CATEGORY_STATUS_FILTER_LABEL_KEYS', keys: Object.values(CATEGORY_STATUS_FILTER_LABEL_KEYS) },
  { name: 'CATEGORY_MEDIA_FILTER_LABEL_KEYS', keys: Object.values(CATEGORY_MEDIA_FILTER_LABEL_KEYS) },
  { name: 'CATEGORY_SORT_OPTIONS', keys: CATEGORY_SORT_OPTIONS.map((option) => option.labelKey) },
  { name: 'SALON_SORT_OPTIONS', keys: SALON_SORT_OPTIONS.map((option) => option.labelKey) },
  {
    name: 'APPOINTMENT_SORT_OPTIONS',
    keys: APPOINTMENT_SORT_OPTIONS.map((option) => option.labelKey),
  },
  { name: 'NAV_ITEMS', keys: NAV_ITEMS.map((item) => item.labelKey) },
];

test('i18n: her labelKey sözlüğü tr ve en içinde çözümleniyor', () => {
  for (const { name, keys } of LABEL_KEY_DICTS) {
    assert.ok(keys.length > 0, `${name} boş olmamalı`);
    for (const key of keys) {
      for (const locale of LOCALES) {
        assert.notEqual(translate(locale, key), key, `${locale}: ${name} → ${key} sözlükte yok`);
      }
    }
  }
});

test('i18n: durum/salon sözlükleri kanonik değerleri eksiksiz kapsıyor', () => {
  for (const value of APPOINTMENT_STATUSES) {
    assert.ok(value in STATUS_LABEL_KEYS, `STATUS_LABEL_KEYS içinde ${value} eksik`);
  }
  for (const value of SALON_STATUSES) {
    assert.ok(value in SALON_STATUS_FILTER_LABEL_KEYS, `durum filtresi sözlüğünde ${value} eksik`);
    assert.ok(value in SALON_STATUS_CHIP_LABEL_KEYS, `chip sözlüğünde ${value} eksik`);
  }
});
