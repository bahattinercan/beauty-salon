import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/appointment.dart';

abstract class AppointmentsRepository {
  Future<Either<Failure, List<Appointment>>> getMyAppointments();
  Future<Either<Failure, Unit>> cancelAppointment(String id);
}
