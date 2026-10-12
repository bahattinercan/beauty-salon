import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/notification_repository.dart';

@injectable
class MarkAllNotificationsReadUseCase {
  final NotificationRepository _repository;
  MarkAllNotificationsReadUseCase(this._repository);

  Future<Either<Failure, Unit>> call() => _repository.markAllAsRead();
}
