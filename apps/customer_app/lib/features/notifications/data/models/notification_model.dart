import '../../domain/entities/notification_item.dart';

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String createdAt;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.data,
    this.isRead = false,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        id: (json['id']?.toString()) ?? '',
        title: (json['title']?.toString()) ?? '',
        body: (json['body']?.toString()) ?? '',
        type: (json['type']?.toString()) ?? 'SYSTEM',
        data: json['data'] is Map
            ? Map<String, dynamic>.from(json['data'] as Map)
            : null,
        isRead: (json['isRead'] as bool?) ?? false,
        createdAt: (json['createdAt']?.toString()) ?? '',
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
