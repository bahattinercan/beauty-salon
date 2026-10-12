import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/review_page.dart';
import '../../domain/entities/salon_detail.dart';
import '../../domain/usecases/get_salon_detail_usecase.dart';
import '../../domain/usecases/get_salon_reviews_usecase.dart';

final salonDetailProvider =
    FutureProvider.family<SalonDetail, String>((ref, salonId) async {
  final result = await getIt<GetSalonDetailUseCase>()(salonId);
  return result.fold(
    (failure) => throw failure,
    (detail) => detail,
  );
});

/// Sayfalı yorum listesi (CA-010). `loadMore()` mevcut sayfaya ekler;
/// `totalPages` backend `meta`sından gelir.
class SalonReviewsNotifier extends AsyncNotifier<ReviewPage> {
  final String salonId;
  SalonReviewsNotifier(this.salonId);

  @override
  Future<ReviewPage> build() => _fetch(1);

  Future<void> loadMore() async {
    final current = state.asData?.value;
    if (current == null || !current.hasNextPage || current.loadingMore) return;

    state = AsyncData(current.copyWith(loadingMore: true));
    final next = await _fetch(current.page + 1);
    state = AsyncData(ReviewPage(
      reviews: [...current.reviews, ...next.reviews],
      page: next.page,
      totalPages: next.totalPages,
      total: next.total,
    ));
  }

  Future<ReviewPage> _fetch(int page) async {
    final result = await getIt<GetSalonReviewsUseCase>()(
      salonId: salonId,
      page: page,
    );
    return result.fold((failure) => throw failure, (reviewPage) => reviewPage);
  }
}

final salonReviewsProvider =
    AsyncNotifierProvider.family<SalonReviewsNotifier, ReviewPage, String>(
      SalonReviewsNotifier.new,
    );
