import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_provider.dart';
import '../../data/datasources/notification_remote_datasource.dart';
import '../../data/repositories/notification_repository_impl.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/notification_repository.dart';
import '../../domain/usecases/get_notifications_usecase.dart';
import '../../domain/usecases/get_unread_notification_count_usecase.dart';
import '../../domain/usecases/mark_all_notifications_read_usecase.dart';
import '../../domain/usecases/mark_notification_read_usecase.dart';

/// salon_app'te DI konteyneri yok: katmanlar elle Provider ile bağlanır.
final notificationRemoteDataSourceProvider = Provider<NotificationRemoteDataSource>(
  (ref) => NotificationRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepositoryImpl(ref.watch(notificationRemoteDataSourceProvider)),
);

final getNotificationsUseCaseProvider = Provider<GetNotificationsUseCase>(
  (ref) => GetNotificationsUseCase(ref.watch(notificationRepositoryProvider)),
);

final getUnreadNotificationCountUseCaseProvider = Provider<GetUnreadNotificationCountUseCase>(
  (ref) => GetUnreadNotificationCountUseCase(ref.watch(notificationRepositoryProvider)),
);

final markNotificationReadUseCaseProvider = Provider<MarkNotificationReadUseCase>(
  (ref) => MarkNotificationReadUseCase(ref.watch(notificationRepositoryProvider)),
);

final markAllNotificationsReadUseCaseProvider = Provider<MarkAllNotificationsReadUseCase>(
  (ref) => MarkAllNotificationsReadUseCase(ref.watch(notificationRepositoryProvider)),
);

/// Sayfalı bildirim listesi (sayfa 1'den başlar, load-more ile büyür).
class NotificationFeedNotifier extends AsyncNotifier<NotificationPage> {
  static const int _limit = 20;

  @override
  Future<NotificationPage> build() => _fetch(1);

  Future<NotificationPage> _fetch(int page) =>
      ref.read(getNotificationsUseCaseProvider)(page: page, limit: _limit);

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(1));
  }

  /// Sonraki sayfayı mevcut listenin sonuna ekler.
  Future<void> loadMore() async {
    final current = state.asData?.value;
    if (current == null || !current.hasNextPage || current.loadingMore) return;

    state = AsyncData(current.copyWith(loadingMore: true));
    final next = await AsyncValue.guard(() => _fetch(current.page + 1));

    // Load-more hatası yüklenmiş kayıtları silmez: liste yerinde kalır, spinner
    // kapanır ve hata çağırana taşınır (ekran SnackBar gösterir).
    if (next.hasError) {
      state = AsyncData(current);
      Error.throwWithStackTrace(next.error!, next.stackTrace!);
    }
    state = AsyncData(_appended(current, next.requireValue));
  }

  NotificationPage _appended(NotificationPage current, NotificationPage next) =>
      NotificationPage(
        items: [...current.items, ...next.items],
        page: next.page,
        totalPages: next.totalPages,
        total: next.total,
      );

  /// Tek bildirimi okundu işaretler; başarıda yerel liste ve rozet güncellenir.
  Future<void> markAsRead(String id) async {
    final current = state.asData?.value;
    if (current != null && current.items.any((n) => n.id == id && n.isRead)) return;

    await ref.read(markNotificationReadUseCaseProvider)(id);
    final loaded = state.asData?.value;
    if (loaded != null) state = AsyncData(loaded.withRead(id));
    ref.invalidate(unreadNotificationCountProvider);
  }

  /// Tüm bildirimleri okundu işaretler.
  Future<void> markAllAsRead() async {
    await ref.read(markAllNotificationsReadUseCaseProvider)();
    final loaded = state.asData?.value;
    if (loaded != null) state = AsyncData(loaded.withAllRead());
    ref.invalidate(unreadNotificationCountProvider);
  }
}

final notificationFeedProvider =
    AsyncNotifierProvider<NotificationFeedNotifier, NotificationPage>(NotificationFeedNotifier.new);

/// AppBar rozeti: okunmamış bildirim sayısı.
class UnreadNotificationCountNotifier extends AsyncNotifier<int> {
  @override
  Future<int> build() => ref.read(getUnreadNotificationCountUseCaseProvider)();
}

final unreadNotificationCountProvider =
    AsyncNotifierProvider<UnreadNotificationCountNotifier, int>(UnreadNotificationCountNotifier.new);
