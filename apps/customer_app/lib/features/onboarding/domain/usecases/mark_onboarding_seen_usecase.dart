import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error/failures.dart';
import '../repositories/onboarding_repository.dart';

@injectable
class MarkOnboardingSeenUseCase {
  final OnboardingRepository _repository;
  MarkOnboardingSeenUseCase(this._repository);

  Future<Either<Failure, void>> call() => _repository.markSeen();
}
