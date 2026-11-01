'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Dialog from '@/components/ui/Dialog';
import { Input, Select, Textarea, Field } from '@/components/ui/Field';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import FilterBar from '@/components/ui/FilterBar';
import FilterChips from '@/components/ui/FilterChips';
import Stars from '@/components/reviews/Stars';
import ReviewActions, { type ReviewPendingAction } from '@/components/reviews/ReviewActions';
import ReviewDetailDialog, { type ReviewDetail } from '@/components/reviews/ReviewDetailDialog';
import useDebouncedValue from '@/lib/useDebouncedValue';
import { cx } from '@/lib/cx';
import type { Locale } from '@/lib/i18n';
import { useI18n } from '@/providers/LocaleProvider';
import {
  DATE_PRESET_OPTIONS,
  DEFAULT_REVIEWS_QUERY,
  PAGE_SIZE_STORAGE_KEY,
  REPLY_LABEL_KEYS,
  REVIEWS_PAGE_SIZES,
  VISIBILITY_LABEL_KEYS,
  activeChips,
  buildReviewsQuery,
  normalizeQuery,
  parseReviewsQuery,
  toApiSearchParams,
  type ReviewRatingFilter,
  type ReviewReplyFilter,
  type ReviewsQueryState,
  type ReviewVisibilityFilter,
} from '@/lib/reviewsQuery';

interface ApiReview {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  salonReply?: string | null;
  salonReplyAt?: string | null;
  images?: string[] | null;
  createdAt: string;
  customer?: { fullName: string };
  salon?: { name: string };
}

/** AP-010 §A: `meta.counts`/`ratings`/`salons` filtrelerden bağımsızdır (global). */
interface ReviewsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: {
    all: number;
    visible: number;
    hidden: number;
    replied: number;
    unreplied: number;
  };
  ratings?: Record<string, number>;
  salons?: { id: string; name: string }[];
}

interface ApiResponse {
  success: boolean;
  data: { data: ApiReview[]; meta: ReviewsMeta };
}

const EMPTY_META: ReviewsMeta = {
  total: 0,
  page: 1,
  limit: DEFAULT_REVIEWS_QUERY.limit,
  totalPages: 1,
};

/** Puan select sırası: en yüksekten aşağı (panel alışkanlığı). */
const RATING_SELECT_ORDER = [5, 4, 3, 2, 1] as const;

/** Yanıt metni sınırı: API validator'ı (`adminReviewReplyValidator`) ile aynı. */
const REPLY_MAX = 2000;

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name[0] || '?').toUpperCase();
}

function formatDate(dateString: string, locale: Locale = 'tr'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Kart satırı → detay modalı verisi; diyalog kendi ağ isteğini yapmaz.
 * `guestLabel` sözlükten gelir (`reviews.card.guest`), modül dil taşımaz.
 */
function toDetail(review: ApiReview, guestLabel: string): ReviewDetail {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    isVisible: review.isVisible,
    salonReply: review.salonReply ?? null,
    salonReplyAt: review.salonReplyAt ?? null,
    createdAt: review.createdAt,
    customerName: review.customer?.fullName || guestLabel,
    salonName: review.salon?.name ?? '—',
    images: Array.isArray(review.images) ? review.images : [],
  };
}

