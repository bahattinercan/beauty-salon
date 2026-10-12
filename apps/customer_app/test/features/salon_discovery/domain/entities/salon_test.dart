import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Salon.distanceKmTo', () {
    const salon = Salon(
      id: '1',
      name: 'Salon',
      address: 'Adres',
      ratingAvg: 4.5,
      reviewCount: 3,
      latitude: 41.0082,
      longitude: 29.0684,
    );

    test('haversine ile km cinsinden mesafe hesaplar', () {
      // 0.09 boylam ≈ 7.56 km (enlem 41°'de 1° boylam ≈ 84 km).
      final km = salon.distanceKmTo(41.0082, 28.9784);
      expect(km, closeTo(7.56, 0.1));
    });

    test('aynı noktada mesafe 0', () {
      expect(salon.distanceKmTo(41.0082, 29.0684), closeTo(0, 0.001));
    });

    test('koordinat yoksa null döner', () {
      const noCoords = Salon(
        id: '2',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 4.5,
        reviewCount: 3,
      );
      expect(noCoords.distanceKmTo(41.0, 29.0), isNull);
    });

    test('distanceLabel m/km biçimlendirir', () {
      const measured = Salon(
        id: '3',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 4.5,
        reviewCount: 3,
        distance: 7.56,
      );
      expect(measured.distanceLabel, '7.6 km');

      const near = Salon(
        id: '4',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 4.5,
        reviewCount: 3,
        distance: 0.34,
      );
      expect(near.distanceLabel, '340 m');
    });
  });
}
