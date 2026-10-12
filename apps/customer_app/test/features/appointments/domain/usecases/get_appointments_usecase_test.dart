import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/appointments/domain/entities/appointment.dart';
import 'package:customer_app/features/appointments/domain/repositories/appointments_repository.dart';
import 'package:customer_app/features/appointments/domain/usecases/get_appointments_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockAppointmentsRepository extends Mock implements AppointmentsRepository {}

void main() {
  late GetAppointmentsUseCase sut;
  late MockAppointmentsRepository mockRepo;

  const tAppointment = Appointment(
    id: 'a1',
    date: '2026-01-01',
    startTime: '10:00',
    endTime: '11:00',
    status: 'PENDING',
    salon: AppointmentSalon(id: 's1', name: 'Salon A'),
  );

  setUp(() {
    mockRepo = MockAppointmentsRepository();
    sut = GetAppointmentsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<Appointment>) döner', () async {
    when(() => mockRepo.getMyAppointments())
        .thenAnswer((_) async => const Right([tAppointment]));

    final result = await sut();

    expect(result, const Right([tAppointment]));
    verify(() => mockRepo.getMyAppointments()).called(1);
  });

  test('boş liste edge case: Right([]) döner', () async {
    when(() => mockRepo.getMyAppointments())
        .thenAnswer((_) async => const Right(<Appointment>[]));

    final result = await sut();

    expect(result.fold((_) => null, (list) => list), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getMyAppointments())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut(), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getMyAppointments())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)), isA<NetworkFailure>());
  });

  test('UnauthorizedFailure durumunda Left(UnauthorizedFailure) döner', () async {
    when(() => mockRepo.getMyAppointments())
        .thenAnswer((_) async => const Left(UnauthorizedFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)),
        isA<UnauthorizedFailure>());
  });
}
