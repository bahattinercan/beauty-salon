/**
 * `/categories` filtre durumu ↔ URL ↔ listeleme eşlemesi (`salonsQuery.ts` deseninin
 * kategori karşılığı).
 *
 * Saf modül: React yok, `window` yok, `localStorage` yok, ağ yok. Sayfa boyutu
 * tercihi yalnızca anahtar sabitiyle dışarı verilir; okuma/yazma sayfaya ait.
 * `tests/lib/categoriesQuery.test.ts` altında `node:test` ile ağsız sınanır.
 *
 * Parametre adları (`salonsQuery` ile aynı): `q`, `durum`, `medya`, `ikon`,
 * `sayfa`, `limit`, `sirala`, `gorunum`. Sıralama tek parametrede taşınır:
 * `sirala=<sort>:<order>`. Varsayılanlar URL'e **yazılmaz** (temiz deep-link);
 * okuma tarafı eksik/geçersiz değeri varsayılana çeker.
 */

/** Sayfa boyutu seçenekleri; API `limit` üst sınırı 100 ile uyumlu. */
export const CATEGORIES_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
/** Sayfa boyutu tercihi sayfalar arasında hatırlanır (localStorage anahtarı). */
export const PAGE_SIZE_STORAGE_KEY = 'categories_page_size';

export type CategoryStatusFilter = 'tümü' | 'aktif' | 'pasif';
export type CategoryMediaFilter = 'tümü' | 'görselli' | 'videolu' | 'medyasız';
export type CategorySort = 'sortOrder' | 'name' | 'serviceCount' | 'createdAt';
export type CategorySortOrder = 'asc' | 'desc';
export type CategoryView = 'tablo' | 'kartlar';

export interface CategoriesQueryState {
  q: string;
  status: CategoryStatusFilter;
  media: CategoryMediaFilter;
  icon: string;
  page: number;
  limit: number;
  sort: CategorySort;
  order: CategorySortOrder;
  view: CategoryView;
}

/** Liste satırı; `sortOrder`/`createdAt` taşınmaz (bkz. `sortCategories`). */
export interface CategoryRow {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  serviceCount: number;
  isActive: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export const DEFAULT_CATEGORIES_QUERY: CategoriesQueryState = {
  q: '',
  status: 'tümü',
  media: 'tümü',
  icon: '',
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  sort: 'sortOrder',
  order: 'asc',
  view: 'tablo',
};

export const CATEGORY_STATUS_FILTERS: CategoryStatusFilter[] = ['tümü', 'aktif', 'pasif'];
export const CATEGORY_MEDIA_FILTERS: CategoryMediaFilter[] = [
  'tümü',
  'görselli',
  'videolu',
  'medyasız',
];

/**
 * `sirala` parametresinin tek kaynağı: UI select seçenekleri de buradan üretilir.
 * `value` = URL biçimi, `sort`/`order` = karşılaştırma anahtarı. İlk kayıt
 * varsayılandır (`normalizeQuery` buradan çözer).
 */
export const CATEGORY_SORT_OPTIONS: {
  value: string;
  label: string;
  sort: CategorySort;
  order: CategorySortOrder;
}[] = [
  { value: 'sortOrder:asc', label: 'Sıra (varsayılan)', sort: 'sortOrder', order: 'asc' },
  { value: 'name:asc', label: 'İsim (A-Z)', sort: 'name', order: 'asc' },
  { value: 'name:desc', label: 'İsim (Z-A)', sort: 'name', order: 'desc' },
  { value: 'serviceCount:desc', label: 'Hizmet sayısı (çok)', sort: 'serviceCount', order: 'desc' },
  { value: 'createdAt:desc', label: 'En yeni', sort: 'createdAt', order: 'desc' },
];

const STATUS_LABELS: Record<CategoryStatusFilter, string> = {
  'tümü': 'Tümü',
  aktif: 'Aktif',
  pasif: 'Pasif',
};

const MEDIA_LABELS: Record<CategoryMediaFilter, string> = {
  'tümü': 'Tümü',
  görselli: 'Görselli',
  videolu: 'Videolu',
  medyasız: 'Medyasız',
};

/** Arama metni üst sınırı API validator'ı ile aynı (`search` ≤100). */
const MAX_Q = 100;
/** İkon anahtarı (`iconName`) kısa bir slug; abartılı değeri kırparız. */
const MAX_ICON = 60;

function parseInteger(raw: string | null, fallback: number, min: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) return fallback;
  return value;
}

/**
 * URL → durum. Eksik ya da geçersiz değer varsayılana düşer; `?` öneki zorunlu
 * değildir.
 */
