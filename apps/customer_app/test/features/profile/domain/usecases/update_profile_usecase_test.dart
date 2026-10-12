import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/profile/domain/entities/user_profile.dart';
import 'package:customer_app/features/profile/domain/repositories/user_repository.dart';
import 'package:customer_app/features/profile/domain/usecases/update_profile_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late UpdateProfileUseCase sut;
  late MockUserRepository mockRepo;

  const tProfile = UserProfile(id: '1', email: 'a@b.com', fullName: 'Ada', role: 'CUSTOMER');

  setUp(() {
    mockRepo = MockUserRepository();
    sut = UpdateProfileUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(UserProfile) döner', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Right(tProfile));

    final result = await sut(fullName: 'Yeni Ad', phone: '555');

    expect(result, const Right(tProfile));
    verify(() => mockRepo.updateProfile(fullName: 'Yeni Ad', phone: '555')).called(1);
  });

  test('parametre verilmezse null iletilir', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Right(tProfile));

    await sut();

    verify(() => mockRepo.updateProfile(fullName: null, phone: null)).called(1);
  });

  test('avatarUrl yalnızca avatar günceller (diğer alanlar null)', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
      avatarUrl: any(named: 'avatarUrl'),
    )).thenAnswer((_) async => const Right(tProfile));

    await sut(avatarUrl: 'https://cdn/x.jpg');

    verify(() => mockRepo.updateProfile(
      fullName: null,
      phone: null,
      avatarUrl: 'https://cdn/x.jpg',
    )).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Left(ServerFailure('Geersiz telefon')));

    expect(await sut(phone: 'x'), const Left(ServerFailure('Geersiz telefon')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(fullName: 'Ada');

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('CacheFailure durumunda Left(CacheFailure) döner', () async {
    when(() => mockRepo.updateProfile(
      fullName: any(named: 'fullName'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Left(CacheFailure('Önbellek hatası')));

    final result = await sut(fullName: 'Ada');

    expect(result.fold((f) => f, (_) => null), isA<CacheFailure>());
  });
}
