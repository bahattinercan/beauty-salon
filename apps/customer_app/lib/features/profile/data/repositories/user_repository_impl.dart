import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_remote_datasource.dart';
import '../models/user_profile_model.dart';

@Injectable(as: UserRepository)
class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remote;
  UserRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, UserProfile>> getProfile() async {
    try {
      final model = await _remote.getProfile();
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, UserProfile>> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    try {
      final model = await _remote.updateProfile(
        fullName: fullName,
        phone: phone,
        avatarUrl: avatarUrl,
      );
      return Right(model.toEntity());
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> requestEmailChange(String newEmail) async {
    try {
      await _remote.requestEmailChange(newEmail);
      return Right(unit);
    } on DioException catch (e) {
      return Left(ServerFailure(_extractMessage(e)));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> confirmEmailChange({
    required String token,
  }) async {
    try {
      await _remote.confirmEmailChange(token: token);
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
