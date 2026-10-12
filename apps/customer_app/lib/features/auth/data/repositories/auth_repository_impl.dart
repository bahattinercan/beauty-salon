import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

@Injectable(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;

  AuthRepositoryImpl(this._remote, this._local);

  ServerFailure _serverFailure(DioException e) {
    final msg = e.response?.data?['message'];
    return ServerFailure(
      msg is List ? msg.first.toString() : msg?.toString() ?? 'Sunucu hatası',
    );
  }

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    try {
      final result = await _remote.login(email, password);
      await _local.cacheTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return Right(result.user.toEntity());
    } on DioException catch (e) {
      return Left(_serverFailure(e));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, User>> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final result = await _remote.register(
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
      );
      await _local.cacheTokens(
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );
      return Right(result.user.toEntity());
    } on DioException catch (e) {
      return Left(_serverFailure(e));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> forgotPassword(String email) async {
    try {
      await _remote.forgotPassword(email);
      return const Right(unit);
    } on DioException catch (e) {
      return Left(_serverFailure(e));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    try {
      await _remote.resetPassword(
        email: email,
        token: token,
        newPassword: newPassword,
      );
      return const Right(unit);
    } on DioException catch (e) {
      return Left(_serverFailure(e));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> logout() async {
    try {
      await _remote.logout();
      await _local.clearAll();
      return const Right(unit);
    } catch (_) {
      await _local.clearAll();
      return const Right(unit);
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _local.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<String?> getAccessToken() => _local.getAccessToken();
}
