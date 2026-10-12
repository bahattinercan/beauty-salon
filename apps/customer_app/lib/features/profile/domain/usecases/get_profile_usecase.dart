import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_profile.dart';
import '../repositories/user_repository.dart';

@injectable
class GetProfileUseCase {
  final UserRepository _repository;
  GetProfileUseCase(this._repository);

  Future<Either<Failure, UserProfile>> call() => _repository.getProfile();
}
