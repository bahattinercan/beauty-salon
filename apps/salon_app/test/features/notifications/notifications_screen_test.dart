import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/core/network/api_provider.dart';
import 'package:salon_app/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:salon_app/features/notifications/presentation/widgets/notification_card.dart';

import 'notification_fake_api.dart';

/// Uygulamanın gerçek locale kurulumu: metinler Türkçe doğrulanabilsin.
Widget harness(FakeNotificationApi api, Widget child) => ProviderScope(
      overrides: [apiClientProvider.overrideWithValue(api.client())],
      child: MaterialApp(
        locale: const Locale('tr'),
        supportedLocales: const [Locale('tr'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: child,
      ),
    );

void main() {
  group('NotificationsScreen', () {
    testWidgets('boş durumda bilgilendirme gösterir', (tester) async {
      final api = FakeNotificationApi((o) => jsonResponse(o, pageBody(const [])));

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Bildirimler'), findsOneWidget);
      expect(find.text('Henüz bildiriminiz yok'), findsOneWidget);
      expect(find.byType(NotificationCard), findsNothing);
    });

    testWidgets('dolu listede başlık, gövde ve tarih çizilir', (tester) async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(
          o,
          pageBody([
            notificationJson(
              id: 'n1',
              title: 'Yeni randevu',
              body: 'Ayşe Yılmaz randevu oluşturdu',
              createdAt: '2026-02-10T09:30:00.000Z',
            ),
            notificationJson(
              id: 'n2',
              title: 'Yeni yorum',
              body: 'Müşteri yorum bıraktı',
              type: 'REVIEW',
              isRead: true,
              createdAt: '2026-03-01T14:00:00.000Z',
            ),
          ]),
        ),
      );

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();

      expect(find.byType(NotificationCard), findsNWidgets(2));
      expect(find.text('Yeni randevu'), findsOneWidget);
      expect(find.text('Ayşe Yılmaz randevu oluşturdu'), findsOneWidget);
      expect(find.text('Yeni yorum'), findsOneWidget);
      // Tür → ikon eşlemesi: randevu ve yorum kartları ayrı ikon kullanır.
      expect(find.byIcon(Icons.calendar_today), findsOneWidget);
      expect(find.byIcon(Icons.rate_review), findsOneWidget);
      // Yerel saat biçimi (UTC → cihaz saati): kart kendi formatlayıcısını kullanır.
      expect(
        find.text(NotificationCard.formatDate(DateTime.parse('2026-02-10T09:30:00.000Z'))),
        findsOneWidget,
      );
      expect(
        find.text(NotificationCard.formatDate(DateTime.parse('2026-03-01T14:00:00.000Z'))),
        findsOneWidget,
      );
    });

    testWidgets('dokunulan bildirim okundu işaretlenir', (tester) async {
      final api = FakeNotificationApi(
        (o) => switch (o.path) {
          '/notifications/unread-count' => jsonResponse(o, unreadCountBody(0)),
          '/notifications' => jsonResponse(o, pageBody([notificationJson(id: 'n1')])),
          _ => jsonResponse(o, {'success': true}),
        },
      );

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Yeni randevu'));
      await tester.pumpAndSettle();

      expect(api.called('PATCH', '/notifications/n1/read'), true);
      // Okundu işaretlenince "tümünü okundu yap" aksiyonu kaybolur.
      expect(find.byIcon(Icons.done_all), findsNothing);
    });

    testWidgets('hata durumunda ErrorState + tekrar dene gösterir', (tester) async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500),
      );

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Bir şeyler ters gitti'), findsOneWidget);
      expect(find.text('Sunucu hatası'), findsOneWidget);
      expect(find.text('Tekrar dene'), findsOneWidget);
      expect(find.byType(NotificationCard), findsNothing);
    });

    testWidgets('hata sonrası tekrar dene yeniden istek atar', (tester) async {
      var fail = true;
      final api = FakeNotificationApi(
        (o) => fail
            ? jsonResponse(o, {'success': false, 'message': 'Sunucu hatası'}, status: 500)
            : jsonResponse(o, pageBody([notificationJson(id: 'n1', title: 'Sonradan geldi')])),
      );

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();
      expect(find.text('Tekrar dene'), findsOneWidget);

      fail = false;
      await tester.tap(find.text('Tekrar dene'));
      await tester.pumpAndSettle();

      expect(find.text('Sonradan geldi'), findsOneWidget);
    });

    testWidgets('birden fazla sayfa varsa "daha fazla" butonu çizilir', (tester) async {
      final api = FakeNotificationApi(
        (o) => jsonResponse(
          o,
          pageBody([notificationJson(id: 'n1')], page: 1, totalPages: 2, total: 3),
        ),
      );

      await tester.pumpWidget(harness(api, const NotificationsScreen()));
      await tester.pumpAndSettle();

      expect(find.textContaining('Daha fazla göster'), findsOneWidget);
    });
  });

  group('NotificationBellButton', () {
    testWidgets('okunmamış sayısını rozet olarak gösterir', (tester) async {
      final api = FakeNotificationApi((o) => jsonResponse(o, unreadCountBody(3)));

      await tester.pumpWidget(
        harness(api, Scaffold(appBar: AppBar(actions: const [NotificationBellButton(onPressed: _noop)]))),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.notifications_outlined), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('sayaç sıfırsa rozet çizilmez', (tester) async {
      final api = FakeNotificationApi((o) => jsonResponse(o, unreadCountBody(0)));

      await tester.pumpWidget(
        harness(api, Scaffold(appBar: AppBar(actions: const [NotificationBellButton(onPressed: _noop)]))),
      );
      await tester.pumpAndSettle();

      expect(find.text('0'), findsNothing);
    });

    testWidgets('sayaç 99 üzerinde 99+ gösterir', (tester) async {
      final api = FakeNotificationApi((o) => jsonResponse(o, unreadCountBody(250)));

      await tester.pumpWidget(
        harness(api, Scaffold(appBar: AppBar(actions: const [NotificationBellButton(onPressed: _noop)]))),
      );
      await tester.pumpAndSettle();

      expect(find.text('99+'), findsOneWidget);
    });
  });

  group('NotificationCard.formatDate', () {
    test('yerel dd.MM.yyyy HH:mm biçimini üretir', () {
      expect(
        NotificationCard.formatDate(DateTime(2026, 2, 10, 9, 5)),
        '10.02.2026 09:05',
      );
    });
  });
}

void _noop() {}
