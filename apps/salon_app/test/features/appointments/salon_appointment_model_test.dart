import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/appointments/data/appointments_provider.dart';

void main() {
  group('SalonAppointment.fromJson', () {
    test('tam response alanlarını doğru tipine çevirir', () {
      final a = SalonAppointment.fromJson({
        'id': 'a1',
        'date': '2026-10-13',
        'startTime': '10:00:00',
        'endTime': '10:45:00',
        'status': 'CONFIRMED',
        'customer': {'fullName': 'Ayşe Yılmaz', 'phone': '+905551112233'},
        'service': {'name': 'Saç Kesimi', 'price': 250},
        'staff': {'fullName': 'Merve Demir'},
        'note': 'Not var',
      });

      expect(a.id, 'a1');
      expect(a.customerName, 'Ayşe Yılmaz');
      expect(a.customerPhone, '+905551112233');
      expect(a.serviceName, 'Saç Kesimi');
      expect(a.servicePrice, 250.0);
      expect(a.staffName, 'Merve Demir');
      expect(a.status, 'CONFIRMED');
    });

    test('nested nulllarda crash olmaz, default kullanılır', () {
      final a = SalonAppointment.fromJson({'id': 'a2'});

      expect(a.status, 'PENDING');
      expect(a.customerName, 'Müşteri');
      expect(a.servicePrice, 0.0);
      expect(a.serviceName, '');
      expect(a.customerPhone, isNull);
      expect(a.staffName, isNull);
    });

    test('price string gelirse de tolere edilir (SQLite DECIMAL)', () {
      final a = SalonAppointment.fromJson({
        'id': 'a3',
        'service': {'name': 'Manikür', 'price': 120.5},
      });
      expect(a.servicePrice, 120.5);
    });
  });
}
