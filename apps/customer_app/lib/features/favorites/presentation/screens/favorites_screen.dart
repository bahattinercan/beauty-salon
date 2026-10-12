import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../salon_discovery/domain/entities/salon_filter.dart';
import '../../../salon_discovery/presentation/providers/salons_provider.dart';
import '../providers/favorites_provider.dart';
import '../widgets/favorite_salon_card.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final favoriteIds = ref.watch(favoritesProvider).asData?.value ?? {};
    final salonsAsync = ref.watch(salonsProvider(const SalonFilter()));

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.profileFavorites),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: salonsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('${s.error}: $e', style: TextStyle(color: colors.error)),
        ),
        data: (salons) {
          final favorites = salons.where((salon) => favoriteIds.contains(salon.id)).toList();

          if (favorites.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite_border, size: 72, color: colors.textHint),
                  const SizedBox(height: 16),
                  Text(
                    s.favoritesEmpty,
                    style: TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w600, color: colors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    s.favoritesEmptySub,
                    style: TextStyle(fontSize: 14, color: colors.textSecondary),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.goNamed(RouteNames.discover),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      s.favoritesExplore,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: favorites.length,
            itemBuilder: (context, index) {
              final salon = favorites[index];
              return FavoriteSalonCard(
                name: salon.name,
                address: salon.locationLabel,
                rating: salon.ratingAvg,
                reviewCount: salon.reviewCount,
                imageUrl: salon.coverImageUrl ?? salon.logoUrl,
                onTap: () => context.pushNamed(
                    RouteNames.salonDetail, pathParameters: {'id': salon.id}),
                onRemove: () {
                  ref.read(favoritesProvider.notifier).toggle(salon.id);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${salon.name} ${s.favoritesRemoved}'),
                      action: SnackBarAction(
                        label: s.favoritesUndo,
                        onPressed: () =>
                            ref.read(favoritesProvider.notifier).toggle(salon.id),
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
