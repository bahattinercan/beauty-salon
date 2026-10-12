import 'package:customer_app/features/notifications/data/models/notification_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NotificationModel.fromJson', () {
    test('backend yanıtını parse eder', () {
      final model = NotificationModel.fromJson({
        'id': 'a1',
        'title': 'Randevu',
        'body': 'Gönderildi',
        'type': 'APPOINTMENT',
        'data': {'appointmentId': 'x', 'salonName': 'Salon A'},
        'isRead': false,
        'createdAt': '2026-01-12T14:30:00.000Z',
      });

      expect(model.id, 'a1');
      expect(model.type, 'APPOINTMENT');
      expect(model.isRead, isFalse);
      expect(model.data, {'appointmentId': 'x', 'salonName': 'Salon A'});
      expect(model.createdAt, '2026-01-12T14:30:00.000Z');
    });

    test('eksik/boş alanlar varsayılanlarla gelir', () {
      final model = NotificationModel.fromJson({'title': 'Başlık'});

      expect(model.id, '');
      expect(model.type, 'SYSTEM');
      expect(model.isRead, isFalse);
      expect(model.data, isNull);
      expect(model.createdAt, '');
    });

    test('data map değilse null olur', () {
      final model = NotificationModel.fromJson({'data': 'metin'});

      expect(model.data, isNull);
    });

    test('toEntity alanları korur', () {
      final entity = NotificationModel.fromJson({
        'id': 'a1',
        'title': 'Başlık',
        'body': 'Gövde',
        'type': 'REVIEW',
        'isRead': true,
        'createdAt': '2026-01-01',
      }).toEntity();

      expect(entity.id, 'a1');
      expect(entity.type, 'REVIEW');
      expect(entity.isRead, isTrue);
    });
  });
}
