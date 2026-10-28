/**
 * `src/lib/appointmentsQuery.ts`
 *
 * Kapsam: `/appointments` filtresinin URL ↔ durum ↔ API sorgusu eşlemesi. Modül
 * saf olduğu için ağsız/stub'süz `node:test` ile koşar (AP-002 kapısı); bu yüzden
 * sayfa testinden (vitest) bağımsız olarak da kırmızıya dönebilir.
 *
 * Kilitlenen sözleşme:
 * - Varsayılanlar URL'e yazılmaz; eksik/geçersiz parametre varsayılana döner.
 * - `?filter=` eski deep-link'i `durum`a alias'lanır, `durum` varsa kazanır.
 * - `sirala` tek parametrede `sort:order` taşır.
 * - `toApiSearchParams` `status=tümü` göndermez; tarih önceli `dateFrom`/`dateTo`
 *   olarak **yerel** takvime göre açılır (`toISOString` yok).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  APPOINTMENT_SORT_OPTIONS,
  APPOINTMENTS_PAGE_SIZES,
  DATE_PRESET_OPTIONS,
  DEFAULT_APPOINTMENTS_QUERY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_STORAGE_KEY,
  activeChips,
  buildAppointmentsQuery,
  dateRangeForPreset,
  normalizeQuery,
  parseAppointmentsQuery,
  toApiSearchParams,
} from '../../src/lib/appointmentsQuery.ts';

/** Sabit "bugün": 27 Ekim 2026, Salı (Pazartesi 26 Ekim, Pazar 1 Kasım). */
const TODAY = new Date(2026, 9, 27);

/**
 * Testte tip importu yok (AP-002 deseni): uydurma enum değerlerini tipli imzaya
 * sokmanın okunur yolu — değerler `Record<string, unknown>` üzerinden geçer.
 */
function patchOf(values: Record<string, unknown>): Partial<typeof DEFAULT_APPOINTMENTS_QUERY> {
  return values as Partial<typeof DEFAULT_APPOINTMENTS_QUERY>;
}

test('sabitler: sayfa boyutları, depolama anahtarı ve seçenekler', () => {
  assert.deepEqual(APPOINTMENTS_PAGE_SIZES, [20, 50, 100]);
  assert.equal(DEFAULT_PAGE_SIZE, 20);
  assert.equal(PAGE_SIZE_STORAGE_KEY, 'appointments_page_size');
  assert.deepEqual(
    APPOINTMENT_SORT_OPTIONS.map((option) => option.value),
    ['createdAt:desc', 'date:asc', 'date:desc']
  );
  assert.deepEqual(
    DATE_PRESET_OPTIONS.map((option) => option.value),
    ['tümü', 'bugün', 'yarın', 'bu-hafta', 'bu-ay', 'geçmiş', 'gelecek']
  );
  // Varsayılan sorgu sıralamaları seçeneklerle tutarlı olmalı.
  assert.ok(
    APPOINTMENT_SORT_OPTIONS.some(
      (option) =>
        option.sort === DEFAULT_APPOINTMENTS_QUERY.sort &&
        option.order === DEFAULT_APPOINTMENTS_QUERY.order
    )
  );
});

test('parseAppointmentsQuery: boş arama varsayılan durumu döner', () => {
  assert.deepEqual(parseAppointmentsQuery(''), DEFAULT_APPOINTMENTS_QUERY);
  assert.deepEqual(parseAppointmentsQuery('?'), DEFAULT_APPOINTMENTS_QUERY);
});

test('parseAppointmentsQuery: "?" öneki zorunlu değil (aynı sonucu verir)', () => {
  assert.deepEqual(
    parseAppointmentsQuery('q=cilt&durum=PENDING'),
    parseAppointmentsQuery('?q=cilt&durum=PENDING')
  );
});

test('parseAppointmentsQuery: eski ?filter=CONFIRMED derin bağlantısı durum olur', () => {
  assert.equal(parseAppointmentsQuery('?filter=CONFIRMED').status, 'CONFIRMED');
  // `durum` varsa alias'ı ezer.
  assert.equal(parseAppointmentsQuery('?filter=CONFIRMED&durum=PENDING').status, 'PENDING');
  // Alias'ta uydurma değer varsa ikisi de geçersiz sayılır → tümü.
  assert.equal(parseAppointmentsQuery('?filter=uydurma').status, 'tümü');
});

test('parseAppointmentsQuery: plan parametre adları çözülür', () => {
  const parsed = parseAppointmentsQuery(
    '?q=cilt&durum=NO_SHOW&salon=s-1&personel=p-1&tarih=bu-hafta&sayfa=3&limit=50&sirala=date:asc'
  );
  assert.equal(parsed.q, 'cilt');
  assert.equal(parsed.status, 'NO_SHOW');
  assert.equal(parsed.salonId, 's-1');
  assert.equal(parsed.staffId, 'p-1');
  assert.equal(parsed.date, 'bu-hafta');
  assert.equal(parsed.page, 3);
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.sort, 'date');
  assert.equal(parsed.order, 'asc');
});

