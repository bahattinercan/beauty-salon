import 'package:fpdart/fpdart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/usecases/get_notifications_usecase.dart';
import '../../domain/usecases/get_unread_count_usecase.dart';
import '../../domain/usecases/mark_all_notifications_read_usecase.dart';
import '../../domain/usecases/mark_notification_read_usecase.dart';

/// Sayfalı bildirim listesi. Key `isRead`: `null` = Tümü, `false` = Okunmamış.
class NotificationsNotifier extends AsyncNotifier<NotificationPage> {
  final bool? isRead;
  NotificationsNotifier(this.isRead);

  @override
  Future<NotificationPage> build() => _fetch(1);

  Future<NotificationPage> _fetch(int page) async {
    final result = await getIt<GetNotificationsUseCase>()(page: page, isRead: isRead);
    return result.fold((failure) => throw failure, (page) => page);
  }

  Future<void> loadMore() async {
    final current = state.asData?.value;
    if (current == null || !current.hasNextPage || current.loadingMore) return;

    state = AsyncData(current.copyWith(loadingMore: true));
    final next = await _fetch(current.page + 1);
    state = AsyncData(NotificationPage(
      items: [...current.items, ...next.items],
      page: next.page,
      totalPages: next.totalPages,
      total: next.total,
    ));
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(1));
  }

  Future<Either<Failure, Unit>> markAsRead(String id) async {
    final result = await getIt<MarkNotificationReadUseCase>()(id);
    result.fold((_) => null, (_) {
      final current = state.asData?.value;
      if (current != null) state = AsyncData(current.withRead(id));
      ref.invalidate(unreadCountProvider);
    });
    return result;
  }

  Future<Either<Failure, Unit>> markAllAsRead() async {
    final result = await getIt<MarkAllNotificationsReadUseCase>()();
    result.fold((_) => null, (_) {
      final current = state.asData?.value;
      if (current != null) state = AsyncData(current.withAllRead());
      ref.invalidate(unreadCountProvider);
    });
    return result;
  }
}

final notificationsProvider =
    AsyncNotifierProvider.family<NotificationsNotifier, NotificationPage, bool?>(
      NotificationsNotifier.new,
    );

/// Profil menüsündeki kırmızı badge bu provider'dan okunur.
class UnreadCountNotifier extends AsyncNotifier<int> {
  @override
  Future<int> build() async {
    final result = await getIt<GetUnreadCountUseCase>()();
    return result.fold((failure) => throw failure, (count) => count);
  }
}

final unreadCountProvider =
    AsyncNotifierProvider<UnreadCountNotifier, int>(UnreadCountNotifier.new);
