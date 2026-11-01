import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/notification_repository.dart';

class GetNotificationsUseCase {
  final NotificationRepository _repository;

  const GetNotificationsUseCase(this._repository);

  Future<NotificationPage> call({int page = 1, int limit = 20, bool? isRead}) =>
      _repository.getNotifications(page: page, limit: limit, isRead: isRead);
}
