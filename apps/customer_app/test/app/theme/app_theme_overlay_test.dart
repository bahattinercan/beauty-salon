import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/app/theme/app_theme.dart';
import 'package:customer_app/app/widgets/brand_surface.dart';

/// Sistem çubukları cihazda tema dışı kalıyordu: `appBarTheme.systemOverlayStyle`
/// yalnızca AppBar'ı olan ekranlarda uygulanıyor, `systemNavigationBarColor` hiç
/// set edilmiyordu → 1080x2400 emülatörde siyah gezinme çubuğu ve mor hero
/// üstünde koyu durum ikonları (~3:1) görüldü.
void main() {
  group('AppTheme.overlayFor', () {
    test('light temada ikonlar koyu, barlar şeffaf', () {
      final s = AppTheme.overlayFor(Brightness.light);
      expect(s.statusBarColor, Colors.transparent);
      expect(s.systemNavigationBarColor, Colors.transparent);
      expect(s.statusBarIconBrightness, Brightness.dark);
      expect(s.systemNavigationBarIconBrightness, Brightness.dark);
    });

    test('dark temada ikonlar açık', () {
      final s = AppTheme.overlayFor(Brightness.dark);
      expect(s.statusBarIconBrightness, Brightness.light);
      expect(s.systemNavigationBarIconBrightness, Brightness.light);
      expect(s.systemNavigationBarColor, Colors.transparent);
    });

    test('marka yüzeyi stilinde ikonlar her zaman açık (mor zemin)', () {
      expect(AppTheme.onBrandSurface.statusBarIconBrightness, Brightness.light);
      expect(AppTheme.onBrandSurface.statusBarColor, Colors.transparent);
    });

    // Tema ağacını testte kurmak GoogleFonts'u ağaca sokuyor (font indirme
    // denemesi testi patlatıyor), o yüzden tutarlılık kaynak üzerinden kilitli:
    // iki yerde elle SystemUiOverlayStyle yazılıp bayatlamasın.
    test('appTheme stilleri overlayFor.tan türetiyor (elle stil yazılmasın)', () {
      final src = File('lib/app/theme/app_theme.dart').readAsStringSync();
      expect(src, contains('systemOverlayStyle: overlayFor(Brightness.light)'));
      expect(src, contains('systemOverlayStyle: overlayFor(Brightness.dark)'));
      expect(src, isNot(contains('systemOverlayStyle: const SystemUiOverlayStyle')));
    });
  });

  group('BrandSurface', () {
    testWidgets('marka yüzeyinde durum ikonları beyaza döner', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(body: BrandSurface(child: SizedBox(height: 120))),
      ));

      final region = tester.widget<AnnotatedRegion<SystemUiOverlayStyle>>(
        find.byType(AnnotatedRegion<SystemUiOverlayStyle>),
      );
      expect(region.value, AppTheme.onBrandSurface);
      expect(region.value.statusBarIconBrightness, Brightness.light);
    });
  });
}