export function parseCategoriesQuery(search: string): CategoriesQueryState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const statusRaw = params.get('durum') ?? '';
  const status = CATEGORY_STATUS_FILTERS.includes(statusRaw as CategoryStatusFilter)
    ? (statusRaw as CategoryStatusFilter)
    : DEFAULT_CATEGORIES_QUERY.status;

  const mediaRaw = params.get('medya') ?? '';
  const media = CATEGORY_MEDIA_FILTERS.includes(mediaRaw as CategoryMediaFilter)
    ? (mediaRaw as CategoryMediaFilter)
    : DEFAULT_CATEGORIES_QUERY.media;

  const sortOption = CATEGORY_SORT_OPTIONS.find((option) => option.value === params.get('sirala'));

  const limitRaw = Number(params.get('limit'));
  const viewRaw = params.get('gorunum');

  return normalizeQuery({
    q: params.get('q') ?? '',
    status,
    media,
    icon: params.get('ikon') ?? '',
    page: parseInteger(params.get('sayfa'), 1, 1),
    limit: CATEGORIES_PAGE_SIZES.includes(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE,
    sort: sortOption?.sort,
    order: sortOption?.order,
    view: viewRaw === 'kartlar' ? 'kartlar' : viewRaw === 'tablo' ? 'tablo' : DEFAULT_CATEGORIES_QUERY.view,
  });
}

/** Durum → URL sorgusu (`?` öneki YOK; tüm filtreler varsayılan ise boş string). */
export function buildCategoriesQuery(state: CategoriesQueryState): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.status !== DEFAULT_CATEGORIES_QUERY.status) params.set('durum', query.status);
  if (query.media !== DEFAULT_CATEGORIES_QUERY.media) params.set('medya', query.media);
  if (query.icon) params.set('ikon', query.icon);
  if (query.page !== DEFAULT_CATEGORIES_QUERY.page) params.set('sayfa', String(query.page));
  if (query.limit !== DEFAULT_CATEGORIES_QUERY.limit) params.set('limit', String(query.limit));
  if (query.sort !== DEFAULT_CATEGORIES_QUERY.sort || query.order !== DEFAULT_CATEGORIES_QUERY.order) {
    params.set('sirala', `${query.sort}:${query.order}`);
  }
  if (query.view !== DEFAULT_CATEGORIES_QUERY.view) params.set('gorunum', query.view);

  return params.toString();
}

export interface CategoryChip {
  key: 'status' | 'media' | 'icon' | 'q' | 'sort';
  label: string;
  /** Chip kaldırıldığında uygulanacak yama; sayfa her zaman 1'e döner (sayfa çağrıda). */
  patch: Partial<CategoriesQueryState>;
}

/** Etkin filtreler, ekrandaki sırayla: durum → medya → ikon → arama → sıralama. */
export function activeChips(state: CategoriesQueryState): CategoryChip[] {
  const query = normalizeQuery(state);
  const chips: CategoryChip[] = [];

  if (query.status !== 'tümü') {
    chips.push({
      key: 'status',
      label: `Durum: ${STATUS_LABELS[query.status]}`,
      patch: { status: 'tümü' },
    });
  }
  if (query.media !== 'tümü') {
    chips.push({
      key: 'media',
      label: `Medya: ${MEDIA_LABELS[query.media]}`,
      patch: { media: 'tümü' },
    });
  }
  if (query.icon) {
    chips.push({ key: 'icon', label: `İkon: ${query.icon}`, patch: { icon: '' } });
  }
  if (query.q) {
    chips.push({ key: 'q', label: `Arama: "${query.q}"`, patch: { q: '' } });
  }
  if (query.sort !== DEFAULT_CATEGORIES_QUERY.sort || query.order !== DEFAULT_CATEGORIES_QUERY.order) {
    const option =
      CATEGORY_SORT_OPTIONS.find((item) => item.sort === query.sort && item.order === query.order) ??
      CATEGORY_SORT_OPTIONS[0];
    chips.push({
      key: 'sort',
      label: `Sıralama: ${option.label}`,
      patch: { sort: DEFAULT_CATEGORIES_QUERY.sort, order: DEFAULT_CATEGORIES_QUERY.order },
    });
  }

  return chips;
}

/** Temizleme butonunun görünürlüğü: en az bir etkin filtre (sıralama dâhil) var mı? */
export function hasActiveFilters(state: CategoriesQueryState): boolean {
  return activeChips(state).length > 0;
}

/**
 * Sınır doğrulaması: URL'den, localStorage'dan veya `updateFilter` yamasından
 * gelen her değer buradan geçer. Geçersiz değer varsayılana döner (hata atılmaz —
 * kullanıcı elle bozulmuş bir deep-link'e düşmüş olabilir).
 */
