import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/appointment.dart';
import '../../domain/repositories/appointments_repository.dart';
import '../datasources/appointments_remote_datasource.dart';

@Injectable(as: AppointmentsRepository)
class AppointmentsRepositoryImpl implements AppointmentsRepository {
  final AppointmentsRemoteDataSource _remote;
  AppointmentsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<Appointment>>> getMyAppointments() async {
    try {
      return Right(await _remote.getMyAppointments());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> cancelAppointment(String id) async {
    try {
      await _remote.cancelAppointment(id);
      return const Right(unit);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
