import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/l10n/app_strings.dart';
import '../route_names.dart';
import 'pill_bottom_nav.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/discover')) return 1;
    if (location.startsWith('/appointments')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.goNamed(RouteNames.home);
      case 1:
        context.goNamed(RouteNames.discover);
      case 2:
        context.goNamed(RouteNames.appointments);
      case 3:
        context.goNamed(RouteNames.profile);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);

    // `extendBody: true`: pill yüzen bir katmandır, içerik onun arkasına kadar
    // akar. Ekranlar alt boşluğu `PillBottomNav.insetOf(context)` ile verir.
    return Scaffold(
      extendBody: true,
      body: child,
      bottomNavigationBar: PillBottomNav(
        items: navItemsOf(S.of(context)),
        currentIndex: currentIndex,
        onTap: (index) => _onTap(context, index),
      ),
    );
  }
}
