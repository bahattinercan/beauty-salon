import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/appointment.dart';
import '../repositories/appointments_repository.dart';

@injectable
class GetAppointmentsUseCase {
  final AppointmentsRepository _repository;
  GetAppointmentsUseCase(this._repository);

  Future<Either<Failure, List<Appointment>>> call() =>
      _repository.getMyAppointments();
}
