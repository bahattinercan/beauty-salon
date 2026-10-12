import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../salon/data/salon_provider.dart';
import '../../data/reviews_provider.dart';

class SalonReviewsScreen extends ConsumerStatefulWidget {
  const SalonReviewsScreen({super.key});

  @override
  ConsumerState<SalonReviewsScreen> createState() => _SalonReviewsScreenState();
}

class _SalonReviewsScreenState extends ConsumerState<SalonReviewsScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final reviewsAsync = ref.watch(reviewsProvider);
    final salonAsync = ref.watch(salonProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.reviewsTitle)),
      body: reviewsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(s.errorMsg('$e'), style: const TextStyle(color: Colors.red))),
        data: (feed) {
          final filtered = switch (_filter) {
            'unreplied' => feed.reviews.where((r) => !r.hasReply).toList(),
            'replied' => feed.reviews.where((r) => r.hasReply).toList(),
            _ => feed.reviews,
          };
          final salon = salonAsync.asData?.value;
          final avgRating = salon?.ratingAvg ?? 0.0;
          final totalCount = salon?.reviewCount ?? feed.total;
          final unrepliedCount = feed.reviews.where((r) => !r.hasReply).length;

          return RefreshIndicator(
            onRefresh: () => ref.read(reviewsProvider.notifier).refresh(),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  color: c.surface,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _statItem(avgRating.toStringAsFixed(1), s.reviewsAvg, Icons.star, AppColors.starFilled, c),
                      Container(width: 1, height: 36, color: c.surfaceVariant),
                      _statItem('$totalCount', s.reviewsTotal, Icons.rate_review, AppColors.primary, c),
                      Container(width: 1, height: 36, color: c.surfaceVariant),
                      _statItem('$unrepliedCount', s.reviewsUnanswered, Icons.reply, AppColors.warning, c),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      _filterChip(s.all, 'all', c),
                      const SizedBox(width: 8),
                      _filterChip(s.reviewsUnanswered, 'unreplied', c),
                      const SizedBox(width: 8),
                      _filterChip(s.reviewsAnswered, 'replied', c),
                    ],
                  ),
                ),
                Expanded(
                  child: filtered.isEmpty
                      ? Center(child: Text(s.noReviewsFound, style: TextStyle(color: c.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filtered.length + (feed.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == filtered.length) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: Center(
                                  child: TextButton(
                                    onPressed: () => ref.read(reviewsProvider.notifier).loadMore(),
                                    child: Text('${s.loadMore} (${feed.total - filtered.length})'),
                                  ),
                                ),
                              );
                            }
                            final review = filtered[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _ReviewCard(
                                review: review,
                                onReply: () => _showReplyDialog(review, s),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statItem(String value, String label, IconData icon, Color color, AppThemeColors c) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 4),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        Text(label, style: TextStyle(fontSize: 11, color: c.textSecondary)),
      ],
    );
  }

  Widget _filterChip(String label, String value, AppThemeColors c) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : c.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : c.secondaryBorder),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isSelected ? Colors.white : c.textSecondary)),
      ),
    );
  }

  void _showReplyDialog(SalonReview review, S s) {
    final ctrl = TextEditingController(text: review.replyText ?? '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.replyDialogTitle(review.customerName)),
        content: TextField(
          controller: ctrl,
          maxLines: 4,
          maxLength: 500,
          decoration: InputDecoration(hintText: s.replyHint, border: const OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
          ElevatedButton(
            onPressed: () async {
              if (ctrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await ref.read(reviewsProvider.notifier).reply(review.id, ctrl.text.trim());
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.replySent)));
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
              }
            },
            child: Text(s.send),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final SalonReview review;
  final VoidCallback onReply;

  const _ReviewCard({required this.review, required this.onReply});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: review.hasReply ? c.surfaceVariant : AppColors.warning.withValues(alpha: 0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: c.secondaryBg,
                child: Text(
                  review.customerName.split(' ').map((e) => e[0]).join().substring(0, review.customerName.split(' ').length >= 2 ? 2 : 1),
                  style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(review.customerName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    if (review.serviceName != null)
                      Text(review.serviceName!, style: TextStyle(fontSize: 11, color: c.textSecondary)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    children: List.generate(5, (i) => Icon(
                      Icons.star,
                      size: 13,
                      color: i < review.rating.round() ? AppColors.starFilled : c.surfaceVariant,
                    )),
                  ),
                  Text(
                    DateFormat('dd MMM yyyy', s.isEn ? 'en_US' : 'tr_TR').format(review.createdAt),
                    style: TextStyle(fontSize: 10, color: c.textHint),
                  ),
                ],
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(review.comment!, style: TextStyle(fontSize: 13, color: c.textSecondary)),
          ],
          if (review.hasReply) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: c.secondaryBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.reply, size: 14, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(child: Text(review.replyText!, style: const TextStyle(fontSize: 12, color: AppColors.primaryDark))),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: onReply,
              icon: const Icon(Icons.edit_outlined, size: 14),
              label: Text(s.editReply, style: const TextStyle(fontSize: 12)),
            ),
          ] else ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: onReply,
              icon: const Icon(Icons.reply, size: 14),
              label: Text(s.reply, style: const TextStyle(fontSize: 12)),
            ),
          ],
        ],
      ),
    );
  }
}
