import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_profile.dart';
import '../repositories/user_repository.dart';

@injectable
class UpdateProfileUseCase {
  final UserRepository _repository;
  UpdateProfileUseCase(this._repository);

  Future<Either<Failure, UserProfile>> call({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) =>
      _repository.updateProfile(
        fullName: fullName,
        phone: phone,
        avatarUrl: avatarUrl,
      );
}
