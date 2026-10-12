import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_slot.dart';

abstract class BookingRepository {
  Future<Either<Failure, List<BookingSlot>>> getAvailableSlots({
    required String salonId,
    required String staffId,
    required String serviceId,
    required String date,
  });

  Future<Either<Failure, String>> createBooking({
    required String salonId,
    String? staffId,
    required String serviceId,
    required String date,
    required String startTime,
    String? note,
  });
}
