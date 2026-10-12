import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  Future<Either<Failure, User>> login(String email, String password);

  Future<Either<Failure, User>> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  });

  Future<Either<Failure, Unit>> logout();

  /// Şifre sıfırlama kodu (OTP) gönderir.
  Future<Either<Failure, Unit>> forgotPassword(String email);

  /// OTP + yeni şifre ile şifreyi sıfırlar.
  Future<Either<Failure, Unit>> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  });

  Future<bool> isLoggedIn();

  Future<String?> getAccessToken();
}
