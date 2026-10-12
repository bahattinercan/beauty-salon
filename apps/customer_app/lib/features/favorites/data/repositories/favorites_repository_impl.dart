import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/repositories/favorites_repository.dart';
import '../datasources/favorites_remote_datasource.dart';

@Injectable(as: FavoritesRepository)
class FavoritesRepositoryImpl implements FavoritesRepository {
  final FavoritesRemoteDataSource _remote;
  FavoritesRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, Set<String>>> getFavoriteIds() async {
    try {
      final ids = await _remote.getFavoriteIds();
      return Right(ids);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> toggle(String salonId) async {
    try {
      await _remote.toggle(salonId);
      return const Right(unit);
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
