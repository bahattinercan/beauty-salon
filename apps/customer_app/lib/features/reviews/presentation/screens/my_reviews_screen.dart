import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/review.dart';
import '../../domain/usecases/get_my_reviews_usecase.dart';
import '../../../../app/route_names.dart';

// ── Provider ────────────────────────────────────────────────────────────────

final myReviewsProvider = FutureProvider.autoDispose<List<Review>>((ref) async {
  final result = await getIt<GetMyReviewsUseCase>()();
  return result.fold((failure) => throw failure, (reviews) => reviews);
});

// ── Screen ───────────────────────────────────────────────────────────────────

class MyReviewsScreen extends ConsumerWidget {
  const MyReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final reviewsAsync = ref.watch(myReviewsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.profileMyReviews),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: reviewsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: colors.error),
              const SizedBox(height: 12),
              Text(s.reviewsLoadFailed, style: TextStyle(color: colors.textSecondary)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(myReviewsProvider),
                child: Text(s.retry),
              ),
            ],
          ),
        ),
        data: (reviews) {
          if (reviews.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.rate_review_outlined, size: 72, color: colors.textHint),
                  const SizedBox(height: 16),
                  Text(s.reviewsEmpty, style: TextStyle(fontSize: 16, color: colors.textSecondary)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: reviews.length,
            itemBuilder: (context, index) => _ReviewCard(review: reviews[index]),
          );
        },
      ),
    );
  }
}

// ── Card ─────────────────────────────────────────────────────────────────────

class _ReviewCard extends StatelessWidget {
  final Review review;

  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => context.pushNamed(RouteNames.salonDetail, pathParameters: {'id': review.salonId}),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(color: colors.secondary, borderRadius: BorderRadius.circular(10)),
                    child: review.salonLogoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              review.salonLogoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Icon(Icons.spa, color: colors.primary, size: 20),
                            ),
                          )
                        : Icon(Icons.spa, color: colors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(review.salonName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        Text(review.timeAgo, style: TextStyle(fontSize: 11, color: colors.textHint)),
                      ],
                    ),
                  ),
                  Row(
                    children: List.generate(5, (i) => Icon(
                      i < review.rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 16,
                      color: i < review.rating ? colors.starFilled : colors.starEmpty,
                    )),
                  ),
                ],
              ),
              if (review.comment != null) ...[
                const SizedBox(height: 10),
                Text(review.comment!, style: TextStyle(fontSize: 13, color: colors.textPrimary, height: 1.4)),
              ],
              if (review.salonReply != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colors.secondary.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.store, size: 13, color: colors.primary),
                          const SizedBox(width: 5),
                          Text(s.reviewsSalonReply,
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: colors.primary)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(review.salonReply!, style: TextStyle(fontSize: 12, color: colors.textSecondary)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
