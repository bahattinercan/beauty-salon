import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/notification_page.dart';
import '../repositories/notification_repository.dart';

@injectable
class GetNotificationsUseCase {
  final NotificationRepository _repository;
  GetNotificationsUseCase(this._repository);

  Future<Either<Failure, NotificationPage>> call({
    int page = 1,
    int limit = 20,
    bool? isRead,
  }) =>
      _repository.getNotifications(page: page, limit: limit, isRead: isRead);
}
