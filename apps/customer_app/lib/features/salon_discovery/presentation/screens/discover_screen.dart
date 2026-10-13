import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
                    child: SearchField(controller: _searchController, onSubmit: notifier.setQuery),
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
                        color: state.filter.hasActiveFilters ? Colors.white : colors.primary,
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
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.75,
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
}
