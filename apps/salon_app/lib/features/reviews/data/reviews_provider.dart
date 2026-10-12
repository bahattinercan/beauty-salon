import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../salon/data/salon_provider.dart';

class SalonReview {
  final String id;
  final String customerName;
  final double rating;
  final String? comment;
  final String? replyText;
  final String? serviceName;
  final DateTime createdAt;

  const SalonReview({
    required this.id,
    required this.customerName,
    required this.rating,
    this.comment,
    this.replyText,
    this.serviceName,
    required this.createdAt,
  });

  bool get hasReply => replyText != null && replyText!.isNotEmpty;

  factory SalonReview.fromJson(Map<String, dynamic> j) => SalonReview(
        id: j['id']?.toString() ?? '',
        customerName: j['customer']?['fullName']?.toString() ?? 'Müşteri',
        rating: (j['rating'] as num?)?.toDouble() ?? 0,
        comment: j['comment']?.toString(),
        replyText: j['salonReply']?.toString(),
        serviceName: j['appointment']?['service']?['name']?.toString(),
        createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? '') ?? DateTime.now(),
      );
}

/// Sayfalı yorum beslemesi: yüklenenler + toplam + sonraki sayfa var mı.
class ReviewFeed {
  final List<SalonReview> reviews;
  final int total;
  final int page;
  final int limit;

  const ReviewFeed({
    required this.reviews,
    required this.total,
    required this.page,
    required this.limit,
  });

  bool get hasMore => reviews.length < total;

  static const ReviewFeed empty = ReviewFeed(reviews: [], total: 0, page: 1, limit: 20);
}

final reviewsProvider =
    AsyncNotifierProvider<ReviewsNotifier, ReviewFeed>(ReviewsNotifier.new);

class ReviewsNotifier extends AsyncNotifier<ReviewFeed> {
  static const int _limit = 20;

  @override
  Future<ReviewFeed> build() => _fetch(1);

  Future<ReviewFeed> _fetch(int page) async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return ReviewFeed.empty;

    final res = await ApiClient().dio.get(
      '/reviews/salon/${salon.id}',
      queryParameters: {'page': page, 'limit': _limit},
    );

    final outer = res.data['data'];
    List list = const [];
    int total = 0;
    if (outer is List) {
      list = outer;
      total = outer.length;
    } else if (outer is Map) {
      list = (outer['data'] as List?) ?? const [];
      total = (outer['total'] as num?)?.toInt() ?? list.length;
    }

    return ReviewFeed(
      reviews: list.map((e) => SalonReview.fromJson(e as Map<String, dynamic>)).toList(),
      total: total,
      page: page,
      limit: _limit,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(1));
  }

  /// Sonraki sayfayı mevcut listenin sonuna ekler.
  Future<void> loadMore() async {
    final current = state.asData?.value;
    if (current == null || !current.hasMore) return;

    state = await AsyncValue.guard(() async {
      final next = await _fetch(current.page + 1);
      return ReviewFeed(
        reviews: [...current.reviews, ...next.reviews],
        total: next.total,
        page: next.page,
        limit: next.limit,
      );
    });
  }

  Future<void> reply(String reviewId, String text) async {
    await ApiClient().dio.patch('/reviews/$reviewId/reply', data: {'reply': text});
    state = await AsyncValue.guard(() => _fetch(1));
  }
}
