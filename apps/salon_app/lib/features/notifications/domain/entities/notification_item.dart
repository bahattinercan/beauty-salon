/// Tek bildirim.
///
/// `type` backend ENUM'undan gelir: APPOINTMENT, REVIEW, ORDER, SYSTEM.
/// Domain katmanı Flutter'a erişmez; ikon/etiket eşlemesi presentation'da yapılır.
class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;

  /// Backend `createdAt` alanı; bozuk/eksikse `null` kalır.
  final DateTime? createdAt;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'SYSTEM',
    this.data,
    this.isRead = false,
    this.createdAt,
  });

  bool get isUnread => !isRead;

  NotificationItem copyWith({bool? isRead}) => NotificationItem(
        id: id,
        title: title,
        body: body,
        type: type,
        data: data,
        isRead: isRead ?? this.isRead,
        createdAt: createdAt,
      );
}
