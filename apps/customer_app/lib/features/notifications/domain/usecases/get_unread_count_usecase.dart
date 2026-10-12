import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/notification_repository.dart';

@injectable
class GetUnreadCountUseCase {
  final NotificationRepository _repository;
  GetUnreadCountUseCase(this._repository);

  Future<Either<Failure, int>> call() => _repository.getUnreadCount();
}
