import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/domain/usecases/logout_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LogoutUseCase sut;
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = LogoutUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.logout()).thenAnswer((_) async => const Right(unit));

    final result = await sut();

    expect(result, const Right(unit));
    verify(() => mockRepo.logout()).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.logout())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    final result = await sut();

    expect(result, const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.logout())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut();

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.logout())
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    final result = await sut();

    expect(result.fold((f) => f, (_) => null), isA<UnauthorizedFailure>());
  });
}
