import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/onboarding/data/datasources/onboarding_local_datasource.dart';
import 'package:customer_app/features/onboarding/data/repositories/onboarding_repository_impl.dart';
import 'package:fpdart/fpdart.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class _MockDataSource extends Mock implements OnboardingLocalDataSource {}

void main() {
  late OnboardingRepositoryImpl sut;
  late _MockDataSource local;

  setUp(() {
    local = _MockDataSource();
    sut = OnboardingRepositoryImpl(local);
  });

  group('hasSeen', () {
    test('bayrak true ise Right(true) döner', () async {
      when(() => local.readSeen()).thenAnswer((_) async => true);
      final result = await sut.hasSeen();
      expect(result, const Right(true));
    });

    test('ilk kurulumda Right(false) döner', () async {
      when(() => local.readSeen()).thenAnswer((_) async => false);
      expect(await sut.hasSeen(), const Right(false));
    });

    test('storage hatasında CacheFailure döner (istisna dışarı sızmaz)', () async {
      when(() => local.readSeen()).thenThrow(Exception('storage kapalı'));
      final result = await sut.hasSeen();
      expect(result.isLeft(), isTrue);
      expect(result.fold((f) => f, (_) => null), isA<CacheFailure>());
    });
  });

  group('markSeen', () {
    test('true yazar', () async {
      when(() => local.writeSeen(true)).thenAnswer((_) async {});
      expect(await sut.markSeen(), const Right(null));
      verify(() => local.writeSeen(true)).called(1);
    });

    test('yazma hatasında CacheFailure', () async {
      when(() => local.writeSeen(true)).thenThrow(Exception('yazılamadı'));
      expect((await sut.markSeen()).isLeft(), isTrue);
    });
  });

  test('clearSeen false yazar (tanıtımı tekrar göster)', () async {
    when(() => local.writeSeen(false)).thenAnswer((_) async {});
    expect(await sut.clearSeen(), const Right(null));
    verify(() => local.writeSeen(false)).called(1);
  });
}
