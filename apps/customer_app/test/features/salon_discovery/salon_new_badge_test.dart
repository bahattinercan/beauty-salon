import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/features/salon_discovery/data/models/salon_model.dart';
import 'package:customer_app/features/salon_discovery/domain/entities/salon.dart';

void main() {
  group('Salon.isNew', () {
    test('10 gün önce açılan salon Yeni sayılır', () {
      final salon = Salon(
        id: 's1',
        name: 'Yeni Salon',
        address: 'Adres',
        ratingAvg: 0,
        reviewCount: 0,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      );
      expect(salon.isNew, true);
    });

    test('45 gün önce açılan salon Yeni sayılmaz', () {
      final salon = Salon(
        id: 's2',
        name: 'Eski Salon',
        address: 'Adres',
        ratingAvg: 4.5,
        reviewCount: 120,
        createdAt: DateTime.now().subtract(const Duration(days: 45)),
      );
      expect(salon.isNew, false);
    });

    test('createdAt yoksa Yeni sayılmaz', () {
      final salon = Salon(
        id: 's3',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 0,
        reviewCount: 0,
      );
      expect(salon.isNew, false);
    });
  });

  group('SalonModel createdAt parse', () {
    test('ISO string createdAt alanı entityye taşınır', () {
      final model = SalonModel.fromJson({
        'id': 's1',
        'name': 'Salon',
        'address': 'Adres',
        'ratingAvg': 4.2,
        'reviewCount': 10,
        'createdAt': '2026-10-05T10:00:00.000Z',
      });

      expect(model.createdAt, isNotNull);
      expect(model.toEntity().createdAt, DateTime.parse('2026-10-05T10:00:00.000Z'));
    });

    test('createdAt yoksa null kalır', () {
      final model = SalonModel.fromJson({'id': 's2', 'name': 'Salon', 'address': 'Adres'});
      expect(model.createdAt, isNull);
    });
  });
}
