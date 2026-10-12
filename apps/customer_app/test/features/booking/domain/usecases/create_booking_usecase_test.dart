import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:customer_app/features/booking/domain/usecases/create_booking_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockBookingRepository extends Mock implements BookingRepository {}

void main() {
  late CreateBookingUseCase sut;
  late MockBookingRepository mockRepo;

  setUp(() {
    mockRepo = MockBookingRepository();
    sut = CreateBookingUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(appointmentId) döner', () async {
    when(() => mockRepo.createBooking(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
      startTime: any(named: 'startTime'),
      note: any(named: 'note'),
    )).thenAnswer((_) async => const Right('a1'));

    final result = await sut(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
      note: 'not',
    );

    expect(result, const Right('a1'));
    verify(() => mockRepo.createBooking(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
      note: 'not',
    )).called(1);
  });

  test('staffId ve note verilmezse null olarak iletilir', () async {
    when(() => mockRepo.createBooking(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
      startTime: any(named: 'startTime'),
      note: any(named: 'note'),
    )).thenAnswer((_) async => const Right('a1'));

    await sut(
      salonId: 's1',
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
    );

    verify(() => mockRepo.createBooking(
      salonId: 's1',
      staffId: null,
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
      note: null,
    )).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.createBooking(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
      startTime: any(named: 'startTime'),
      note: any(named: 'note'),
    )).thenAnswer((_) async => const Left(ServerFailure('Slot dolu')));

    final result = await sut(
      salonId: 's1',
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
    );

    expect(result, const Left(ServerFailure('Slot dolu')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.createBooking(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
      startTime: any(named: 'startTime'),
      note: any(named: 'note'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(
      salonId: 's1',
      serviceId: 'sv1',
      date: '2026-01-01',
      startTime: '10:00',
    );

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
