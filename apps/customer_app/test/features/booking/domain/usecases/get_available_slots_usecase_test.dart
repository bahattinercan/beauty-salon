import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/booking/domain/entities/booking_slot.dart';
import 'package:customer_app/features/booking/domain/repositories/booking_repository.dart';
import 'package:customer_app/features/booking/domain/usecases/get_available_slots_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockBookingRepository extends Mock implements BookingRepository {}

void main() {
  late GetAvailableSlotsUseCase sut;
  late MockBookingRepository mockRepo;

  const tSlot = BookingSlot(time: '10:00', available: true);

  setUp(() {
    mockRepo = MockBookingRepository();
    sut = GetAvailableSlotsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<BookingSlot>) döner', () async {
    when(() => mockRepo.getAvailableSlots(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
    )).thenAnswer((_) async => const Right([tSlot]));

    final result = await sut(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
    );

    expect(result, const Right([tSlot]));
    verify(() => mockRepo.getAvailableSlots(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
    )).called(1);
  });

  test('boş slot listesi edge case: Right([]) döner', () async {
    when(() => mockRepo.getAvailableSlots(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
    )).thenAnswer((_) async => const Right(<BookingSlot>[]));

    final result = await sut(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
    );

    expect(result.fold((_) => null, (list) => list), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getAvailableSlots(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
    )).thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(
      await sut(salonId: 's1', staffId: 'st1', serviceId: 'sv1', date: '2026-01-01'),
      const Left(ServerFailure('Sunucu hatası')),
    );
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getAvailableSlots(
      salonId: any(named: 'salonId'),
      staffId: any(named: 'staffId'),
      serviceId: any(named: 'serviceId'),
      date: any(named: 'date'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(
      salonId: 's1',
      staffId: 'st1',
      serviceId: 'sv1',
      date: '2026-01-01',
    );

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
