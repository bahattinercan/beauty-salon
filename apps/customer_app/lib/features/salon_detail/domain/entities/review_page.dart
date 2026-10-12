import 'salon_detail.dart';

/// Yorum sayfası. `page`/`totalPages`/`total` backend `meta`'sından gelir.
class ReviewPage {
  final List<SalonReview> reviews;
  final int page;
  final int totalPages;
  final int total;

  /// Load-more isteği sürüyor mu — widget altında spinner gösterir.
  final bool loadingMore;

  const ReviewPage({
    required this.reviews,
    required this.page,
    required this.totalPages,
    this.total = 0,
    this.loadingMore = false,
  });

  bool get hasNextPage => page < totalPages;

  ReviewPage copyWith({
    List<SalonReview>? reviews,
    int? page,
    int? totalPages,
    int? total,
    bool? loadingMore,
  }) =>
      ReviewPage(
        reviews: reviews ?? this.reviews,
        page: page ?? this.page,
        totalPages: totalPages ?? this.totalPages,
        total: total ?? this.total,
        loadingMore: loadingMore ?? this.loadingMore,
      );
}
