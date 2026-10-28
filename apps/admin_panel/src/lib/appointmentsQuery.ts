/**
 * Randevu sayfası — `/appointments` filtre durumu ↔ URL ↔ API sorgusu eşlemesi.
 *
 * Saf modül: React yok, `window` yok, `localStorage` yok, ağ yok. Desen
 * `src/lib/salonsQuery.ts` ile birebir aynıdır (aynı isimlendirme, aynı sınır
 * doğrulaması) ve `tests/lib/appointmentsQuery.test.ts` altında `node:test` ile
 * ağsız sınanır (AP-002 kapısı).
 *
 * Parametre adları: `q`, `durum`, `salon`, `personel`, `tarih`, `sayfa`, `limit`,
 * `sirala`. Sıralama tek parametrede taşınır: `sirala=<sort>:<order>`
 * (`createdAt:desc`, `date:asc`, `date:desc`). Varsayılanlar URL'e **yazılmaz**
 * (temiz deep-link); okuma tarafı eksik/geçersiz değeri varsayılana çeker.
 */

/** API `limit` üst sınırı 100; panelde üç seçenek var. */
export const APPOINTMENTS_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
/** Sayfa boyutu tercihi sayfalar arasında hatırlanır (localStorage — sayfa tarafı). */
export const PAGE_SIZE_STORAGE_KEY = 'appointments_page_size';

/** `tümü` yalnız panelde var: API'ye gönderilmez (API beş enum değeri kabul eder). */
export type AppointmentStatusFilter =
  | 'tümü'
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
export type AppointmentSort = 'createdAt' | 'date';
export type SortOrder = 'asc' | 'desc';
export type DatePreset = 'tümü' | 'bugün' | 'yarın' | 'bu-hafta' | 'bu-ay' | 'geçmiş' | 'gelecek';

export interface AppointmentsQueryState {
  q: string;
  status: AppointmentStatusFilter;
  salonId: string;
  staffId: string;
  date: DatePreset;
  page: number;
  limit: number;
  sort: AppointmentSort;
  order: SortOrder;
}

export const DEFAULT_APPOINTMENTS_QUERY: AppointmentsQueryState = {
  q: '',
  status: 'tümü',
  salonId: '',
  staffId: '',
  date: 'tümü',
  page: 1,
  limit: 20,
  sort: 'createdAt',
  order: 'desc',
};

export const APPOINTMENT_STATUS_FILTERS: AppointmentStatusFilter[] = [
  'tümü',
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

/**
 * `sirala` parametresinin tek kaynağı: UI select seçenekleri de buradan üretilir.
 * `value` = URL biçimi, `sort`/`order` = API parametreleri.
 */
export const APPOINTMENT_SORT_OPTIONS: {
  value: string;
  label: string;
  sort: AppointmentSort;
  order: SortOrder;
}[] = [
  { value: 'createdAt:desc', label: 'En yeni', sort: 'createdAt', order: 'desc' },
  { value: 'date:asc', label: 'Tarih (yakın)', sort: 'date', order: 'asc' },
  { value: 'date:desc', label: 'Tarih (uzak)', sort: 'date', order: 'desc' },
];

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'tümü', label: 'Tüm tarihler' },
  { value: 'bugün', label: 'Bugün' },
  { value: 'yarın', label: 'Yarın' },
  { value: 'bu-hafta', label: 'Bu hafta' },
  { value: 'bu-ay', label: 'Bu ay' },
  { value: 'geçmiş', label: 'Geçmiş' },
  { value: 'gelecek', label: 'Gelecek' },
];

/** Chip etiketlerindeki durum adları (API enum → Türkçe görünen metin). */
const TR_LABEL: Record<AppointmentStatusFilter, string> = {
  'tümü': 'Tümü',
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
};

const DATE_PRESET_VALUES: DatePreset[] = DATE_PRESET_OPTIONS.map((option) => option.value);

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

/**
 * URL → durum. `?filter=CONFIRMED` eski derin bağlantısı (PageHeader) `durum`a
 * alias'lanır; `durum` varsa o kazanır.
 */
export function parseAppointmentsQuery(search: string): AppointmentsQueryState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const statusRaw = params.get('durum') ?? params.get('filter') ?? '';
  const status = APPOINTMENT_STATUS_FILTERS.includes(statusRaw as AppointmentStatusFilter)
    ? (statusRaw as AppointmentStatusFilter)
    : DEFAULT_APPOINTMENTS_QUERY.status;

  const sortOption = APPOINTMENT_SORT_OPTIONS.find(
    (option) => option.value === params.get('sirala')
  );

  const dateRaw = params.get('tarih');
  const date = DATE_PRESET_VALUES.includes(dateRaw as DatePreset)
    ? (dateRaw as DatePreset)
    : DEFAULT_APPOINTMENTS_QUERY.date;

  const limitRaw = Number(params.get('limit'));

  return normalizeQuery({
    q: params.get('q') ?? '',
    status,
    salonId: params.get('salon') ?? '',
    staffId: params.get('personel') ?? '',
    date,
    page: parseInteger(params.get('sayfa'), 1, 1),
    limit: APPOINTMENTS_PAGE_SIZES.includes(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE,
    sort: sortOption?.sort,
    order: sortOption?.order,
  });
}

