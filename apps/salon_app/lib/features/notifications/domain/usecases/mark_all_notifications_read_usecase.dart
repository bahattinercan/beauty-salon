import '../../domain/repositories/notification_repository.dart';

class MarkAllNotificationsReadUseCase {
  final NotificationRepository _repository;

  const MarkAllNotificationsReadUseCase(this._repository);

  Future<void> call() => _repository.markAllAsRead();
}
