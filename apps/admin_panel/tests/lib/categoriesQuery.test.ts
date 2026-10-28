/**
 * `src/lib/categoriesQuery.ts` — `/categories` filtre durumunun URL ↔ durum ↔
 * liste eşlemesi (`salonsQuery.test.ts` deseni).
 *
 * Modül saf olduğu için ağsız/stub'sız `node:test` ile koşar; sayfa testinden
 * (vitest) bağımsız olarak kırmızıya dönebilir.
 *
 * Kilitlenen sözleşme:
 * - Varsayılanlar URL'e yazılmaz; eksik/geçersiz parametre varsayılana döner.
 * - `sirala` tek parametrede `sort:order` taşır; bilinmeyen değer varsayılan sıra.
 * - Filtre semantiği: `aktif`/`pasif` → `isActive`; `görselli`/`videolu`/`medyasız`
 *   → `imageUrl`/`videoUrl`; `q` ad+açıklamada harf duyarsız; `ikon` tam eşitlik.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORIES_PAGE_SIZES,
  CATEGORY_MEDIA_FILTERS,
  CATEGORY_SORT_OPTIONS,
  CATEGORY_STATUS_FILTERS,
  DEFAULT_CATEGORIES_QUERY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_STORAGE_KEY,
  activeChips,
  buildCategoriesQuery,
  filterCategories,
  hasActiveFilters,
  normalizeQuery,
  paginateCategories,
  parseCategoriesQuery,
  sortCategories,
  type CategoryMediaFilter,
  type CategoryRow,
  type CategoryStatusFilter,
} from '../../src/lib/categoriesQuery.ts';

type RowWithMeta = CategoryRow & { sortOrder?: number; createdAt?: string };

const ROWS: CategoryRow[] = [
  {
    id: '1',
    name: 'Saç',
    description: 'Kesim ve boyama',
    icon: 'content_cut',
    serviceCount: 12,
    isActive: true,
    imageUrl: 'https://cdn/sac.jpg',
    videoUrl: null,
  },
  {
    id: '2',
    name: 'Cilt Bakımı',
    description: null,
    icon: 'face',
    serviceCount: 4,
    isActive: false,
    imageUrl: '',
    videoUrl: '  ',
  },
  {
    id: '3',
    name: 'Spa & Masaj',
    description: 'Masaj paketleri',
    icon: 'spa',
    serviceCount: 9,
    isActive: true,
  },
  {
    id: '4',
    name: 'Tırnak',
    description: 'Manikür, pedikür',
    icon: 'brush',
    serviceCount: 0,
    isActive: true,
    imageUrl: null,
    videoUrl: 'https://cdn/tirnak.mp4',
  },
];

test('sabitler: sayfa boyutları, varsayılan ve localStorage anahtarı', () => {
  assert.deepEqual(CATEGORIES_PAGE_SIZES, [20, 50, 100]);
  assert.equal(DEFAULT_PAGE_SIZE, 20);
  assert.equal(PAGE_SIZE_STORAGE_KEY, 'categories_page_size');
  assert.deepEqual(CATEGORY_STATUS_FILTERS, ['tümü', 'aktif', 'pasif']);
  assert.deepEqual(CATEGORY_MEDIA_FILTERS, ['tümü', 'görselli', 'videolu', 'medyasız']);
  assert.deepEqual(
    CATEGORY_SORT_OPTIONS.map((option) => option.value),
    ['sortOrder:asc', 'name:asc', 'name:desc', 'serviceCount:desc', 'createdAt:desc']
  );
});

test('parseCategoriesQuery: boş arama varsayılan durumu döner', () => {
  assert.deepEqual(parseCategoriesQuery(''), DEFAULT_CATEGORIES_QUERY);
  assert.deepEqual(parseCategoriesQuery('?'), DEFAULT_CATEGORIES_QUERY);
});

test('parseCategoriesQuery: "?" öneki zorunlu değil (aynı sonucu verir)', () => {
  assert.deepEqual(
    parseCategoriesQuery('q=masaj&durum=aktif'),
    parseCategoriesQuery('?q=masaj&durum=aktif')
  );
});

test('parseCategoriesQuery: tüm parametreler okunur', () => {
  const parsed = parseCategoriesQuery(
    '?q=masaj&durum=pasif&medya=videolu&ikon=spa&sayfa=3&limit=50&sirala=name:desc&gorunum=kartlar'
  );
  assert.equal(parsed.q, 'masaj');
  assert.equal(parsed.status, 'pasif');
  assert.equal(parsed.media, 'videolu');
  assert.equal(parsed.icon, 'spa');
  assert.equal(parsed.page, 3);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.sort, 'name');
  assert.equal(parsed.order, 'desc');
  assert.equal(parsed.view, 'kartlar');
});

test('parseCategoriesQuery: geçersiz durum/medya/sayfa/limit/görünüm varsayılana döner', () => {
  const parsed = parseCategoriesQuery(
    '?durum=uydurma&medya=medyalı&sayfa=0&limit=30&gorunum=izgara'
  );
  assert.equal(parsed.status, 'tümü');
  assert.equal(parsed.media, 'tümü');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.view, 'tablo');
});

test('parseCategoriesQuery: bilinmeyen sirala değeri varsayılan sıraya döner', () => {
  const broken = parseCategoriesQuery('?sirala=name');
  assert.equal(broken.sort, 'sortOrder');
  assert.equal(broken.order, 'asc');

  const rated = parseCategoriesQuery('?sirala=createdAt:desc');
  assert.equal(rated.sort, 'createdAt');
  assert.equal(rated.order, 'desc');
});

test('buildCategoriesQuery: varsayılan durum boş sorgu üretir ("?" yok)', () => {
  assert.equal(buildCategoriesQuery(DEFAULT_CATEGORIES_QUERY), '');
});

test('buildCategoriesQuery: dolu durum tüm parametreleri plan adlarıyla yazar', () => {
  const qs = buildCategoriesQuery({
    q: 'masaj',
    status: 'aktif',
    media: 'görselli',
    icon: 'spa',
    page: 2,
    limit: 100,
    sort: 'serviceCount',
    order: 'desc',
    view: 'kartlar',
  });
  const params = new URLSearchParams(qs);

  assert.equal(qs.startsWith('?'), false);
  assert.equal(params.get('q'), 'masaj');
  assert.equal(params.get('durum'), 'aktif');
  assert.equal(params.get('medya'), 'görselli');
  assert.equal(params.get('ikon'), 'spa');
  assert.equal(params.get('sayfa'), '2');
  assert.equal(params.get('limit'), '100');
  assert.equal(params.get('sirala'), 'serviceCount:desc');
  assert.equal(params.get('gorunum'), 'kartlar');
});

test('buildCategoriesQuery ∘ parseCategoriesQuery: gidiş-dönüş durumu korur', () => {
  const state = normalizeQuery({
    q: '  masaj  ',
    status: 'aktif',
    media: 'medyasız',
    icon: 'spa',
    page: 4,
    limit: 50,
    sort: 'name',
    order: 'desc',
    view: 'kartlar',
  });
  assert.deepEqual(parseCategoriesQuery(`?${buildCategoriesQuery(state)}`), state);
});

test('normalizeQuery: limit/page/q sınırları ve geçersiz ikon/durum düzeltmesi', () => {
  const normalized = normalizeQuery({
    q: '  saç  ',
    status: 'aktif',
    media: 'görselli',
    icon: '  content_cut  ',
    page: 0,
    limit: 30,
    sort: 'name',
    order: 'asc',
  });

  assert.equal(normalized.q, 'saç');
  assert.equal(normalized.icon, 'content_cut');
  assert.equal(normalized.page, 1);
  assert.equal(normalized.limit, 20);

  // 100 karakterlik sınır kırpılır, sayısal olmayan sayfa 1'e döner.
  const long = normalizeQuery({ q: 'a'.repeat(140), page: 2.5, limit: 100 });
  assert.equal(long.q.length, 100);
  assert.equal(long.page, 1);
  assert.equal(long.limit, 100);

  // Elle bozulmuş deep-link / localStorage değerleri de normalize'dan geçer.
  const badStatus = 'yanlış' as CategoryStatusFilter;
  const badMedia = 'medyalı' as CategoryMediaFilter;
  assert.equal(normalizeQuery({ status: badStatus }).status, 'tümü');
  assert.equal(normalizeQuery({ media: badMedia }).media, 'tümü');
});

test('filterCategories: durum filtresi isActive semantiğiyle çalışır', () => {
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, status: 'aktif' }).map((r) => r.id),
    ['1', '3', '4']
  );
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, status: 'pasif' }).map((r) => r.id),
    ['2']
  );
  assert.equal(filterCategories(ROWS, DEFAULT_CATEGORIES_QUERY).length, 4);
});

test('filterCategories: medya filtresi görsel/video/medyasız ayrımı', () => {
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, media: 'görselli' }).map((r) => r.id),
    ['1']
  );
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, media: 'videolu' }).map((r) => r.id),
    ['4']
  );
  // Boş string ve boşluklu string "medyasız" sayılır (id 2'de videoUrl = '  ').
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, media: 'medyasız' }).map((r) => r.id),
    ['2', '3']
  );
});

test('filterCategories: ikon tam eşitlik, q ad/açıklamada harf duyarsız', () => {
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, icon: 'face' }).map((r) => r.id),
    ['2']
  );
  // Alt dize eşleşmez.
  assert.deepEqual(filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, icon: 'sp' }), []);

  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, q: 'MASAJ' }).map((r) => r.id),
    ['3']
  );
  // Açıklamada geçen ifade de bulunur.
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, q: 'manikür' }).map((r) => r.id),
    ['4']
  );
  // Birleşik filtreler VE olarak çalışır.
  assert.deepEqual(
    filterCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, q: 'saç', status: 'pasif' }),
    []
  );
});

test('sortCategories: isim Türkçe locale ile, hizmet sayısı sayısal olarak sıralanır', () => {
  const asc = sortCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, sort: 'name', order: 'asc' });
  assert.deepEqual(asc.map((r) => r.name), ['Cilt Bakımı', 'Saç', 'Spa & Masaj', 'Tırnak']);

  const desc = sortCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, sort: 'name', order: 'desc' });
  assert.deepEqual(desc.map((r) => r.name), ['Tırnak', 'Spa & Masaj', 'Saç', 'Cilt Bakımı']);

  const byCount = sortCategories(ROWS, {
    ...DEFAULT_CATEGORIES_QUERY,
    sort: 'serviceCount',
    order: 'desc',
  });
  assert.deepEqual(byCount.map((r) => r.serviceCount), [12, 9, 4, 0]);

  // Girdi dizisi değişmez, sortOrder/createdAt taşımayan satırlarda sıra korunur.
  assert.deepEqual(ROWS.map((r) => r.id), ['1', '2', '3', '4']);
  assert.deepEqual(
    sortCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, sort: 'createdAt', order: 'desc' }).map(
      (r) => r.id
    ),
    ['1', '2', '3', '4']
  );
});

test('sortCategories: satırda sortOrder/createdAt varsa kullanılır', () => {
  const rows: RowWithMeta[] = [
    { ...ROWS[0], sortOrder: 3 },
    { ...ROWS[2], sortOrder: 1 },
    { ...ROWS[3], sortOrder: 2 },
  ];
  assert.deepEqual(
    sortCategories(rows, DEFAULT_CATEGORIES_QUERY).map((r) => r.id),
    ['3', '4', '1']
  );

  const dated: RowWithMeta[] = [
    { ...ROWS[0], createdAt: '2024-01-01T00:00:00Z' },
    { ...ROWS[2], createdAt: '2025-06-01T00:00:00Z' },
  ];
  assert.deepEqual(
    sortCategories(dated, { ...DEFAULT_CATEGORIES_QUERY, sort: 'createdAt', order: 'desc' }).map(
      (r) => r.id
    ),
    ['3', '1']
  );
});

test('paginateCategories: sayfa dilimi, toplam ve taşan sayfa kırpması', () => {
  // `limit` yalnızca 20/50/100 kabul edildiği için sayfalama 25 satırla sınanır.
  const many: CategoryRow[] = Array.from({ length: 25 }, (_, index) => ({
    id: String(index + 1),
    name: `Kategori ${index + 1}`,
    icon: 'scissors',
    serviceCount: index,
    isActive: true,
  }));

  const first = paginateCategories(many, DEFAULT_CATEGORIES_QUERY);
  assert.equal(first.rows.length, 20);
  assert.deepEqual(
    first.rows.slice(0, 2).map((row) => row.id),
    ['1', '2']
  );
  assert.equal(first.total, 25);
  assert.equal(first.totalPages, 2);
  assert.equal(first.page, 1);

  const last = paginateCategories(many, { ...DEFAULT_CATEGORIES_QUERY, page: 2 });
  assert.equal(last.rows.length, 5);
  assert.deepEqual(
    last.rows.map((row) => row.id),
    ['21', '22', '23', '24', '25']
  );

  // Son sayfadan ileri taşan sayfa en son geçerli sayfaya kırılır.
  const beyond = paginateCategories(many, { ...DEFAULT_CATEGORIES_QUERY, page: 9 });
  assert.equal(beyond.page, 2);
  assert.equal(beyond.rows.length, 5);

  // Beyaz listede olmayan limit normalize'da 20'ye döner.
  assert.equal(paginateCategories(ROWS, { ...DEFAULT_CATEGORIES_QUERY, limit: 2 }).rows.length, 4);

  // Boş liste: totalPages 1, rows boş.
  const empty = paginateCategories([], DEFAULT_CATEGORIES_QUERY);
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.total, 0);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.page, 1);
});

test('activeChips: durum → medya → ikon → arama → sıralama sırası ve kaldırma yamaları', () => {
  const chips = activeChips({
    ...DEFAULT_CATEGORIES_QUERY,
    q: 'masaj',
    status: 'aktif',
    media: 'videolu',
    icon: 'spa',
    sort: 'name',
    order: 'desc',
  });

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['status', 'media', 'icon', 'q', 'sort']
  );
  assert.deepEqual(
    chips.map((chip) => chip.label),
    [
      'Durum: Aktif',
      'Medya: Videolu',
      'İkon: spa',
      'Arama: "masaj"',
      'Sıralama: İsim (Z-A)',
    ]
  );
  assert.deepEqual(chips[0].patch, { status: 'tümü' });
  assert.deepEqual(chips[1].patch, { media: 'tümü' });
  assert.deepEqual(chips[2].patch, { icon: '' });
  assert.deepEqual(chips[3].patch, { q: '' });
  assert.deepEqual(chips[4].patch, { sort: 'sortOrder', order: 'asc' });
});

test('activeChips: varsayılan sıralama/görünüm/sayfa chip üretmez', () => {
  assert.deepEqual(activeChips(DEFAULT_CATEGORIES_QUERY), []);
  assert.deepEqual(
    activeChips({ ...DEFAULT_CATEGORIES_QUERY, view: 'kartlar', page: 3, limit: 50 }),
    []
  );
});

test('hasActiveFilters: en az bir filtre (sıralama dâhil) etkin mi', () => {
  assert.equal(hasActiveFilters(DEFAULT_CATEGORIES_QUERY), false);
  assert.equal(hasActiveFilters({ ...DEFAULT_CATEGORIES_QUERY, q: 'saç' }), true);
  assert.equal(hasActiveFilters({ ...DEFAULT_CATEGORIES_QUERY, media: 'medyasız' }), true);
  assert.equal(hasActiveFilters({ ...DEFAULT_CATEGORIES_QUERY, sort: 'name', order: 'asc' }), true);
  assert.equal(
    hasActiveFilters({ ...DEFAULT_CATEGORIES_QUERY, sort: 'sortOrder', order: 'asc' }),
    false
  );
});
