import '../../../../core/network/api_client.dart';
import '../../domain/entities/notification_page.dart';
import '../models/notification_model.dart';

/// Backend `/notifications` uçları.
///
/// Sözleşme (`apps/api/src/controllers/notification.controller.js`):
/// - `GET /notifications?page&limit&isRead` → `data: { data: [...], meta: { total, page, limit, totalPages } }`
/// - `GET /notifications/unread-count` → `data: { count }`
/// - `PATCH /notifications/:id/read`
/// - `PATCH /notifications/read-all`
abstract class NotificationRemoteDataSource {
  Future<NotificationPage> getNotifications({int page = 1, int limit = 20, bool? isRead});
  Future<int> getUnreadCount();
  Future<void> markAsRead(String id);
  Future<void> markAllAsRead();
}

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final ApiClient _client;

  const NotificationRemoteDataSourceImpl(this._client);

  @override
  Future<NotificationPage> getNotifications({int page = 1, int limit = 20, bool? isRead}) async {
    final res = await _client.dio.get(
      '/notifications',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (isRead != null) 'isRead': isRead.toString(),
      },
    );

    final payload = res.data is Map ? (res.data as Map)['data'] : null;
    final meta = payload is Map ? payload['meta'] : null;
    final raw = payload is Map
        ? (payload['data'] as List? ?? const [])
        : (payload as List? ?? const []);

    final items = raw
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>).toEntity())
        .toList();

    return NotificationPage(
      items: items,
      page: meta is Map ? (meta['page'] as num?)?.toInt() ?? page : page,
      totalPages: meta is Map ? (meta['totalPages'] as num?)?.toInt() ?? 1 : 1,
      total: meta is Map ? (meta['total'] as num?)?.toInt() ?? items.length : items.length,
    );
  }

  @override
  Future<int> getUnreadCount() async {
    final res = await _client.dio.get('/notifications/unread-count');
    final payload = res.data is Map ? (res.data as Map)['data'] : null;
    return payload is Map ? (payload['count'] as num?)?.toInt() ?? 0 : 0;
  }

  @override
  Future<void> markAsRead(String id) async {
    await _client.dio.patch('/notifications/$id/read');
  }

  @override
  Future<void> markAllAsRead() async {
    await _client.dio.patch('/notifications/read-all');
  }
}
