import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

@injectable
class RegisterUseCase {
  final AuthRepository _repository;
  RegisterUseCase(this._repository);

  Future<Either<Failure, User>> call({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) =>
      _repository.register(
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
      );
}
