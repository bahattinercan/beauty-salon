/**
 * Yorum Yönetimi sayfası — `/reviews` filtre durumu ↔ URL ↔ API sorgusu eşlemesi.
 *
 * Saf modül: React yok, `window` yok, `localStorage` yok, ağ yok. Desen
 * randevu sayfasının sorgu modülüyle aynıdır (aynı isimlendirme, aynı sınır
 * doğrulaması) ve `tests/lib/reviewsQuery.test.ts` altında `node:test` ile
 * ağsız sınanır. Randevu sayfasının sorgu modülünden import YOK (iki sayfa
 * bağımsız dağıtılır), tarih yardımcıları bu dosyada yerel kopya.
 *
 * Parametre adları: `q`, `gorunum`, `puan`, `yanit`, `salon`, `tarih`, `sayfa`,
 * `limit`, `sirala`. Sıralama tek parametrede taşınır: `sirala=<sort>:<order>`
 * (`createdAt:desc`, `rating:desc`, `rating:asc`). Varsayılanlar URL'e **yazılmaz**
 * (temiz deep-link); okuma tarafı eksik/geçersiz değeri varsayılana çeker.
 *
 * Çeviri: modül SAF kalır — görünen metin yerine `labelKey`/`valueKey`/`vars`
 * döndürür, `t(...)` çağrısı sayfada yapılır (bkz. `activeChips`).
 */

/** API `limit` üst sınırı 100; panelde üç seçenek var. */
export const REVIEWS_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
/** Sayfa boyutu tercihi sayfalar arasında hatırlanır (localStorage — sayfa tarafı). */
export const PAGE_SIZE_STORAGE_KEY = 'reviews_page_size';

/** `tümü` yalnız panelde var: API'ye gönderilmez (API görünürlüğü enum olarak alır). */
export type ReviewVisibilityFilter = 'tümü' | 'görünür' | 'gizli';
export type ReviewReplyFilter = 'tümü' | 'yanıtlı' | 'yanıtsız';
/** Puan 1..5 tam sayı; `tümü` = filtre yok. */
export type ReviewRatingFilter = 'tümü' | 1 | 2 | 3 | 4 | 5;
export type ReviewSort = 'createdAt' | 'rating';
export type SortOrder = 'asc' | 'desc';
export type DatePreset = 'tümü' | 'bugün' | 'yarın' | 'bu-hafta' | 'bu-ay' | 'geçmiş' | 'gelecek';

export interface ReviewsQueryState {
  q: string;
  visibility: ReviewVisibilityFilter;
  rating: ReviewRatingFilter;
  reply: ReviewReplyFilter;
  salonId: string;
  date: DatePreset;
  page: number;
  limit: number;
  sort: ReviewSort;
  order: SortOrder;
}

export const DEFAULT_REVIEWS_QUERY: ReviewsQueryState = {
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
};

export const REVIEW_VISIBILITY_FILTERS: ReviewVisibilityFilter[] = ['tümü', 'görünür', 'gizli'];
export const REVIEW_REPLY_FILTERS: ReviewReplyFilter[] = ['tümü', 'yanıtlı', 'yanıtsız'];
export const REVIEW_RATING_FILTERS: ReviewRatingFilter[] = ['tümü', 1, 2, 3, 4, 5];

/**
 * `sirala` parametresinin tek kaynağı: UI select seçenekleri de buradan üretilir.
 * `value` = URL biçimi, `sort`/`order` = API parametreleri, `labelKey` = i18n
 * anahtarı (modül SAF kalır: metin değil anahtar döner, çeviriyi sayfa yapar).
 */
export const REVIEW_SORT_OPTIONS: {
  value: string;
  labelKey: string;
  sort: ReviewSort;
  order: SortOrder;
}[] = [
  { value: 'createdAt:desc', labelKey: 'reviews.sort.newest', sort: 'createdAt', order: 'desc' },
  {
    value: 'rating:desc',
    labelKey: 'reviews.sort.highestRating',
    sort: 'rating',
    order: 'desc',
  },
  {
    value: 'rating:asc',
    labelKey: 'reviews.sort.lowestRating',
    sort: 'rating',
    order: 'asc',
  },
];

/** Tarih önceli → i18n anahtarı: select seçenekleri ve chipler aynı kaynaktan. */
export const DATE_PRESET_LABEL_KEYS: Record<DatePreset, string> = {
  'tümü': 'reviews.datePreset.all',
  'bugün': 'reviews.datePreset.today',
  'yarın': 'reviews.datePreset.tomorrow',
  'bu-hafta': 'reviews.datePreset.thisWeek',
  'bu-ay': 'reviews.datePreset.thisMonth',
  'geçmiş': 'reviews.datePreset.past',
  'gelecek': 'reviews.datePreset.upcoming',
};

