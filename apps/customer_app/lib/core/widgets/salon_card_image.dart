import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../app/theme/app_colors.dart';

class CardBadge extends StatelessWidget {
  final String text;
  final Color background;
  final Color textColor;

  const CardBadge({
    super.key,
    required this.text,
    required this.background,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textColor),
      ),
    );
  }
}

class SalonCardImage extends StatelessWidget {
  final String imageUrl;
  final String distance;
  final String priceRange;
  final bool isFavorite;
  final VoidCallback? onFavoriteTap;

  const SalonCardImage({
    super.key,
    required this.imageUrl,
    required this.distance,
    required this.priceRange,
    required this.isFavorite,
    this.onFavoriteTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    Widget gradient({Widget? child}) => Container(
          height: 140,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [colors.primary, colors.primaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: child,
        );

    return Stack(
      children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            height: 140,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (context, url) => gradient(),
            errorWidget: (context, url, error) =>
                gradient(child: const Center(child: Icon(Icons.spa_outlined, size: 40, color: Colors.white24))),
          ),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: CardBadge(
            text: distance,
            background: Colors.white.withValues(alpha: 0.92),
            textColor: const Color(0xFF1A1023),
          ),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: GestureDetector(
            onTap: onFavoriteTap,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isFavorite ? Icons.favorite : Icons.favorite_border,
                size: 18,
                color: isFavorite ? colors.primary : colors.textSecondary,
              ),
            ),
          ),
        ),
        if (priceRange.isNotEmpty)
          Positioned(
            bottom: 10,
            right: 10,
            child: CardBadge(
              text: priceRange,
              background: colors.primary.withValues(alpha: 0.9),
              textColor: Colors.white,
            ),
          ),
      ],
    );
  }
}
