import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/extensions/error_extensions.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../../favorites/presentation/providers/favorites_provider.dart';
import '../providers/salon_detail_provider.dart';
import '../widgets/cover_header.dart';
import '../widgets/review_list_widget.dart';
import '../widgets/salon_info_section.dart';
import '../widgets/service_list_widget.dart';
import '../widgets/staff_list_widget.dart';
import '../widgets/tab_bar_delegate.dart';
import '../widgets/working_hours_section.dart';

class SalonDetailScreen extends ConsumerStatefulWidget {
  final String salonId;

  const SalonDetailScreen({super.key, required this.salonId});

  @override
  ConsumerState<SalonDetailScreen> createState() => _SalonDetailScreenState();
}

class _SalonDetailScreenState extends ConsumerState<SalonDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController tabController;

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final salonAsync = ref.watch(salonDetailProvider(widget.salonId));
    final isFavorite =
        ref.watch(favoritesProvider).asData?.value.contains(widget.salonId) ?? false;

    return Scaffold(
      body: salonAsync.when(
        loading: () => const SkeletonList(count: 3, itemHeight: 140),
        error: (e, _) => ErrorState(
          message: '${s.salonLoadFailed}: ${e.displayMessage}',
          onRetry: () => ref.invalidate(salonDetailProvider(widget.salonId)),
        ),
        data: (salon) => CustomScrollView(
          slivers: [
            CoverHeader(
              salon: salon,
              isFavorite: isFavorite,
              onBack: () => context.pop(),
              onFavorite: () =>
                  ref.read(favoritesProvider.notifier).toggle(widget.salonId),
              onShare: () => Share.share('${salon.name}\n${salon.address}'),
            ),
            SalonInfoSection(salon: salon),
            WorkingHoursSection(salon: salon),
            SliverPersistentHeader(
              pinned: true,
              delegate: TabBarDelegate(
                TabBar(
                  controller: tabController,
                  labelColor: colors.primary,
                  unselectedLabelColor: colors.textSecondary,
                  indicatorColor: colors.primary,
                  indicatorWeight: 3,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: [
                    Tab(text: s.salonTabServices),
                    Tab(text: s.salonTabStaff),
                    Tab(text: s.salonTabReviews),
                  ],
                ),
              ),
            ),
            SliverFillRemaining(
              child: TabBarView(
                controller: tabController,
                children: [
                  ServiceListWidget(services: salon.services),
                  StaffListWidget(staff: salon.staff),
                  ReviewListWidget(
                    salonId: widget.salonId,
                    ratingAvg: salon.ratingAvg,
                    reviewCount: salon.reviewCount,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: colors.shadowFloat,
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: () => context.pushNamed(
                RouteNames.booking, pathParameters: {'salonId': widget.salonId}),
            style: ElevatedButton.styleFrom(
              backgroundColor: colors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              s.appointmentsBook,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}
