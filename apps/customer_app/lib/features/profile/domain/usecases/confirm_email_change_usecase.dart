import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/user_repository.dart';

@injectable
class ConfirmEmailChangeUseCase {
  final UserRepository _repository;
  ConfirmEmailChangeUseCase(this._repository);

  Future<Either<Failure, Unit>> call({required String token}) =>
      _repository.confirmEmailChange(token: token);
}
