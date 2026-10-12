# CA-010 — Review Pagination (Salon Detail)

**Öncelik:** 🟢 Düşük
**Tahmini Efor:** 1-2 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

`GET /reviews/salon/:salonId` endpoint'i pagination destekliyor (`page`, `limit`). Ama `salon_reviews_provider.dart` tüm review'ları tek seferde çekiyor. `ReviewListWidget` tüm review'ları gösteriyor. "Daha fazla yükle" veya infinite scroll yok.

---

## Backend Referans

```
GET /api/v1/reviews/salon/:salonId?page=1&limit=10
Response:
{
  success: true,
  data: [...],
  meta: { page: 1, total: 45, totalPages: 5 }
}
```

---

## Yapılacak Değişiklikler

### 1. Salon Detail Provider — Pagination

#### `lib/features/salon_detail/presentation/providers/salon_detail_provider.dart` → güncelle

```dart
// Mevcut salonDetailProvider yanına pagination provider ekle:

final salonReviewsProvider = StateNotifierProvider<SalonReviewsNotifier, AsyncValue<PaginatedReviews>>((ref) {
  return SalonReviewsNotifier(ref);
});

class PaginatedReviews {
  final List<SalonReview> reviews;
  final int page;
  final int totalPages;
  final double ratingAvg;
  final int reviewCount;
  
  const PaginatedReviews({
    required this.reviews,
    required this.page,
    required this.totalPages,
    required this.ratingAvg,
    required this.reviewCount,
  });
}

class SalonReviewsNotifier extends StateNotifier<AsyncValue<PaginatedReviews>> {
  final Ref ref;
  int _page = 1;
  static const _limit = 10;

  SalonReviewsNotifier(this.ref) : super(const AsyncLoading());

  Future<void> loadReviews(String salonId) async {
    _page = 1;
    await _fetchReviews(salonId);
  }

  Future<void> loadMoreReviews(String salonId) async {
    if (state is! AsyncData) return;
    final data = (state as AsyncData).value;
    if (_page >= data.totalPages) return;
    _page++;
    await _fetchReviews(salonId, page: _page);
  }

  Future<void> _fetchReviews(String salonId, {int? page}) async {
    final currentPage = page ?? _page;
    try {
      final result = await getIt<GetSalonReviewsUseCase>()(
        salonId: salonId,
        page: currentPage,
        limit: _limit,
      );
      
      state = result.fold(
        (failure) => AsyncError(failure.message, StackTrace.current),
        (reviews) {
          // İlk sayfa mı? (replace) yoksa append mı?
          if (currentPage == 1 || state is! AsyncData) {
            return AsyncData(PaginatedReviews(
              reviews: reviews,
              page: currentPage,
              totalPages: 1, // TODO: backend'den gelmeli
              ratingAvg: 0, // TODO: salon'dan gelmeli
              reviewCount: reviews.length, // TODO: backend'den gelmeli
            ));
          } else {
            final existing = (state as AsyncData).value;
            return AsyncData(PaginatedReviews(
              reviews: [...existing.reviews, ...reviews],
              page: currentPage,
              totalPages: existing.totalPages,
              ratingAvg: existing.ratingAvg,
              reviewCount: existing.reviewCount,
            ));
          }
        },
      );
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
```

### 2. UseCase — Güncelleme

#### `lib/features/salon_detail/domain/usecases/get_salon_reviews_usecase.dart` → güncelle

```dart
@injectable
class GetSalonReviewsUseCase {
  final SalonDetailRepository _repository;
  GetSalonReviewsUseCase(this._repository);

  Future<Either<Failure, List<SalonReview>>> call({
    required String salonId,
    int page = 1,
    int limit = 10,
  }) => _repository.getSalonReviews(
        salonId: salonId, page: page, limit: limit,
      );
}
```

#### `lib/features/salon_detail/domain/repositories/salon_detail_repository.dart` → güncelle

