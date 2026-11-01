import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/notifications/data/models/notification_model.dart';
import 'package:salon_app/features/notifications/domain/entities/notification_item.dart';
import 'package:salon_app/features/notifications/domain/entities/notification_page.dart';

void main() {
  group('NotificationModel', () {
    test('tüm alanları (okunmamış dahil) parse eder', () {
      final model = NotificationModel.fromJson({
        'id': 'n1',
        'title': 'Yeni randevu',
        'body': 'Ayşe Yılmaz randevu oluşturdu',
        'type': 'APPOINTMENT',
        'data': {'appointmentId': 'appt-1'},
        'isRead': false,
        'createdAt': '2026-02-10T09:30:00.000Z',
      });

      expect(model.id, 'n1');
      expect(model.title, 'Yeni randevu');
      expect(model.body, 'Ayşe Yılmaz randevu oluşturdu');
      expect(model.type, 'APPOINTMENT');
      expect(model.data?['appointmentId'], 'appt-1');
      expect(model.isRead, false);
      expect(model.createdAt, DateTime.parse('2026-02-10T09:30:00.000Z'));
    });

    test('okunmuş bildirimi isRead=true olarak parse eder', () {
      final model = NotificationModel.fromJson({'id': 'n2', 'isRead': true});
      expect(model.isRead, true);
      expect(model.toEntity().isUnread, false);
    });

    test('snake_case is_read alanını da kabul eder', () {
      final model = NotificationModel.fromJson({'id': 'n3', 'is_read': true});
      expect(model.isRead, true);
    });

    test('eksik alanlarda güvenli varsayılanlar kullanır', () {
      final model = NotificationModel.fromJson({'id': 42});

      expect(model.id, '42');
      expect(model.title, '');
      expect(model.body, '');
      expect(model.type, 'SYSTEM');
      expect(model.data, isNull);
      expect(model.isRead, false);
      expect(model.createdAt, isNull);
    });

    test('bozuk createdAt null olur, fırlatmaz', () {
      final model = NotificationModel.fromJson({'id': 'n4', 'createdAt': 'bozuk-tarih'});
      expect(model.createdAt, isNull);
    });

    test('toEntity alanları birebir taşır', () {
      final item = NotificationModel.fromJson({
        'id': 'n5',
        'title': 'Başlık',
        'body': 'Gövde',
        'type': 'REVIEW',
        'isRead': false,
        'createdAt': '2026-01-01T00:00:00.000Z',
      }).toEntity();

      expect(item.id, 'n5');
      expect(item.title, 'Başlık');
      expect(item.body, 'Gövde');
      expect(item.type, 'REVIEW');
      expect(item.isUnread, true);
      expect(item.createdAt, DateTime.parse('2026-01-01T00:00:00.000Z'));
    });
  });

  group('NotificationItem', () {
    test('copyWith yalnızca isRead değiştirir', () {
      final item = NotificationItem(
        id: 'n1',
        title: 'T',
        body: 'B',
        createdAt: DateTime(2026, 2, 10),
      );

      final read = item.copyWith(isRead: true);
      expect(read.isRead, true);
      expect(read.isUnread, false);
      expect(read.title, item.title);
      expect(read.body, item.body);
      expect(read.createdAt, item.createdAt);
    });
  });

  group('NotificationPage', () {
    NotificationItem item(String id, {bool isRead = false}) =>
        NotificationItem(id: id, title: 'T$id', body: 'B$id', isRead: isRead);

    test('hasNextPage sayfa toplam sayfadan küçükse true', () {
      expect(
        const NotificationPage(items: [], page: 1, totalPages: 3).hasNextPage,
        true,
      );
      expect(
        const NotificationPage(items: [], page: 3, totalPages: 3).hasNextPage,
        false,
      );
    });

    test('unreadCount okunmamışları sayar', () {
      final page = NotificationPage(
        items: [item('1'), item('2', isRead: true), item('3')],
        page: 1,
        totalPages: 1,
      );
      expect(page.unreadCount, 2);
      expect(page.isEmpty, false);
    });

    test('withRead tek kaydı okundu yapar', () {
      final page = NotificationPage(
        items: [item('1'), item('2')],
        page: 1,
        totalPages: 1,
      ).withRead('1');

      expect(page.items.firstWhere((n) => n.id == '1').isRead, true);
      expect(page.items.firstWhere((n) => n.id == '2').isRead, false);
      expect(page.unreadCount, 1);
    });

    test('withAllRead tüm kayıtları okundu yapar', () {
      final page = NotificationPage(
        items: [item('1'), item('2'), item('3')],
        page: 1,
        totalPages: 1,
      ).withAllRead();

      expect(page.unreadCount, 0);
    });

    test('empty sabiti boş sayfadır', () {
      expect(NotificationPage.empty.isEmpty, true);
      expect(NotificationPage.empty.hasNextPage, false);
    });
  });
}
