/**
 * AP-007 W3 — `/salons` filtre durumu ↔ URL ↔ API sorgusu eşlemesi (plan §5.2).
 *
 * Saf modül: React yok, `window` yok, ağ yok. `tests/lib/salonsQuery.test.ts`
 * altında `node:test` ile ağsız sınanır (AP-002 kapısı).
 *
 * Parametre adları (plan §5.2): `q`, `durum`, `sehir`, `puan`, `sayfa`, `limit`,
 * `sirala`, `gorunum`. Sıralama tek parametrede taşınır: `sirala=<sort>:<order>`
 * (`createdAt:desc`, `name:asc`, `rating:desc`). Varsayılanlar URL'e **yazılmaz**
 * (temiz deep-link); okuma tarafı eksik/geçersiz değeri varsayılana çeker.
 *
 * i18n: modül görünen metin taşımaz — sabit etiketler `labelKey` döndürür, metni
 * sayfa `t(labelKey, vars)` ile basar (`salons.*` sözlüğü). Böylece modül React'siz
 * ve dilsiz kalır, `node:test` altında ağsız/DOM'suz sınanabilir.
 */

/** API `limit` üst sınırı 100 (plan H3); panelde üç seçenek var. */
export const SALONS_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
/** Sayfa boyutu tercihi sayfalar arasında hatırlanır (localStorage). */
export const PAGE_SIZE_STORAGE_KEY = 'salons_page_size';

export type SalonStatusFilter = 'tümü' | 'onaylı' | 'bekliyor' | 'pasif';
export type SalonSort = 'createdAt' | 'name' | 'rating';
export type SalonSortOrder = 'asc' | 'desc';
export type SalonView = 'tablo' | 'kartlar';

export interface SalonsQueryState {
  q: string;
  status: SalonStatusFilter;
  city: string;
  minRating: number | null;
  page: number;
  limit: number;
  sort: SalonSort;
  order: SalonSortOrder;
  view: SalonView;
}

export const DEFAULT_SALONS_QUERY: SalonsQueryState = {
  q: '',
  status: 'tümü',
  city: '',
  minRating: null,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  sort: 'createdAt',
  order: 'desc',
  view: 'tablo',
};

export const SALON_STATUS_FILTERS: SalonStatusFilter[] = ['tümü', 'onaylı', 'bekliyor', 'pasif'];

/**
 * `sirala` parametresinin tek kaynağı: UI select seçenekleri de buradan üretilir.
 * `value` = URL biçimi, `sort`/`order` = API parametreleri, `labelKey` = görünen
 * metnin `salons.*` sözlüğündeki anahtarı.
 */
export const SALON_SORT_OPTIONS: {
  value: string;
  labelKey: string;
  sort: SalonSort;
  order: SalonSortOrder;
}[] = [
  { value: 'createdAt:desc', labelKey: 'salons.filter.sortNewest', sort: 'createdAt', order: 'desc' },
  { value: 'createdAt:asc', labelKey: 'salons.filter.sortOldest', sort: 'createdAt', order: 'asc' },
  { value: 'name:asc', labelKey: 'salons.filter.sortNameAsc', sort: 'name', order: 'asc' },
  { value: 'rating:desc', labelKey: 'salons.filter.sortRatingDesc', sort: 'rating', order: 'desc' },
];

/** Durum filtresi sekmelerinin (`Tümü`, `Onaylı`, …) sözlük anahtarları. */
export const SALON_STATUS_FILTER_LABEL_KEYS: Record<SalonStatusFilter, string> = {
  'tümü': 'salons.statusFilter.all',
  'onaylı': 'salons.statusFilter.approved',
  'bekliyor': 'salons.statusFilter.pending',
  'pasif': 'salons.statusFilter.passive',
};

/**
 * Etkin filtre chip'lerinin TAM etiket anahtarları (`Durum: Onaylı`). Ayrı anahtar
 * tutulur: chip metni sözlükte tek parçadır, sayfa `t(labelKey)` ile basar; durum
 * kelimesini çevirmek için modülün sözlüğe bakması gerekmez.
 */
export const SALON_STATUS_CHIP_LABEL_KEYS: Record<SalonStatusFilter, string> = {
  'tümü': 'salons.chips.statusAll',
  'onaylı': 'salons.chips.statusApproved',
  'bekliyor': 'salons.chips.statusPending',
  'pasif': 'salons.chips.statusPassive',
};

/** Arama metni üst sınırı API validator'ı ile aynı (`search` ≤100). */
const MAX_Q = 100;
const MAX_CITY = 60;

function parseInteger(raw: string | null, fallback: number, min: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) return fallback;
  return value;
}

/**
 * URL → durum. `?filter=bekliyor` eski derin bağlantısı (PageHeader) `durum`a
 * alias'lanır; `durum` varsa o kazanır.
 */
