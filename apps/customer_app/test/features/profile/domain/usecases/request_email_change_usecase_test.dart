import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/profile/domain/repositories/user_repository.dart';
import 'package:customer_app/features/profile/domain/usecases/request_email_change_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late RequestEmailChangeUseCase sut;
  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
    sut = RequestEmailChangeUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.requestEmailChange(any())).thenAnswer((_) async => Right(unit));

    final result = await sut('yeni@ornek.com');

    expect(result, Right(unit));
    verify(() => mockRepo.requestEmailChange('yeni@ornek.com')).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.requestEmailChange(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Bu e-posta zaten kullanımda')));

    final result = await sut('yeni@ornek.com');

    expect(result.fold((f) => f, (_) => null), isA<ServerFailure>());
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.requestEmailChange(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut('yeni@ornek.com');

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
