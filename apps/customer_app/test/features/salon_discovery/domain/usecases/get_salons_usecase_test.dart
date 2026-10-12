import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon_filter.dart';
import 'package:customer_app/features/salon_discovery/domain/repositories/salons_repository.dart';
import 'package:customer_app/features/salon_discovery/domain/usecases/get_salons_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSalonsRepository extends Mock implements SalonsRepository {}

void main() {
  late GetSalonsUseCase sut;
  late MockSalonsRepository mockRepo;

  // mocktail `any()` için örnek değer gerekli (SalonFilter özel bir tip).
  setUpAll(() => registerFallbackValue(const SalonFilter()));

  const tSalon = Salon(
    id: '1',
    name: 'Salon A',
    address: 'Adres',
    ratingAvg: 4.5,
    reviewCount: 10,
    priceRange: 2,
  );

  setUp(() {
    mockRepo = MockSalonsRepository();
    sut = GetSalonsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<Salon>) döner', () async {
    when(() => mockRepo.getSalons(any()))
        .thenAnswer((_) async => const Right([tSalon]));

    const filter = SalonFilter(search: 'saç');
    final result = await sut(filter);

    expect(result, const Right([tSalon]));
    verify(() => mockRepo.getSalons(filter)).called(1);
  });

  test('boş filtre backend’e aynı nesne olarak iletilir', () async {
    when(() => mockRepo.getSalons(any()))
        .thenAnswer((_) async => const Right(<Salon>[]));

    await sut(const SalonFilter());

    verify(() => mockRepo.getSalons(const SalonFilter())).called(1);
  });

  test('boş sonuç edge case: Right([]) döner', () async {
    when(() => mockRepo.getSalons(any()))
        .thenAnswer((_) async => const Right(<Salon>[]));

    final result = await sut(const SalonFilter(search: 'yok'));

    expect(result.fold((_) => null, (list) => list), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getSalons(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    final result = await sut(const SalonFilter());

    expect(result, const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getSalons(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(const SalonFilter());

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
