import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/notification_page.dart';
import '../models/notification_model.dart';

abstract class NotificationRemoteDataSource {
  Future<NotificationPage> getNotifications({
    int page,
    int limit,
    bool? isRead,
  });
  Future<int> getUnreadCount();
  Future<void> markAsRead(String id);
  Future<void> markAllAsRead();
}

@Injectable(as: NotificationRemoteDataSource)
class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final ApiClient _apiClient;
  NotificationRemoteDataSourceImpl(this._apiClient);

  @override
  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    bool? isRead,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.notifications,
      queryParameters: {
        'page': page,
        'limit': limit,
        'isRead': ?isRead,
      },
    );

    // Backend sayfalı yanıt veriyor: data.data = liste, data.meta = sayfa bilgisi.
    final payload = response.data['data'];
    final meta = payload is Map ? payload['meta'] : null;
    final raw = payload is Map
        ? (payload['data'] as List? ?? const [])
        : (payload as List? ?? const []);

    final items = raw
        .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>).toEntity())
        .toList();

    return NotificationPage(
      items: items,
      page: meta is Map ? (meta['page'] as int? ?? page) : page,
      totalPages: meta is Map ? (meta['totalPages'] as int? ?? 1) : 1,
      total: meta is Map ? (meta['total'] as int? ?? items.length) : items.length,
    );
  }

  @override
  Future<int> getUnreadCount() async {
    final response = await _apiClient.get(ApiConstants.notificationsUnreadCount);
    final payload = response.data['data'];
    return (payload is Map ? payload['count'] : null) as int? ?? 0;
  }

  @override
  Future<void> markAsRead(String id) async {
    await _apiClient.patch(ApiConstants.notificationRead(id));
  }

  @override
  Future<void> markAllAsRead() async {
    await _apiClient.patch(ApiConstants.notificationsReadAll);
  }
}
