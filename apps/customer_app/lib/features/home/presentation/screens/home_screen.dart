import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/category_labels.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/widgets/category_icon.dart';
import '../../../../core/widgets/salon_card_shimmer.dart';
import '../../../favorites/presentation/providers/favorites_provider.dart';
import '../../../salon_discovery/domain/entities/salon.dart';
import '../../../salon_discovery/domain/entities/salon_filter.dart';
import '../../../salon_discovery/presentation/providers/categories_provider.dart';
import '../../../salon_discovery/presentation/providers/location_provider.dart';
import '../../../salon_discovery/presentation/providers/salons_provider.dart';
import '../widgets/banner_header.dart';
import '../widgets/category_chip.dart';
import '../widgets/section_header.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? selectedCategoryId;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final categories = ref.watch(categoriesProvider).asData?.value ?? const [];
    final favorites = ref.watch(favoritesProvider).asData?.value ?? {};
    final nearbyAsync = ref.watch(nearbySalonsProvider);
    // Konum reddedilirse bilgi satır içi gösterilir; eskiden kalıcı hale gelen
    // floating SnackBar alttaki aksiyon butonlarını (booking "Devam") kapatıyordu.
    final locationDenied =
        ref.watch(locationProvider).error is LocationPermissionDeniedFailure;
    final allSalons =
        ref.watch(salonsProvider(const SalonFilter())).asData?.value ?? [];
    final topRated = [...allSalons]
      ..sort((a, b) => b.ratingAvg.compareTo(a.ratingAvg));

    final hasNearby = nearbyAsync.asData?.value.isNotEmpty ?? false;
    final showNearbySection = nearbyAsync.isLoading || hasNearby;

    // Konum reddedildiyse kullanıcıyı satır içi bilgilendir: konum tek kaynaklı
    // (`locationProvider`), Home artık kendi başına izin istemiyor.

    void toggleFavorite(Salon salon) =>
        ref.read(favoritesProvider.notifier).toggle(salon.id);

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: BannerHeader()),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 24, bottom: 8),
                child: SizedBox(
                  height: 100,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return CategoryChip(
                          icon: Icons.apps,
                          label: s.catAll,
                          isSelected: selectedCategoryId == null,
                          onTap: () => setState(() => selectedCategoryId = null),
                        );
                      }
                      final category = categories[index - 1];
                      return CategoryChip(
                        icon: categoryIcon(category.iconName),
                        label: categoryLabel(s, category.name),
                        isSelected: selectedCategoryId == category.id,
                        onTap: () => context.goNamed(RouteNames.discover,
                            queryParameters: {'category': category.id}),
                      );
                    },
                  ),
                ),
              ),
            ),
            if (locationDenied)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: LocationNotice(
                    onOpenSettings: () =>
                        getIt<LocationService>().openAppSettings(),
                  ),
                ),
              ),
            if (showNearbySection) ...[
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: s.homeNearbySalons,
                  seeAllLabel: s.homeSeeAll,
                  onSeeAll: () => context.goNamed(RouteNames.discover),
                ),
              ),
              SliverToBoxAdapter(
                child: nearbyAsync.when(
                  loading: () => SizedBox(
                    height: 260,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: 3,
                      itemBuilder: (_, _) => const Padding(
                        padding: EdgeInsets.only(right: 16),
                        child: SalonCardShimmer(),
                      ),
                    ),
                  ),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (nearby) => nearby.isEmpty
                      ? const SizedBox.shrink()
                      : SalonCarousel(
                          items: nearby,
                          favoriteIds: favorites,
                          onFavorite: toggleFavorite,
                        ),
                ),
              ),
            ],
            if (topRated.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: s.homeTopReviewed,
                  seeAllLabel: s.homeSeeAll,
                  onSeeAll: () => context.goNamed(RouteNames.discover),
                ),
              ),
              SliverToBoxAdapter(
                child: SalonCarousel(
                  items: topRated.take(4).toList(),
                  favoriteIds: favorites,
                  onFavorite: toggleFavorite,
                  distanceOf: (salon) => salon.locationLabel,
                ),
              ),
            ],
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

/// Konum izni reddedildiğinde gösterilen satır içi bilgi kartı.
class LocationNotice extends StatelessWidget {
  final VoidCallback onOpenSettings;

  const LocationNotice({super.key, required this.onOpenSettings});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: colors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.warning.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.location_off_outlined, color: colors.warning, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              s.locationDeniedBody,
              style: TextStyle(fontSize: 13, color: colors.textPrimary),
            ),
          ),
          TextButton(
            onPressed: onOpenSettings,
            style: TextButton.styleFrom(foregroundColor: colors.primary),
            child: Text(
              s.profileSettings,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