export function parseSalonsQuery(search: string): SalonsQueryState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const statusRaw = params.get('durum') ?? params.get('filter') ?? '';
  const status = SALON_STATUS_FILTERS.includes(statusRaw as SalonStatusFilter)
    ? (statusRaw as SalonStatusFilter)
    : DEFAULT_SALONS_QUERY.status;

  const sortOption = SALON_SORT_OPTIONS.find((option) => option.value === params.get('sirala'));

  const ratingRaw = params.get('puan');
  const rating = ratingRaw === null || ratingRaw === '' ? Number.NaN : Number(ratingRaw);

  const limitRaw = Number(params.get('limit'));

  const viewRaw = params.get('gorunum');

  return normalizeQuery({
    q: params.get('q') ?? '',
    status,
    city: params.get('sehir') ?? '',
    minRating: Number.isFinite(rating) ? rating : null,
    page: parseInteger(params.get('sayfa'), 1, 1),
    limit: SALONS_PAGE_SIZES.includes(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE,
    sort: sortOption?.sort,
    order: sortOption?.order,
    view: viewRaw === 'kartlar' ? 'kartlar' : viewRaw === 'tablo' ? 'tablo' : DEFAULT_SALONS_QUERY.view,
  });
}

/** Durum → URL sorgusu (`?` öneki YOK; boşsa tüm filtreler varsayılan). */
export function buildSalonsQuery(state: SalonsQueryState): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.status !== DEFAULT_SALONS_QUERY.status) params.set('durum', query.status);
  if (query.city) params.set('sehir', query.city);
  if (query.minRating !== null) params.set('puan', String(query.minRating));
  if (query.page !== DEFAULT_SALONS_QUERY.page) params.set('sayfa', String(query.page));
  if (query.limit !== DEFAULT_SALONS_QUERY.limit) params.set('limit', String(query.limit));
  if (query.sort !== DEFAULT_SALONS_QUERY.sort || query.order !== DEFAULT_SALONS_QUERY.order) {
    params.set('sirala', `${query.sort}:${query.order}`);
  }
  if (query.view !== DEFAULT_SALONS_QUERY.view) params.set('gorunum', query.view);

  return params.toString();
}

/**
 * Durum → `GET /admin/salons` sorgusu. `status=tümü` **gönderilmez** (API
 * validator'ı yalnız üç değeri kabul eder); sıralama `sort`+`order` olarak ayrışır.
 */
export function toApiSearchParams(state: SalonsQueryState): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sort: query.sort,
    order: query.order,
  });

  if (query.q) params.set('search', query.q);
  if (query.status !== 'tümü') params.set('status', query.status);
  if (query.city) params.set('city', query.city);
  if (query.minRating !== null) params.set('minRating', String(query.minRating));

  return params.toString();
}

export interface SalonChip {
  key: 'status' | 'city' | 'minRating' | 'q';
  /** Chip metninin sözlük anahtarı; sayfa `t(labelKey, vars)` ile basar. */
  labelKey: string;
  /** `{city}`, `{rating}`, `{q}` yer tutucularının değerleri (çevrilmiş metin değil). */
  vars?: Record<string, string | number>;
  /** Chip kaldırıldığında uygulanacak yama; sayfa her zaman 1'e döner. */
  patch: Partial<SalonsQueryState>;
}

/** Etkin filtreler, ekrandaki sırayla: durum → şehir → puan → arama. */
export function activeChips(state: SalonsQueryState): SalonChip[] {
  const query = normalizeQuery(state);
  const chips: SalonChip[] = [];

  if (query.status !== 'tümü') {
    chips.push({
      key: 'status',
      labelKey: SALON_STATUS_CHIP_LABEL_KEYS[query.status],
      patch: { status: 'tümü' },
    });
  }
  if (query.city) {
    chips.push({
      key: 'city',
      labelKey: 'salons.chips.city',
      vars: { city: query.city },
      patch: { city: '' },
    });
  }
  if (query.minRating !== null) {
    chips.push({
      key: 'minRating',
      labelKey: 'salons.chips.minRating',
      vars: { rating: query.minRating },
      patch: { minRating: null },
    });
  }
  if (query.q) {
    chips.push({
      key: 'q',
      labelKey: 'salons.chips.q',
      vars: { q: query.q },
      patch: { q: '' },
    });
  }

  return chips;
}

/**
 * Sınır doğrulaması: URL'den, localStorage'dan veya `updateFilter` yamasından
 * gelen her değer buradan geçer. Geçersiz değer varsayılana döner (hata atılmaz —
 * kullanıcı elle bozulmuş bir deep-link'e düşmüş olabilir).
 */
export function normalizeQuery(state: Partial<SalonsQueryState>): SalonsQueryState {
  const merged = { ...DEFAULT_SALONS_QUERY, ...state };

  const status = SALON_STATUS_FILTERS.includes(merged.status)
    ? merged.status
    : DEFAULT_SALONS_QUERY.status;

  const sortOption =
    SALON_SORT_OPTIONS.find(
      (option) => option.sort === merged.sort && option.order === merged.order
    ) ?? SALON_SORT_OPTIONS[0];

  const rating = merged.minRating;
  const minRating =
    typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 5
      ? rating
      : null;

  return {
    q: typeof merged.q === 'string' ? merged.q.trim().slice(0, MAX_Q) : '',
    status,
    city: typeof merged.city === 'string' ? merged.city.trim().slice(0, MAX_CITY) : '',
    minRating,
    page: Number.isInteger(merged.page) && merged.page >= 1 ? merged.page : 1,
    limit: SALONS_PAGE_SIZES.includes(merged.limit) ? merged.limit : DEFAULT_PAGE_SIZE,
    sort: sortOption.sort,
    order: sortOption.order,
    view: merged.view === 'kartlar' ? 'kartlar' : 'tablo',
  };
}
