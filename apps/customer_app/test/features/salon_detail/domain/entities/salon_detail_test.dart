import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const hours = {
    'monday': {'open': '09:00', 'close': '18:00'},
    'tuesday': {'open': '09:00', 'close': '18:00'},
    'wednesday': {'open': '09:00', 'close': '18:00'},
    'thursday': {'open': '09:00', 'close': '18:00'},
    'friday': {'open': '09:00', 'close': '18:00'},
    'saturday': {'open': '10:00', 'close': '16:00'},
    'sunday': {'open': null, 'close': null},
  };

  SalonDetail salon({int priceRange = 0}) => SalonDetail(
        id: '1',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 4.5,
        reviewCount: 10,
        priceRange: priceRange,
        workingHours: hours,
      );

  group('SalonDetail fiyat aralığı', () {
    test('priceRange 1/2/3 → ₺/₺₺/₺₺₺', () {
      expect(salon(priceRange: 1).priceRangeLabel, '₺');
      expect(salon(priceRange: 2).priceRangeLabel, '₺₺');
      expect(salon(priceRange: 3).priceRangeLabel, '₺₺₺');
    });

    test('priceRange 0 → boş etiket (gösterilmez)', () {
      expect(salon().priceRangeLabel, '');
    });
  });

  group('SalonDetail haftalık çalışma saatleri', () {
    test('7 gün, Pazartesi ile başlar', () {
      final rows = salon().weeklyWorkingHours;

      expect(rows.length, 7);
      expect(rows.first.day, 'monday');
      expect(rows.last.day, 'sunday');
    });

    test('kapalı gün isOpen false, açık gün saatleri taşır', () {
      final rows = salon().weeklyWorkingHours;
      final sunday = rows.last;
      final monday = rows.first;

      expect(sunday.isOpen, isFalse);
      expect(sunday.openTime, isNull);
      expect(monday.isOpen, isTrue);
      expect(monday.openTime, '09:00');
      expect(monday.closeTime, '18:00');
    });

    test('dayIndex dayNames listesiyle hizalanır (Pazartesi → 0)', () {
      final rows = salon().weeklyWorkingHours;

      expect(rows[0].dayIndex, 0);
      expect(rows[5].dayIndex, 5);
      expect(rows[6].dayIndex, 6);
    });

    test('todayHours kapalı gün için null döner (metni l10n üretir)', () {
      final closedToday = SalonDetail(
        id: '1',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 0,
        reviewCount: 0,
        workingHours: {
          WorkingHoursRow.days[DateTime.now().weekday - 1]: {'open': null, 'close': null},
        },
      );

      expect(closedToday.todayHours, isNull);
    });

    test('workingHours boşsa tüm günler kapalı', () {
      const empty = SalonDetail(
        id: '1',
        name: 'Salon',
        address: 'Adres',
        ratingAvg: 0,
        reviewCount: 0,
      );

      expect(empty.weeklyWorkingHours.every((r) => !r.isOpen), isTrue);
    });
  });
}