test('parseAppointmentsQuery: geçersiz durum/sayfa/limit/tarih/sirala varsayılana döner', () => {
  const parsed = parseAppointmentsQuery(
    '?durum=UYDURMA&sayfa=0&limit=30&tarih=geçen-yıl&sirala=date:bootstrap'
  );
  assert.equal(parsed.status, 'tümü');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.date, 'tümü');
  assert.equal(parsed.sort, 'createdAt');
  assert.equal(parsed.order, 'desc');
  // `sirala=date` (order eksik) de geçersizdir.
  const half = parseAppointmentsQuery('?sirala=date');
  assert.equal(half.sort, 'createdAt');
  assert.equal(half.order, 'desc');
  // Sayı olmayan sayfa da varsayılana döner.
  assert.equal(parseAppointmentsQuery('?sayfa=abc').page, 1);
});

test('buildAppointmentsQuery: varsayılan durum boş sorgu üretir', () => {
  assert.equal(buildAppointmentsQuery(DEFAULT_APPOINTMENTS_QUERY), '');
  assert.equal(buildAppointmentsQuery(normalizeQuery({ page: 1, limit: 20 })), '');
});

test('buildAppointmentsQuery: dolu durum tüm parametreleri plan adlarıyla yazar', () => {
  const qs = buildAppointmentsQuery({
    q: 'cilt',
    status: 'CANCELLED',
    salonId: 'salon-1',
    staffId: 'staff-1',
    date: 'bu-ay',
    page: 2,
    limit: 100,
    sort: 'date',
    order: 'asc',
  });
  const params = new URLSearchParams(qs);

  assert.equal(params.get('q'), 'cilt');
  assert.equal(params.get('durum'), 'CANCELLED');
  assert.equal(params.get('salon'), 'salon-1');
  assert.equal(params.get('personel'), 'staff-1');
  assert.equal(params.get('tarih'), 'bu-ay');
  assert.equal(params.get('sayfa'), '2');
  assert.equal(params.get('limit'), '100');
  assert.equal(params.get('sirala'), 'date:asc');
  // `?` öneki yok.
  assert.equal(qs.startsWith('?'), false);
});

test('buildAppointmentsQuery ∘ parseAppointmentsQuery: gidiş-dönüş durumu korur', () => {
  const state = normalizeQuery({
    q: '  bakım  ',
    status: 'COMPLETED',
    salonId: 'aaaa1111',
    staffId: 'bbbb2222',
    date: 'gelecek',
    page: 4,
    limit: 50,
    sort: 'date',
    order: 'desc',
  });
  assert.deepEqual(parseAppointmentsQuery(`?${buildAppointmentsQuery(state)}`), state);
  // Varsayılan sıralama yazılmadığı için `sirala` dönmez, state yine eşittir.
  const defaults = normalizeQuery({ q: 'x', sort: 'createdAt', order: 'desc' });
  assert.equal(buildAppointmentsQuery(defaults).includes('sirala'), false);
  assert.deepEqual(parseAppointmentsQuery(buildAppointmentsQuery(defaults)), defaults);
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

test('toApiSearchParams: q→search, salonId/staffId API adlarıyla gider; status=tümü gönderilmez', () => {
  const params = new URLSearchParams(
    toApiSearchParams(
      {
        ...DEFAULT_APPOINTMENTS_QUERY,
        q: 'Fatma',
        salonId: 'salon-1',
        staffId: 'staff-1',
        date: 'bu-ay',
        page: 2,
        limit: 50,
        sort: 'date',
        order: 'asc',
      },
      TODAY
    )
  );

  assert.equal(params.get('search'), 'Fatma');
  assert.equal(params.get('salonId'), 'salon-1');
  assert.equal(params.get('staffId'), 'staff-1');
  assert.equal(params.get('page'), '2');
  assert.equal(params.get('limit'), '50');
  assert.equal(params.get('sort'), 'date');
  assert.equal(params.get('order'), 'asc');
  assert.equal(params.get('dateFrom'), '2026-10-01');
  assert.equal(params.get('dateTo'), '2026-10-31');
  assert.equal(params.has('status'), false);
  assert.equal(params.has('q'), false);
});

test('toApiSearchParams: durum seçiliyken status eklenir, tarih seçilmezse aralık yazılmaz', () => {
  const params = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_APPOINTMENTS_QUERY, status: 'NO_SHOW' }, TODAY)
  );
  assert.equal(params.get('status'), 'NO_SHOW');
  // Sayfalama/sıralama her zaman yazılır.
  assert.equal(params.get('page'), '1');
  assert.equal(params.get('limit'), '20');
  assert.equal(params.get('sort'), 'createdAt');
  assert.equal(params.get('order'), 'desc');
  assert.equal(params.has('search'), false);
  assert.equal(params.has('salonId'), false);
  assert.equal(params.has('staffId'), false);
  assert.equal(params.has('dateFrom'), false);
  assert.equal(params.has('dateTo'), false);
});

