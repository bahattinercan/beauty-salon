import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/usecases/get_profile_usecase.dart';
import '../../domain/usecases/update_profile_usecase.dart';

class UserNotifier extends AsyncNotifier<UserProfile?> {
  @override
  Future<UserProfile?> build() async {
    final result = await getIt<GetProfileUseCase>()();
    return result.fold((_) => null, (profile) => profile);
  }

  Future<Either<Failure, UserProfile>> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    final result = await getIt<UpdateProfileUseCase>()(
      fullName: fullName,
      phone: phone,
      avatarUrl: avatarUrl,
    );
    result.fold((_) => null, (updated) => state = AsyncData(updated));
    return result;
  }
}

final userProvider = AsyncNotifierProvider<UserNotifier, UserProfile?>(
  UserNotifier.new,
);
