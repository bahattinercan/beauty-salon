import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/review_page.dart';
import '../../domain/entities/salon_detail.dart';
import '../../domain/repositories/salon_detail_repository.dart';
import '../datasources/salon_detail_remote_datasource.dart';

@Injectable(as: SalonDetailRepository)
class SalonDetailRepositoryImpl implements SalonDetailRepository {
  final SalonDetailRemoteDataSource _remote;
  SalonDetailRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, SalonDetail>> getSalonDetail(String salonId) async {
    try {
      return Right(await _remote.getSalonDetail(salonId));
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, ReviewPage>> getSalonReviews({
    required String salonId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      return Right(await _remote.getSalonReviews(
        salonId: salonId,
        page: page,
        limit: limit,
      ));
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
