import '../../domain/entities/notification_item.dart';

/// `GET /notifications` yanıtındaki tek kaydın ham karşılığı.
class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime? createdAt;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'SYSTEM',
    this.data,
    this.isRead = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        type: json['type']?.toString() ?? 'SYSTEM',
        data: json['data'] is Map ? Map<String, dynamic>.from(json['data'] as Map) : null,
        // Backend `is_read` (snake_case) kolonu döndürür; istemciye `isRead` adıyla
        // serileşiyor. İki biçim de kabul edilir.
        isRead: json['isRead'] as bool? ?? json['is_read'] as bool? ?? false,
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      );

  NotificationItem toEntity() => NotificationItem(
        id: id,
        title: title,
        body: body,
        type: type,
        data: data,
        isRead: isRead,
        createdAt: createdAt,
      );
}
