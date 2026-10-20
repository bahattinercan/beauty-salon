import 'package:flutter/material.dart';
import '../../../../core/widgets/salon_card.dart';
import '../../../salon_discovery/domain/entities/salon.dart';

/// Yatay salon şeridi.
///
/// `SalonCarousel` eskiden `banner_header.dart` içinde duruyordu (yanlış
/// yerleşim — banner ile alakası yok); WP3'te buraya taşındı.
class SalonCarousel extends StatelessWidget {
  final List<Salon> items;
  final Set<String> favoriteIds;
  final ValueChanged<Salon> onFavorite;
  final String Function(Salon) distanceOf;

  const SalonCarousel({
    super.key,
    required this.items,
    required this.favoriteIds,
    required this.onFavorite,
    this.distanceOf = _defaultDistance,
  });

  static String _defaultDistance(Salon s) => s.distanceLabel;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      // Kart gövdesi ~90px: sabit 260 yerine medya+gövde toplamı.
      height: SalonCard.preferredHeight,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final salon = items[index];
          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: SalonCard(
              id: salon.id,
              name: salon.name,
              address: salon.address,
              rating: salon.ratingAvg,
              reviewCount: salon.reviewCount,
              distance: distanceOf(salon),
              priceRange: salon.priceRangeLabel,
              imageUrl: salon.coverImageUrl ?? salon.logoUrl ?? '',
              isFavorite: favoriteIds.contains(salon.id),
              onFavoriteTap: () => onFavorite(salon),
            ),
          );
        },
      ),
    );
  }
}
