/**
 * `src/lib/reviewsQuery.ts`
 *
 * Kapsam: Yorum Yönetimi filtresinin URL ↔ durum ↔ API sorgusu eşlemesi. Modül
 * saf olduğu için ağsız/stub'süz `node:test` ile koşar; sayfa testinden (vitest)
 * bağımsız olarak da kırmızıya dönebilir.
 *
 * Kilitlenen sözleşme:
 * - Varsayılanlar URL'e yazılmaz; eksik/geçersiz parametre varsayılana döner.
 * - `?filter=visible|hidden` eski deep-link'i `gorunum`e alias'lanır, `gorunum`
 *   varsa kazanır.
 * - `sirala` tek parametrede `sort:order` taşır.
 * - `toApiSearchParams` `tümü` filtrelerini göndermez; görünürlük `visible`/
 *   `hidden`, yanıt `replied`/`unreplied` olur; tarih önceli **yerel** takvime
 *   göre `dateFrom`/`dateTo`ya açılır (`toISOString` yok).
 * - Chip sırası sabit: görünüm → puan → yanıt → salon → tarih → arama.
 * - Modül SAF: çip ve seçenek metinleri `labelKey`/`valueKey`/`vars` olarak döner,
 *   tr metinleri `translate` ile çözülür (sayfanın bastığı metin birebir korunur).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DATE_PRESET_LABEL_KEYS,
  DATE_PRESET_OPTIONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_REVIEWS_QUERY,
  PAGE_SIZE_STORAGE_KEY,
  REPLY_LABEL_KEYS,
  REVIEW_REPLY_FILTERS,
  REVIEW_VISIBILITY_FILTERS,
  REVIEW_SORT_OPTIONS,
  REVIEWS_PAGE_SIZES,
  VISIBILITY_LABEL_KEYS,
  activeChips,
  buildReviewsQuery,
  dateRangeForPreset,
  normalizeQuery,
  parseReviewsQuery,
  toApiSearchParams,
} from '../../src/lib/reviewsQuery.ts';
import { translate } from '../../src/lib/i18n/index.ts';

/** Sabit "bugün": 27 Ekim 2026, Salı (Pazartesi 26 Ekim, Pazar 1 Kasım). */
const TODAY = new Date(2026, 9, 27);

/**
 * Testte tip importu yok (lib test deseni): uydurma enum değerlerini tipli imzaya
 * sokmanın okunur yolu — değerler `Record<string, unknown>` üzerinden geçer.
 */
function patchOf(values: Record<string, unknown>): Partial<typeof DEFAULT_REVIEWS_QUERY> {
  return values as Partial<typeof DEFAULT_REVIEWS_QUERY>;
}

/**
 * Çip metnini sayfanın bastığı gibi çözer (`app/reviews/page.tsx`): şablon
 * anahtarı + (varsa) `{label}` değer anahtarı + hazır değişkenler. Tip importu
 * yok (lib test deseni): yapısal parametre yeterli.
 */
function chipLabel(chip: {
  labelKey: string;
  valueKey?: string;
  vars?: Record<string, string | number>;
}): string {
  return translate('tr', chip.labelKey, {
    ...chip.vars,
    ...(chip.valueKey ? { label: translate('tr', chip.valueKey) } : null),
  });
}

