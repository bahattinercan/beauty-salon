import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../app/route_names.dart';
import '../../app/theme/app_colors.dart';
import 'salon_card_content.dart';
import 'salon_card_image.dart';

class SalonCard extends StatelessWidget {
  /// Yatay şeritte kart yüksekliği: medya + gövde toplamı.
  /// Eskiden şeritte sabit `260` tahmini kullanılıyordu; gövde ~90px tutunca
  /// kartın içinde (özellikle rating satırının altında) boşluk kalıyordu.
  static const double mediaHeight = 140;
  static const double contentHeight = 96; // ölçülen gövde: 93
  static double get preferredHeight => mediaHeight + contentHeight;

  final String id;
  final String name;
  final String imageUrl;
  final double rating;
  final int reviewCount;
  final String distance;
  final String priceRange;
  final String address;
  final String? phone;
  final List<String> tags;
  final bool isFavorite;
  final VoidCallback? onFavoriteTap;

  const SalonCard({
    super.key,
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.rating,
    required this.reviewCount,
    required this.distance,
    required this.priceRange,
    required this.address,
    this.phone,
    this.tags = const [],
    this.isFavorite = false,
    this.onFavoriteTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return GestureDetector(
      onTap: () =>
          context.pushNamed(RouteNames.salonDetail, pathParameters: {'id': id}),
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            SalonCardImage(
              imageUrl: imageUrl,
              distance: distance,
              priceRange: priceRange,
              isFavorite: isFavorite,
              onFavoriteTap: onFavoriteTap,
              seed: id,
              salonName: name,
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: colors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  InfoLine(icon: Icons.place_outlined, text: address),
                  if (phone != null && phone!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    InfoLine(
                      icon: Icons.phone_outlined,
                      text: phone!,
                      iconSize: 12,
                      fontSize: 11,
                    ),
                  ],
                  const SizedBox(height: 8),
                  RatingRow(rating: rating, reviewCount: reviewCount),
                  if (tags.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    TagChips(tags: tags),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
