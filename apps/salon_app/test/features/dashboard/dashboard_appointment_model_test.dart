import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/dashboard/data/dashboard_provider.dart';

void main() {
  group('DashboardAppointment Model Tests', () {
    test('DashboardAppointment.fromJson should handle nested nulls', () {
      final appointment = DashboardAppointment.fromJson(<String, dynamic>{
        'id': 'apt-1',
        'date': '2026-02-16',
        'startTime': '10:00',
        'endTime': '10:45',
        'status': 'CONFIRMED',
      });

      expect(appointment.id, 'apt-1');
      expect(appointment.customerName, 'Müşteri');
      expect(appointment.serviceName, '');
      expect(appointment.servicePrice, isNull);
      expect(appointment.staffName, isNull);
    });

    test('DashboardAppointment.fromJson should extract service price', () {
      final appointment = DashboardAppointment.fromJson(<String, dynamic>{
        'id': 'apt-2',
        'date': '2026-02-16',
        'startTime': '11:00',
        'endTime': '11:45',
        'status': 'COMPLETED',
        'customer': {'fullName': 'Ayşe Yılmaz', 'phone': '+905551112233'},
        'service': {'name': 'Saç Kesimi', 'price': 150},
        'staff': {'fullName': 'Merve Demir'},
      });

      expect(appointment.customerName, 'Ayşe Yılmaz');
      expect(appointment.customerPhone, '+905551112233');
      expect(appointment.serviceName, 'Saç Kesimi');
      expect(appointment.servicePrice, 150.0);
      expect(appointment.staffName, 'Merve Demir');
    });
  });
}
