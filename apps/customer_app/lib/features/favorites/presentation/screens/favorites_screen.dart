import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
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
        loading: () => const SkeletonList(count: 4, itemHeight: 140),
        error: (e, _) => ErrorState(
          message: '${s.error}: $e',
          onRetry: () =>
              ref.read(salonsProvider(const SalonFilter()).notifier).refresh(),
        ),
        data: (salons) {
          final favorites = salons.where((salon) => favoriteIds.contains(salon.id)).toList();

          if (favorites.isEmpty) {
            return EmptyState(
              message: s.favoritesEmpty,
              subMessage: s.favoritesEmptySub,
              icon: Icons.favorite_border,
              actionLabel: s.favoritesExplore,
              onAction: () => context.goNamed(RouteNames.discover),
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
