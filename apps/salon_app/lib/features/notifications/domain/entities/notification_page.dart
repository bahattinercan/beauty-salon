import 'notification_item.dart';

/// Sayfalı bildirim listesi. `page`/`totalPages`/`total` backend `meta`'sından gelir.
class NotificationPage {
  final List<NotificationItem> items;
  final int page;
  final int totalPages;
  final int total;

  /// Load-more isteği sürüyor mu — listenin altında spinner gösterilir.
  final bool loadingMore;

  const NotificationPage({
    required this.items,
    required this.page,
    required this.totalPages,
    this.total = 0,
    this.loadingMore = false,
  });

  static const NotificationPage empty =
      NotificationPage(items: [], page: 1, totalPages: 1);

  bool get hasNextPage => page < totalPages;

  /// Yüklenen sayfadaki okunmamış bildirim sayısı.
  int get unreadCount => items.where((n) => n.isUnread).length;

  bool get isEmpty => items.isEmpty;

  NotificationPage copyWith({
    List<NotificationItem>? items,
    int? page,
    int? totalPages,
    int? total,
    bool? loadingMore,
  }) =>
      NotificationPage(
        items: items ?? this.items,
        page: page ?? this.page,
        totalPages: totalPages ?? this.totalPages,
        total: total ?? this.total,
        loadingMore: loadingMore ?? this.loadingMore,
      );

  /// Yerel durumu "tümü okundu"ya çeker (sunucu yanıtı beklenmeden).
  NotificationPage withAllRead() => copyWith(
        items: items.map((n) => n.copyWith(isRead: true)).toList(),
      );

  /// Yerel durumda tek bildirimi okundu yapar.
  NotificationPage withRead(String id) => copyWith(
        items: items.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
      );
}