test('sabitler: sayfa boyutları, depolama anahtarı ve seçenekler', () => {
  assert.deepEqual(REVIEWS_PAGE_SIZES, [20, 50, 100]);
  assert.equal(DEFAULT_PAGE_SIZE, 20);
  assert.equal(PAGE_SIZE_STORAGE_KEY, 'reviews_page_size');
  assert.deepEqual(REVIEW_VISIBILITY_FILTERS, ['tümü', 'görünür', 'gizli']);
  assert.deepEqual(REVIEW_REPLY_FILTERS, ['tümü', 'yanıtlı', 'yanıtsız']);
  assert.deepEqual(
    REVIEW_SORT_OPTIONS.map((option) => option.value),
    ['createdAt:desc', 'createdAt:asc', 'rating:desc', 'rating:asc']
  );
  assert.deepEqual(
    DATE_PRESET_OPTIONS.map((option) => option.value),
    ['tümü', 'bugün', 'yarın', 'bu-hafta', 'bu-ay', 'geçmiş', 'gelecek']
  );
  // Etiketler metin değil i18n anahtarı taşır; bugünkü tr kopyası birebir korunur.
  assert.deepEqual(
    REVIEW_SORT_OPTIONS.map((option) => translate('tr', option.labelKey)),
    ['En yeni', 'En eski', 'Yüksek puan', 'Düşük puan']
  );
  // Select aria-label'i de sözlükte var (eksik anahtar anahtarın kendisini basar).
  assert.equal(translate('tr', 'reviews.page.sortFilter'), 'Sıralama');
  assert.equal(translate('en', 'reviews.page.sortFilter'), 'Sort');
  assert.deepEqual(
    DATE_PRESET_OPTIONS.map((option) => translate('tr', option.labelKey)),
    ['Tüm tarihler', 'Bugün', 'Yarın', 'Bu hafta', 'Bu ay', 'Geçmiş', 'Gelecek']
  );
  // Select ve chip aynı anahtar kaynağını kullanır (sapma olursa burada yakalanır).
  assert.deepEqual(
    DATE_PRESET_OPTIONS.map((option) => option.labelKey),
    DATE_PRESET_OPTIONS.map((option) => DATE_PRESET_LABEL_KEYS[option.value])
  );
  assert.deepEqual(
    Object.values(VISIBILITY_LABEL_KEYS).map((key) => translate('tr', key)),
    ['Tümü', 'Görünür', 'Gizli']
  );
  assert.deepEqual(
    Object.values(REPLY_LABEL_KEYS).map((key) => translate('tr', key)),
    ['Tümü', 'Yanıtlı', 'Yanıtsız']
  );
  // Varsayılan sorgu sıralamaları seçeneklerle tutarlı olmalı.
  assert.ok(
    REVIEW_SORT_OPTIONS.some(
      (option) =>
        option.sort === DEFAULT_REVIEWS_QUERY.sort &&
        option.order === DEFAULT_REVIEWS_QUERY.order
    )
  );
});

test('varsayılan sorgu: tüm filtreler kapalı, sayfalama 1/20', () => {
  assert.deepEqual(DEFAULT_REVIEWS_QUERY, {
    q: '',
    visibility: 'tümü',
    rating: 'tümü',
    reply: 'tümü',
    salonId: '',
    date: 'tümü',
    page: 1,
    limit: 20,
    sort: 'createdAt',
    order: 'desc',
  });
});

test('parseReviewsQuery: boş arama varsayılan durumu döner', () => {
  assert.deepEqual(parseReviewsQuery(''), DEFAULT_REVIEWS_QUERY);
  assert.deepEqual(parseReviewsQuery('?'), DEFAULT_REVIEWS_QUERY);
});

test('parseReviewsQuery: "?" öneki zorunlu değil (aynı sonucu verir)', () => {
  assert.deepEqual(
    parseReviewsQuery('q=cilt&gorunum=gizli'),
    parseReviewsQuery('?q=cilt&gorunum=gizli')
  );
});

test('parseReviewsQuery: plan parametre adları çözülür', () => {
  const parsed = parseReviewsQuery(
    '?q=cilt&gorunum=gizli&puan=4&yanit=yanıtsız&salon=s-1&tarih=bu-hafta&sayfa=3&limit=50&sirala=rating:asc'
  );
  assert.equal(parsed.q, 'cilt');
  assert.equal(parsed.visibility, 'gizli');
  assert.equal(parsed.rating, 4);
  assert.equal(parsed.reply, 'yanıtsız');
  assert.equal(parsed.salonId, 's-1');
  assert.equal(parsed.date, 'bu-hafta');
  assert.equal(parsed.page, 3);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.sort, 'rating');
  assert.equal(parsed.order, 'asc');
});

test('parseReviewsQuery: dört sıralama seçeneği de (sort, order) ikilisine çözülür', () => {
  const expected: [string, string, string][] = [
    ['createdAt:desc', 'createdAt', 'desc'],
    ['createdAt:asc', 'createdAt', 'asc'],
    ['rating:desc', 'rating', 'desc'],
    ['rating:asc', 'rating', 'asc'],
  ];
  for (const [value, sort, order] of expected) {
    const parsed = parseReviewsQuery(`?sirala=${value}`);
    assert.equal(parsed.sort, sort, value);
    assert.equal(parsed.order, order, value);
  }
  // URL biçimi select seçenekleriyle aynı kaynaktan gelmeli (yazım sapması olmasın).
  assert.deepEqual(
    REVIEW_SORT_OPTIONS.map((option) => option.value),
    expected.map(([value]) => value)
  );
});

