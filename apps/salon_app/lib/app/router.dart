import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/data/auth_provider.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../features/appointments/presentation/screens/salon_appointments_screen.dart';
import '../features/staff/presentation/screens/staff_management_screen.dart';
import '../features/services/presentation/screens/service_management_screen.dart';
import '../features/reviews/presentation/screens/salon_reviews_screen.dart';
import '../features/profile/presentation/screens/salon_profile_screen.dart';
import '../shared/widgets/salon_main_scaffold.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  _RouterNotifier(this._ref) {
    _ref.listen(authProvider, (_, _) => notifyListeners());
  }
  bool get isLoggedIn => _ref.read(authProvider).asData?.value.isLoggedIn ?? false;
  bool get isResolving => _ref.read(authProvider).isLoading;
}

final _routerNotifierProvider = Provider<_RouterNotifier>((ref) => _RouterNotifier(ref));

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(_routerNotifierProvider);

  // Web'de açılış yolu tarayıcı URL'inden alınmalı. go_router yalnızca platform
  // varsayılanı '/' iken initialLocation'ı kullanıyor; Flutter web'de defaultRouteName
  // her zaman '/' olduğu için deep linkler (/reviews gibi) initialLocation'a düşüyor
  // ve kullanıcı hangi yoldan gelirse dashboard'a yönlendiriliyordu.
  final webPath = kIsWeb ? Uri.base.path : '';
  final initialLocation = webPath.isNotEmpty && webPath != '/' ? webPath : '/login';

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: initialLocation,
    refreshListenable: notifier,
    redirect: (context, state) {
      final isLoginRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      // Oturum durumu henüz çözülmedi (secure storage okunuyor). Bu aşamada yönlendirme
      // deep link'i kaybediyor: web'de /reviews ile açılan uygulama /login'e düşüyor,
      // sonra login ekranı /dashboard'a atıyordu. Yalnızca kök yolu login'e gönderiyoruz;
      // refreshListenable durum çözülünce tekrar değerlendirir.
      if (notifier.isResolving) {
        return state.matchedLocation == '/' ? '/login' : null;
      }
      if (!notifier.isLoggedIn && !isLoginRoute) return '/login';
      if (notifier.isLoggedIn && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => SalonMainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: '/appointments',
            pageBuilder: (context, state) => const NoTransitionPage(child: SalonAppointmentsScreen()),
          ),
          GoRoute(
            path: '/staff',
            pageBuilder: (context, state) => const NoTransitionPage(child: StaffManagementScreen()),
          ),
          GoRoute(
            path: '/services',
            pageBuilder: (context, state) => const NoTransitionPage(child: ServiceManagementScreen()),
          ),
          GoRoute(
            path: '/reviews',
            pageBuilder: (context, state) => const NoTransitionPage(child: SalonReviewsScreen()),
          ),
          GoRoute(
            path: '/salon-profile',
            pageBuilder: (context, state) => const NoTransitionPage(child: SalonProfileScreen()),
          ),
        ],
      ),
    ],
  );
});
