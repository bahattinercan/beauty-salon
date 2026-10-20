import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/router.dart';
import 'app/theme/app_theme.dart';
import 'core/di/injection.dart';
import 'core/l10n/locale_provider.dart';
import 'app/theme/theme_provider.dart';
import 'core/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await configureDependencies();
  await NotificationService.init();

  runApp(const ProviderScope(child: BeautySalonApp()));
}

class BeautySalonApp extends ConsumerWidget {
  const BeautySalonApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localeAsync = ref.watch(localeProvider);
    final locale = localeAsync.asData?.value ?? const Locale('tr');

    final themeMode = ref.watch(themeProvider).asData?.value ?? ThemeMode.light;

    return MaterialApp.router(
      title: 'Beauty Salon',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      locale: locale,
      supportedLocales: const [Locale('tr'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      // Sistem çubukları tema ile birlikte uygulanır: `appBarTheme` stili
      // yalnızca AppBar'lı ekranlarda devreye giriyordu, login/home
      // CustomScrollView kullanıyor → cihazda siyah gezinme çubuğu + mor
      // hero üstünde koyu ikon göründü.
      builder: (context, child) =>
          _SystemUiChrome(child: child ?? const SizedBox.shrink()),
    );
  }
}

/// Tema değiştiğinde (light/dark/system) sistem çubuklarını yeniden uygular.
class _SystemUiChrome extends StatefulWidget {
  const _SystemUiChrome({required this.child});

  final Widget child;

  @override
  State<_SystemUiChrome> createState() => _SystemUiChromeState();
}

class _SystemUiChromeState extends State<_SystemUiChrome> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    SystemChrome.setSystemUIOverlayStyle(
      AppTheme.overlayFor(Theme.of(context).brightness),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
