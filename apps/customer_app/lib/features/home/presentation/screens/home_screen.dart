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
import '../../../../core/widgets/salon_card.dart';
import '../../../../core/widgets/salon_card_shimmer.dart';
import '../../../favorites/presentation/providers/favorites_provider.dart';
import '../../../salon_discovery/domain/entities/salon.dart';
import '../../../salon_discovery/domain/entities/salon_filter.dart';
import '../../../salon_discovery/presentation/providers/categories_provider.dart';
import '../../../salon_discovery/presentation/providers/location_provider.dart';
import '../../../salon_discovery/presentation/providers/salons_provider.dart';
import '../widgets/banner_header.dart';
import '../widgets/category_circle_chip.dart';
import '../widgets/hero_promo_card.dart';
import '../widgets/location_notice.dart';
import '../widgets/salon_carousel.dart';
import '../widgets/section_header.dart';
import '../../../../app/widgets/pill_bottom_nav.dart';

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

    void toggleFavorite(Salon salon) =>
        ref.read(favoritesProvider.notifier).toggle(salon.id);

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        bottom: false, // alt boşluk pill yüksekliğiyle elle veriliyor
        child: CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: BannerHeader()),
            // Sıra (Booksy referansı): hero promo → kategoriler → yakındakiler.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: HeroPromoCard(
                  onTap: () => context.goNamed(RouteNames.discover),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 20, bottom: 4),
                child: SizedBox(
                  height: 92,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return CategoryCircleChip(
                          icon: Icons.apps,
                          label: s.catAll,
                          isSelected: selectedCategoryId == null,
                          onTap: () =>
                              setState(() => selectedCategoryId = null),
                        );
                      }
                      final category = categories[index - 1];
                      return CategoryCircleChip(
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
                    height: SalonCard.preferredHeight,
                    child: _SalonListShimmer(),
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
            // Pill nav yüzen katman olduğu için (extendBody) son satır onun
            // altında kalmasın: güvenli alan + pill yüksekliği.
            SliverToBoxAdapter(
              child: SizedBox(height: PillBottomNav.insetOf(context)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Yükleme iskeleti: şerit biçiminde üç kart.
class _SalonListShimmer extends StatelessWidget {
  const _SalonListShimmer();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: 3,
      itemBuilder: (_, _) => const Padding(
        padding: EdgeInsets.only(right: 16),
        child: SalonCardShimmer(),
      ),
    );
  }
}
