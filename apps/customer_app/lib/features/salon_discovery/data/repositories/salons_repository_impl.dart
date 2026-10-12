import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/salon.dart';
import '../../domain/entities/salon_filter.dart';
import '../../domain/repositories/salons_repository.dart';
import '../datasources/salons_remote_datasource.dart';
import '../models/salon_model.dart';

@Injectable(as: SalonsRepository)
class SalonsRepositoryImpl implements SalonsRepository {
  final SalonsRemoteDataSource _remote;
  SalonsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<Salon>>> getSalons(SalonFilter filter) async {
    try {
      final models = await _remote.getSalons(filter);
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, List<Salon>>> getNearbySalons({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) async {
    try {
      final models = await _remote.getNearbySalons(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
