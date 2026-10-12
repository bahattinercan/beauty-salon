import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/profile/domain/entities/user_profile.dart';
import 'package:customer_app/features/profile/domain/repositories/user_repository.dart';
import 'package:customer_app/features/profile/domain/usecases/get_profile_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late GetProfileUseCase sut;
  late MockUserRepository mockRepo;

  const tProfile = UserProfile(id: '1', email: 'a@b.com', fullName: 'Ada', role: 'CUSTOMER');

  setUp(() {
    mockRepo = MockUserRepository();
    sut = GetProfileUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(UserProfile) döner', () async {
    when(() => mockRepo.getProfile()).thenAnswer((_) async => const Right(tProfile));

    final result = await sut();

    expect(result, const Right(tProfile));
    verify(() => mockRepo.getProfile()).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getProfile())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut(), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getProfile())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.getProfile())
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)),
        isA<UnauthorizedFailure>());
  });
}
