import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/di/injection.dart';
import '../features/auth/domain/repositories/auth_repository.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/forgot_password_screen.dart';
import '../features/auth/presentation/screens/reset_password_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/salon_discovery/presentation/screens/discover_screen.dart';
import '../features/salon_detail/presentation/screens/salon_detail_screen.dart';
import '../features/booking/presentation/screens/booking_screen.dart';
import '../features/appointments/presentation/screens/appointments_screen.dart';
import '../features/reviews/presentation/screens/write_review_screen.dart';
import '../features/reviews/presentation/screens/my_reviews_screen.dart';
import '../features/favorites/presentation/screens/favorites_screen.dart';
import '../features/notifications/presentation/screens/notifications_screen.dart';
import '../features/profile/presentation/screens/profile_screen.dart';
import '../features/profile/presentation/screens/edit_profile_screen.dart';
import 'widgets/main_scaffold.dart';
import 'route_names.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/login',
  redirect: (context, state) async {
    final isLoggedIn = await getIt<AuthRepository>().isLoggedIn();
    final isAuthRoute = state.matchedLocation == '/login' ||
        state.matchedLocation == '/register' ||
        state.matchedLocation == '/forgot-password' ||
        state.matchedLocation == '/reset-password';

    if (isLoggedIn && isAuthRoute) return '/home';
    if (!isLoggedIn && !isAuthRoute) return '/login';
    return null;
  },
  routes: [
    // Auth routes
    GoRoute(
      path: '/login',
      name: RouteNames.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      name: RouteNames.register,
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      name: RouteNames.forgotPassword,
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/reset-password',
      name: RouteNames.resetPassword,
      builder: (context, state) => ResetPasswordScreen(
        initialEmail: state.uri.queryParameters['email'],
      ),
    ),

    // Main app with bottom navigation
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => MainScaffold(child: child),
      routes: [
        GoRoute(
          path: '/home',
          name: RouteNames.home,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: HomeScreen(),
          ),
        ),
        GoRoute(
          path: '/discover',
          name: RouteNames.discover,
          pageBuilder: (context, state) => NoTransitionPage(
            child: DiscoverScreen(
              initialCategory: state.uri.queryParameters['category'],
            ),
          ),
        ),
        GoRoute(
          path: '/appointments',
          name: RouteNames.appointments,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: AppointmentsScreen(),
          ),
        ),
        GoRoute(
          path: '/profile',
          name: RouteNames.profile,
          pageBuilder: (context, state) => const NoTransitionPage(
            child: ProfileScreen(),
          ),
        ),
      ],
    ),

    // Detail routes (outside shell, fullscreen)
    GoRoute(
      path: '/salon/:id',
      name: RouteNames.salonDetail,
      builder: (context, state) => SalonDetailScreen(
        salonId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/booking/:salonId',
      name: RouteNames.booking,
      builder: (context, state) => BookingScreen(
        salonId: state.pathParameters['salonId']!,
      ),
    ),
    GoRoute(
      path: '/review/:appointmentId',
      name: RouteNames.writeReview,
      builder: (context, state) => WriteReviewScreen(
        appointmentId: state.pathParameters['appointmentId']!,
      ),
    ),
    GoRoute(
      path: '/favorites',
      name: RouteNames.favorites,
      builder: (context, state) => const FavoritesScreen(),
    ),
    GoRoute(
      path: '/edit-profile',
      name: RouteNames.editProfile,
      builder: (context, state) => const EditProfileScreen(),
    ),
    GoRoute(
      path: '/my-reviews',
      name: RouteNames.myReviews,
      builder: (context, state) => const MyReviewsScreen(),
    ),
    GoRoute(
      path: '/notifications',
      name: RouteNames.notifications,
      builder: (context, state) => const NotificationsScreen(),
    ),
  ],
);
