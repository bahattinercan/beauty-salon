import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/network/media_url.dart';
import '../../../../core/widgets/salon_card_content.dart';
import '../../../../core/widgets/salon_card_image.dart';
import '../../../favorites/presentation/providers/favorites_provider.dart';
import '../../domain/entities/salon.dart';

/// Discover grid kartı.
///
/// Eskiden görsel + rozet katmanı burada elle yazılmıştı (`core/widgets/
/// salon_card_image.dart` aynı işi yapıyordu — iki ayrı kopya). WP4'te tek
/// ortak medyaya bağlandı ve görsel oranı sabit 160px yerine **4/5**.
///
/// Ayrıca isim eskiden rozetlerle AYNI satırdaydı; dar 2 kolon kartta
/// "Rose…" / "Bella…" şeklinde kısalıyordu. Artık isim tam genişlikte,
/// rozetler görselin üzerinde.
class DiscoverSalonCard extends ConsumerWidget {
  final Salon salon;

  /// Grid hücresinin yüksekliğini hesaplamak için: medya oranı + gövde.
  static const double mediaAspectRatio = 4 / 5;
  static const double contentHeight = 96;

  static double extentFor(double cardWidth) =>
      cardWidth / mediaAspectRatio + contentHeight;

  const DiscoverSalonCard({super.key, required this.salon});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final isFavorite =
        ref.watch(favoritesProvider).asData?.value.contains(salon.id) ?? false;

    return GestureDetector(
      onTap: () => context.pushNamed(RouteNames.salonDetail,
          pathParameters: {'id': salon.id}),
      child: Container(
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
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            SalonCardImage(
              // Boş URL'de ağ isteği yapılmaz; SalonPlaceholder devreye girer.
              imageUrl: resolveMediaUrl(salon.coverImageUrl ?? salon.logoUrl ?? ''),
              distance: salon.distanceLabel,
              // Dar kartta "Kadıköy, İ…" yerine yalnızca ilçe; tam adres
              // gövde satırında zaten var.
              locationFallback: salon.locationLabel.split(',').first.trim(),
              priceRange: '',
              aspectRatio: mediaAspectRatio,
              isNew: salon.isNew,
              newBadgeLabel: s.newSalonBadge,
              // 0 yorumlu salon puan çipi göstermez.
              scoreLabel: salon.reviewCount > 0
                  ? salon.ratingAvg.toStringAsFixed(1)
                  : null,
              isFavorite: isFavorite,
              onFavoriteTap: () =>
                  ref.read(favoritesProvider.notifier).toggle(salon.id),
              seed: salon.id,
              salonName: salon.name,
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    salon.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.2,
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  InfoLine(
                    icon: Icons.place_outlined,
                    text: salon.address,
                    iconSize: 14,
                    fontSize: 12,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (salon.priceRangeLabel.isNotEmpty) ...[
                        Text(
                          salon.priceRangeLabel,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                            color: colors.primary,
                          ),
                        ),
                        Text(
                          '  •  ',
                          style: TextStyle(fontSize: 12, color: colors.textHint),
                        ),
                      ],
                      Expanded(
                        child: Text(
                          '${salon.reviewCount} ${s.discoverReviews}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            color: colors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
