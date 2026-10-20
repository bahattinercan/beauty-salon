import 'package:cached_network_image/cached_network_image.dart';
import 'package:customer_app/app/theme/app_colors.dart';
import 'package:customer_app/app/theme/app_theme.dart';
import 'package:customer_app/core/widgets/salon_card.dart';
import 'package:customer_app/core/widgets/salon_card_image.dart';
import 'package:customer_app/core/widgets/salon_card_shimmer.dart';
import 'package:customer_app/core/widgets/salon_placeholder.dart';
import 'package:customer_app/features/favorites/presentation/providers/favorites_provider.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';
import 'package:customer_app/features/salon_discovery/presentation/widgets/discover_salon_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeFavoritesNotifier extends FavoritesNotifier {
  @override
  Future<Set<String>> build() async => const {'f1'};
}

Salon _salon({
  String id = 's1',
  double rating = 4.5,
  int reviews = 12,
  bool isNew = false,
  String? cover,
  int priceRange = 2,
}) =>
    Salon(
      id: id,
      name: 'Rosalina Güzellik Merkezi',
      address: 'Abdi Ipekçi Cad. No:14',
      city: 'İstanbul',
      district: 'Şişli',
      ratingAvg: rating,
      reviewCount: reviews,
      priceRange: priceRange,
      coverImageUrl: cover,
      createdAt: isNew ? DateTime.now() : DateTime.now().subtract(const Duration(days: 400)),
    );

// `Override` tipi riverpod 3'te dışa aktarılmıyor -> listeler satır içinde
// tip çıkarımı ile verilir.
Widget _wrap(Widget child, [double width = 200]) => MaterialApp(
        theme: AppTheme.lightTheme,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      supportedLocales: const [Locale('tr'), Locale('en')],
      locale: const Locale('tr'),
      home: Scaffold(body: Center(child: SizedBox(width: width, child: child))),
    );

// Grid kartı gerçek kolon genişliğinde ölçülmeli (telefon 2 kolon ≈ 169px).
Widget _withFavorites(Widget child, [double width = 200]) => ProviderScope(
      overrides: [favoritesProvider.overrideWith(_FakeFavoritesNotifier.new)],
      child: _wrap(child, width),
    );

bool _hasBadge(WidgetTester tester, Color color) => tester
    .widgetList<Container>(find.byType(Container))
    .any((c) => (c.decoration as BoxDecoration?)?.color == color);

