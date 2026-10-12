import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

String ratingText(S s, int rating) {
  switch (rating) {
    case 1:
      return s.ratingBad;
    case 2:
      return s.ratingOkay;
    case 3:
      return s.ratingGood;
    case 4:
      return s.ratingVeryGood;
    case 5:
      return s.ratingExcellent;
    default:
      return s.ratingTap;
  }
}

class RatingSelector extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onChanged;

  const RatingSelector({super.key, required this.rating, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Center(
      child: Column(
        children: [
          Text(
            s.reviewRatePrompt,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            ratingText(s, rating),
            style: TextStyle(
              color: rating > 0 ? colors.accent : colors.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final star = index + 1;
              return GestureDetector(
                onTap: () => onChanged(star),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Icon(
                    star <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
                    size: 44,
                    color: star <= rating ? colors.starFilled : colors.starEmpty,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
