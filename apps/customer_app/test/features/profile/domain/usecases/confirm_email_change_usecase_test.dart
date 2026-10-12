import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/profile/domain/repositories/user_repository.dart';
import 'package:customer_app/features/profile/domain/usecases/confirm_email_change_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late ConfirmEmailChangeUseCase sut;
  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
    sut = ConfirmEmailChangeUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.confirmEmailChange(token: any(named: 'token')))
        .thenAnswer((_) async => Right(unit));

    final result = await sut(token: '123456');

    expect(result, Right(unit));
    verify(() => mockRepo.confirmEmailChange(token: '123456')).called(1);
  });

  test('kod süresi dolmuş: Left(ServerFailure) döner', () async {
    when(() => mockRepo.confirmEmailChange(token: any(named: 'token')))
        .thenAnswer((_) async => const Left(ServerFailure('Doğrulama kodunun süresi dolmuş')));

    final result = await sut(token: '123456');

    expect(result.fold((f) => f, (_) => null), isA<ServerFailure>());
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.confirmEmailChange(token: any(named: 'token')))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(token: '123456');

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
