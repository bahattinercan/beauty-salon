import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/appointments/domain/repositories/appointments_repository.dart';
import 'package:customer_app/features/appointments/domain/usecases/cancel_appointment_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAppointmentsRepository extends Mock implements AppointmentsRepository {}

void main() {
  late CancelAppointmentUseCase sut;
  late MockAppointmentsRepository mockRepo;

  setUp(() {
    mockRepo = MockAppointmentsRepository();
    sut = CancelAppointmentUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.cancelAppointment(any()))
        .thenAnswer((_) async => const Right(unit));

    final result = await sut('a1');

    expect(result, const Right(unit));
    verify(() => mockRepo.cancelAppointment('a1')).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.cancelAppointment(any()))
        .thenAnswer((_) async => const Left(ServerFailure('Bu randevu üzerinde işlem yapılamaz')));

    expect(
      await sut('a1'),
      const Left(ServerFailure('Bu randevu üzerinde işlem yapılamaz')),
    );
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.cancelAppointment(any()))
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut('a1').then((r) => r.fold((f) => f, (_) => null)),
        isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.cancelAppointment(any()))
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    expect(await sut('a1').then((r) => r.fold((f) => f, (_) => null)),
        isA<UnauthorizedFailure>());
  });

  test('boş id edge case: repositoryye olduğu gibi iletilir', () async {
    when(() => mockRepo.cancelAppointment(any()))
        .thenAnswer((_) async => const Right(unit));

    await sut('');

    verify(() => mockRepo.cancelAppointment('')).called(1);
  });
}