export function normalizeQuery(state: Partial<CategoriesQueryState>): CategoriesQueryState {
  const merged = { ...DEFAULT_CATEGORIES_QUERY, ...state };

  const status = CATEGORY_STATUS_FILTERS.includes(merged.status)
    ? merged.status
    : DEFAULT_CATEGORIES_QUERY.status;

  const media = CATEGORY_MEDIA_FILTERS.includes(merged.media)
    ? merged.media
    : DEFAULT_CATEGORIES_QUERY.media;

  const sortOption =
    CATEGORY_SORT_OPTIONS.find(
      (option) => option.sort === merged.sort && option.order === merged.order
    ) ?? CATEGORY_SORT_OPTIONS[0];

  return {
    q: typeof merged.q === 'string' ? merged.q.trim().slice(0, MAX_Q) : '',
    status,
    media,
    icon: typeof merged.icon === 'string' ? merged.icon.trim().slice(0, MAX_ICON) : '',
    page: Number.isInteger(merged.page) && merged.page >= 1 ? merged.page : 1,
    limit: CATEGORIES_PAGE_SIZES.includes(merged.limit) ? merged.limit : DEFAULT_PAGE_SIZE,
    sort: sortOption.sort,
    order: sortOption.order,
    view: merged.view === 'kartlar' ? 'kartlar' : 'tablo',
  };
}

/** Boş/dolu ayrımı: `null`, `undefined` ve boş (veya boşluklu) metin = "yok". */
function hasMedia(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function matchesStatus(row: CategoryRow, status: CategoryStatusFilter): boolean {
  if (status === 'aktif') return row.isActive === true;
  if (status === 'pasif') return row.isActive === false;
  return true;
}

function matchesMedia(row: CategoryRow, media: CategoryMediaFilter): boolean {
  const image = hasMedia(row.imageUrl);
  const video = hasMedia(row.videoUrl);
  switch (media) {
    case 'görselli':
      return image;
    case 'videolu':
      return video;
    case 'medyasız':
      return !image && !video;
    default:
      return true;
  }
}

function matchesSearch(row: CategoryRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = `${row.name}\n${row.description ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

/**
 * Filtreleri uygular: durum (`isActive`), medya (`imageUrl`/`videoUrl`), ikon
 * (tam eşitlik) ve `q` (ad veya açıklamada büyük/küçük harf duyarsız). Sıra
 * değişmez; sıralama için `sortCategories`.
 */
export function filterCategories(rows: CategoryRow[], state: CategoriesQueryState): CategoryRow[] {
  const query = normalizeQuery(state);
  return rows.filter(
    (row) =>
      matchesStatus(row, query.status) &&
      matchesMedia(row, query.media) &&
      (query.icon === '' || row.icon === query.icon) &&
      matchesSearch(row, query.q)
  );
}

/**
 * `sortOrder` ve `createdAt` `CategoryRow` sözleşmesinde değildir (API listesinde
 * gelir, panelde henüz taşınmıyor). Satırda bulunursa kullanılır, bulunmazsa
 * karşılaştırma `0` döner ve `Array.prototype.sort` kararlılığı sayesinde
 * geldikleri sıra korunur.
 */
type CategorySortMeta = Partial<Record<'sortOrder' | 'createdAt', unknown>>;

function metaNumber(row: CategoryRow, key: 'sortOrder' | 'createdAt'): number {
  const value = (row as CategoryRow & CategorySortMeta)[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function compareRows(a: CategoryRow, b: CategoryRow, sort: CategorySort): number {
  switch (sort) {
    case 'name':
      return a.name.localeCompare(b.name, 'tr');
    case 'serviceCount':
      return a.serviceCount - b.serviceCount;
    case 'sortOrder':
      return metaNumber(a, 'sortOrder') - metaNumber(b, 'sortOrder');
    default:
      return metaNumber(a, 'createdAt') - metaNumber(b, 'createdAt');
  }
}

/** `sort` + `order` ile sıralanmış **yeni** dizi döner (girdi değişmez). */
export function sortCategories(rows: CategoryRow[], state: CategoriesQueryState): CategoryRow[] {
  const query = normalizeQuery(state);
  const direction = query.order === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => direction * compareRows(a, b, query.sort));
}

export interface PaginatedCategories {
  rows: CategoryRow[];
  total: number;
  totalPages: number;
  /** Sorgulanan sayfa; aralık dışındaysa en yakın geçerli sayfaya kırılır. */
  page: number;
}

/**
 * Sayfalama: `total`/`totalPages` filtrelenmiş listeye göredir. Boş listede
 * `totalPages = 1` (sayfa göstergesi 1'de kalır), son sayfadan ileri taşan
 * `page` değeri kırılır.
 */
export function paginateCategories(
  rows: CategoryRow[],
  state: CategoriesQueryState
): PaginatedCategories {
  const query = normalizeQuery(state);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const offset = (page - 1) * query.limit;

  return { rows: rows.slice(offset, offset + query.limit), total, totalPages, page };
}