```dart
Future<Either<Failure, List<SalonReview>>> getSalonReviews({
  required String salonId,
  int page,
  int limit,
});
```

#### `lib/features/salon_detail/data/datasources/salon_detail_remote_datasource.dart` → güncelle

```dart
Future<List<SalonReviewModel>> getSalonReviews({
  required String salonId,
  int page = 1,
  int limit = 10,
}) async {
  final response = await _apiClient.get(
    ApiConstants.salonReviews,
    queryParameters: {
      'salonId': salonId,
      'page': page,
      'limit': limit,
    },
  );
  final data = (response.data['data'] as List?) ?? [];
  return data.map((json) => SalonReviewModel.fromJson(json as Map<String, dynamic>)).toList();
}
```

### 3. ReviewListWidget — Güncelleme

#### `lib/features/salon_detail/presentation/widgets/review_list_widget.dart` → güncelle

```dart
class ReviewListWidget extends ConsumerWidget {
  final String salonId;
  final double ratingAvg;
  final int reviewCount;

  const ReviewListWidget({
    super.key,
    required this.salonId,
    required this.ratingAvg,
    required this.reviewCount,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    
    // SalonReviewsProvider kullan
    final reviewsAsync = ref.watch(salonReviewsProvider);

    return reviewsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 48, color: colors.error),
            const SizedBox(height: 12),
            Text('${s.reviewsLoadFailed} $e'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => ref.invalidate(salonReviewsProvider),
              child: Text(s.retry),
            ),
          ],
        ),
      ),
      data: (data) {
        if (data.reviews.isEmpty) {
          return Center(child: Text(s.reviewsEmpty));
        }

        return Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: data.reviews.length + (data.page < data.totalPages ? 1 : 0),
                itemBuilder: (context, index) {
                  // "Daha fazla yükle" butonu
                  if (index == data.reviews.length && data.page < data.totalPages) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: ElevatedButton.icon(
                          onPressed: () => ref
                              .read(salonReviewsProvider.notifier)
                              .loadMoreReviews(salonId),
                          icon: const Icon(Icons.expand_more),
                          label: Text(s.loadMore),
                        ),
                      ),
                    );
                  }

                  // Review card
                  final review = data.reviews[index];
                  return SalonReviewCard(review: review);
                },
              ),
            ),
            // Rating summary
            _buildRatingSummary(s, ratingAvg, reviewCount, colors),
          ],
        );
      },
    );
  }

  Widget _buildRatingSummary(S s, double ratingAvg, int reviewCount, AppColors colors) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        margin: const EdgeInsets.all(20),
      ),
      child: Row(
        children: [
          Text(
            ratingAvg.toStringAsFixed(1),
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: List.generate(5, (index) {
                  final star = index + 1;
                  return Icon(
                    star <= ratingAvg ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 18,
                    color: colors.starFilled,
                  );
                }),
              ),
              Text(
                '$reviewCount ${s.reviews}',
                style: TextStyle(fontSize: 12, color: colors.textSecondary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

### 4. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
String get loadMore     => isEn ? 'Load More'     : 'Daha Fazla Yükle';
String get reviewsLoadFailed => isEn ? 'Could not load reviews' : 'Yorumlar yüklenemedi';
```

### 5. SalonDetailScreen — Provider güncelle

#### `lib/features/salon_detail/presentation/screens/salon_detail_screen.dart`

```dart
// ReviewListWidget çağrısını güncelle:
// ESKİ:
ReviewListWidget(salonId: widget.salonId, ratingAvg: salon.ratingAvg, reviewCount: salon.reviewCount),

// YENİ (salonDetailProvider'ı kullan — zaten salon bilgisi var):
// salonDetailProvider zaten salon bilgisi yüklüyor, salonReviewsProvider ayrı pagination
ReviewListWidget(
  salonId: widget.salonId,
  ratingAvg: salon.ratingAvg,
  reviewCount: salon.reviewCount,
),
// Not: salonReviewsProvider ilk load için salonId'yi parametre olarak almalı
```

