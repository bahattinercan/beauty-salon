import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/user_repository.dart';

@injectable
class RequestEmailChangeUseCase {
  final UserRepository _repository;
  RequestEmailChangeUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String newEmail) =>
      _repository.requestEmailChange(newEmail);
}
