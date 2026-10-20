import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/network/media_url.dart';
import '../../domain/entities/salon_detail.dart';

class ReviewCard extends StatelessWidget {
  final SalonReview review;

  const ReviewCard({super.key, required this.review});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: colors.shadowCard,
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: colors.secondary,
                  child: Text(review.customerInitials,
                      style: TextStyle(
                          color: colors.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(review.customerName,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      if (review.serviceName != null)
                        Text(review.serviceName!,
                            style: TextStyle(fontSize: 11, color: colors.textSecondary)),
                    ],
                  ),
                ),
                Text(review.timeAgo, style: TextStyle(fontSize: 11, color: colors.textHint)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: List.generate(5, (i) {
                return Icon(
                  i < review.rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  size: 16,
                  color: i < review.rating ? colors.starFilled : colors.starEmpty,
                );
              }),
            ),
            if (review.comment != null) ...[
              const SizedBox(height: 8),
              Text(review.comment!,
                  style: TextStyle(fontSize: 13, color: colors.textPrimary, height: 1.4)),
            ],
            if (review.images.isNotEmpty) ...[
              const SizedBox(height: 10),
              SizedBox(
                height: 92,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: review.images.map((url) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        resolveMediaUrl(url),
                        width: 92,
                        height: 92,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          width: 92,
                          height: 92,
                          color: colors.secondary,
                          child: Icon(Icons.image, color: colors.primary),
                        ),
                      ),
                    ),
                  )).toList(),
                ),
              ),
            ],
            if (review.reply != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colors.secondary.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.store, size: 14, color: colors.primary),
                        const SizedBox(width: 6),
                        Text(S.of(context).reviewsSalonReply,
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600, color: colors.primary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(review.reply!,
                        style: TextStyle(fontSize: 12, color: colors.textSecondary, height: 1.3)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
