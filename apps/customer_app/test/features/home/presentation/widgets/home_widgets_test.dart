import 'package:customer_app/app/theme/app_colors.dart';
import 'package:customer_app/app/theme/app_theme.dart';
import 'package:customer_app/features/home/presentation/widgets/category_circle_chip.dart';
import 'package:customer_app/features/home/presentation/widgets/hero_promo_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

// Uygulama l10n'i `S.of(context)` ile okunur (factory yok) — testler tr
// yerelinde somut metinlerle çalışır (mevcut onboarding testi de böyle).
const _cta = 'Fırsatları gör';
const _title = "İlk randımanda %60'a varan indirim";

Widget _wrap(Widget child) => MaterialApp(
      theme: AppTheme.lightTheme,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('tr'), Locale('en')],
      locale: const Locale('tr'),
      home: Scaffold(body: Center(child: child)),
    );

void _noop() {}

void main() {
  final colors = AppColors.light;

  group('HeroPromoCard', () {
    testWidgets('başlık, gövde ve CTA render edilir', (tester) async {
      await tester.pumpWidget(_wrap(const HeroPromoCard()));

      expect(find.text(_title), findsOneWidget);
      expect(find.text(_cta), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    // Kural: lime yalnızca DOLGU; üstündeki metin koyu (onAccentLime, 14.1:1).
    testWidgets('CTA pill dolgusu lime, metni onAccentLime', (tester) async {
      await tester.pumpWidget(_wrap(const HeroPromoCard()));

      final pill = tester
          .widgetList<Container>(find.byType(Container))
          .firstWhere((c) => (c.decoration as BoxDecoration?)?.color == colors.accentLime);
      final pillText = tester.widget<Text>(
        find.descendant(of: find.byWidget(pill), matching: find.byType(Text)),
      );
      expect(pillText.style?.color, colors.onAccentLime);
    });

    testWidgets('dokunma tek geri çağrıya bağlı', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(HeroPromoCard(onTap: () => taps++)));

      await tester.tap(find.text(_cta));
      await tester.pumpAndSettle();
      expect(taps, 1);
    });

    // 360px'de rozet ile metin savaşırsa kart taşar (liste kayması).
    testWidgets('360px genişlikte taşma yok', (tester) async {
      await tester.binding.setSurfaceSize(const Size(360, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(_wrap(const HeroPromoCard()));

      expect(tester.takeException(), isNull);
    });
  });

  group('CategoryCircleChip', () {
    testWidgets('daire + etiket render edilir', (tester) async {
      await tester.pumpWidget(_wrap(
        const CategoryCircleChip(
          icon: Icons.content_cut,
          label: 'Saç',
          isSelected: false,
          onTap: _noop,
        ),
      ));

      expect(find.text('Saç'), findsOneWidget);
      expect(find.byIcon(Icons.content_cut), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    // Seçim işareti halka olmalı: lime dolgu beyaz zeminde 1.31:1 → yasak.
    testWidgets('seçili öğe lime HALKA kullanır, lime dolgu değil', (tester) async {
      await tester.pumpWidget(_wrap(
        const CategoryCircleChip(
          icon: Icons.content_cut,
          label: 'Saç',
          isSelected: true,
          onTap: _noop,
        ),
      ));

      final box =
          tester.widget<AnimatedContainer>(find.byType(AnimatedContainer));
      final deco = box.decoration as BoxDecoration;
      expect(deco.shape, BoxShape.circle);
      expect(deco.border!.top.color, colors.accentLime);
      expect(deco.border!.top.width, 3);
      expect(deco.color, colors.primary); // dolgu primary, ikon onPrimary
    });

    testWidgets('etiket 64px kutuya sığar, tek satıra kısalır', (tester) async {
      await tester.pumpWidget(_wrap(
        const CategoryCircleChip(
          icon: Icons.spa,
          label: 'Cilt Bakımı',
          isSelected: false,
          onTap: _noop,
        ),
      ));

      final size = tester.getSize(find.text('Cilt Bakımı'));
      expect(size.width, lessThanOrEqualTo(64));
    });
  });
}
