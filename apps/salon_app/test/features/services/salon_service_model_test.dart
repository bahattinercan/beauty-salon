import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/services/data/services_provider.dart';

void main() {
  group('SalonService.fromJson', () {
    test('category nested alanı okunur', () {
      final s = SalonService.fromJson({
        'id': 'sv1',
        'name': 'Saç Kesimi',
        'category': {'id': 'cat1', 'name': 'Saç'},
        'durationMinutes': 45,
        'price': 250,
        'description': 'Kısa description',
        'isActive': true,
      });

      expect(s.categoryId, 'cat1');
      expect(s.categoryName, 'Saç');
      expect(s.durationMinutes, 45);
      expect(s.price, 250.0);
    });

    test('durationMinutes yoksa 30 default, price yoksa 0', () {
      final s = SalonService.fromJson({'id': 'sv2', 'name': 'Manikür'});

      expect(s.durationMinutes, 30);
      expect(s.price, 0.0);
      expect(s.categoryId, isNull);
      expect(s.isActive, true);
    });
  });

  group('ServiceCategory.fromJson', () {
    test('eksik alanlar boş string olur', () {
      expect(ServiceCategory.fromJson({}).id, '');
      expect(ServiceCategory.fromJson({'id': 'c1', 'name': 'Saç'}).name, 'Saç');
    });
  });
}
