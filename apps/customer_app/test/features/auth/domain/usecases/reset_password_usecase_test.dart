import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/domain/usecases/reset_password_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late ResetPasswordUseCase sut;
  late MockAuthRepository mockRepo;

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = ResetPasswordUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner ve parametreler iletilir', () async {
    when(() => mockRepo.resetPassword(
      email: any(named: 'email'),
      token: any(named: 'token'),
      newPassword: any(named: 'newPassword'),
    )).thenAnswer((_) async => const Right(unit));

    final result = await sut(
      email: 'a@b.com',
      token: '123456',
      newPassword: 'yeni-sifre',
    );

    expect(result, const Right(unit));
    verify(() => mockRepo.resetPassword(
      email: 'a@b.com',
      token: '123456',
      newPassword: 'yeni-sifre',
    )).called(1);
  });

  test('hatalı OTP için Left(ServerFailure) döner', () async {
    when(() => mockRepo.resetPassword(
      email: any(named: 'email'),
      token: any(named: 'token'),
      newPassword: any(named: 'newPassword'),
    )).thenAnswer((_) async => const Left(ServerFailure('Invalid OTP')));

    final result = await sut(
      email: 'a@b.com',
      token: '000000',
      newPassword: 'yeni-sifre',
    );

    expect(result, const Left(ServerFailure('Invalid OTP')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.resetPassword(
      email: any(named: 'email'),
      token: any(named: 'token'),
      newPassword: any(named: 'newPassword'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(
      email: 'a@b.com',
      token: '123456',
      newPassword: 'yeni-sifre',
    );

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.resetPassword(
      email: any(named: 'email'),
      token: any(named: 'token'),
      newPassword: any(named: 'newPassword'),
    )).thenAnswer((_) async => const Left(UnauthorizedFailure()));

    final result = await sut(
      email: 'a@b.com',
      token: '123456',
      newPassword: 'yeni-sifre',
    );

    expect(result.fold((f) => f, (_) => null), isA<UnauthorizedFailure>());
  });
}
