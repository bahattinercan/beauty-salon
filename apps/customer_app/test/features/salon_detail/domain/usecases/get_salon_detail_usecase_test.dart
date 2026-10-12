import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:customer_app/features/salon_detail/domain/repositories/salon_detail_repository.dart';
import 'package:customer_app/features/salon_detail/domain/usecases/get_salon_detail_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSalonDetailRepository extends Mock implements SalonDetailRepository {}

void main() {
  late GetSalonDetailUseCase sut;
  late MockSalonDetailRepository mockRepo;

  const tDetail = SalonDetail(
    id: '1',
    name: 'Salon A',
    address: 'Adres',
    ratingAvg: 4.5,
    reviewCount: 10,
    priceRange: 2,
  );

  setUp(() {
    mockRepo = MockSalonDetailRepository();
    sut = GetSalonDetailUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(SalonDetail) döner', () async {
    when(() => mockRepo.getSalonDetail(any())).thenAnswer((_) async => const Right(tDetail));

    final result = await sut('1');

    expect(result, const Right(tDetail));
    verify(() => mockRepo.getSalonDetail('1')).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getSalonDetail(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Salon not found')));

    final result = await sut('999');

    expect(result, const Left(ServerFailure('Salon not found')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getSalonDetail(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut('1');

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.getSalonDetail(any()))
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    final result = await sut('1');

    expect(result.fold((f) => f, (_) => null), isA<UnauthorizedFailure>());
  });

  test("boş salonId edge case: repositoryye olduğu gibi iletilir", () async {
    when(() => mockRepo.getSalonDetail(any())).thenAnswer((_) async => const Right(tDetail));

    await sut('');

    verify(() => mockRepo.getSalonDetail('')).called(1);
  });
}
