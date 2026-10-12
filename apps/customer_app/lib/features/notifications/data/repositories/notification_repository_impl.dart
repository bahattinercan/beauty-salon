import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/notification_page.dart';
import '../../domain/repositories/notification_repository.dart';
import '../datasources/notification_remote_datasource.dart';

@Injectable(as: NotificationRepository)
class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource _remote;
  NotificationRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, NotificationPage>> getNotifications({
    int page = 1,
    int limit = 20,
    bool? isRead,
  }) async {
    try {
      return Right(await _remote.getNotifications(page: page, limit: limit, isRead: isRead));
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, int>> getUnreadCount() async {
    try {
      return Right(await _remote.getUnreadCount());
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> markAsRead(String id) async {
    try {
      await _remote.markAsRead(id);
      return Right(unit);
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> markAllAsRead() async {
    try {
      await _remote.markAllAsRead();
      return Right(unit);
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  String _extractMessage(DioException e) {
    final msg = e.response?.data?['message'];
    return msg is List
        ? msg.first.toString()
        : msg?.toString() ?? 'Sunucu hatası';
  }
}
