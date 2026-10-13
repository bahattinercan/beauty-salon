import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../providers/salon_detail_provider.dart';
import '../widgets/rating_summary.dart';
import '../widgets/review_card.dart';

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
    final s = S.of(context);
    final reviewsAsync = ref.watch(salonReviewsProvider(salonId));

    return reviewsAsync.when(
      loading: () => const SkeletonList(count: 3, itemHeight: 120),
      error: (e, _) => ErrorState(
        message: '${s.reviewsLoadFailed}: $e',
        onRetry: () => ref.invalidate(salonReviewsProvider(salonId)),
      ),
      data: (page) => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          RatingSummary(
            ratingAvg: ratingAvg,
            reviewCount: reviewCount,
            reviews: page.reviews,
          ),
          const SizedBox(height: 20),
          if (page.reviews.isEmpty)
            EmptyState(message: s.reviewsEmpty, icon: Icons.rate_review_outlined)
          else
            ...page.reviews.map((review) => ReviewCard(review: review)),
          if (page.loadingMore)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (page.hasNextPage)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: ElevatedButton.icon(
                  onPressed: () =>
                      ref.read(salonReviewsProvider(salonId).notifier).loadMore(),
                  icon: const Icon(Icons.expand_more),
                  label: Text('${s.loadMore} (${page.reviews.length}/${page.total})'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