test('parseReviewsQuery: eski ?filter=visible|hidden derin bağlantısı gorunum olur', () => {
  assert.equal(parseReviewsQuery('?filter=visible').visibility, 'görünür');
  assert.equal(parseReviewsQuery('?filter=hidden').visibility, 'gizli');
  // `gorunum` varsa alias'ı ezer.
  assert.equal(parseReviewsQuery('?filter=hidden&gorunum=görünür').visibility, 'görünür');
  // Alias'ta uydurma değer varsa ikisi de geçersiz sayılır → tümü.
  assert.equal(parseReviewsQuery('?filter=uydurma').visibility, 'tümü');
});

test('parseReviewsQuery: geçersiz gorunum/puan/yanit varsayılana döner', () => {
  const parsed = parseReviewsQuery('?gorunum=heryerde&puan=9&yanit=cevaplı');
  assert.equal(parsed.visibility, 'tümü');
  assert.equal(parsed.rating, 'tümü');
  assert.equal(parsed.reply, 'tümü');
  // Puan 0 ve sayı olmayan değer de geçersiz.
  assert.equal(parseReviewsQuery('?puan=0').rating, 'tümü');
  assert.equal(parseReviewsQuery('?puan=abc').rating, 'tümü');
  // Puan 1 geçerli kenar değeri.
  assert.equal(parseReviewsQuery('?puan=1').rating, 1);
});

test('parseReviewsQuery: geçersiz sayfa/limit/tarih/sirala varsayılana döner', () => {
  const parsed = parseReviewsQuery(
    '?sayfa=0&limit=30&tarih=geçen-yıl&sirala=rating:bootstrap'
  );
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.date, 'tümü');
  assert.equal(parsed.sort, 'createdAt');
  assert.equal(parsed.order, 'desc');
  // `sirala=rating` (order eksik) de geçersizdir.
  const half = parseReviewsQuery('?sirala=rating');
  assert.equal(half.sort, 'createdAt');
  assert.equal(half.order, 'desc');
  // Listedeki olmayan kombinasyon (order eksik) de varsayılana döner.
  assert.equal(parseReviewsQuery('?sirala=createdAt').sort, 'createdAt');
  assert.equal(parseReviewsQuery('?sirala=createdAt').order, 'desc');
  // Sayı olmayan sayfa da varsayılana döner.
  assert.equal(parseReviewsQuery('?sayfa=abc').page, 1);
});

test('buildReviewsQuery: varsayılan durum boş sorgu üretir', () => {
  assert.equal(buildReviewsQuery(DEFAULT_REVIEWS_QUERY), '');
  assert.equal(buildReviewsQuery(normalizeQuery({ page: 1, limit: 20 })), '');
});

test('buildReviewsQuery: dolu durum tüm parametreleri plan adlarıyla yazar', () => {
  const qs = buildReviewsQuery({
    q: 'cilt',
    visibility: 'gizli',
    rating: 5,
    reply: 'yanıtlı',
    salonId: 'salon-1',
    date: 'bu-ay',
    page: 2,
    limit: 100,
    sort: 'rating',
    order: 'asc',
  });
  const params = new URLSearchParams(qs);

  assert.equal(params.get('q'), 'cilt');
  assert.equal(params.get('gorunum'), 'gizli');
  assert.equal(params.get('puan'), '5');
  assert.equal(params.get('yanit'), 'yanıtlı');
  assert.equal(params.get('salon'), 'salon-1');
  assert.equal(params.get('tarih'), 'bu-ay');
  assert.equal(params.get('sayfa'), '2');
  assert.equal(params.get('limit'), '100');
  assert.equal(params.get('sirala'), 'rating:asc');
  // `?` öneki yok.
  assert.equal(qs.startsWith('?'), false);
});

