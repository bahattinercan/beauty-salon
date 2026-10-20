import 'package:customer_app/app/route_names.dart';
import 'package:customer_app/features/onboarding/presentation/providers/onboarding_provider.dart';
import 'package:customer_app/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:customer_app/features/onboarding/presentation/widgets/page_dots.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

/// getIt'e dokunmadan provider'ı sahte durumla besler.
class _FakeOnboardingNotifier extends OnboardingNotifier {
  _FakeOnboardingNotifier(this._seen);

  final bool _seen;
  static int completeCalls = 0;

  @override
  Future<bool> build() async => _seen;

  @override
  Future<void> complete() async {
    completeCalls++;
    state = const AsyncData(true);
  }
}

GoRouter _router() => GoRouter(
      initialLocation: '/onboarding',
      routes: [
        GoRoute(
          path: '/onboarding',
          name: RouteNames.onboarding,
          builder: (context, state) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/login',
          name: RouteNames.login,
          builder: (context, state) => const SizedBox(key: Key('login-route')),
        ),
      ],
    );

Future<void> _pump(WidgetTester tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        onboardingProvider.overrideWith(() => _FakeOnboardingNotifier(false)),
      ],
      child: MaterialApp.router(routerConfig: _router()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => _FakeOnboardingNotifier.completeCalls = 0);

  testWidgets('ilk slayt baslik ve Atla ile render edilir', (tester) async {
    await _pump(tester);

    expect(find.byType(OnboardingScreen), findsOneWidget);
    expect(find.text('Discover salons near you'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.byKey(const Key('onboarding-next')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('dairesel buton slaytu ilerletir', (tester) async {
    await _pump(tester);

    await tester.tap(find.byKey(const Key('onboarding-next')));
    await tester.pumpAndSettle();

    expect(find.text('Book in seconds'), findsOneWidget);
    expect(_FakeOnboardingNotifier.completeCalls, 0);
  });

  testWidgets('son slaytta "Atla" giris ekranina yonlendirir', (tester) async {
    await _pump(tester);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(_FakeOnboardingNotifier.completeCalls, 1);
    expect(find.byKey(const Key('login-route')), findsOneWidget);
  });

  testWidgets('son slaytta onay butonu bitirir', (tester) async {
    await _pump(tester);

    for (var i = 0; i < 2; i++) {
      await tester.tap(find.byKey(const Key('onboarding-next')));
      await tester.pumpAndSettle();
    }
    expect(find.text('Keep your favorites'), findsOneWidget);
    // son slaytta ikon ok yerine tiktir
    expect(find.byIcon(Icons.check_rounded), findsOneWidget);

    await tester.tap(find.byKey(const Key('onboarding-next')));
    await tester.pumpAndSettle();

    expect(_FakeOnboardingNotifier.completeCalls, 1);
    expect(find.byKey(const Key('login-route')), findsOneWidget);
  });

  // Geniş ekran (web/tablet) regression: AspectRatio tabanlı düzen 800px
  // genişlikte Column'u taşırıyordu (RenderFlex overflowed by 388px).
  testWidgets('geniş ekranda (900x700) taşma yok', (tester) async {
    await tester.binding.setSurfaceSize(const Size(900, 700));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await _pump(tester);

    expect(tester.takeException(), isNull);
    expect(find.text('Discover salons near you'), findsOneWidget);
  });

  testWidgets('sayfa noktaları aktif sayfayı gösterir', (tester) async {
    await _pump(tester);

    final dots = find.byType(PageDots);
    expect(dots, findsOneWidget);
    expect(find.bySemanticsLabel('1 / 3'), findsOneWidget);

    await tester.tap(find.byKey(const Key('onboarding-next')));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('2 / 3'), findsOneWidget);
  });
}
