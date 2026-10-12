import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/di/injection.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/entities/user.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/presentation/screens/login_screen.dart';
import 'package:customer_app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthRepository implements AuthRepository {
  @override
  Future<bool> isLoggedIn() async => false;

  @override
  Future<String?> getAccessToken() async => null;

  @override
  Future<Either<Failure, User>> login(String email, String password) =>
      Future.value(const Left(ServerFailure('not implemented')));

  @override
  Future<Either<Failure, User>> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) =>
      Future.value(const Left(ServerFailure('not implemented')));

  @override
  Future<Either<Failure, Unit>> logout() =>
      Future.value(const Left(ServerFailure('not implemented')));

  @override
  Future<Either<Failure, Unit>> forgotPassword(String email) =>
      Future.value(const Left(ServerFailure('not implemented')));

  @override
  Future<Either<Failure, Unit>> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) =>
      Future.value(const Left(ServerFailure('not implemented')));
}

void main() {
  setUp(() {
    getIt.reset();
    getIt.registerSingleton<FlutterSecureStorage>(const FlutterSecureStorage());
    getIt.registerSingleton<AuthRepository>(_FakeAuthRepository());
  });

  testWidgets('Giriş yapılmamışsa uygulama login ekranını gösterir',
      (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: BeautySalonApp()),
    );
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
  });
}
