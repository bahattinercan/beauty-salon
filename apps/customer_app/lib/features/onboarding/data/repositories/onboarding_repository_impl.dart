import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error/failures.dart';
import '../../domain/repositories/onboarding_repository.dart';
import '../datasources/onboarding_local_datasource.dart';

@Injectable(as: OnboardingRepository)
class OnboardingRepositoryImpl implements OnboardingRepository {
  final OnboardingLocalDataSource _local;
  OnboardingRepositoryImpl(this._local);

  @override
  Future<Either<Failure, bool>> hasSeen() async {
    try {
      return Right(await _local.readSeen());
    } catch (_) {
      return const Left(CacheFailure('Onboarding durumu okunamadı'));
    }
  }

  @override
  Future<Either<Failure, void>> markSeen() async {
    try {
      await _local.writeSeen(true);
      return const Right(null);
    } catch (_) {
      return const Left(CacheFailure('Onboarding durumu kaydedilemedi'));
    }
  }

  @override
  Future<Either<Failure, void>> clearSeen() async {
    try {
      await _local.writeSeen(false);
      return const Right(null);
    } catch (_) {
      return const Left(CacheFailure('Onboarding durumu temizlenemedi'));
    }
  }
}