/** Durum → URL sorgusu (`?` öneki YOK; boşsa tüm filtreler varsayılan). */
export function buildAppointmentsQuery(state: AppointmentsQueryState): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.status !== DEFAULT_APPOINTMENTS_QUERY.status) params.set('durum', query.status);
  if (query.salonId) params.set('salon', query.salonId);
  if (query.staffId) params.set('personel', query.staffId);
  if (query.date !== DEFAULT_APPOINTMENTS_QUERY.date) params.set('tarih', query.date);
  if (query.page !== DEFAULT_APPOINTMENTS_QUERY.page) params.set('sayfa', String(query.page));
  if (query.limit !== DEFAULT_APPOINTMENTS_QUERY.limit) params.set('limit', String(query.limit));
  if (query.sort !== DEFAULT_APPOINTMENTS_QUERY.sort || query.order !== DEFAULT_APPOINTMENTS_QUERY.order) {
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
 * Durum → `GET /admin/appointments` sorgusu. `status=tümü` **gönderilmez** (API
 * validator'ı yalnız beş enum değerini kabul eder); tarih önceli `dateFrom`/
 * `dateTo`ya açılır. Sayfalama ve sıralama her zaman yazılır.
 */
export function toApiSearchParams(state: AppointmentsQueryState, today: Date): string {
  const query = normalizeQuery(state);
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sort: query.sort,
    order: query.order,
  });

  if (query.q) params.set('search', query.q);
  if (query.status !== 'tümü') params.set('status', query.status);
  if (query.salonId) params.set('salonId', query.salonId);
  if (query.staffId) params.set('staffId', query.staffId);

  const range = dateRangeForPreset(query.date, today);
  if (range.dateFrom) params.set('dateFrom', range.dateFrom);
  if (range.dateTo) params.set('dateTo', range.dateTo);

  return params.toString();
}

/** Kaldırılabilir filtre çipi; `patch` alanı varsayılana çeker ve sayfayı 1'e döner. */
interface AppointmentChip {
  key: 'status' | 'salon' | 'staff' | 'date' | 'q';
  label: string;
  patch: Partial<AppointmentsQueryState>;
}

/**
 * Etkin filtreler, ekrandaki sırayla: durum → salon → personel → tarih → arama.
 * `names` seçili salon/personel görünen adları; yoksa kimlik gösterilir.
 * Sıralama/sayfa/limit bir "filtre" sayılmaz, chip üretmez.
 */
export function activeChips(
  state: AppointmentsQueryState,
  names?: { salon?: string; staff?: string }
): AppointmentChip[] {
  const query = normalizeQuery(state);
  const chips: AppointmentChip[] = [];

  if (query.status !== 'tümü') {
    chips.push({
      key: 'status',
      label: `Durum: ${TR_LABEL[query.status]}`,
      patch: { status: 'tümü', page: 1 },
    });
  }
  if (query.salonId) {
    chips.push({
      key: 'salon',
      label: `Salon: ${names?.salon ?? query.salonId}`,
      patch: { salonId: '', page: 1 },
    });
  }
  if (query.staffId) {
    chips.push({
      key: 'staff',
      label: `Personel: ${names?.staff ?? query.staffId}`,
      patch: { staffId: '', page: 1 },
    });
  }
  if (query.date !== 'tümü') {
    const label =
      DATE_PRESET_OPTIONS.find((option) => option.value === query.date)?.label ?? query.date;
    chips.push({ key: 'date', label: `Tarih: ${label}`, patch: { date: 'tümü', page: 1 } });
  }
  if (query.q) {
    chips.push({ key: 'q', label: `Arama: "${query.q}"`, patch: { q: '', page: 1 } });
  }

  return chips;
}

/**
 * Sınır doğrulaması: URL'den, localStorage'dan veya `updateFilter` yamasından
 * gelen her değer buradan geçer. Geçersiz değer varsayılana döner (hata atılmaz —
 * kullanıcı elle bozulmuş bir deep-link'e düşmüş olabilir).
 */
export function normalizeQuery(
  state: Partial<AppointmentsQueryState>
): AppointmentsQueryState {
  const merged = { ...DEFAULT_APPOINTMENTS_QUERY, ...state };

  const status = APPOINTMENT_STATUS_FILTERS.includes(merged.status)
    ? merged.status
    : DEFAULT_APPOINTMENTS_QUERY.status;

  const date = DATE_PRESET_VALUES.includes(merged.date)
    ? merged.date
    : DEFAULT_APPOINTMENTS_QUERY.date;

  // Yalnız listedeki (sort, order) ikilisi kabul edilir; uydurma kombinasyon varsayılana döner.
  const sortOption =
    APPOINTMENT_SORT_OPTIONS.find(
      (option) => option.sort === merged.sort && option.order === merged.order
    ) ?? APPOINTMENT_SORT_OPTIONS[0];

  return {
    q: typeof merged.q === 'string' ? merged.q.trim().slice(0, MAX_Q) : '',
    status,
    salonId: typeof merged.salonId === 'string' ? merged.salonId.trim().slice(0, MAX_ID) : '',
    staffId: typeof merged.staffId === 'string' ? merged.staffId.trim().slice(0, MAX_ID) : '',
    date,
    page: Number.isInteger(merged.page) && merged.page >= 1 ? merged.page : 1,
    limit: APPOINTMENTS_PAGE_SIZES.includes(merged.limit) ? merged.limit : DEFAULT_PAGE_SIZE,
    sort: sortOption.sort,
    order: sortOption.order,
  };
}
