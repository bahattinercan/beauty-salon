import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/state_view.dart';
import '../providers/notification_providers.dart';
import '../widgets/notification_list_body.dart';

/// `/notifications` — okunmamış/okunmuş bildirim listesi.
///
/// Sayfalama müşteri uygulamasındaki desenle aynı: ilk sayfa + "daha fazla" ile
/// load-more, aşağı çekerek yenileme. Dokunulan bildirim okundu işaretlenir.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _markAsRead(BuildContext context, WidgetRef ref, String id) async {
    try {
      await ref.read(notificationFeedProvider.notifier).markAsRead(id);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e'), backgroundColor: AppColors.of(context).error),
      );
    }
  }

  Future<void> _markAllAsRead(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(notificationFeedProvider.notifier).markAllAsRead();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tüm bildirimler okundu olarak işaretlendi')),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e'), backgroundColor: AppColors.of(context).error),
      );
    }
  }

  Future<void> _loadMore(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(notificationFeedProvider.notifier).loadMore();
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e'), backgroundColor: AppColors.of(context).error),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final async = ref.watch(notificationFeedProvider);
    final hasUnread =
        async.asData?.value.items.any((n) => n.isUnread) ?? false;

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          if (hasUnread)
            IconButton(
              tooltip: 'Tümünü okundu işaretle',
              icon: const Icon(Icons.done_all),
              onPressed: () => _markAllAsRead(context, ref),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: c.primary,
        onRefresh: () => ref.read(notificationFeedProvider.notifier).refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            async.when(
              loading: () => const SkeletonList(count: 4, itemHeight: 88),
              error: (error, _) => Padding(
                padding: const EdgeInsets.only(top: 48),
                child: ErrorState(
                  message: '$error',
                  onRetry: () => ref.invalidate(notificationFeedProvider),
                ),
              ),
              data: (page) => NotificationListBody(
                page: page,
                onTap: (id) => _markAsRead(context, ref, id),
                onLoadMore: () => _loadMore(context, ref),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// AppBar'daki bildirim ikonu + okunmamış sayacı rozeti.
class NotificationBellButton extends ConsumerWidget {
  final VoidCallback? onPressed;

  const NotificationBellButton({super.key, this.onPressed});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final count = ref.watch(unreadNotificationCountProvider).asData?.value ?? 0;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          tooltip: 'Bildirimler',
          icon: Icon(Icons.notifications_outlined, color: c.onPrimary),
          onPressed: onPressed ?? () => context.push('/notifications'),
        ),
        if (count > 0)
          Positioned(
            right: 6,
            top: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              constraints: const BoxConstraints(minWidth: 18),
              decoration: BoxDecoration(
                color: c.accentLime,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: c.primary, width: 1.5),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: c.onAccentLime,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
