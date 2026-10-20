import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/extensions/error_extensions.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../../../core/utils/snackbar.dart';
import '../providers/notifications_provider.dart';
import '../widgets/notification_list_body.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  /// `null` = Tümü, `false` = Okunmamış.
  bool? _filter;

  Future<void> _markAll() async {
    final s = S.of(context);
    final result = await ref.read(notificationsProvider(_filter).notifier).markAllAsRead();
    if (!mounted) return;

    result.fold(
      (failure) => showAppSnackBar(context, failure.message, isError: true),
      (_) => showAppSnackBar(context, s.markAllRead),
    );
  }

  Future<void> _markOne(String id) async {
    final result = await ref.read(notificationsProvider(_filter).notifier).markAsRead(id);
    if (!mounted) return;

    result.fold(
      (failure) => showAppSnackBar(context, failure.message, isError: true),
      (_) {},
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final async = ref.watch(notificationsProvider(_filter));

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.notificationsTitle),
        actions: [
          IconButton(
            onPressed: _markAll,
            tooltip: s.markAllRead,
            icon: const Icon(Icons.done_all),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                _FilterChip(label: s.filterAll, selected: _filter == null, onTap: () => setState(() => _filter = null)),
                const SizedBox(width: 8),
                _FilterChip(label: s.filterUnread, selected: _filter == false, onTap: () => setState(() => _filter = false)),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(notificationsProvider(_filter).notifier).refresh(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  switch (async) {
                    AsyncLoading() => const SkeletonList(count: 3, itemHeight: 70),
                    AsyncError(:final error) => ErrorState(
                        message: error.displayMessage,
                        onRetry: () => ref.invalidate(notificationsProvider(_filter)),
                      ),
                    AsyncData(:final value) => NotificationListBody(
                        page: value,
                        onTap: (id) => _markOne(id),
                        onLoadMore: () => ref.read(notificationsProvider(_filter).notifier).loadMore(),
                      ),
                  },
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? colors.primary : colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? colors.primary : colors.surfaceVariant),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? colors.onPrimary : colors.textPrimary,
          ),
        ),
      ),
    );
  }
}

