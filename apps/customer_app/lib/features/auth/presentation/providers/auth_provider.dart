import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/forgot_password_usecase.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/reset_password_usecase.dart';

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthInitial();

  Future<void> login(String email, String password) async {
    state = const AuthLoading();
    final result = await getIt<LoginUseCase>()(email, password);
    state = result.fold(
      (failure) => AuthError(failure.message),
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = const AuthLoading();
    final result = await getIt<RegisterUseCase>()(
      fullName: fullName,
      email: email,
      password: password,
      phone: phone,
    );
    state = result.fold(
      (failure) => AuthError(failure.message),
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> logout() async {
    state = const AuthLoading();
    await getIt<LogoutUseCase>()();
    state = const AuthUnauthenticated();
  }

  /// Şifre sıfırlama kodu gönderir. Başarılıysa `true` döner.
  Future<bool> forgotPassword(String email) async {
    state = const AuthLoading();
    final result = await getIt<ForgotPasswordUseCase>()(email);
    return result.fold(
      (failure) {
        state = AuthError(failure.message);
        return false;
      },
      (_) {
        state = const AuthInitial();
        return true;
      },
    );
  }

  /// OTP + yeni şifre ile şifreyi sıfırlar. Başarılıysa `true` döner.
  Future<bool> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    state = const AuthLoading();
    final result = await getIt<ResetPasswordUseCase>()(
      email: email,
      token: token,
      newPassword: newPassword,
    );
    return result.fold(
      (failure) {
        state = AuthError(failure.message);
        return false;
      },
      (_) {
        state = const AuthInitial();
        return true;
      },
    );
  }

  void clearError() {
    if (state is AuthError) state = const AuthInitial();
  }
}

final authNotifierProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
