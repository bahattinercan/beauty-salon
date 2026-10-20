import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/onboarding/domain/repositories/onboarding_repository.dart';
import 'package:customer_app/features/onboarding/domain/usecases/get_onboarding_seen_usecase.dart';
import 'package:customer_app/features/onboarding/domain/usecases/mark_onboarding_seen_usecase.dart';
import 'package:customer_app/features/onboarding/domain/usecases/reset_onboarding_seen_usecase.dart';
import 'package:fpdart/fpdart.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class _MockRepository extends Mock implements OnboardingRepository {}

void main() {
  late OnboardingRepository repo;

  setUp(() => repo = _MockRepository());

  group('GetOnboardingSeenUseCase', () {
    test('repository den okur', () async {
      when(() => repo.hasSeen()).thenAnswer((_) async => const Right(true));
      final result = await GetOnboardingSeenUseCase(repo)();
      expect(result, const Right(true));
      verify(() => repo.hasSeen()).called(1);
    });

    test('CacheFailure iletir', () async {
      when(() => repo.hasSeen())
          .thenAnswer((_) async => const Left(CacheFailure('okunamadı')));
      final result = await GetOnboardingSeenUseCase(repo)();
      expect(result.fold((f) => f, (_) => null), isA<CacheFailure>());
    });
  });

  group('MarkOnboardingSeenUseCase', () {
    test('başarıda Right(null)', () async {
      when(() => repo.markSeen()).thenAnswer((_) async => const Right(null));
      expect(await MarkOnboardingSeenUseCase(repo)(), const Right(null));
    });

    test('CacheFailure iletir', () async {
      when(() => repo.markSeen())
          .thenAnswer((_) async => const Left(CacheFailure('kaydedilemedi')));
      expect((await MarkOnboardingSeenUseCase(repo)()).isLeft(), isTrue);
    });
  });

  group('ResetOnboardingSeenUseCase', () {
    test('clearSeen çağırır', () async {
      when(() => repo.clearSeen()).thenAnswer((_) async => const Right(null));
      expect(await ResetOnboardingSeenUseCase(repo)(), const Right(null));
      verify(() => repo.clearSeen()).called(1);
    });

    test('CacheFailure iletir', () async {
      when(() => repo.clearSeen())
          .thenAnswer((_) async => const Left(CacheFailure('temizlenemedi')));
      expect((await ResetOnboardingSeenUseCase(repo)()).isLeft(), isTrue);
    });
  });
}
