'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Star } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/shell/PageHeader';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { Input, Select, Field } from '@/components/ui/Field';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { cx } from '@/lib/cx';

interface ApiReview {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  salonReply?: string | null;
  salonReplyAt?: string | null;
  createdAt: string;
  customer?: { fullName: string };
  salon?: { name: string };
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiReview[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

const ITEMS_PER_PAGE = 10;

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name[0] || '?').toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx('h-4 w-4', i <= rating ? 'fill-warning text-warning' : 'text-border-strong')}
          aria-hidden
        />
      ))}
    </span>
  );
}

type Visibility = 'all' | 'visible' | 'hidden';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiResponse>(`/admin/reviews?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      if (res.success && res.data) {
        setReviews(res.data.data || []);
        setTotalPages(res.data.meta.totalPages);
        setTotalCount(res.data.meta.total);
      } else {
        setReviews([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yorumlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleVisibility = async (reviewId: string) => {
    try {
      setTogglingId(reviewId);
      await apiFetch(`/reviews/${reviewId}/toggle-visibility`, { method: 'PATCH' });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, isVisible: !r.isVisible } : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Görünürlük güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = reviews.filter((review) => {
    const q = searchQuery.toLowerCase();
    const customerName = review.customer?.fullName || 'Misafir';
    const comment = review.comment || '';
    const matchesSearch =
      !q ||
      customerName.toLowerCase().includes(q) ||
      (review.salon?.name || '').toLowerCase().includes(q) ||
      comment.toLowerCase().includes(q);
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;
    const matchesVisibility =
      visibility === 'all' || (visibility === 'visible' && review.isVisible) || (visibility === 'hidden' && !review.isVisible);
    return matchesSearch && matchesRating && matchesVisibility;
  });

  return (
    <>
      <PageHeader
        title="Yorum Yönetimi"
        subtitle={`${totalCount} yorum`}
        actions={
          <Button variant="outline" size="sm" onClick={fetchReviews}>
            Yenile
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <Input
          icon={Star}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Müşteri, salon veya yorum metni ara…"
          aria-label="Yorum ara"
        />
        <div className="flex flex-wrap items-end gap-3">
          <Tabs<Visibility>
            ariaLabel="Görünürlük filtresi"
            value={visibility}
            onChange={setVisibility}
            items={[
              { value: 'all', label: 'Tümü' },
              { value: 'visible', label: 'Görünür' },
              { value: 'hidden', label: 'Gizli' },
            ]}
          />
          <Field label="Puan" htmlFor="rating-filter" className="w-32">
            <Select
              id="rating-filter"
              value={String(ratingFilter)}
              onChange={(e) =>
                setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
            >
              <option value="all">Tümü</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} yıldız
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchReviews} /> : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState title="Yorum bulunamadı" description="Arama veya filtre kriterlerinizi değiştirin." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((review) => (
            <Card key={review.id} className="flex flex-col p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-primary-solid text-xs font-bold text-on-primary">
                  {initials(review.customer?.fullName || 'M')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-fg">
                      {review.customer?.fullName || 'Misafir'}
                    </span>
                    {review.isVisible ? (
                      <Badge tone="success">Görünür</Badge>
                    ) : (
                      <Badge tone="neutral">Gizli</Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-fg-muted">{review.salon?.name ?? '—'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-fg-muted">{formatDate(review.createdAt)}</span>
                </div>
              </div>

              {review.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-fg">{review.comment}</p>
              ) : (
                <p className="mt-3 text-sm italic text-fg-muted">Yorum yazılmamış.</p>
              )}

              {review.salonReply ? (
                <div className="mt-3 rounded-field border-l-2 border-primary bg-surface-variant p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Salon yanıtı</p>
                  <p className="mt-1 text-sm text-fg">{review.salonReply}</p>
                </div>
              ) : null}

              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <Button
                  variant={review.isVisible ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleVisibility(review.id)}
                  disabled={togglingId === review.id}
                >
                  {togglingId === review.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : review.isVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                  {review.isVisible ? 'Gizle' : 'Görünür yap'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />
    </>
  );
}
