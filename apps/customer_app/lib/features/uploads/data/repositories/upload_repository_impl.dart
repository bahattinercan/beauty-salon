import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/repositories/upload_repository.dart';
import '../datasources/upload_remote_datasource.dart';

@Injectable(as: UploadRepository)
class UploadRepositoryImpl implements UploadRepository {
  final UploadRemoteDataSource _remote;
  UploadRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<String>>> uploadFiles(List<String> filePaths) async {
    try {
      return Right(await _remote.uploadFiles(filePaths));
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return const Left(NetworkFailure());
      }
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
