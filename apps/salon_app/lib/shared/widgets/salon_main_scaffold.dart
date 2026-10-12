import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/l10n/app_strings.dart';

class SalonMainScaffold extends StatelessWidget {
  final Widget child;

  const SalonMainScaffold({super.key, required this.child});

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/dashboard')) return 0;
    if (location.startsWith('/appointments')) return 1;
    if (location.startsWith('/staff') || location.startsWith('/services')) return 2;
    if (location.startsWith('/reviews')) return 3;
    if (location.startsWith('/salon-profile')) return 4;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0: context.go('/dashboard');
      case 1: context.go('/appointments');
      case 2: context.go('/staff');
      case 3: context.go('/reviews');
      case 4: context.go('/salon-profile');
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final currentIndex = _getCurrentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, -4)),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (index) => _onTap(context, index),
          items: [
            BottomNavigationBarItem(icon: const Icon(Icons.dashboard_outlined), activeIcon: const Icon(Icons.dashboard), label: s.navDashboard),
            BottomNavigationBarItem(icon: const Icon(Icons.calendar_today_outlined), activeIcon: const Icon(Icons.calendar_today), label: s.navAppointments),
            BottomNavigationBarItem(icon: const Icon(Icons.people_outline), activeIcon: const Icon(Icons.people), label: s.navTeam),
            BottomNavigationBarItem(icon: const Icon(Icons.rate_review_outlined), activeIcon: const Icon(Icons.rate_review), label: s.navReviews),
            BottomNavigationBarItem(icon: const Icon(Icons.store_outlined), activeIcon: const Icon(Icons.store), label: s.navMySalon),
          ],
        ),
      ),
    );
  }
}