---

## Test Senaryoları

1. **İlk yükleme:** 10 review göster, "Daha fazla yükle" varsa göster
2. **Load more:** "Daha fazla yükle" → 10 daha ekle (append)
3. **Tümünü yükle:** Son sayfada → "Daha fazla yükle" gizli
4. **Empty:** Yorum yok → "Henüz yorum yapılmamış"
5. **Error:** API hata → hata göster + retry
6. **Rating summary:** Ortalama puan + toplam yorum sayısı göster

---

## Dikkat Edilecekler

1. **Backend meta:** `page`, `totalPages` response'da gelmeli. Eğer gelmiyorsa backend'te düzelt.
2. **Append vs replace:** İlk yükleme → replace, sonraki → append.
3. **Rating summary:** `ratingAvg` ve `reviewCount` salon'dan geliyor (salonDetailProvider).
4. **Performance:** 10 review = hızlı. 100+ review varsa infinite scroll daha iyi ama "daha fazla yükle" daha basit.
5. **SalonDetailScreen:** `salonReviewsProvider` ilk load'ı ne zaman yapacak? `initState`'de veya `salonDetailProvider`'dan salon yüklendiğinde.

---

## Uygulanan (2026-07-27)

Plan metnindeki tasarım iki yerde düzeltildi:

**1. `StateNotifier` + `try/catch` yerine `AsyncNotifier`** — CLAUDE.md §3: presentation'da `try/catch` yok. Provider hata durumunda `Failure`'ı `throw` ediyor, widget `when(error:)` ile gösteriyor.

**2. `totalPages` artık backend'den geliyor** — plandaki `totalPages: 1 // TODO` gerekmiyordu: `paginatedResponse` gerçekten `meta: { total, page, limit, totalPages }` döndürüyor (`apps/api/src/utils/helpers.js`).

**Domain:** `domain/entities/review_page.dart` → `ReviewPage { reviews, page, totalPages, total, loadingMore }` + `hasNextPage` + `copyWith`.

**Katmanlar:**
- `SalonDetailRemoteDataSource.getSalonReviews({salonId, page, limit})` → `ReviewPage` (meta parse ediliyor). Önceki hali `catch (_) => []` ile hatayı yutuyordu — kaldırıldı, hata repository'ye yayılıyor.
- `SalonDetailRepository` / impl: `Either<Failure, ReviewPage>`.
- `GetSalonReviewsUseCase({salonId, page = 1, limit = 10})`.
- `ApiConstants.salonReviews = '/reviews/salon'` eklendi (datasource ham path kullanıyordu).

**Provider:** `AsyncNotifierProvider.family<SalonReviewsNotifier, ReviewPage, String>` — `loadMore()` mevcut sayfaya append eder, `hasNextPage` false ise istek atmaz, append öncesi `loadingMore = true` (widget altında spinner).

**Widget:** `ReviewListWidget` load-more butonu + sayaç `(10/45)` gösteriyor; hata durumunda retry.

**Bilinen tavizler:**
- `loadMore` başarısız olursa state `AsyncError` olur → yüklenmiş yorumlar kaybolur, retry 1. sayfadan yeniden çeker. (Listeyi korumak için hata flag'i domain entity'ye taşımak gerekirdi, domain `Failure` import edemez.)
- `RatingSummary` dağılım çubukları yalnızca **yüklenen** yorumlara göre hesaplanıyor; backend rating dağılımı döndürmüyor.

**Testler (123 test, analyze temiz):**
- `review_page_test.dart` — `hasNextPage`, `copyWith`, append.
- `get_salon_reviews_usecase_test.dart` — sayfa/limit iletiliyor, varsayılanlar, failure'lar.
- `salon_detail_provider_test.dart` — ilk yükleme, append, son sayfada istek yok, `loadingMore` geçişi.
  - Not: `get_it` v8'de `reset()` **async**; `await` edilmezse `registerSingleton` kaydı siliniyor (bu testte yakalandı).
