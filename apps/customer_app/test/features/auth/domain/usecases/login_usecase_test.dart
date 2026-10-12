import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/entities/user.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/domain/usecases/login_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LoginUseCase sut;
  late MockAuthRepository mockRepo;

  const tUser = User(id: '1', email: 'a@b.com', fullName: 'Ada');

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = LoginUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(User) döner', () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => const Right(tUser));

    final result = await sut('a@b.com', 'secret');

    expect(result, const Right(tUser));
    verify(() => mockRepo.login('a@b.com', 'secret')).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => const Left(ServerFailure('Bad credentials')));

    final result = await sut('a@b.com', 'wrong');

    expect(result, const Left(ServerFailure('Bad credentials')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut('a@b.com', 'secret');

    expect(result.isLeft(), isTrue);
    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    final result = await sut('a@b.com', 'secret');

    expect(result.fold((f) => f, (_) => null), isA<UnauthorizedFailure>());
  });

  test("boş e-posta ile çağrıldığında repository'ye olduğu gibi iletilir", () async {
    when(() => mockRepo.login(any(), any()))
        .thenAnswer((_) async => const Right(tUser));

    await sut('', '');

    verify(() => mockRepo.login('', '')).called(1);
  });
}
