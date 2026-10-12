import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../app/theme/app_colors.dart';

class SalonCardShimmer extends StatelessWidget {
  const SalonCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    Widget bar(double width) => Container(
          height: 12,
          width: width,
          decoration: BoxDecoration(
            color: colors.secondary,
            borderRadius: BorderRadius.circular(4),
          ),
        );

    return Shimmer.fromColors(
      baseColor: colors.secondary.withValues(alpha: 0.5),
      highlightColor: colors.surface,
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 140,
              decoration: BoxDecoration(
                color: colors.secondary,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  bar(160),
                  const SizedBox(height: 8),
                  bar(120),
                  const SizedBox(height: 8),
                  bar(140),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