void main() {
  final colors = AppColors.light;

  group('SalonCardImage (ortak medya)', () {
    testWidgets('boş URL → ağ isteği yok, placeholder var', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '₺₺',
        isFavorite: false,
        seed: 's1',
        salonName: 'Rosalina',
      )));

      expect(find.byType(SalonPlaceholder), findsOneWidget);
      expect(find.byType(CachedNetworkImage), findsNothing);
    });

    testWidgets('skor çipi yoksa yıldız da yok (0 yorum)', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '1,2 km',
        priceRange: '',
        isFavorite: false,
        seed: 's1',
      )));

      expect(find.byIcon(Icons.star_rounded), findsNothing);
    });

    testWidgets('skor çipi nötr koyu zemindir (navPill), beyaz/accent değil',
        (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '',
        isFavorite: false,
        seed: 's1',
        scoreLabel: '4.5',
      )));

      expect(find.text('4.5'), findsOneWidget);
      expect(find.byIcon(Icons.star_rounded), findsOneWidget);
      expect(_hasBadge(tester, colors.navPill), isTrue);
      expect(_hasBadge(tester, colors.accent), isFalse);
    });

    testWidgets('"Yeni" rozeti lime DOLGU, üstü koyu metin', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '',
        isFavorite: false,
        seed: 's1',
        isNew: true,
        newBadgeLabel: 'Yeni',
      )));

      expect(_hasBadge(tester, colors.accentLime), isTrue);
      final badgeText = tester
          .widgetList<Text>(find.text('Yeni'))
          .first;
      expect(badgeText.style?.color, colors.onAccentLime);
    });

    testWidgets('kalp tıklaması geri çağrıyı tetikler', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '',
        isFavorite: true,
        onFavoriteTap: () => taps++,
        seed: 's1',
      )));

      await tester.tap(find.byIcon(Icons.favorite));
      await tester.pump();
      expect(taps, 1);
    });

    // Grid kartı 4/5 oranında: genişlik 200 → yükseklik 250.
    testWidgets('aspectRatio verilirken yükseklik orandan gelir', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '',
        isFavorite: false,
        seed: 's1',
        aspectRatio: 4 / 5,
      )));

      final size = tester.getSize(find.byType(SalonCardImage));
      expect(size.width, 200);
      expect(size.height, closeTo(250, 0.5));
    });

    testWidgets('aspectRatio yokken sabit 140 yükseklik', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardImage(
        imageUrl: '',
        distance: '',
        priceRange: '₺₺',
        isFavorite: false,
        seed: 's1',
      )));

      expect(tester.getSize(find.byType(SalonCardImage)).height,
          SalonCardImage.imageHeight);
    });
  });

  group('SalonCard / şerit yüksekliği', () {
    // Şeritte kart yüksekliği sabit tahminse kartın içinde boşluk kalıyor;
    // artık medya + gövde toplamı kullanılıyor.
    testWidgets('preferredHeight kartın doğal yüksekliğini karşılıyor', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCard(
        id: 's1',
        name: 'Elegance Beauty Studio',
        imageUrl: '',
        rating: 4.6,
        reviewCount: 5,
        distance: '1,2 km',
        priceRange: '₺₺₺',
        address: 'Bağdat Cad. No:123',
      )));

      final natural = tester.getSize(find.byType(SalonCard)).height;
      expect(natural, lessThanOrEqualTo(SalonCard.preferredHeight));
      expect(SalonCard.preferredHeight - natural, lessThan(16),
          reason: 'boşluk payı çok büyük: $natural');
    });

    testWidgets('şerit iskeleti kartla aynı yükseklikte (zıplama olmasın)', (tester) async {
      await tester.pumpWidget(_wrap(const SalonCardShimmer()));

      expect(tester.getSize(find.byType(SalonCardShimmer)).height,
          SalonCard.preferredHeight);
    });
  });

  group('DiscoverSalonCard', () {
    // İsim eskiden rozetlerle aynı satırdaydı → "Rose…" kısalması.
    testWidgets('görsel yokken placeholder; isim kendi satırında geniş alanı kullanır',
        (tester) async {
      await tester.pumpWidget(
          _withFavorites(DiscoverSalonCard(salon: _salon()), 169));

      expect(find.byType(SalonPlaceholder), findsOneWidget);
      expect(find.text('Rosalina Güzellik Merkezi'), findsOneWidget);
      final name = tester.getRect(find.text('Rosalina Güzellik Merkezi'));
      final card = tester.getRect(find.byType(DiscoverSalonCard));
      expect(name.width, greaterThan(card.width * 0.6));
    });

    testWidgets('0 yorum → puan çipi yok', (tester) async {
      await tester.pumpWidget(
          _withFavorites(DiscoverSalonCard(salon: _salon(reviews: 0, rating: 0)), 169));

      expect(find.byIcon(Icons.star_rounded), findsNothing);
      expect(find.byIcon(Icons.star), findsNothing);
    });

    testWidgets('169px kartta taşma yok ve lime rozet var', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
          _withFavorites(DiscoverSalonCard(salon: _salon(isNew: true)), 169));

      expect(_hasBadge(tester, colors.accentLime), isTrue);
      expect(tester.takeException(), isNull);
    });

    // Grid hücresi kartın doğal yüksekliğini geçmeli (taşma / zıplama olmasın).
    for (final width in [154.0, 169.0, 250.0]) {
      testWidgets('extentFor($width) doğal yüksekliği karşılıyor', (tester) async {
        await tester.pumpWidget(
            _withFavorites(DiscoverSalonCard(salon: _salon(isNew: true)), width));

        final natural = tester.getSize(find.byType(DiscoverSalonCard));
        expect(DiscoverSalonCard.extentFor(width), greaterThanOrEqualTo(natural.height),
            reason: 'grid hücresi karttan kısa: $natural');
      });
    }
  });
}
