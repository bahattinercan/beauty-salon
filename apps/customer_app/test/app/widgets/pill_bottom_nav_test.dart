import 'package:customer_app/app/theme/app_colors.dart';
import 'package:customer_app/app/theme/app_theme.dart';
import 'package:customer_app/app/widgets/pill_bottom_nav.dart';
import 'package:customer_app/core/l10n/app_strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

// `S` l10n'i context'ten okunur (public dil factory'si yok) -> nav Builder ile.
Widget _nav({required int index, ValueChanged<int>? onTap}) =>
    Builder(builder: (context) => PillBottomNav(
          items: navItemsOf(S.of(context)),
          currentIndex: index,
          onTap: onTap ?? (_) {},
        ));

Widget _wrap(Widget nav) => MaterialApp(
      theme: AppTheme.lightTheme,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('tr'), Locale('en')],
      locale: const Locale('tr'),
      home: Scaffold(
        extendBody: true,
        body: const SizedBox.shrink(),
        bottomNavigationBar: nav,
      ),
    );

void main() {
  final colors = AppColors.light;

  testWidgets('4 öğe etiketleriyle render edilir', (tester) async {
    await tester.pumpWidget(_wrap(_nav(index: 0)));

    for (final label in ['Ana Sayfa', 'Keşfet', 'Randevular', 'Profil']) {
      expect(find.text(label), findsOneWidget);
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('tıklama doğru indeksi iletir', (tester) async {
    final tapped = <int>[];
    await tester.pumpWidget(_wrap(_nav(index: 0, onTap: tapped.add)));

    await tester.tap(find.text('Randevular'));
    await tester.pump();
    await tester.tap(find.text('Profil'));
    await tester.pump();

    expect(tapped, [2, 3]);
  });

  testWidgets('yalnızca aktif öğe açık daire taşır', (tester) async {
    await tester.pumpWidget(_wrap(_nav(index: 1)));

    final fills = tester
        .widgetList<AnimatedContainer>(find.byType(AnimatedContainer))
        .map((c) => (c.decoration as BoxDecoration?)?.color)
        .toList();
    expect(fills, [
      Colors.transparent,
      colors.onNavPill,
      Colors.transparent,
      Colors.transparent,
    ]);
  });

  // Pill body üzerine yüzer (extendBody) -> ekranlar bu boşluğu bırakmalı.
  testWidgets('insetOf = ayrılan yükseklik (güvenli alan 0 olan test yüzeyinde)',
      (tester) async {
    await tester.pumpWidget(_wrap(_nav(index: 0)));

    final navFinder = find.byType(PillBottomNav);
    expect(PillBottomNav.insetOf(tester.element(navFinder)),
        PillBottomNav.reservedHeight);
    // Pill'in kendi yüksekliği ayrılan boşluğu aşarsa içerik altında kalır.
    expect(tester.getSize(navFinder).height,
        lessThanOrEqualTo(PillBottomNav.reservedHeight));
  });

  testWidgets('390x844 ve 320x640 taşma yok', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    await tester.pumpWidget(_wrap(_nav(index: 3)));
    expect(tester.takeException(), isNull);

    await tester.binding.setSurfaceSize(const Size(320, 640));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    addTearDown(() => tester.binding.setSurfaceSize(null));
  });
}
