import '../../domain/repositories/notification_repository.dart';

class GetUnreadNotificationCountUseCase {
  final NotificationRepository _repository;

  const GetUnreadNotificationCountUseCase(this._repository);

  Future<int> call() => _repository.getUnreadCount();
}
