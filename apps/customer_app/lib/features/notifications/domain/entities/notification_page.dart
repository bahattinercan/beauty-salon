import 'notification_item.dart';

/// Bildirim sayfası. `page`/`totalPages`/`total` backend `meta`'sından gelir.
class NotificationPage {
  final List<NotificationItem> items;
  final int page;
  final int totalPages;
  final int total;

  /// Load-more isteği sürüyor mu — widget altında spinner gösterir.
  final bool loadingMore;

  const NotificationPage({
    required this.items,
    required this.page,
    required this.totalPages,
    this.total = 0,
    this.loadingMore = false,
  });

  bool get hasNextPage => page < totalPages;

  int get unreadCount => items.where((n) => !n.isRead).length;

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

  NotificationPage withAllRead() => NotificationPage(
        items: items.map((n) => n.copyWith(isRead: true)).toList(),
        page: page,
        totalPages: totalPages,
        total: total,
        loadingMore: loadingMore,
      );

  NotificationPage withRead(String id) => NotificationPage(
        items: items.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
        page: page,
        totalPages: totalPages,
        total: total,
        loadingMore: loadingMore,
      );
}