export const DATE_PRESET_OPTIONS: { value: DatePreset; labelKey: string }[] = [
  { value: 'tümü', labelKey: DATE_PRESET_LABEL_KEYS['tümü'] },
  { value: 'bugün', labelKey: DATE_PRESET_LABEL_KEYS['bugün'] },
  { value: 'yarın', labelKey: DATE_PRESET_LABEL_KEYS['yarın'] },
  { value: 'bu-hafta', labelKey: DATE_PRESET_LABEL_KEYS['bu-hafta'] },
  { value: 'bu-ay', labelKey: DATE_PRESET_LABEL_KEYS['bu-ay'] },
  { value: 'geçmiş', labelKey: DATE_PRESET_LABEL_KEYS['geçmiş'] },
  { value: 'gelecek', labelKey: DATE_PRESET_LABEL_KEYS['gelecek'] },
];

/** Görünürlük adlarının i18n anahtarları (panel değeri → sözlük anahtarı). */
export const VISIBILITY_LABEL_KEYS: Record<ReviewVisibilityFilter, string> = {
  'tümü': 'reviews.visibility.all',
  görünür: 'reviews.visibility.visible',
  gizli: 'reviews.visibility.hidden',
};

/** Yanıt durumu adlarının i18n anahtarları. */
export const REPLY_LABEL_KEYS: Record<ReviewReplyFilter, string> = {
  'tümü': 'reviews.reply.all',
  yanıtlı: 'reviews.reply.replied',
  yanıtsız: 'reviews.reply.unreplied',
};

const DATE_PRESET_VALUES: DatePreset[] = DATE_PRESET_OPTIONS.map((option) => option.value);

/** `?filter=visible|hidden` eski deep-link değeri → panel görünürlük değeri. */
const LEGACY_VISIBILITY: Record<string, ReviewVisibilityFilter> = {
  visible: 'görünür',
  hidden: 'gizli',
};

/** Arama metni üst sınırı API validator'ı ile aynı (`search` ≤100). */
const MAX_Q = 100;
/** Kimlik alanları UUID; elle bozulmuş deep-link'e karşı sınırlanır. */
const MAX_ID = 36;

/** Yerel takvim tarihi → `YYYY-MM-DD`. `toISOString` KULLANILMAZ: UTC kaydırması
 *  gece/gündüz farkında tarihi bir gün ileri/geri alırdı. */
function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Yerel takvimde gün ekle/çıkar (ay/yıl taşması `Date` tarafından çözülür). */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function parseInteger(raw: string | null, fallback: number, min: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) return fallback;
  return value;
}

/** `puan` URL değeri: `'1'`..`'5'` tam sayıya, değilse `'tümü'`ne çevrilir. */
function parseRating(raw: string | null): ReviewRatingFilter {
  const value = Number(raw);
  return REVIEW_RATING_FILTERS.includes(value as ReviewRatingFilter)
    ? (value as ReviewRatingFilter)
    : 'tümü';
}

/**
 * URL → durum. `?filter=visible|hidden` eski derin bağlantısı (PageHeader)
 * `gorunum`e alias'lanır; `gorunum` varsa o kazanır.
 */
export function parseReviewsQuery(search: string): ReviewsQueryState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  // Eski deep-link değeri (`visible`/`hidden`) panele çevrilir; `gorunum` varsa o kazanır.
  const legacyRaw = params.get('filter');
  const visibilityRaw =
    params.get('gorunum') ?? (legacyRaw ? LEGACY_VISIBILITY[legacyRaw] : undefined) ?? null;

  const sortOption = REVIEW_SORT_OPTIONS.find(
    (option) => option.value === params.get('sirala')
  );

  const dateRaw = params.get('tarih');
  const date = DATE_PRESET_VALUES.includes(dateRaw as DatePreset)
    ? (dateRaw as DatePreset)
    : DEFAULT_REVIEWS_QUERY.date;

  const replyRaw = params.get('yanit');
  const reply = REVIEW_REPLY_FILTERS.includes(replyRaw as ReviewReplyFilter)
    ? (replyRaw as ReviewReplyFilter)
    : DEFAULT_REVIEWS_QUERY.reply;

  const limitRaw = Number(params.get('limit'));

  return normalizeQuery({
    q: params.get('q') ?? '',
    visibility: normalizeVisibility(visibilityRaw),
    rating: parseRating(params.get('puan')),
    reply,
    salonId: params.get('salon') ?? '',
    date,
    page: parseInteger(params.get('sayfa'), 1, 1),
    limit: REVIEWS_PAGE_SIZES.includes(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE,
    sort: sortOption?.sort,
    order: sortOption?.order,
  });
}