test('buildReviewsQuery: varsayılandan farklı sıralama sirala=<alan>:<yon> olarak yazılır', () => {
  // Varsayılan (createdAt:desc) yazılmaz; diğer üçü yazılır ve geri okunur.
  for (const option of REVIEW_SORT_OPTIONS) {
    const qs = buildReviewsQuery({
      ...DEFAULT_REVIEWS_QUERY,
      sort: option.sort,
      order: option.order,
    });
    const isDefault =
      option.sort === DEFAULT_REVIEWS_QUERY.sort && option.order === DEFAULT_REVIEWS_QUERY.order;
    assert.equal(new URLSearchParams(qs).has('sirala'), !isDefault, option.value);
    if (!isDefault) {
      assert.equal(new URLSearchParams(qs).get('sirala'), option.value);
      assert.deepEqual(parseReviewsQuery(qs), {
        ...DEFAULT_REVIEWS_QUERY,
        sort: option.sort,
        order: option.order,
      });
    }
  }
});

test('buildReviewsQuery: varsayılan değerler URL sorgusuna yazılmaz', () => {
  const qs = buildReviewsQuery({ ...DEFAULT_REVIEWS_QUERY, q: 'masaj' });
  assert.equal(qs, 'q=masaj');
  // Varsayılan görünürlük/puan/yanıt/tarih/sayfa/limit/sıralama hiç yazılmaz.
  for (const name of ['gorunum', 'puan', 'yanit', 'tarih', 'sayfa', 'limit', 'sirala', 'salon']) {
    assert.equal(new URLSearchParams(qs).has(name), false);
  }
});

test('buildReviewsQuery ∘ parseReviewsQuery: gidiş-dönüş durumu korur', () => {
  const state = normalizeQuery({
    q: '  bakım  ',
    visibility: 'görünür',
    rating: 3,
    reply: 'yanıtsız',
    salonId: 'aaaa1111',
    date: 'gelecek',
    page: 4,
    limit: 50,
    sort: 'rating',
    order: 'desc',
  });
  assert.deepEqual(parseReviewsQuery(`?${buildReviewsQuery(state)}`), state);
  // Varsayılan sıralama yazılmadığı için `sirala` dönmez, state yine eşittir.
  const defaults = normalizeQuery({ q: 'x', sort: 'createdAt', order: 'desc' });
  assert.equal(buildReviewsQuery(defaults).includes('sirala'), false);
  assert.deepEqual(parseReviewsQuery(buildReviewsQuery(defaults)), defaults);
});

test('dateRangeForPreset: bugün ve yarın tek günlük yerel aralık', () => {
  assert.deepEqual(dateRangeForPreset('bugün', TODAY), {
    dateFrom: '2026-10-27',
    dateTo: '2026-10-27',
  });
  assert.deepEqual(dateRangeForPreset('yarın', TODAY), {
    dateFrom: '2026-10-28',
    dateTo: '2026-10-28',
  });
  assert.deepEqual(dateRangeForPreset('tümü', TODAY), {});
});

test('dateRangeForPreset: bu-hafta Pazartesi..Pazar (Pazar günü 6 gün geri)', () => {
  // 27 Ekim 2026 Salı → hafta 26 Ekim (Pazartesi) .. 1 Kasım (Pazar).
  assert.deepEqual(dateRangeForPreset('bu-hafta', TODAY), {
    dateFrom: '2026-10-26',
    dateTo: '2026-11-01',
  });
  // 1 Kasım 2026 Pazar → hafta 26 Ekim .. 1 Kasım (ay taşımalı).
  assert.deepEqual(dateRangeForPreset('bu-hafta', new Date(2026, 10, 1)), {
    dateFrom: '2026-10-26',
    dateTo: '2026-11-01',
  });
});

test('dateRangeForPreset: bu-ay ayın ilk ve son günü (Şubat, yıl sonu)', () => {
  assert.deepEqual(dateRangeForPreset('bu-ay', TODAY), {
    dateFrom: '2026-10-01',
    dateTo: '2026-10-31',
  });
  // Şubat 2026 sönük yıl → 28 gün.
  assert.deepEqual(dateRangeForPreset('bu-ay', new Date(2026, 1, 15)), {
    dateFrom: '2026-02-01',
    dateTo: '2026-02-28',
  });
  // Aralık: ay sonu yıl taşır.
  assert.deepEqual(dateRangeForPreset('bu-ay', new Date(2026, 11, 5)), {
    dateFrom: '2026-12-01',
    dateTo: '2026-12-31',
  });
});

