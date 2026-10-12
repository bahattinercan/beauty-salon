import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

class RatingRow extends StatelessWidget {
  final double rating;
  final int reviewCount;

  const RatingRow({super.key, required this.rating, required this.reviewCount});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    if (rating == 0 && reviewCount == 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: colors.accent.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          'Yeni',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: colors.accent,
          ),
        ),
      );
    }

    return Row(
      children: [
        ...List.generate(5, (index) {
          final starValue = index + 1;
          if (rating >= starValue) {
            return Icon(Icons.star_rounded, size: 16, color: colors.starFilled);
          } else if (rating >= starValue - 0.5) {
            return Icon(Icons.star_half_rounded, size: 16, color: colors.starFilled);
          }
          return Icon(Icons.star_rounded, size: 16, color: colors.starEmpty);
        }),
        const SizedBox(width: 6),
        Text(
          rating.toStringAsFixed(1),
          style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600, color: colors.textPrimary),
        ),
        const SizedBox(width: 4),
        Text('($reviewCount)', style: TextStyle(fontSize: 12, color: colors.textSecondary)),
      ],
    );
  }
}

class TagChips extends StatelessWidget {
  final List<String> tags;

  const TagChips({super.key, required this.tags});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: tags.take(3).map((tag) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: colors.secondary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            tag,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: colors.primaryDark),
          ),
        );
      }).toList(),
    );
  }
}

class InfoLine extends StatelessWidget {
  final IconData icon;
  final String text;
  final double iconSize;
  final double fontSize;

  const InfoLine({
    super.key,
    required this.icon,
    required this.text,
    this.iconSize = 14,
    this.fontSize = 12,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Row(
      children: [
        Icon(icon, size: iconSize, color: colors.textSecondary),
        const SizedBox(width: 3),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: fontSize, color: colors.textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
