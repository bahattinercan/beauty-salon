import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/service_category.dart';
import 'package:customer_app/features/salon_discovery/domain/repositories/categories_repository.dart';
import 'package:customer_app/features/salon_discovery/domain/usecases/get_categories_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockCategoriesRepository extends Mock implements CategoriesRepository {}

void main() {
  late GetCategoriesUseCase sut;
  late MockCategoriesRepository mockRepo;

  const tCategory = ServiceCategory(
    id: 'c1',
    name: 'Saç',
    iconName: 'content_cut',
    sortOrder: 1,
  );

  setUp(() {
    mockRepo = MockCategoriesRepository();
    sut = GetCategoriesUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<ServiceCategory>) döner', () async {
    when(() => mockRepo.getCategories())
        .thenAnswer((_) async => const Right([tCategory]));

    final result = await sut();

    expect(result, const Right([tCategory]));
    verify(() => mockRepo.getCategories()).called(1);
  });

  test('boş kategori listesi edge case: Right([]) döner', () async {
    when(() => mockRepo.getCategories())
        .thenAnswer((_) async => const Right(<ServiceCategory>[]));

    final result = await sut();

    expect(result.fold((_) => null, (list) => list), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getCategories())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    final result = await sut();

    expect(result, const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getCategories())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut();

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
