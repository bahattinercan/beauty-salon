import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/favorites/domain/repositories/favorites_repository.dart';
import 'package:customer_app/features/favorites/domain/usecases/get_favorite_ids_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockFavoritesRepository extends Mock implements FavoritesRepository {}

void main() {
  late GetFavoriteIdsUseCase sut;
  late MockFavoritesRepository mockRepo;

  setUp(() {
    mockRepo = MockFavoritesRepository();
    sut = GetFavoriteIdsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(Set<String>) döner', () async {
    when(() => mockRepo.getFavoriteIds())
        .thenAnswer((_) async => const Right({'s1', 's2'}));

    final result = await sut();

    expect(result, const Right({'s1', 's2'}));
    verify(() => mockRepo.getFavoriteIds()).called(1);
  });

  test('boş küme edge case: Right({}) döner', () async {
    when(() => mockRepo.getFavoriteIds())
        .thenAnswer((_) async => const Right(<String>{}));

    final result = await sut();

    expect(result.fold((_) => null, (set) => set), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getFavoriteIds())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut(), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getFavoriteIds())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)), isA<NetworkFailure>());
  });
}
