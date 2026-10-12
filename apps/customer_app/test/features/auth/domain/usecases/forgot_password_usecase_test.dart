import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/domain/usecases/forgot_password_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late ForgotPasswordUseCase sut;
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = ForgotPasswordUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.forgotPassword(any()))
        .thenAnswer((_) async => const Right(unit));

    final result = await sut('a@b.com');

    expect(result, const Right(unit));
    verify(() => mockRepo.forgotPassword('a@b.com')).called(1);
  });

  test('repository hata döndüğünde Left(ServerFailure) döner', () async {
    when(() => mockRepo.forgotPassword(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Email not found')));

    final result = await sut('a@b.com');

    expect(result, const Left(ServerFailure('Email not found')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.forgotPassword(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut('a@b.com');

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.forgotPassword(any()))
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    final result = await sut('a@b.com');

    expect(result.fold((f) => f, (_) => null), isA<UnauthorizedFailure>());
  });
}