test('dateRangeForPreset: geçmiş/gelecek tek kenarlı, ay taşması doğru', () => {
  assert.deepEqual(dateRangeForPreset('geçmiş', TODAY), { dateTo: '2026-10-26' });
  assert.deepEqual(dateRangeForPreset('gelecek', TODAY), { dateFrom: '2026-10-28' });
  // 1 Kasım için geçmiş 31 Ekim, gelecek 2 Kasım (ay/yıl taşması yok).
  assert.deepEqual(dateRangeForPreset('geçmiş', new Date(2026, 10, 1)), { dateTo: '2026-10-31' });
  assert.deepEqual(dateRangeForPreset('gelecek', new Date(2026, 10, 1)), { dateFrom: '2026-11-02' });
});

test('toApiSearchParams: gorunum ve yanit API enumlarina acilir, tumu gonderilmez', () => {
  const visible = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_REVIEWS_QUERY, visibility: 'görünür', reply: 'yanıtlı' }, TODAY)
  );
  assert.equal(visible.get('visibility'), 'visible');
  assert.equal(visible.get('replied'), 'replied');

  const hidden = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_REVIEWS_QUERY, visibility: 'gizli', reply: 'yanıtsız' }, TODAY)
  );
  assert.equal(hidden.get('visibility'), 'hidden');
  assert.equal(hidden.get('replied'), 'unreplied');

  const none = new URLSearchParams(toApiSearchParams(DEFAULT_REVIEWS_QUERY, TODAY));
  assert.equal(none.has('visibility'), false);
  assert.equal(none.has('replied'), false);
  assert.equal(none.has('rating'), false);
});

test('toApiSearchParams: q→search, puan→rating, salon→salonId API adlarıyla gider', () => {
  const params = new URLSearchParams(
    toApiSearchParams(
      {
        ...DEFAULT_REVIEWS_QUERY,
        q: 'Fatma',
        rating: 2,
        salonId: 'salon-1',
        date: 'bu-ay',
        page: 2,
        limit: 50,
        sort: 'rating',
        order: 'desc',
      },
      TODAY
    )
  );

  assert.equal(params.get('search'), 'Fatma');
  assert.equal(params.get('rating'), '2');
  assert.equal(params.get('salonId'), 'salon-1');
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('sort'), 'rating');
  assert.equal(params.get('order'), 'desc');
  assert.equal(params.get('dateFrom'), '2026-10-01');
  assert.equal(params.get('dateTo'), '2026-10-31');
  // Panel parametre adları API sorgusunda kullanılmaz.
  assert.equal(params.has('q'), false);
  assert.equal(params.has('gorunum'), false);
  assert.equal(params.has('puan'), false);
});

test('toApiSearchParams: sayfalama ve siralama her zaman yazilir, araliksiz tarih yazılmaz', () => {
  const params = new URLSearchParams(toApiSearchParams(DEFAULT_REVIEWS_QUERY, TODAY));
  assert.equal(params.get('page'), '1');
  assert.equal(params.get('limit'), '20');
  assert.equal(params.get('sort'), 'createdAt');
  assert.equal(params.get('order'), 'desc');
  assert.equal(params.has('search'), false);
  assert.equal(params.has('salonId'), false);
  assert.equal(params.has('dateFrom'), false);
  assert.equal(params.has('dateTo'), false);
});

test('toApiSearchParams: seçilen her sıralama sort/order ikilisi olarak APIye gider', () => {
  for (const option of REVIEW_SORT_OPTIONS) {
    const params = new URLSearchParams(
      toApiSearchParams(
        { ...DEFAULT_REVIEWS_QUERY, sort: option.sort, order: option.order },
        TODAY
      )
    );
    assert.equal(params.get('sort'), option.sort, option.value);
    assert.equal(params.get('order'), option.order, option.value);
  }
});

test('toApiSearchParams: bugün önceli dateFrom=dateTo=bugün yapar', () => {
  const params = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_REVIEWS_QUERY, date: 'bugün' }, TODAY)
  );
  assert.equal(params.get('dateFrom'), '2026-10-27');
  assert.equal(params.get('dateTo'), '2026-10-27');
  // Geçmiş önceli yalnız dateTo taşır.
  const past = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_REVIEWS_QUERY, date: 'geçmiş' }, TODAY)
  );
  assert.equal(past.get('dateTo'), '2026-10-26');
  assert.equal(past.has('dateFrom'), false);
});

