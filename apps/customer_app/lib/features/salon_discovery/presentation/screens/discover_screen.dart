import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/widgets/pill_bottom_nav.dart';
import '../../../../core/extensions/error_extensions.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon.dart';
import '../providers/categories_provider.dart';
import '../providers/discover_provider.dart';
import '../providers/location_provider.dart';
import '../providers/salons_provider.dart';
import '../widgets/category_chips.dart';
import '../widgets/discover_salon_card.dart';
import '../../../../core/widgets/state_view.dart';
import '../widgets/filter_sheet.dart';
import '../widgets/search_bar.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  final String? initialCategory;

  const DiscoverScreen({super.key, this.initialCategory});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  /// Yazarken canlı arama (eskiden yalnızca Enter ile filtreliyordu).
  void _onQueryChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      ref
          .read(discoverProvider(widget.initialCategory).notifier)
          .setQuery(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final notifier = ref.read(discoverProvider(widget.initialCategory).notifier);
    final state = ref.watch(discoverProvider(widget.initialCategory));
    final categories = ref.watch(categoriesProvider).asData?.value ?? const [];
    final location = ref.watch(locationProvider).asData?.value;
    final salonsAsync = ref.watch(salonsProvider(state.filter));
    final results = notifier.applyClientFilter(
        salonsAsync.asData?.value ?? const <Salon>[], location);

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: SearchField(
                      controller: _searchController,
                      onSubmit: notifier.setQuery,
                      onChanged: _onQueryChanged,
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () => showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => FilterSheet(
                        initial: state.filter,
                        onApply: (f) {
                          notifier.setFilter(f);
                          Navigator.pop(context);
                        },
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: state.filter.hasActiveFilters ? colors.primary : colors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: state.filter.hasActiveFilters ? colors.primary : colors.secondaryDark,
                        ),
                      ),
                      child: Icon(
                        Icons.tune,
                        size: 20,
                        color: state.filter.hasActiveFilters ? colors.onPrimary : colors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  Text(
                    '${results.length} ${s.discoverSalonsFound}',
                    style: TextStyle(fontSize: 13, color: colors.textSecondary),
                  ),
                  const Spacer(),
                  if (location == null && state.filter.maxDistanceKm > 0)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Text(
                        s.discoverLocationOff,
                        style: TextStyle(fontSize: 12, color: colors.textHint),
                      ),
                    ),
                  SortMenu(onSelected: notifier.setSort),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: CategoryChips(
                categories: categories,
                selectedId: state.filter.categoryId,
                onSelect: notifier.setCategory,
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: salonsAsync.when(
                loading: () => const SkeletonList(count: 4, itemHeight: 160),
                error: (e, _) => ErrorState(
                  message: e.displayMessage,
                  onRetry: () => ref.invalidate(salonsProvider(state.filter)),
                ),
                data: (_) => results.isEmpty
                    ? EmptyState(
                        message: s.discoverNoResults,
                        actionLabel: s.discoverClearFilters,
                        onAction: () {
                          _searchController.clear();
                          notifier.clear();
                        },
                      )
                    : GridView.builder(
                        // Alt boşluk: pill nav yüzen katman (extendBody).
                      padding: EdgeInsets.fromLTRB(
                          20, 8, 20, PillBottomNav.insetOf(context)),
                        // Geniş ekranda 2 kolon kartları devasa yapıyordu
                        // (1280px'te ~620x830 kutu, boş gövde).
                        // Oran yerine mainAxisExtent: kart 4/5 görsel + gövde
                        // yüksekliğini kendisi bildiriyor, böylece hücre ile
                        // kart birebir aynı (liste zıplaması / taşma yok).
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: _gridColumns(context),
                          mainAxisExtent: DiscoverSalonCard.extentFor(
                            _gridCardWidth(context),
                          ),
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: results.length,
                        itemBuilder: (_, i) => DiscoverSalonCard(salon: results[i]),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Telefon 2 kolon; tablet/masaüstünde kartlar aşırı büyümesin diye artırılır.
  int _gridColumns(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width >= 1100) return 4;
    if (width >= 800) return 3;
    return 2;
  }

  /// Tek kartın genişliği: ekran - GridView kenar dolgusu (2x20) - aralıklar.
  /// Grid hücresi ile kart yüksekliğinin eşitlenmesi için gerekiyor.
  double _gridCardWidth(BuildContext context) {
    final columns = _gridColumns(context);
    return (MediaQuery.sizeOf(context).width - 40 - 12 * (columns - 1)) /
        columns;
  }
}