export default function ReviewsPage() {
  const router = useRouter();
  const { locale, t } = useI18n();

  /** Sayaç yoksa (ilk yükleme / eski API) parantez basılmaz. */
  const withCount = (label: string, count: number | undefined): string =>
    count === undefined ? label : t('reviews.option', { label, count });

  const [query, setQuery] = useState<ReviewsQueryState>(DEFAULT_REVIEWS_QUERY);
  const [hydrated, setHydrated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [meta, setMeta] = useState<ReviewsMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<ApiReview | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ review: ApiReview; value: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiReview | null>(null);

  // Arama 300ms debounce; filtreler anında. Sunucu isteği debounce edilmiş değerle.
  const debouncedQ = useDebouncedValue(query.q, 300);
  const apiQuery = toApiSearchParams({ ...query, q: debouncedQ }, new Date());

  /**
   * İlk açılış: URL'den durum okunur, sayfa boyutu tercihi localStorage'dan gelir
   * (URL'de açık `limit` varsa o kazanır). `useSearchParams` statik prerender'da
   * Suspense sınırı zorunlu kıldığı için `window.location` (AP-007 deseni).
   */
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseReviewsQuery(window.location.search);
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    const limit = params.has('limit')
      ? fromUrl.limit
      : REVIEWS_PAGE_SIZES.includes(stored)
        ? stored
        : fromUrl.limit;

    setQuery(normalizeQuery({ ...fromUrl, limit }));
    setHydrated(true);
  }, [router]);

  const fetchReviews = useCallback(
    async (search: string, signal: AbortSignal) => {
      try {
        setError(null);
        setLoading(true);
        const result = await apiFetch<ApiResponse>(`/admin/reviews?${search}`, { signal });
        if (result.success && result.data) {
          setReviews(result.data.data);
          setMeta(result.data.meta);
        }
      } catch (err) {
        // İptal edilen istek state yazmaz: yavaş cevap yeni filtreyi ezmesin.
        if (signal.aborted) return;
        const message = err instanceof Error ? err.message : t('reviews.notice.loadError');
        if (message.includes('401') || message.includes('403')) {
          router.push('/login');
          return;
        }
        setError(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [router, t]
  );

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    void fetchReviews(apiQuery, controller.signal);
    return () => controller.abort();
  }, [apiQuery, fetchReviews, hydrated, reloadKey]);

  /**
   * Tek kaynak `query` → URL. İlk render yazmaz (URL zaten okunuyor), sonra her
   * değişiklik `router.replace` ile yazılır (`scroll: false`).
   */
  const lastWrittenQuery = useRef<string | null>(null);
  useEffect(() => {
    const next = buildReviewsQuery(query);
    if (lastWrittenQuery.current === null) {
      lastWrittenQuery.current = next;
      return;
    }
    if (lastWrittenQuery.current === next) return;
    lastWrittenQuery.current = next;
    router.replace(next ? `/reviews?${next}` : '/reviews', { scroll: false });
  }, [query, router]);

  /** Filtre değişimi sayfayı 1'e döndürür; sayfa değişimi açıkça `page` verir. */
  const updateFilter = useCallback((patch: Partial<ReviewsQueryState>) => {
    setQuery((prev) => normalizeQuery({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  /** Temizle: tüm filtreler varsayılana, sayfa 1 — sayfa boyutu korunur. */
  const clearFilters = useCallback(() => {
    setQuery((prev) => normalizeQuery({ ...DEFAULT_REVIEWS_QUERY, limit: prev.limit }));
  }, []);

  const changePageSize = (size: number) => {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    updateFilter({ limit: size });
  };

  // Diyalog kapanışları sabit referans: `Dialog` effect'i `onClose` kimliğine bağlı,
  // her render'da yeni fonksiyon verilirse odak her tuş vuruşunda ilk kontrole döner.
  const closeDetail = useCallback(() => setDetailTarget(null), []);
  const closeReply = useCallback(() => setReplyTarget(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const runReply = async () => {
    if (!replyTarget) return;
    const { review, value } = replyTarget;
    try {
      setPending(`${review.id}-reply`);
      setNotice(null);
      const result = await apiFetch<{
        success: boolean;
        data: { id: string; salonReply: string; salonReplyAt: string };
      }>(`/admin/reviews/${review.id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ reply: value.trim() }),
      });
      setReviews((prev) =>
        prev.map((row) =>
          row.id === review.id
            ? {
                ...row,
                salonReply: result.data.salonReply,
                salonReplyAt: result.data.salonReplyAt,
              }
            : row
        )
      );
      setReplyTarget(null);
      setNotice({ kind: 'success', text: t('reviews.notice.replySaved') });
    } catch (err) {
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : t('reviews.notice.replySaveError'),
      });
    } finally {
      setPending(null);
    }
  };

  /** Görünürlük geri alınabilir: istek öncesi iyimser güncelleme, hatada geri alma. */
  const runToggleVisibility = async (review: ApiReview) => {
    const nextVisible = !review.isVisible;
    try {
      setPending(`${review.id}-visibility`);
      setNotice(null);
      setReviews((prev) =>
        prev.map((row) => (row.id === review.id ? { ...row, isVisible: nextVisible } : row))
      );
      await apiFetch(`/reviews/${review.id}/toggle-visibility`, { method: 'PATCH' });
      setNotice({
        kind: 'success',
        text: nextVisible ? t('reviews.notice.madeVisible') : t('reviews.notice.hidden'),
      });
    } catch (err) {
      setReviews((prev) =>
        prev.map((row) => (row.id === review.id ? { ...row, isVisible: review.isVisible } : row))
      );
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : t('reviews.notice.visibilityError'),
      });
    } finally {
      setPending(null);
    }
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    const review = deleteTarget;
    try {
      setPending(`${review.id}-delete`);
      setNotice(null);
      await apiFetch(`/admin/reviews/${review.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setNotice({ kind: 'success', text: t('reviews.notice.deleted') });
      // Silme sonrası toplam/sayfalar değişir: liste sunucudan tazelenir.
      setReloadKey((key) => key + 1);
    } catch (err) {
      setNotice({
        kind: 'error',
        text: err instanceof Error ? err.message : t('reviews.notice.deleteError'),
      });
    } finally {
      setPending(null);
    }
  };

  const pendingFor = (id: string): ReviewPendingAction => {
    if (pending === `${id}-reply`) return 'reply';
    if (pending === `${id}-visibility`) return 'visibility';
    if (pending === `${id}-delete`) return 'delete';
    return null;
  };

  const counts = meta.counts;
  const ratings = meta.ratings ?? {};
  const salonList = meta.salons ?? [];

  // Deep-link'te seçili kimlik meta listesinde yoksa select boş görünmesin.
  const salonOptions =
    query.salonId && !salonList.some((salon) => salon.id === query.salonId)
      ? [...salonList, { id: query.salonId, name: query.salonId }]
      : salonList;

  const selectedSalonName = salonList.find((salon) => salon.id === query.salonId)?.name;

  const hasFilters = Boolean(
    query.q ||
      query.visibility !== 'tümü' ||
      query.rating !== 'tümü' ||
      query.reply !== 'tümü' ||
      query.salonId ||
      query.date !== 'tümü'
  );

  const replyValue = replyTarget?.value ?? '';
  const replyLength = replyValue.trim().length;
  const replyInvalid = replyLength === 0 || replyLength > REPLY_MAX;

  return (
    <>
      <PageHeader
        title={t('reviews.page.title')}
        // Sayaç global `meta.counts.all` (filtre uygulanınca daralmaz).
        subtitle={t('reviews.page.subtitle', { count: counts?.all ?? meta.total })}
        actions={
          <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            {t('reviews.page.refresh')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2">
        <FilterBar
          leading={
            // Ölçü sarmalayıcıda: kontrolün taban sınıfı `w-full` olduğu için
            // genişlik/daralma sınıfları doğrudan kontrole verilince eziliyor (AP-007).
            <div className="min-w-[10rem] flex-1 overflow-hidden">
              <Input
                icon={Search}
                value={query.q}
                onChange={(e) => updateFilter({ q: e.target.value })}
                placeholder={t('reviews.page.searchPlaceholder')}
                aria-label={t('reviews.page.searchAriaLabel')}
              />
            </div>
          }
        >
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t('reviews.page.visibilityFilter')}
              value={query.visibility}
              onChange={(e) =>
                updateFilter({ visibility: e.target.value as ReviewVisibilityFilter })
              }
            >
              <option value="tümü">
                {withCount(t(VISIBILITY_LABEL_KEYS['tümü']), counts?.all)}
              </option>
              <option value="görünür">
                {withCount(t(VISIBILITY_LABEL_KEYS['görünür']), counts?.visible)}
              </option>
              <option value="gizli">
                {withCount(t(VISIBILITY_LABEL_KEYS['gizli']), counts?.hidden)}
              </option>
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t('reviews.page.ratingFilter')}
              value={String(query.rating)}
              onChange={(e) =>
                updateFilter({
                  rating: (e.target.value === 'tümü'
                    ? 'tümü'
                    : Number(e.target.value)) as ReviewRatingFilter,
                })
              }
            >
              <option value="tümü">{t('reviews.page.allRatings')}</option>
              {RATING_SELECT_ORDER.map((n) => (
                <option key={n} value={n}>
                  {withCount(t('reviews.rating.stars', { rating: n }), ratings[String(n)])}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t('reviews.page.replyFilter')}
              value={query.reply}
              onChange={(e) => updateFilter({ reply: e.target.value as ReviewReplyFilter })}
            >
              <option value="tümü">{withCount(t(REPLY_LABEL_KEYS['tümü']), counts?.all)}</option>
              <option value="yanıtlı">
                {withCount(t(REPLY_LABEL_KEYS['yanıtlı']), counts?.replied)}
              </option>
              <option value="yanıtsız">
                {withCount(t(REPLY_LABEL_KEYS['yanıtsız']), counts?.unreplied)}
              </option>
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t('reviews.page.salonFilter')}
              value={query.salonId}
              onChange={(e) => updateFilter({ salonId: e.target.value })}
            >
              <option value="">{t('reviews.page.allSalons')}</option>
              {salonOptions.map((salon) => (
                <option key={salon.id} value={salon.id}>
                  {salon.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="!min-w-[8.5rem] max-w-48 flex-1">
            <Select
              aria-label={t('reviews.page.dateFilter')}
              value={query.date}
              onChange={(e) =>
                updateFilter({ date: e.target.value as ReviewsQueryState['date'] })
              }
            >
              {DATE_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <FilterChips
          chips={activeChips(query, { salon: selectedSalonName }).map((chip) => ({
            key: chip.key,
            // Şablon anahtarı + değer anahtarı; `vars` hazır değişkenleri taşır.
            label: t(chip.labelKey, {
              ...chip.vars,
              ...(chip.valueKey ? { label: t(chip.valueKey) } : null),
            }),
            onRemove: () => updateFilter(chip.patch),
          }))}
          onClearAll={clearFilters}
        />
      </div>

      {/* Canlı bölge her zaman DOM'da: başarı da hata da aynı yerden duyurulur (alert() yok). */}
      <p
        role="status"
        aria-live="polite"
        className={cx(
          'mb-3 text-sm',
          notice ? (notice.kind === 'error' ? 'text-error' : 'text-fg-muted') : 'sr-only'
        )}
      >
        {notice?.text ?? ''}
      </p>

      {error ? <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} /> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <EmptyState
            title={
              hasFilters ? t('reviews.empty.filteredTitle') : t('reviews.empty.noneTitle')
            }
            description={
              hasFilters
                ? t('reviews.empty.filteredDescription')
                : t('reviews.empty.noneDescription')
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <Card key={review.id} as="article" className="flex flex-col p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-primary-solid text-xs font-bold text-on-primary">
                  {initials(review.customer?.fullName || t('reviews.card.guest'))}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-fg">
                      {review.customer?.fullName || t('reviews.card.guest')}
                    </span>
                    {review.isVisible ? (
                      <Badge tone="success">{t('reviews.visibility.visible')}</Badge>
                    ) : (
                      <Badge tone="neutral">{t('reviews.visibility.hidden')}</Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-fg-muted">{review.salon?.name ?? '—'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-fg-muted">{formatDate(review.createdAt, locale)}</span>
                </div>
              </div>

              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-fg">{review.comment}</p>
              ) : (
                <p className="mt-3 text-sm italic text-fg-muted">{t('reviews.card.noComment')}</p>
              )}

              {review.salonReply ? (
                <div className="mt-3 rounded-field border-l-2 border-primary bg-surface-variant p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {t('reviews.card.salonReply')}
                  </p>
                  <p className="mt-1 text-sm text-fg">{review.salonReply}</p>
                </div>
              ) : null}

              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <ReviewActions
                  isVisible={review.isVisible}
                  hasReply={Boolean(review.salonReply)}
                  pending={pendingFor(review.id)}
                  onDetail={() => setDetailTarget(review)}
                  onReply={() => setReplyTarget({ review, value: review.salonReply ?? '' })}
                  onToggleVisibility={() => void runToggleVisibility(review)}
                  onDelete={() => setDeleteTarget(review)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={query.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={query.limit}
        pageSizeOptions={REVIEWS_PAGE_SIZES}
        onPage={(page) => updateFilter({ page })}
        onPageSize={changePageSize}
      />

      <ReviewDetailDialog
        review={detailTarget ? toDetail(detailTarget, t('reviews.card.guest')) : null}
        open={detailTarget !== null}
        onClose={closeDetail}
      />

      <Dialog
        open={replyTarget !== null}
        onClose={closeReply}
        title={t('reviews.replyDialog.title')}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeReply} disabled={pending !== null}>
              {t('reviews.replyDialog.back')}
            </Button>
            <Button variant="primary" onClick={() => void runReply()} disabled={replyInvalid || pending !== null}>
              {pending?.endsWith('-reply') ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t('reviews.replyDialog.save')}
            </Button>
          </>
        }
      >
        <Field
          label={t('reviews.replyDialog.label')}
          htmlFor="review-reply"
          hint={t('reviews.replyDialog.hint', { count: replyLength, max: REPLY_MAX })}
          error={replyInvalid ? t('reviews.replyDialog.errorLength') : null}
        >
          <Textarea
            id="review-reply"
            value={replyValue}
            onChange={(e) => {
              const { value } = e.target;
              setReplyTarget((prev) => (prev ? { ...prev, value } : prev));
            }}
            placeholder={t('reviews.replyDialog.placeholder')}
          />
        </Field>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={closeDelete}
        title={t('reviews.deleteDialog.title')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeDelete} disabled={pending !== null}>
              {t('reviews.deleteDialog.back')}
            </Button>
            <Button variant="danger" onClick={() => void runDelete()} disabled={pending !== null}>
              {pending?.endsWith('-delete') ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t('reviews.deleteDialog.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">{t('reviews.deleteDialog.message')}</p>
      </Dialog>
    </>
  );
}