test('activeChips: filtre yoksa chip üretmez', () => {
  assert.deepEqual(activeChips(DEFAULT_REVIEWS_QUERY), []);
  // Sıralama/limit/sayfa bir "filtre" değildir (chip çıkmaz).
  assert.deepEqual(
    activeChips({ ...DEFAULT_REVIEWS_QUERY, sort: 'rating', order: 'asc', page: 3, limit: 100 }),
    []
  );
});

test('activeChips: sıralama hiçbir seçimde chip üretmez (randevu sayfasıyla aynı)', () => {
  for (const option of REVIEW_SORT_OPTIONS) {
    assert.deepEqual(
      activeChips({ ...DEFAULT_REVIEWS_QUERY, sort: option.sort, order: option.order }),
      [],
      option.value
    );
  }
  // Sıralama tek başına etkinken de yalnız gerçek filtreler chip üretir.
  const chips = activeChips({
    ...DEFAULT_REVIEWS_QUERY,
    rating: 5,
    sort: 'createdAt',
    order: 'asc',
  });
  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['rating']
  );
});

test('activeChips: chip sırası sabit (görünüm → puan → yanıt → salon → tarih → arama)', () => {
  const chips = activeChips(
    {
      ...DEFAULT_REVIEWS_QUERY,
      q: 'masaj',
      visibility: 'görünür',
      rating: 5,
      reply: 'yanıtlı',
      salonId: 'salon-1',
      date: 'yarın',
      page: 5,
    },
    { salon: 'Kuaför Yıldız' }
  );

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['visibility', 'rating', 'reply', 'salon', 'date', 'q']
  );
  // Ham sözleşme: anahtar + değişkenler (modül metin taşımaz).
  assert.deepEqual(
    chips.map((chip) => chip.labelKey),
    [
      'reviews.chips.visibility',
      'reviews.chips.rating',
      'reviews.chips.reply',
      'reviews.chips.salon',
      'reviews.chips.date',
      'reviews.chips.search',
    ]
  );
  assert.deepEqual(
    chips.map((chip) => chip.valueKey),
    [
      'reviews.visibility.visible',
      undefined,
      'reviews.reply.replied',
      undefined,
      'reviews.datePreset.tomorrow',
      undefined,
    ]
  );
  assert.deepEqual(chips[1].vars, { rating: 5 });
  assert.deepEqual(chips[3].vars, { name: 'Kuaför Yıldız' });
  assert.deepEqual(chips[5].vars, { query: 'masaj' });
  // Sayfanın bastığı metin bugünkü Türkçeyle aynı kalır.
  assert.deepEqual(
    chips.map((chip) => chipLabel(chip)),
    [
      'Görünüm: Görünür',
      'Puan: 5 yıldız',
      'Yanıt: Yanıtlı',
      'Salon: Kuaför Yıldız',
      'Tarih: Yarın',
      'Arama: "masaj"',
    ]
  );
  // Her yama ilgili alanı varsayılana çeker ve sayfayı 1'e döner.
  assert.deepEqual(chips[0].patch, { visibility: 'tümü', page: 1 });
  assert.deepEqual(chips[1].patch, { rating: 'tümü', page: 1 });
  assert.deepEqual(chips[2].patch, { reply: 'tümü', page: 1 });
  assert.deepEqual(chips[3].patch, { salonId: '', page: 1 });
  assert.deepEqual(chips[4].patch, { date: 'tümü', page: 1 });
  assert.deepEqual(chips[5].patch, { q: '', page: 1 });
});

test('activeChips: salon adı yoksa kimlik gösterilir', () => {
  const chips = activeChips({ ...DEFAULT_REVIEWS_QUERY, salonId: 'salon-1' });
  assert.equal(chips.length, 1);
  assert.equal(chips[0].labelKey, 'reviews.chips.salon');
  assert.deepEqual(chips[0].vars, { name: 'salon-1' });
  assert.equal(chipLabel(chips[0]), 'Salon: salon-1');
});

