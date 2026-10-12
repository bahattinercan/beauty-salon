import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/notification_repository.dart';

@injectable
class MarkNotificationReadUseCase {
  final NotificationRepository _repository;
  MarkNotificationReadUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String id) => _repository.markAsRead(id);
}
