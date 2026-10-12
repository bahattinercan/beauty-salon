import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/entities/user.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/domain/usecases/register_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late RegisterUseCase sut;
  late MockAuthRepository mockRepo;

  const tUser = User(id: '1', email: 'a@b.com', fullName: 'Ada');

  setUp(() {
    mockRepo = MockAuthRepository();
    sut = RegisterUseCase(mockRepo);
  });

  test('başarılı kayıtta Right(User) döner', () async {
    when(() => mockRepo.register(
      fullName: any(named: 'fullName'),
      email: any(named: 'email'),
      password: any(named: 'password'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Right(tUser));

    final result = await sut(
      fullName: 'Ada',
      email: 'a@b.com',
      password: 'secret',
      phone: '555',
    );

    expect(result, const Right(tUser));
    verify(() => mockRepo.register(
      fullName: 'Ada',
      email: 'a@b.com',
      password: 'secret',
      phone: '555',
    )).called(1);
  });

  test('phone verilmezse null olarak iletilir', () async {
    when(() => mockRepo.register(
      fullName: any(named: 'fullName'),
      email: any(named: 'email'),
      password: any(named: 'password'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Right(tUser));

    await sut(fullName: 'Ada', email: 'a@b.com', password: 'secret');

    verify(() => mockRepo.register(
      fullName: 'Ada',
      email: 'a@b.com',
      password: 'secret',
      phone: null,
    )).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.register(
      fullName: any(named: 'fullName'),
      email: any(named: 'email'),
      password: any(named: 'password'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Left(ServerFailure('Email already used')));

    final result = await sut(
      fullName: 'Ada',
      email: 'a@b.com',
      password: 'secret',
    );

    expect(result, const Left(ServerFailure('Email already used')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.register(
      fullName: any(named: 'fullName'),
      email: any(named: 'email'),
      password: any(named: 'password'),
      phone: any(named: 'phone'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(
      fullName: 'Ada',
      email: 'a@b.com',
      password: 'secret',
    );

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
