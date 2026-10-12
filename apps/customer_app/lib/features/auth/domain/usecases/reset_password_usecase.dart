import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

@injectable
class ResetPasswordUseCase {
  final AuthRepository _repository;
  ResetPasswordUseCase(this._repository);

  Future<Either<Failure, Unit>> call({
    required String email,
    required String token,
    required String newPassword,
  }) =>
      _repository.resetPassword(
        email: email,
        token: token,
        newPassword: newPassword,
      );
}
