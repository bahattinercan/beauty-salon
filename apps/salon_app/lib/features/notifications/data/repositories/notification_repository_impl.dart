import 'package:dio/dio.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/notification_failure.dart';
import '../../domain/repositories/notification_repository.dart';
import '../datasources/notification_remote_datasource.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource _remote;

  const NotificationRepositoryImpl(this._remote);

  @override
  Future<NotificationPage> getNotifications({int page = 1, int limit = 20, bool? isRead}) =>
      _guard(() => _remote.getNotifications(page: page, limit: limit, isRead: isRead));

  @override
  Future<int> getUnreadCount() => _guard(_remote.getUnreadCount);

  @override
  Future<void> markAsRead(String id) => _guard(() => _remote.markAsRead(id));

  @override
  Future<void> markAllAsRead() => _guard(_remote.markAllAsRead);

  /// Dio/parse hatalarını kullanıcıya gösterilebilir tek tipe indirger.
  Future<T> _guard<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on NotificationFailure {
      rethrow;
    } on DioException catch (e) {
      throw NotificationFailure(_message(e));
    } on TypeError {
      throw const NotificationFailure('Bildirim verisi okunamadı');
    }
  }

  String _message(DioException e) {
    final data = e.response?.data;
    final msg = data is Map ? data['message'] : null;
    if (msg is List) return msg.first.toString();
    if (msg != null) return msg.toString();
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.';
    }
    return 'Bildirimler yüklenemedi';
  }
}
