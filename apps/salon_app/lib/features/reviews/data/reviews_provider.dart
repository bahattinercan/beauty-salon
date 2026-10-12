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

final reviewsProvider =
    AsyncNotifierProvider<ReviewsNotifier, List<SalonReview>>(ReviewsNotifier.new);

class ReviewsNotifier extends AsyncNotifier<List<SalonReview>> {
  @override
  Future<List<SalonReview>> build() => _fetch();

  Future<List<SalonReview>> _fetch() async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return [];
    final res = await ApiClient().dio.get('/reviews/salon/${salon.id}');
    final outer = res.data['data'];
    final List list;
    if (outer is List) {
      list = outer;
    } else if (outer is Map) {
      list = (outer['data'] as List?) ?? [];
    } else {
      list = [];
    }
    return list.map((e) => SalonReview.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> reply(String reviewId, String text) async {
    await ApiClient().dio.patch('/reviews/$reviewId/reply', data: {'reply': text});
    state = await AsyncValue.guard(_fetch);
  }
}
