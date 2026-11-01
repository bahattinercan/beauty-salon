import '../../domain/repositories/notification_repository.dart';

class MarkNotificationReadUseCase {
  final NotificationRepository _repository;

  const MarkNotificationReadUseCase(this._repository);

  Future<void> call(String id) => _repository.markAsRead(id);
}
