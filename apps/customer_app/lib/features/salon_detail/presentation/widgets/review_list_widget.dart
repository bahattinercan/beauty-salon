import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
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
    final colors = AppColors.of(context);
    final s = S.of(context);
    final reviewsAsync = ref.watch(salonReviewsProvider(salonId));

    return reviewsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(s.reviewsLoadFailed,
                style: TextStyle(color: colors.textSecondary)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => ref.invalidate(salonReviewsProvider(salonId)),
              child: Text(s.retry),
            ),
          ],
        ),
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
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(s.reviewsEmpty,
                    style: TextStyle(color: colors.textSecondary)),
              ),
            )
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