test('toApiSearchParams: bugün önceli dateFrom=dateTo=bugün yapar', () => {
  const params = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_APPOINTMENTS_QUERY, date: 'bugün' }, TODAY)
  );
  assert.equal(params.get('dateFrom'), '2026-10-27');
  assert.equal(params.get('dateTo'), '2026-10-27');
  // Geçmiş önceli yalnız dateTo taşır.
  const past = new URLSearchParams(
    toApiSearchParams({ ...DEFAULT_APPOINTMENTS_QUERY, date: 'geçmiş' }, TODAY)
  );
  assert.equal(past.get('dateTo'), '2026-10-26');
  assert.equal(past.has('dateFrom'), false);
});

test('activeChips: filtre yoksa chip üretmez', () => {
  assert.deepEqual(activeChips(DEFAULT_APPOINTMENTS_QUERY), []);
  // Sıralama/limit/sayfa bir "filtre" değildir (chip çıkmaz).
  assert.deepEqual(
    activeChips({ ...DEFAULT_APPOINTMENTS_QUERY, sort: 'date', order: 'asc', page: 3, limit: 100 }),
    []
  );
});

test('activeChips: üç filtre durum → salon → tarih sırasıyla ve doğru etiketle gelir', () => {
  const chips = activeChips({
    ...DEFAULT_APPOINTMENTS_QUERY,
    q: 'cilt',
    status: 'CONFIRMED',
    salonId: 'salon-1',
    date: 'yarın',
    page: 5,
  });

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['status', 'salon', 'date', 'q']
  );
  assert.deepEqual(
    chips.map((chip) => chip.label),
    ['Durum: Onaylandı', 'Salon: salon-1', 'Tarih: Yarın', 'Arama: "cilt"']
  );
  // Her yama ilgili alanı varsayılana çeker ve sayfayı 1'e döner.
  assert.deepEqual(chips[0].patch, { status: 'tümü', page: 1 });
  assert.deepEqual(chips[1].patch, { salonId: '', page: 1 });
  assert.deepEqual(chips[2].patch, { date: 'tümü', page: 1 });
  assert.deepEqual(chips[3].patch, { q: '', page: 1 });
});

test('activeChips: beş filtre tam sırayla, isimler varsa görünen ad kullanılır', () => {
  const chips = activeChips(
    {
      ...DEFAULT_APPOINTMENTS_QUERY,
      q: 'masaj',
      status: 'CANCELLED',
      salonId: 'salon-1',
      staffId: 'staff-1',
      date: 'bu-hafta',
    },
    { salon: 'Kuaför Yıldız', staff: 'Ayşe Yılmaz' }
  );

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ['status', 'salon', 'staff', 'date', 'q']
  );
  assert.deepEqual(
    chips.map((chip) => chip.label),
    [
      'Durum: İptal Edildi',
      'Salon: Kuaför Yıldız',
      'Personel: Ayşe Yılmaz',
      'Tarih: Bu hafta',
      'Arama: "masaj"',
    ]
  );
  assert.deepEqual(chips[2].patch, { staffId: '', page: 1 });
});

test('activeChips: her durum etiketi TR_LABEL karşılığıyla üretilir', () => {
  const expected = [
    ['PENDING', 'Durum: Bekliyor'],
    ['CONFIRMED', 'Durum: Onaylandı'],
    ['COMPLETED', 'Durum: Tamamlandı'],
    ['CANCELLED', 'Durum: İptal Edildi'],
    ['NO_SHOW', 'Durum: Gelmedi'],
  ] as const;

  for (const [status, label] of expected) {
    const chips = activeChips({ ...DEFAULT_APPOINTMENTS_QUERY, status });
    assert.equal(chips.length, 1);
    assert.equal(chips[0].label, label);
    assert.equal(chips[0].key, 'status');
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

test('normalizeQuery: metinler kırpılır, uydurma enum/sıralama varsayılana döner', () => {
  const normalized = normalizeQuery({
    ...patchOf({ date: 'dün' }),
    q: '  cilt bakımı  ',
    status: 'PENDING',
    salonId: '  salon-1  ',
    staffId: 'x'.repeat(40),
    sort: 'date',
    order: 'desc',
    page: 3,
    limit: 100,
  });

  assert.equal(normalized.q, 'cilt bakımı');
  assert.equal(normalized.status, 'PENDING');
  assert.equal(normalized.salonId, 'salon-1');
  assert.equal(normalized.staffId.length, 36);
  assert.equal(normalized.date, 'tümü');
  assert.equal(normalized.sort, 'date');
  assert.equal(normalized.order, 'desc');
  assert.equal(normalized.page, 3);
  assert.equal(normalized.limit, 100);

  // Uydurma durum ve eşleşmeyen (sort, order) ikilisi varsayılana döner.
  const broken = normalizeQuery(patchOf({ status: 'ARCHIVED', sort: 'date', order: 'bootstrap' }));
  assert.equal(broken.status, 'tümü');
  assert.equal(broken.sort, 'createdAt');
  assert.equal(broken.order, 'desc');

  // q uzunluğu 100 ile sınırlı.
  assert.equal(normalizeQuery({ q: 'a'.repeat(150) }).q.length, 100);
});
