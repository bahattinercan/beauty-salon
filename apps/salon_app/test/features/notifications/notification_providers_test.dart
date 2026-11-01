import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/core/network/api_provider.dart';
import 'package:salon_app/features/notifications/domain/notification_failure.dart';
import 'package:salon_app/features/notifications/presentation/providers/notification_providers.dart';

import 'notification_fake_api.dart';

void main() {
  ProviderContainer makeContainer(FakeNotificationApi api) {
    final container = ProviderContainer(
      overrides: [apiClientProvider.overrideWithValue(api.client())],
    );
    addTearDown(container.dispose);
    return container;
  }

  group('notificationFeedProvider', () {
    test('ilk sayfayı yükler ve okunmamışları sayar', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(
          o,
          pageBody([notificationJson(id: 'n1'), notificationJson(id: 'n2', isRead: true)]),
        ),
      );
      final container = makeContainer(api);

      await settle(() => container.read(notificationFeedProvider));

      final feed = container.read(notificationFeedProvider).requireValue;
      expect(feed.items.length, 2);
      expect(feed.unreadCount, 1);
      expect(feed.hasNextPage, false);
      expect(api.called('GET', '/notifications'), true);
    });

    test('hata durumunda AsyncError olur', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500),
      );
      final container = makeContainer(api);

      await settle(() => container.read(notificationFeedProvider));

      final state = container.read(notificationFeedProvider);
      expect(state.hasError, true);
      expect(state.error, isA<NotificationFailure>());
    });

    test('refresh hatayı AsyncError olarak yazar', () async {
      var fail = false;
      final api = FakeNotificationApi(
        (o) => fail
            ? jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500)
            : jsonResponse(o, pageBody([notificationJson(id: 'n1')])),
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));
      expect(container.read(notificationFeedProvider).hasValue, true);

      fail = true;
      await container.read(notificationFeedProvider.notifier).refresh();

      expect(container.read(notificationFeedProvider).hasError, true);
    });

    test('markAsRead tek uca PATCH atar ve yerel durumu günceller', () async {
      final api = FakeNotificationApi(
        (o) => switch (o.path) {
          '/notifications/unread-count' => jsonResponse(o, unreadCountBody(0)),
          '/notifications' => jsonResponse(
              o,
              pageBody([notificationJson(id: 'n1'), notificationJson(id: 'n2')]),
            ),
          _ => jsonResponse(o, {'success': true}),
        },
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await container.read(notificationFeedProvider.notifier).markAsRead('n1');

      expect(api.called('PATCH', '/notifications/n1/read'), true);
      final feed = container.read(notificationFeedProvider).requireValue;
      expect(feed.items.firstWhere((n) => n.id == 'n1').isRead, true);
      expect(feed.items.firstWhere((n) => n.id == 'n2').isRead, false);

      await settle(() => container.read(unreadNotificationCountProvider));
      expect(container.read(unreadNotificationCountProvider).requireValue, 0);
    });

    test('zaten okunmuş bildirim için istek atılmaz', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, pageBody([notificationJson(id: 'n1', isRead: true)])),
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await container.read(notificationFeedProvider.notifier).markAsRead('n1');

      expect(api.called('PATCH', '/notifications/n1/read'), false);
    });

    test('markAsRead hatasında durum korunur, hata çağırana taşınır', () async {
      final api = FakeNotificationApi(
        (o) => switch (o.path) {
          '/notifications/unread-count' => jsonResponse(o, unreadCountBody(1)),
          '/notifications' => jsonResponse(o, pageBody([notificationJson(id: 'n1')])),
          _ => jsonResponse(o, {'success': false, 'message': 'Bildirim bulunamadı'}, status: 404),
        },
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await expectLater(
        container.read(notificationFeedProvider.notifier).markAsRead('n1'),
        throwsA(isA<NotificationFailure>()),
      );
      final feed = container.read(notificationFeedProvider).requireValue;
      expect(feed.items.single.isRead, false);
    });

    test('markAllAsRead tümünü okundu yapar', () async {
      final api = FakeNotificationApi(
        (o) => switch (o.path) {
          '/notifications/unread-count' => jsonResponse(o, unreadCountBody(0)),
          '/notifications' => jsonResponse(
              o,
              pageBody([notificationJson(id: 'n1'), notificationJson(id: 'n2')]),
            ),
          _ => jsonResponse(o, {'success': true}),
        },
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await container.read(notificationFeedProvider.notifier).markAllAsRead();

      expect(api.called('PATCH', '/notifications/read-all'), true);
      expect(container.read(notificationFeedProvider).requireValue.unreadCount, 0);
    });

    test('loadMore sonraki sayfayı listenin sonuna ekler', () async {
      final api = FakeNotificationApi((o) {
        final page = (o.queryParameters['page'] as num?)?.toInt() ?? 1;
        return jsonResponse(
          o,
          page == 1
              ? pageBody([notificationJson(id: 'n1'), notificationJson(id: 'n2')],
                  page: 1, totalPages: 2, total: 3)
              : pageBody([notificationJson(id: 'n3', isRead: true)],
                  page: 2, totalPages: 2, total: 3),
        );
      });
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await container.read(notificationFeedProvider.notifier).loadMore();

      final feed = container.read(notificationFeedProvider).requireValue;
      expect(feed.items.map((n) => n.id).toList(), ['n1', 'n2', 'n3']);
      expect(feed.page, 2);
      expect(feed.hasNextPage, false);
      expect(feed.loadingMore, false);
    });

    test('loadMore hatasında yüklenmiş kayıtlar korunur', () async {
      final api = FakeNotificationApi((o) {
        final page = (o.queryParameters['page'] as num?)?.toInt() ?? 1;
        if (page == 1) {
          return jsonResponse(
            o,
            pageBody([notificationJson(id: 'n1')], page: 1, totalPages: 2, total: 2),
          );
        }
        return jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500);
      });
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));

      await expectLater(
        container.read(notificationFeedProvider.notifier).loadMore(),
        throwsA(isA<NotificationFailure>()),
      );

      final feed = container.read(notificationFeedProvider).requireValue;
      expect(feed.items.single.id, 'n1');
      expect(feed.loadingMore, false);
      expect(feed.hasNextPage, true);
    });

    test('son sayfada loadMore istek atmaz', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, pageBody([notificationJson(id: 'n1')], total: 1)),
      );
      final container = makeContainer(api);
      await settle(() => container.read(notificationFeedProvider));
      final before = api.requests.length;

      await container.read(notificationFeedProvider.notifier).loadMore();

      expect(api.requests.length, before);
    });
  });

  group('unreadNotificationCountProvider', () {
    test('okunmamış sayısını yükler', () async {
      final api = FakeNotificationApi((o) => jsonResponse(o, unreadCountBody(5)));
      final container = makeContainer(api);

      await settle(() => container.read(unreadNotificationCountProvider));

      expect(container.read(unreadNotificationCountProvider).requireValue, 5);
    });

    test('sayaç ucu hata verirse AsyncError olur', () async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500),
      );
      final container = makeContainer(api);

      await settle(() => container.read(unreadNotificationCountProvider));

      expect(container.read(unreadNotificationCountProvider).hasError, true);
    });
  });
}
