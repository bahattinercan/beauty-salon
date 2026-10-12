import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/salon_card.dart';
import '../../../salon_discovery/domain/entities/salon.dart';

class BannerHeader extends StatelessWidget {
  const BannerHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      decoration: BoxDecoration(
        gradient: colors.bannerGradient,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 52, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.homeWelcome,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.75),
                            letterSpacing: 0.3),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s.homeDiscover,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: -0.3),
                    ),
                  ],
                ),
              ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person, color: Colors.white, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () => context.goNamed(RouteNames.discover),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: colors.primaryDark.withValues(alpha: 0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(Icons.search, color: colors.textHint, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    s.homeSearchHintFull,
                    style: TextStyle(color: colors.textHint, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

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
      height: 260,
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
