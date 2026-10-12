import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/salon/data/salon_provider.dart';

void main() {
  group('SalonInfo Model Tests', () {
    test('SalonInfo.fromJson should handle all fields safely', () {
      final salon = SalonInfo.fromJson(<String, dynamic>{
        'id': 'salon-1',
        'name': 'Test Salon',
        'address': 'Test Address',
        'phone': '5551234567',
        'email': 'test@salon.com',
        'description': 'Test Description',
        'ratingAvg': 4.5,
        'reviewCount': 42,
        'workingHours': <String, dynamic>{},
      });

      expect(salon.id, 'salon-1');
      expect(salon.name, 'Test Salon');
      expect(salon.address, 'Test Address');
      expect(salon.phone, '5551234567');
      expect(salon.ratingAvg, 4.5);
      expect(salon.reviewCount, 42);
    });

    test('SalonInfo.fromJson should handle null values gracefully', () {
      final salon = SalonInfo.fromJson(<String, dynamic>{
        'id': null,
        'name': null,
        'address': null,
        'phone': null,
        'email': null,
        'description': null,
        'ratingAvg': null,
        'reviewCount': null,
        'workingHours': null,
      });

      expect(salon.id, '');
      expect(salon.name, '');
      expect(salon.ratingAvg, 0);
      expect(salon.reviewCount, 0);
      expect(salon.workingHours.isEmpty, true);
    });
  });

  group('WorkingDay Model Tests', () {
    test('WorkingDay.fromJson should use defaults for missing values', () {
      final day = WorkingDay.fromJson(<String, dynamic>{});
      expect(day.open, '09:00');
      expect(day.close, '18:00');
      expect(day.isClosed, false);
    });

    test('WorkingDay.toJson should roundtrip correctly', () {
      const day = WorkingDay(open: '10:00', close: '20:00', isClosed: false);
      final json = day.toJson();
      expect(json['open'], '10:00');
      expect(json['close'], '20:00');
      expect(json['isClosed'], false);
    });

    test('kapalı gün displayTimeRange "Kapalı" döner', () {
      const day = WorkingDay(open: '09:00', close: '18:00', isClosed: true);
      expect(day.displayTimeRange, 'Kapalı');
    });
  });
}
