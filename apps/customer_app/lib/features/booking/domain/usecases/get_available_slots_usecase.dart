import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/booking_slot.dart';
import '../repositories/booking_repository.dart';

@injectable
class GetAvailableSlotsUseCase {
  final BookingRepository _repository;
  GetAvailableSlotsUseCase(this._repository);

  Future<Either<Failure, List<BookingSlot>>> call({
    required String salonId,
    required String staffId,
    required String serviceId,
    required String date,
  }) =>
      _repository.getAvailableSlots(
        salonId: salonId,
        staffId: staffId,
        serviceId: serviceId,
        date: date,
      );
}
