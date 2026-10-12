import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/booking_slot.dart';
import '../../domain/repositories/booking_repository.dart';
import '../datasources/booking_remote_datasource.dart';

@Injectable(as: BookingRepository)
class BookingRepositoryImpl implements BookingRepository {
  final BookingRemoteDataSource _remote;
  BookingRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<BookingSlot>>> getAvailableSlots({
    required String salonId,
    required String staffId,
    required String serviceId,
    required String date,
  }) async {
    try {
      final slots = await _remote.getAvailableSlots(
        salonId: salonId,
        staffId: staffId,
        serviceId: serviceId,
        date: date,
      );
      return Right(slots);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, String>> createBooking({
    required String salonId,
    String? staffId,
    required String serviceId,
    required String date,
    required String startTime,
    String? note,
  }) async {
    try {
      final id = await _remote.createBooking(
        salonId: salonId,
        staffId: staffId,
        serviceId: serviceId,
        date: date,
        startTime: startTime,
        note: note,
      );
      return Right(id);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'];
      return Left(ServerFailure(
        msg is List ? msg.first.toString() : msg?.toString() ?? 'Sunucu hatası',
      ));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
