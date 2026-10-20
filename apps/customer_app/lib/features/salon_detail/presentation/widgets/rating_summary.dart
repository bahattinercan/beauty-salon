import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_detail.dart';

class RatingSummary extends StatelessWidget {
  final double ratingAvg;
  final int reviewCount;
  final List<SalonReview> reviews;

  const RatingSummary({
    super.key,
    required this.ratingAvg,
    required this.reviewCount,
    required this.reviews,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    Widget bar(int stars) {
      final count = reviews.where((r) => r.rating == stars).length;
      final ratio = reviews.isEmpty ? 0.0 : count / reviews.length;

      return Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          children: [
            Text('$stars', style: TextStyle(fontSize: 12, color: colors.textSecondary)),
            const SizedBox(width: 4),
            Icon(Icons.star, size: 12, color: colors.starFilled),
            const SizedBox(width: 8),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: ratio,
                  backgroundColor: colors.surfaceVariant,
                  valueColor: AlwaysStoppedAnimation<Color>(colors.starFilled),
                  minHeight: 6,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: colors.shadowCard,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                ratingAvg > 0 ? ratingAvg.toStringAsFixed(1) : '—',
                style: TextStyle(
                    fontSize: 40, fontWeight: FontWeight.bold, color: colors.textPrimary),
              ),
              Row(
                children: List.generate(5, (i) {
                  return Icon(
                    i < ratingAvg.floor()
                        ? Icons.star_rounded
                        : (i < ratingAvg ? Icons.star_half_rounded : Icons.star_outline_rounded),
                    size: 18,
                    color: colors.starFilled,
                  );
                }),
              ),
              const SizedBox(height: 4),
              Text('$reviewCount ${S.of(context).reviews}',
                  style: TextStyle(fontSize: 12, color: colors.textSecondary)),
            ],
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [for (int i = 5; i >= 1; i--) bar(i)],
            ),
          ),
        ],
      ),
    );
  }
}
