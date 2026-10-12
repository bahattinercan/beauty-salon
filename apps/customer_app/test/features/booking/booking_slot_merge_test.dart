import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/features/booking/domain/entities/booking_slot.dart';
import 'package:customer_app/features/booking/presentation/providers/booking_provider.dart';

void main() {
  group('mergeSlots', () {
    test('aynı saat birden fazla çalışanda geliyorsa tek kayıt olur', () {
      final merged = mergeSlots([
        [const BookingSlot(time: '10:00', available: true), const BookingSlot(time: '11:00', available: false)],
        [const BookingSlot(time: '10:00', available: true), const BookingSlot(time: '12:00', available: true)],
      ]);

      expect(merged.length, 3);
      expect(merged.map((s) => s.time), ['10:00', '11:00', '12:00']);
    });

    test('bir çalışan boşsa saat boş sayılır (union mantığı)', () {
      final merged = mergeSlots([
        [const BookingSlot(time: '10:00', available: false)],
        [const BookingSlot(time: '10:00', available: true)],
      ]);

      expect(merged.length, 1);
      expect(merged.first.available, true);
    });

    test('saatler sıralı döner', () {
      final merged = mergeSlots([
        [const BookingSlot(time: '15:00', available: true), const BookingSlot(time: '09:00', available: true)],
      ]);
      expect(merged.map((s) => s.time), ['09:00', '15:00']);
    });
  });
}
