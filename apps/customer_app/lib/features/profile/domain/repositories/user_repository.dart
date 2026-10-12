import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user_profile.dart';

abstract class UserRepository {
  Future<Either<Failure, UserProfile>> getProfile();

  Future<Either<Failure, UserProfile>> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  });

  Future<Either<Failure, Unit>> requestEmailChange(String newEmail);
  Future<Either<Failure, Unit>> confirmEmailChange({required String token});
}
