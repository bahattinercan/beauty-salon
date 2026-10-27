/**
 * AP-007 W3 — `src/lib/salonsQuery.ts`
 *
 * Kapsam: `/salons` filtresinin URL ↔ durum ↔ API sorgusu eşlemesi. Modül saf
 * olduğu için ağsız/stub'sız `node:test` ile koşar (AP-002 kapısı); bu yüzden
 * sayfa testinden (vitest) bağımsız olarak da kırmızıya dönebilir.
 *
 * Kilitlenen sözleşme:
 * - Varsayılanlar URL'e yazılmaz; eksik/geçersiz parametre varsayılana döner.
 * - `?filter=` eski deep-link'i `durum`a alias'lanır (PageHeader linki korunur).
 * - `sirala` tek parametrede `sort:order` taşır.
 * - `toApiSearchParams` `status=tümü` göndermez (API validator 422 verirdi).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SALONS_QUERY,
  activeChips,
  buildSalonsQuery,
  normalizeQuery,
  parseSalonsQuery,
  toApiSearchParams,
} from '../../src/lib/salonsQuery.ts';

test('parseSalonsQuery: boş arama varsayılan durumu döner', () => {
  assert.deepEqual(parseSalonsQuery(''), DEFAULT_SALONS_QUERY);
  assert.deepEqual(parseSalonsQuery('?'), DEFAULT_SALONS_QUERY);
});

test('parseSalonsQuery: "?" öneki zorunlu değil (aynı sonucu verir)', () => {
  assert.deepEqual(
    parseSalonsQuery('q=kuaför&durum=onaylı'),
    parseSalonsQuery('?q=kuaför&durum=onaylı')
  );
});

test('parseSalonsQuery: eski ?filter=bekliyor derin bağlantısı durum olur', () => {
  assert.equal(parseSalonsQuery('?filter=bekliyor').status, 'bekliyor');
  // `durum` varsa alias'ı ezer.
  assert.equal(parseSalonsQuery('?filter=pasif&durum=onaylı').status, 'onaylı');
});

test('parseSalonsQuery: geçersiz durum/sayfa/puan/limit varsayılana döner', () => {
  const parsed = parseSalonsQuery('?durum=uydurma&sayfa=0&puan=9&limit=30');
  assert.equal(parsed.status, 'tümü');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.minRating, null);
  assert.equal(parsed.limit, 20);
});

test('parseSalonsQuery: sirala=sort:order çözülür, bilinmeyen değer varsayılan', () => {
  const named = parseSalonsQuery('?sirala=name:asc');
  assert.equal(named.sort, 'name');
  assert.equal(named.order, 'asc');

  const rated = parseSalonsQuery('?sirala=rating:desc');
  assert.equal(rated.sort, 'rating');
  assert.equal(rated.order, 'desc');

  const broken = parseSalonsQuery('?sirala=name');
  assert.equal(broken.sort, 'createdAt');
  assert.equal(broken.order, 'desc');
});

test('parseSalonsQuery: sayılar ve görünüm çözülür', () => {
  const parsed = parseSalonsQuery('?sayfa=3&limit=50&puan=4.5&sehir=İstanbul&gorunum=kartlar');
  assert.equal(parsed.page, 3);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.minRating, 4.5);
  assert.equal(parsed.city, 'İstanbul');
  assert.equal(parsed.view, 'kartlar');
  // Bilinmeyen görünüm tabloya döner.
  assert.equal(parseSalonsQuery('?gorunum=izgara').view, 'tablo');
});

test('buildSalonsQuery: varsayılan durum boş sorgu üretir', () => {
  assert.equal(buildSalonsQuery(DEFAULT_SALONS_QUERY), '');
});

test('buildSalonsQuery: dolu durum tüm parametreleri plan adlarıyla yazar', () => {
  const qs = buildSalonsQuery({
    q: 'kuaför',
    status: 'onaylı',
    city: 'İstanbul',
    minRating: 4,
    page: 2,
    limit: 50,
    sort: 'rating',
    order: 'desc',
    view: 'kartlar',
  });
  const params = new URLSearchParams(qs);

  assert.equal(params.get('q'), 'kuaför');
  assert.equal(params.get('durum'), 'onaylı');
  assert.equal(params.get('sehir'), 'İstanbul');
  assert.equal(params.get('puan'), '4');
  assert.equal(params.get('sayfa'), '2');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('sirala'), 'rating:desc');
  assert.equal(params.get('gorunum'), 'kartlar');
});

test('buildSalonsQuery ∘ parseSalonsQuery: gidiş-dönüş durumu korur', () => {
  const state = normalizeQuery({
    q: '  masaj ',
    status: 'pasif',
    city: 'Ankara',
    minRating: 3,
    page: 4,
    limit: 100,
    sort: 'name',
    order: 'asc',
    view: 'kartlar',
  });
  assert.deepEqual(parseSalonsQuery(`?${buildSalonsQuery(state)}`), state);
});

test('activeChips: durum → şehir → puan → arama sırası ve kaldırma yamaları', () => {
  const chips = activeChips({
    ...DEFAULT_SALONS_QUERY,
    q: 'kuaför',
    status: 'onaylı',
    city: 'İstanbul',
    minRating: 4,
  });

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['status', 'city', 'minRating', 'q']
  );
  assert.deepEqual(
    chips.map((chip) => chip.label),
    ['Durum: Onaylı', 'Şehir: İstanbul', 'Puan: 4+', 'Arama: "kuaför"']
  );
  assert.deepEqual(chips[0].patch, { status: 'tümü' });
  assert.deepEqual(chips[1].patch, { city: '' });
  assert.deepEqual(chips[2].patch, { minRating: null });
  assert.deepEqual(chips[3].patch, { q: '' });
});

test('activeChips: filtre yoksa chip üretmez', () => {
  assert.deepEqual(activeChips(DEFAULT_SALONS_QUERY), []);
  // Sıralama/görünüm/sayfa bir "filtre" değildir (chip çıkmaz).
  assert.deepEqual(
    activeChips({ ...DEFAULT_SALONS_QUERY, sort: 'name', order: 'asc', view: 'kartlar', page: 3 }),
    []
  );
});

test('normalizeQuery: aralık dışı değerleri kırpar, metni temizler', () => {
  const normalized = normalizeQuery({
    q: '  kuaför  ',
    status: 'bekliyor',
    city: '  İzmir ',
    minRating: 7,
    page: 0,
    limit: 30,
    sort: 'rating',
    order: 'desc',
    view: 'kartlar',
  });

  assert.equal(normalized.q, 'kuaför');
  assert.equal(normalized.city, 'İzmir');
  assert.equal(normalized.minRating, null);
  assert.equal(normalized.page, 1);
  assert.equal(normalized.limit, 20);
  assert.equal(normalized.sort, 'rating');
  assert.equal(normalized.order, 'desc');
});

test('toApiSearchParams: status=tümü gönderilmez, filtreler API adlarıyla gider', () => {
  const params = new URLSearchParams(
    toApiSearchParams({
      ...DEFAULT_SALONS_QUERY,
      q: 'Fatma',
      city: 'İstanbul',
      minRating: 3,
      page: 2,
      limit: 50,
      sort: 'name',
      order: 'asc',
    })
  );

  assert.equal(params.get('search'), 'Fatma');
  assert.equal(params.get('city'), 'İstanbul');
  assert.equal(params.get('minRating'), '3');
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('sort'), 'name');
  assert.equal(params.get('order'), 'asc');
  assert.equal(params.has('status'), false);
});

test('toApiSearchParams: durum seçiliyken status parametresi eklenir', () => {
  const params = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_SALONS_QUERY, status: 'pasif' })
  );
  assert.equal(params.get('status'), 'pasif');
  assert.equal(params.has('search'), false);
  assert.equal(params.has('city'), false);
});
