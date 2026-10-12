import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/favorites/domain/repositories/favorites_repository.dart';
import 'package:customer_app/features/favorites/domain/usecases/toggle_favorite_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockFavoritesRepository extends Mock implements FavoritesRepository {}

void main() {
  late ToggleFavoriteUseCase sut;
  late MockFavoritesRepository mockRepo;

  setUp(() {
    mockRepo = MockFavoritesRepository();
    sut = ToggleFavoriteUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.toggle(any())).thenAnswer((_) async => const Right(unit));

    final result = await sut('s1');

    expect(result, const Right(unit));
    verify(() => mockRepo.toggle('s1')).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.toggle(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut('s1'), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.toggle(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut('s1').then((r) => r.fold((f) => f, (_) => null)), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.toggle(any()))
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    expect(await sut('s1').then((r) => r.fold((f) => f, (_) => null)),
        isA<UnauthorizedFailure>());
  });

  test('boş id edge case: repositoryye olduğu gibi iletilir', () async {
    when(() => mockRepo.toggle(any())).thenAnswer((_) async => const Right(unit));

    await sut('');

    verify(() => mockRepo.toggle('')).called(1);
  });
}
