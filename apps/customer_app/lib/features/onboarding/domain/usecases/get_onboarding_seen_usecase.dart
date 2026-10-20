import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error/failures.dart';
import '../repositories/onboarding_repository.dart';

@injectable
class GetOnboardingSeenUseCase {
  final OnboardingRepository _repository;
  GetOnboardingSeenUseCase(this._repository);

  Future<Either<Failure, bool>> call() => _repository.hasSeen();
}
