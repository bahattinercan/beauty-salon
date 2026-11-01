import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/notifications/data/datasources/notification_remote_datasource.dart';
import 'package:salon_app/features/notifications/data/repositories/notification_repository_impl.dart';
import 'package:salon_app/features/notifications/domain/notification_failure.dart';

import 'notification_fake_api.dart';

void main() {
  group('NotificationRemoteDataSource', () {
    test('sayfalı yanıtı meta ile birlikte parse eder', () async {
      final api = FakeNotificationApi((o) => jsonResponse(
            o,
            pageBody(
              [notificationJson(id: 'n1'), notificationJson(id: 'n2', isRead: true)],
              page: 2,
              totalPages: 4,
              total: 42,
            ),
          ));
      final ds = NotificationRemoteDataSourceImpl(api.client());

      final page = await ds.getNotifications(page: 2, limit: 20);

      expect(page.items.length, 2);
      expect(page.items[0].isUnread, true);
      expect(page.items[1].isRead, true);
      expect(page.page, 2);
      expect(page.totalPages, 4);
      expect(page.total, 42);
      expect(page.hasNextPage, true);
    });

    test('sorgu parametrelerini (page/limit/isRead) gönderir', () async {
      final api = FakeNotificationApi((o) => jsonResponse(o, pageBody(const [])));
      final ds = NotificationRemoteDataSourceImpl(api.client());

      await ds.getNotifications(page: 3, limit: 10, isRead: false);

      final query = api.requests.single.queryParameters;
      expect(query['page'], 3);
      expect(query['limit'], 10);
      expect(query['isRead'], 'false');
    });

    test('isRead null iken parametre gönderilmez', () async {
      final api = FakeNotificationApi((o) => jsonResponse(o, pageBody(const [])));
      final ds = NotificationRemoteDataSourceImpl(api.client());

      await ds.getNotifications();

      expect(api.requests.single.queryParameters.containsKey('isRead'), false);
    });

    test('meta yoksa tek sayfa kabul eder', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {
          'success': true,
          'data': [notificationJson(id: 'n1')],
        }),
      );
      final ds = NotificationRemoteDataSourceImpl(api.client());

      final page = await ds.getNotifications();

      expect(page.items.length, 1);
      expect(page.page, 1);
      expect(page.totalPages, 1);
    });

    test('okunmamış sayacını okur, alan yoksa 0 döner', () async {
      final api = FakeNotificationApi((o) => jsonResponse(o, unreadCountBody(7)));
      final ds = NotificationRemoteDataSourceImpl(api.client());

      expect(await ds.getUnreadCount(), 7);
      expect(api.called('GET', '/notifications/unread-count'), true);

      final emptyApi = FakeNotificationApi(
        (o) => jsonResponse(o, {'success': true, 'data': const {}}),
      );
      expect(await NotificationRemoteDataSourceImpl(emptyApi.client()).getUnreadCount(), 0);
    });

    test('markAsRead ve markAllAsRead doğru uçlara PATCH atar', () async {
      final api = FakeNotificationApi((o) => jsonResponse(o, {'success': true}));
      final ds = NotificationRemoteDataSourceImpl(api.client());

      await ds.markAsRead('n1');
      await ds.markAllAsRead();

      expect(api.called('PATCH', '/notifications/n1/read'), true);
      expect(api.called('PATCH', '/notifications/read-all'), true);
    });
  });

  group('NotificationRepositoryImpl hata yolu', () {
    NotificationRepositoryImpl repo(
      FakeNotificationApi api,
    ) =>
        NotificationRepositoryImpl(NotificationRemoteDataSourceImpl(api.client()));

    test('500 yanıtını sunucu mesajıyla NotificationFailure yapar', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {'success': false, 'message': 'Bildirim bulunamadı'}, status: 500),
      );

      await expectLater(
        repo(api).markAsRead('n1'),
        throwsA(isA<NotificationFailure>().having((f) => f.message, 'message', 'Bildirim bulunamadı')),
      );
    });

    test('bağlantı hatasını Türkçe mesaja çevirir', () async {
      final throwingApi = FakeNotificationApi((o) {
        throw DioException(
          requestOptions: o,
          type: DioExceptionType.connectionError,
          message: 'connection refused',
        );
      });

      await expectLater(
        repo(throwingApi).getUnreadCount(),
        throwsA(isA<NotificationFailure>().having(
          (f) => f.message,
          'message',
          contains('Bağlantı kurulamadı'),
        )),
      );
    });

    test('beklenmeyen parse hatasını NotificationFailure yapar', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {
          'success': true,
          'data': {
            'data': ['metin-degil-nesne'],
          },
        }),
      );

      await expectLater(
        repo(api).getNotifications(),
        throwsA(isA<NotificationFailure>()),
      );
    });

    test('başarılı çağrıda değeri döner', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, pageBody([notificationJson(id: 'n1')], total: 1)),
      );

      final page = await repo(api).getNotifications();
      expect(page.items.single.id, 'n1');
      expect(page.totalPages, 1);
    });
  });
}
