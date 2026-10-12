import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class StarRatingInput extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const StarRatingInput({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(S.of(context).discoverMinRating,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Row(
          children: List.generate(5, (i) {
            final star = i + 1.0;
            return GestureDetector(
              onTap: () => onChanged(star),
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  Icons.star_rounded,
                  size: 38,
                  color: star <= value ? colors.starFilled : colors.starEmpty,
                ),
              ),
            );
          }),
        ),
        if (value > 1)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              '$value ${S.of(context).discoverStarsAndUp}',
              style: TextStyle(fontSize: 12, color: colors.textSecondary),
            ),
          ),
      ],
    );
  }
}
