import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';
import 'package:customer_app/features/salon_discovery/domain/repositories/salons_repository.dart';
import 'package:customer_app/features/salon_discovery/domain/usecases/get_nearby_salons_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSalonsRepository extends Mock implements SalonsRepository {}

void main() {
  late GetNearbySalonsUseCase sut;
  late MockSalonsRepository mockRepo;

  const tSalon = Salon(
    id: '1',
    name: 'Yakındaki Salon',
    address: 'Adres',
    ratingAvg: 4.5,
    reviewCount: 10,
    priceRange: 2,
    distance: 1.2,
  );

  setUp(() {
    mockRepo = MockSalonsRepository();
    sut = GetNearbySalonsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<Salon>) döner', () async {
    when(() => mockRepo.getNearbySalons(
      latitude: any(named: 'latitude'),
      longitude: any(named: 'longitude'),
      radius: any(named: 'radius'),
    )).thenAnswer((_) async => const Right([tSalon]));

    final result = await sut(latitude: 41.0, longitude: 28.9, radius: 10);

    expect(result, const Right([tSalon]));
    verify(() => mockRepo.getNearbySalons(
      latitude: 41.0,
      longitude: 28.9,
      radius: 10,
    )).called(1);
  });

  test('radius verilmezse varsayılan 10 iletilir', () async {
    when(() => mockRepo.getNearbySalons(
      latitude: any(named: 'latitude'),
      longitude: any(named: 'longitude'),
      radius: any(named: 'radius'),
    )).thenAnswer((_) async => const Right(<Salon>[]));

    await sut(latitude: 41.0, longitude: 28.9);

    verify(() => mockRepo.getNearbySalons(
      latitude: 41.0,
      longitude: 28.9,
      radius: 10,
    )).called(1);
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getNearbySalons(
      latitude: any(named: 'latitude'),
      longitude: any(named: 'longitude'),
      radius: any(named: 'radius'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(latitude: 41.0, longitude: 28.9);

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getNearbySalons(
      latitude: any(named: 'latitude'),
      longitude: any(named: 'longitude'),
      radius: any(named: 'radius'),
    )).thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(
      await sut(latitude: 41.0, longitude: 28.9),
      const Left(ServerFailure('Sunucu hatası')),
    );
  });
}
