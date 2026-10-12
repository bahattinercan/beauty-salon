import '../../../../core/extensions/datetime_extensions.dart';

/// Bildirim. `type` backend ENUM'undan gelir: APPOINTMENT, REVIEW, ORDER, SYSTEM.
/// Domain katmanı l10n ve Flutter'a erişemez → ikon/etiket eşlemesi
/// presentation'da yapılır (CLAUDE.md §2).
class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String createdAt;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.data,
    this.isRead = false,
    required this.createdAt,
  });

  DateTime? get createdAtDate => DateTime.tryParse(createdAt);

  String get timeAgo => createdAtDate?.timeAgoTr ?? '';

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
