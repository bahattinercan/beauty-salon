'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

const ITEMS_PER_PAGE = 10;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<ApiResponse>(
        `/admin/reviews?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
      );
      if (res.success && res.data) {
        setReviews(res.data.data || []);
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
      await apiFetch(`/reviews/${reviewId}/toggle-visibility`, {
        method: 'PATCH',
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isVisible: !r.isVisible } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Görünürlük güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const customerName = review.customer?.fullName || 'Misafir';
    const salonName = review.salon?.name || '';
    const comment = review.comment || '';

    const matchesSearch =
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;

    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'visible' && review.isVisible) ||
      (visibilityFilter === 'hidden' && !review.isVisible);

    return matchesSearch && matchesRating && matchesVisibility;
  });

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || '?').toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yorum Yönetimi</h1>
          <p className="text-gray-600 mt-1">Platformdaki tüm müşteri yorumlarını yönetin</p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Müşteri, salon veya yorum ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
              aria-label="Puan Filtresi"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700"
            >
              <option value="all">Tüm Puanlar</option>
              <option value="5">5 Yıldız</option>
              <option value="4">4 Yıldız</option>
              <option value="3">3 Yıldız</option>
              <option value="2">2 Yıldız</option>
              <option value="1">1 Yıldız</option>
            </select>

            <select
              value={visibilityFilter}
              onChange={(e) =>
                setVisibilityFilter(e.target.value as 'all' | 'visible' | 'hidden')
              }
              aria-label="Görünürlük Filtresi"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="visible">Görünür</option>
              <option value="hidden">Gizli</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => {
                const customerName = review.customer?.fullName || 'Misafir';
                const salonName = review.salon?.name || 'Salon';
                return (
                  <div
                    key={review.id}
                    className={`border rounded-lg p-5 transition-all ${
                      review.isVisible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-sm">
                          {getInitials(customerName)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{customerName}</p>
                          <p className="text-xs text-gray-500">{salonName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                        <button
                          onClick={() => handleToggleVisibility(review.id)}
                          disabled={togglingId === review.id}
                          className={`p-2 rounded-lg transition-colors ${
                            review.isVisible
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
                          }`}
                          title={review.isVisible ? 'Yorumu Gizle' : 'Yorumu Göster'}
                        >
                          {togglingId === review.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : review.isVisible ? (
                            <Eye className="w-4 h-4 text-green-600 dark:text-green-300" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mt-3 leading-relaxed">
                      {review.comment || <span className="italic text-gray-400">Yorum metni yok</span>}
                    </p>

                    {review.salonReply && (
                      <div className="mt-3 ml-6 p-3 bg-secondary/50 border-l-2 border-primary rounded text-sm">
                        <p className="font-semibold text-xs text-primary mb-1">Salon Yanıtı</p>
                        <p className="text-gray-700 text-xs">{review.salonReply}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                Kriterlere uygun yorum bulunamadı
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sayfa: <span className="font-semibold">{currentPage}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Önceki sayfa"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={reviews.length < ITEMS_PER_PAGE || loading}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Sonraki sayfa"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
