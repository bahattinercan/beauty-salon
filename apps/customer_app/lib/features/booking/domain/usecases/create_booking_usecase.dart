import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/booking_repository.dart';

@injectable
class CreateBookingUseCase {
  final BookingRepository _repository;
  CreateBookingUseCase(this._repository);

  Future<Either<Failure, String>> call({
    required String salonId,
    String? staffId,
    required String serviceId,
    required String date,
    required String startTime,
    String? note,
  }) =>
      _repository.createBooking(
        salonId: salonId,
        staffId: staffId,
        serviceId: serviceId,
        date: date,
        startTime: startTime,
        note: note,
      );
}
