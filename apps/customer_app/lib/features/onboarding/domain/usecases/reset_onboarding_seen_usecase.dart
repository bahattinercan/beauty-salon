import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error/failures.dart';
import '../repositories/onboarding_repository.dart';

@injectable
class ResetOnboardingSeenUseCase {
  final OnboardingRepository _repository;
  ResetOnboardingSeenUseCase(this._repository);

  Future<Either<Failure, void>> call() => _repository.clearSeen();
}
