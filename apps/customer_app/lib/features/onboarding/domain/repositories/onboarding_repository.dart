import 'package:fpdart/fpdart.dart';

import '../../../../core/error/failures.dart';

/// Onboarding'in bir kez gösterilip gösterilmediği (kalıcı bayrak).
///
/// Not: slayt içerikleri sunum katmanındadır (çeviri gerektirir); domain
/// yalnızca "gösterildi mi" bilgisini taşır.
abstract class OnboardingRepository {
  Future<Either<Failure, bool>> hasSeen();

  Future<Either<Failure, void>> markSeen();

  /// Profil > Ayarlar'daki "Tanıtımı tekrar göster" için.
  Future<Either<Failure, void>> clearSeen();
}
