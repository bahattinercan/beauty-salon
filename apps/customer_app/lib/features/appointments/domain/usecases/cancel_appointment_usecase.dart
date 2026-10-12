import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/appointments_repository.dart';

@injectable
class CancelAppointmentUseCase {
  final AppointmentsRepository _repository;
  CancelAppointmentUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String id) =>
      _repository.cancelAppointment(id);
}