/** Ham URL değerini panele çevirir; tanınmayan değer `'tümü'`ne düşer. */
function normalizeVisibility(raw: string | null): ReviewVisibilityFilter {
  if (raw === null) return DEFAULT_REVIEWS_QUERY.visibility;
  return REVIEW_VISIBILITY_FILTERS.includes(raw as ReviewVisibilityFilter)
    ? (raw as ReviewVisibilityFilter)
    : DEFAULT_REVIEWS_QUERY.visibility;
}

/** Durum → URL sorgusu (`?` öneki YOK; boşsa tüm filtreler varsayılan). */
export function buildReviewsQuery(state: ReviewsQueryState): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.visibility !== DEFAULT_REVIEWS_QUERY.visibility) {
    params.set('gorunum', query.visibility);
  }
  if (query.rating !== DEFAULT_REVIEWS_QUERY.rating) params.set('puan', String(query.rating));
  if (query.reply !== DEFAULT_REVIEWS_QUERY.reply) params.set('yanit', query.reply);
  if (query.salonId) params.set('salon', query.salonId);
  if (query.date !== DEFAULT_REVIEWS_QUERY.date) params.set('tarih', query.date);
  if (query.page !== DEFAULT_REVIEWS_QUERY.page) params.set('sayfa', String(query.page));
  if (query.limit !== DEFAULT_REVIEWS_QUERY.limit) params.set('limit', String(query.limit));
  if (
    query.sort !== DEFAULT_REVIEWS_QUERY.sort ||
    query.order !== DEFAULT_REVIEWS_QUERY.order
  ) {
    params.set('sirala', `${query.sort}:${query.order}`);
  }

  return params.toString();
}

/**
 * Tarih önceli → API aralığı (`dateFrom`/`dateTo` inclusive). Boş nesne = filtre
 * yok. Aralık **yerel** takvime göre hesaplanır; `tümü` için `{}` döner.
 *
 * `bugün`/`yarın`/`geçmiş`/`gelecek` tek kenarlı, `bu-hafta` ISO haftası
 * (Pazartesi..Pazar), `bu-ay` ayın ilk/son günü.
 */
export function dateRangeForPreset(
  preset: DatePreset,
  today: Date
): { dateFrom?: string; dateTo?: string } {
  switch (preset) {
    case 'bugün': {
      const day = localDate(today);
      return { dateFrom: day, dateTo: day };
    }
    case 'yarın': {
      const day = localDate(addDays(today, 1));
      return { dateFrom: day, dateTo: day };
    }
    case 'bu-hafta': {
      // ISO hafta: Pazartesi başlangıç. `getDay()` 0 = Pazar → o gün 6 gün geri.
      const weekday = today.getDay();
      const offsetToMonday = weekday === 0 ? 6 : weekday - 1;
      const monday = addDays(today, -offsetToMonday);
      return { dateFrom: localDate(monday), dateTo: localDate(addDays(monday, 6)) };
    }
    case 'bu-ay': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      // Ayın son günü: sonraki ayın 0'ı (taşırmalı gün) → aynı ayın son günü.
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { dateFrom: localDate(first), dateTo: localDate(last) };
    }
    case 'geçmiş':
      return { dateTo: localDate(addDays(today, -1)) };
    case 'gelecek':
      return { dateFrom: localDate(addDays(today, 1)) };
    case 'tümü':
    default:
      return {};
  }
}

/**
 * Durum → `GET /admin/reviews` sorgusu. `tümü` olan filtreler **gönderilmez**;
 * görünürlük `visible`/`hidden`, yanıt `replied`/`unreplied` olarak açılır.
 * Sayfalama ve sıralama her zaman yazılır.
 */
export function toApiSearchParams(state: ReviewsQueryState, today: Date): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sort: query.sort,
    order: query.order,
  });

  if (query.q) params.set('search', query.q);
  if (query.rating !== 'tümü') params.set('rating', String(query.rating));
  if (query.salonId) params.set('salonId', query.salonId);

  // Eski deep-link değerleri (`visible`/`hidden`) burada da API biçimine çevrilir.
  if (query.visibility === 'görünür') params.set('visibility', 'visible');
  if (query.visibility === 'gizli') params.set('visibility', 'hidden');
  if (query.reply === 'yanıtlı') params.set('replied', 'replied');
  if (query.reply === 'yanıtsız') params.set('replied', 'unreplied');

  const range = dateRangeForPreset(query.date, today);
  if (range.dateFrom) params.set('dateFrom', range.dateFrom);
  if (range.dateTo) params.set('dateTo', range.dateTo);

  return params.toString();
}

/**
 * Kaldırılabilir filtre çipi; `patch` alanı varsayılana çeker ve sayfayı 1'e döner.
 *
 * Metin taşımaz — çeviri anahtarı taşır (modül SAF):
 * - `labelKey`: çip şablonu (`reviews.chips.visibility`).
 * - `valueKey`: şablondaki `{label}` yer tutucusunun çeviri anahtarı (görünüm/yanıt/tarih).
 * - `vars`: şablondaki diğer yer tutucuların hazır değerleri (ad, puan, arama metni).
 *
 * Sayfa basar: `t(chip.labelKey, { ...chip.vars, ...(chip.valueKey ? { label: t(chip.valueKey) } : {}) })`.
 */
