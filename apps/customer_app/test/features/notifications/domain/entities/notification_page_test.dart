import 'package:customer_app/features/notifications/domain/entities/notification_item.dart';
import 'package:customer_app/features/notifications/domain/entities/notification_page.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const n1 = NotificationItem(
    id: '1',
    title: 'Randevu hatırlatması',
    body: 'Randevunuz 1 saat sonra',
    type: 'APPOINTMENT',
    isRead: false,
    createdAt: '2026-01-12T14:30:00Z',
  );
  const n2 = NotificationItem(
    id: '2',
    title: 'Yeni yorum',
    body: 'Yorumunuz onaylandı',
    type: 'REVIEW',
    isRead: true,
    createdAt: '2026-01-10T09:15:00Z',
  );

  NotificationPage page({
    int page = 1,
    int totalPages = 3,
    bool loadingMore = false,
  }) =>
      NotificationPage(
        items: const [n1, n2],
        page: page,
        totalPages: totalPages,
        total: 6,
        loadingMore: loadingMore,
      );

  group('NotificationItem', () {
    test('copyWith yalnızca isRead değiştirir', () {
      final updated = n1.copyWith(isRead: true);

      expect(updated.isRead, isTrue);
      expect(updated.id, n1.id);
      expect(updated.title, n1.title);
    });

    test('createdAt parse edilemiyorsa timeAgo boş döner', () {
      const bad = NotificationItem(
        id: '1',
        title: 't',
        body: 'b',
        type: 'SYSTEM',
        createdAt: 'bozuk-tarih',
      );

      expect(bad.createdAtDate, isNull);
      expect(bad.timeAgo, '');
    });
  });

  group('NotificationPage', () {
    test('unreadCount yalnızca listedeki okunmamışları sayar', () {
      expect(page().unreadCount, 1);
    });

    test('hasNextPage page < totalPages', () {
      expect(page(page: 1, totalPages: 3).hasNextPage, isTrue);
      expect(page(page: 3, totalPages: 3).hasNextPage, isFalse);
    });

    test('withRead yalnızca eşleşen bildirimi okundu yapar', () {
      final updated = page().withRead('1');

      expect(updated.items.first.isRead, isTrue);
      expect(updated.items.last.isRead, isTrue); // zaten okunmuştu
      expect(updated.items.last.id, '2');
    });

    test('withAllRead tümünü okundu yapar, sayfa bilgisini korur', () {
      final updated = page(page: 2, totalPages: 4, loadingMore: true).withAllRead();

      expect(updated.items.every((n) => n.isRead), isTrue);
      expect(updated.page, 2);
      expect(updated.totalPages, 4);
      expect(updated.loadingMore, isTrue);
      expect(updated.unreadCount, 0);
    });
  });
}
