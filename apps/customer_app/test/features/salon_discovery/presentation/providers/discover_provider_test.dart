import 'package:customer_app/core/services/geolocation.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon_filter.dart';
import 'package:customer_app/features/salon_discovery/presentation/providers/discover_provider.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  late ProviderContainer container;

  const salons = [
    Salon(id: '1', name: 'A', address: 'Adres', ratingAvg: 4.5, reviewCount: 10,
        priceRange: 3, distance: 8.0),
    Salon(id: '2', name: 'B', address: 'Adres', ratingAvg: 4.8, reviewCount: 5,
        priceRange: 1, distance: 2.0),
    Salon(id: '3', name: 'C', address: 'Adres', ratingAvg: 4.0, reviewCount: 2,
        priceRange: 2, distance: 15.0),
    Salon(id: '4', name: 'D', address: 'Adres', ratingAvg: 4.1, reviewCount: 1,
        priceRange: 1),
  ];

  List<Salon> results(SalonFilter filter) {
    container.listen(discoverProvider(null), (_, _) {});
    final notifier = container.read(discoverProvider(null).notifier);
    notifier.setFilter(filter);
    return notifier.applyClientFilter(salons, null);
  }

  setUp(() => container = ProviderContainer());
  tearDown(() => container.dispose());

  group('applyClientFilter', () {
    test('konum yokken mesafe filtresi uygulanmaz (liste boşalmaz)', () {
      final list = results(const SalonFilter(maxDistanceKm: 10));
      expect(list.map((s) => s.id), ['1', '2', '3', '4']);
    });

    test('mesafe filtresizse tüm liste korunur', () {
      expect(results(const SalonFilter()).length, 4);
    });

    test('price_low istemci tarafında artan sıralar', () {
      final list = results(const SalonFilter(sortBy: 'price_low'));
      expect(list.map((s) => s.id), ['2', '4', '3', '1']);
    });

    test('price_high istemci tarafında azalan sıralar', () {
      final list = results(const SalonFilter(sortBy: 'price_high'));
      expect(list.map((s) => s.id), ['1', '3', '2', '4']);
    });

    test('distance artan sıralar (en yakın önce)', () {
      final list = results(const SalonFilter(sortBy: 'distance'));
      expect(list.map((s) => s.id), ['2', '1', '3', '4']);
    });

    test('konum verilince mesafesi olmayan salonlar haversine ile filtrelenir', () {
      const far = Salon(
        id: '5',
        name: 'Uzak',
        address: 'Adres',
        ratingAvg: 4.9,
        reviewCount: 20,
        priceRange: 2,
        latitude: 41.0082,
        longitude: 29.0684, // ~7.56 km
      );
      const near = Salon(
        id: '6',
        name: 'Yakın',
        address: 'Adres',
        ratingAvg: 4.1,
        reviewCount: 1,
        priceRange: 2,
        latitude: 41.02,
        longitude: 28.98, // ~1.3 km
      );

      container.listen(discoverProvider(null), (_, _) {});
      final notifier = container.read(discoverProvider(null).notifier);
      notifier.setFilter(const SalonFilter(maxDistanceKm: 5));

      final list = notifier.applyClientFilter(
          [far, near], const Geolocation(latitude: 41.0082, longitude: 28.9784));

      expect(list.map((s) => s.id), ['6']);
      expect(list.first.distance, closeTo(1.33, 0.05));
    });

    test('initialCategory query parametresi filter.categoryId olur', () {
      container.listen(discoverProvider('c1'), (_, _) {});
      expect(container.read(discoverProvider('c1')).filter.categoryId, 'c1');
    });
  });
}
