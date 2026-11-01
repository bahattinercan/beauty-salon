import '../entities/notification_page.dart';

/// Bildirim akışı sözleşmesi. Hatalar `NotificationFailure` olarak fırlatılır.
abstract class NotificationRepository {
  /// Sayfalı liste. `isRead` verilirse sunucu tarafında filtrelenir.
  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    bool? isRead,
  });

  /// Okunmamış bildirim sayısı (rozet için).
  Future<int> getUnreadCount();

  /// Tek bildirimi okundu işaretle.
  Future<void> markAsRead(String id);

  /// Tüm bildirimleri okundu işaretle.
  Future<void> markAllAsRead();
}