test('activeChips: her görünümlük/yanıt/puan değeri etiketini üretir', () => {
  for (const [visibility, valueKey, label] of [
    ['görünür', 'reviews.visibility.visible', 'Görünüm: Görünür'],
    ['gizli', 'reviews.visibility.hidden', 'Görünüm: Gizli'],
  ] as const) {
    const chips = activeChips({ ...DEFAULT_REVIEWS_QUERY, visibility });
    assert.equal(chips.length, 1);
    assert.equal(chips[0].key, 'visibility');
    assert.equal(chips[0].labelKey, 'reviews.chips.visibility');
    assert.equal(chips[0].valueKey, valueKey);
    assert.equal(chips[0].valueKey, VISIBILITY_LABEL_KEYS[visibility]);
    assert.equal(chipLabel(chips[0]), label);
  }
  for (const [reply, valueKey, label] of [
    ['yanıtlı', 'reviews.reply.replied', 'Yanıt: Yanıtlı'],
    ['yanıtsız', 'reviews.reply.unreplied', 'Yanıt: Yanıtsız'],
  ] as const) {
    const chips = activeChips({ ...DEFAULT_REVIEWS_QUERY, reply });
    assert.equal(chips.length, 1);
    assert.equal(chips[0].key, 'reply');
    assert.equal(chips[0].labelKey, 'reviews.chips.reply');
    assert.equal(chips[0].valueKey, valueKey);
    assert.equal(chips[0].valueKey, REPLY_LABEL_KEYS[reply]);
    assert.equal(chipLabel(chips[0]), label);
  }
  for (const rating of [1, 2, 3, 4, 5] as const) {
    const chips = activeChips({ ...DEFAULT_REVIEWS_QUERY, rating });
    assert.equal(chips[0].key, 'rating');
    assert.equal(chips[0].labelKey, 'reviews.chips.rating');
    assert.equal(chips[0].valueKey, undefined);
    assert.deepEqual(chips[0].vars, { rating });
    assert.equal(chipLabel(chips[0]), `Puan: ${rating} yıldız`);
  }
});

test('normalizeQuery: geçersiz limit 20ye döner, geçerli limit korunur', () => {
  assert.equal(normalizeQuery({ limit: 30 }).limit, 20);
  assert.equal(normalizeQuery({ limit: 50 }).limit, 50);
  assert.equal(normalizeQuery({ limit: 100 }).limit, 100);
  assert.equal(normalizeQuery({ limit: 0 }).limit, 20);
  assert.equal(normalizeQuery({ limit: 20.5 }).limit, 20);
  assert.equal(normalizeQuery({ limit: undefined }).limit, 20);
  assert.equal(normalizeQuery({ page: 2.5 }).page, 1);
  assert.equal(normalizeQuery({ page: 7 }).page, 7);
});

test('normalizeQuery: uydurma enum/değerler varsayılana döner, metinler kırpılır', () => {
  const normalized = normalizeQuery({
    ...patchOf({ date: 'dün', visibility: 'heryerde', reply: 'cevaplı', rating: '7' }),
    q: '  cilt bakımı  ',
    salonId: '  salon-1  ',
    sort: 'rating',
    order: 'asc',
    page: 3,
    limit: 100,
  });

  assert.equal(normalized.q, 'cilt bakımı');
  assert.equal(normalized.visibility, 'tümü');
  assert.equal(normalized.reply, 'tümü');
  assert.equal(normalized.rating, 'tümü');
  assert.equal(normalized.salonId, 'salon-1');
  assert.equal(normalized.date, 'tümü');
  assert.equal(normalized.sort, 'rating');
  assert.equal(normalized.order, 'asc');
  assert.equal(normalized.page, 3);
  assert.equal(normalized.limit, 100);

  // Eşleşmeyen (sort, order) ikilisi varsayılana döner.
  const broken = normalizeQuery(patchOf({ sort: 'rating', order: 'bootstrap' }));
  assert.equal(broken.sort, 'createdAt');
  assert.equal(broken.order, 'desc');

  // Puan sayısal string yamada sayıya döner, 1..5 dışı 'tümü'ne düşer.
  assert.equal(normalizeQuery(patchOf({ rating: '4' })).rating, 4);
  assert.equal(normalizeQuery(patchOf({ rating: 0 })).rating, 'tümü');

  // q uzunluğu 100 ile sınırlı.
  assert.equal(normalizeQuery({ q: 'a'.repeat(150) }).q.length, 100);
  // salonId 36 karakterle sınırlı (elle bozulmuş deep-link).
  assert.equal(normalizeQuery({ salonId: 'x'.repeat(40) }).salonId.length, 36);
});