export interface ReviewChip {
  key: 'visibility' | 'rating' | 'reply' | 'salon' | 'date' | 'q';
  labelKey: string;
  valueKey?: string;
  vars?: Record<string, string | number>;
  patch: Partial<ReviewsQueryState>;
}

/**
 * Etkin filtreler, ekrandaki sırayla: görünüm → puan → yanıt → salon → tarih → arama.
 * `names` seçili salonun görünen adı; yoksa kimlik gösterilir.
 * Sıralama/sayfa/limit bir "filtre" sayılmaz, chip üretmez.
 */
export function activeChips(
  state: ReviewsQueryState,
  names?: { salon?: string }
): ReviewChip[] {
  const query = normalizeQuery(state);
  const chips: ReviewChip[] = [];

  if (query.visibility !== 'tümü') {
    chips.push({
      key: 'visibility',
      labelKey: 'reviews.chips.visibility',
      valueKey: VISIBILITY_LABEL_KEYS[query.visibility],
      patch: { visibility: 'tümü', page: 1 },
    });
  }
  if (query.rating !== 'tümü') {
    chips.push({
      key: 'rating',
      labelKey: 'reviews.chips.rating',
      vars: { rating: query.rating },
      patch: { rating: 'tümü', page: 1 },
    });
  }
  if (query.reply !== 'tümü') {
    chips.push({
      key: 'reply',
      labelKey: 'reviews.chips.reply',
      valueKey: REPLY_LABEL_KEYS[query.reply],
      patch: { reply: 'tümü', page: 1 },
    });
  }
  if (query.salonId) {
    chips.push({
      key: 'salon',
      labelKey: 'reviews.chips.salon',
      vars: { name: names?.salon ?? query.salonId },
      patch: { salonId: '', page: 1 },
    });
  }
  if (query.date !== 'tümü') {
    chips.push({
      key: 'date',
      labelKey: 'reviews.chips.date',
      valueKey: DATE_PRESET_LABEL_KEYS[query.date],
      patch: { date: 'tümü', page: 1 },
    });
  }
  if (query.q) {
    chips.push({
      key: 'q',
      labelKey: 'reviews.chips.search',
      vars: { query: query.q },
      patch: { q: '', page: 1 },
    });
  }

  return chips;
}

/**
 * Sınır doğrulaması: URL'den, localStorage'dan veya `updateFilter` yamasından
 * gelen her değer buradan geçer. Geçersiz değer varsayılana döner (hata atılmaz —
 * kullanıcı elle bozulmuş bir deep-link'e düşmüş olabilir).
 */
export function normalizeQuery(
  state: Partial<ReviewsQueryState>
): ReviewsQueryState {
  const merged = { ...DEFAULT_REVIEWS_QUERY, ...state };

  const visibility = normalizeVisibility(merged.visibility);

  const reply = REVIEW_REPLY_FILTERS.includes(merged.reply)
    ? merged.reply
    : DEFAULT_REVIEWS_QUERY.reply;

  // Puan sayı ya da sayısal string olabilir (`'4'`); `tümü` → NaN → 1..5 dışı → 'tümü'.
  const ratingNumber = Number(merged.rating);
  const rating: ReviewRatingFilter = REVIEW_RATING_FILTERS.includes(
    ratingNumber as ReviewRatingFilter
  )
    ? (ratingNumber as ReviewRatingFilter)
    : DEFAULT_REVIEWS_QUERY.rating;

  const date = DATE_PRESET_VALUES.includes(merged.date)
    ? merged.date
    : DEFAULT_REVIEWS_QUERY.date;

  // Yalnız listedeki (sort, order) ikilisi kabul edilir; uydurma kombinasyon varsayılana döner.
  const sortOption =
    REVIEW_SORT_OPTIONS.find(
      (option) => option.sort === merged.sort && option.order === merged.order
    ) ?? REVIEW_SORT_OPTIONS[0];

  return {
    q: typeof merged.q === 'string' ? merged.q.trim().slice(0, MAX_Q) : '',
    visibility,
    rating,
    reply,
    salonId: typeof merged.salonId === 'string' ? merged.salonId.trim().slice(0, MAX_ID) : '',
    date,
    page: Number.isInteger(merged.page) && merged.page >= 1 ? merged.page : 1,
    limit: REVIEWS_PAGE_SIZES.includes(merged.limit) ? merged.limit : DEFAULT_PAGE_SIZE,
    sort: sortOption.sort,
    order: sortOption.order,
  };
}
