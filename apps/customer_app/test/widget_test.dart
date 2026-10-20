import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/di/injection.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/auth/domain/entities/user.dart';
import 'package:customer_app/features/auth/domain/repositories/auth_repository.dart';
import 'package:customer_app/features/auth/presentation/screens/login_screen.dart';
import 'package:customer_app/features/onboarding/domain/repositories/onboarding_repository.dart';
import 'package:customer_app/features/onboarding/domain/usecases/get_onboarding_seen_usecase.dart';
import 'package:customer_app/features/onboarding/domain/usecases/mark_onboarding_seen_usecase.dart';
import 'package:customer_app/features/onboarding/domain/usecases/reset_onboarding_seen_usecase.dart';
import 'package:customer_app/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:customer_app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.loggedIn = false});

  final bool loggedIn;

  @override
  Future<bool> isLoggedIn() async => loggedIn;

  @override
  Future<String?> getAccessToken() async => loggedIn ? 'fake' : null;

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

class _FakeOnboardingRepository implements OnboardingRepository {
  _FakeOnboardingRepository({required this.seen, this.failing = false});

  bool seen;
  final bool failing;

  @override
  Future<Either<Failure, bool>> hasSeen() async =>
      failing ? const Left(CacheFailure('storage kapalı')) : Right(seen);

  @override
  Future<Either<Failure, void>> markSeen() async {
    seen = true;
    return const Right(null);
  }

  @override
  Future<Either<Failure, void>> clearSeen() async {
    seen = false;
    return const Right(null);
  }
}

Future<void> _registerFakes({
  bool loggedIn = false,
  bool onboardingSeen = false,
  bool onboardingFailing = false,
}) async {
  // reset() async; beklenmezse sonra kaydedilen fake'ler silinebiliyor.
  await getIt.reset();
  final onboardingRepo = _FakeOnboardingRepository(
    seen: onboardingSeen,
    failing: onboardingFailing,
  );
  getIt.registerSingleton<FlutterSecureStorage>(const FlutterSecureStorage());
  getIt.registerSingleton<AuthRepository>(_FakeAuthRepository(loggedIn: loggedIn));
  getIt.registerSingleton<OnboardingRepository>(onboardingRepo);
  getIt.registerSingleton<GetOnboardingSeenUseCase>(
      GetOnboardingSeenUseCase(onboardingRepo));
  getIt.registerSingleton<MarkOnboardingSeenUseCase>(
      MarkOnboardingSeenUseCase(onboardingRepo));
  getIt.registerSingleton<ResetOnboardingSeenUseCase>(
      ResetOnboardingSeenUseCase(onboardingRepo));
}

Future<void> _pumpApp(WidgetTester tester) async {
  await tester.pumpWidget(const ProviderScope(child: BeautySalonApp()));
  await tester.pumpAndSettle();
}

void main() {
  // Router redirect'i güvenli biçimde test etmek için bekleme süresi;
  // pumpAndSettle yukarıdaki fake'lerle yeterli ama güvenlik payı bırakılır.
  testWidgets('ilk açılışta (gösterilmemiş) onboarding ekranı gelir',
      (tester) async {
    await _registerFakes();
    await _pumpApp(tester);

    expect(find.byType(OnboardingScreen), findsOneWidget);
    expect(find.byType(LoginScreen), findsNothing);
  });

  testWidgets('onboarding gösterildiyse ve giriş yoksa login ekranı gelir',
      (tester) async {
    await _registerFakes(onboardingSeen: true);
    await _pumpApp(tester);

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(OnboardingScreen), findsNothing);
  });

  testWidgets('storage hatasında onboarding döngüsü oluşmaz, login gelir',
      (tester) async {
    await _registerFakes(onboardingFailing: true);
    await _pumpApp(tester);

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(OnboardingScreen), findsNothing);
  });

  testWidgets('onboarding "Atla" sonrası login ekranına geçer', (tester) async {
    await _registerFakes();
    await _pumpApp(tester);

    await tester.tap(find.text('Atla')); // uygulama varsayılan dili tr
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(OnboardingScreen), findsNothing);
  });
}
