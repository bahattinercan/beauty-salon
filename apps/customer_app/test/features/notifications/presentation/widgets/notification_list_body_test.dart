import 'package:customer_app/features/notifications/domain/entities/notification_item.dart';
import 'package:customer_app/features/notifications/domain/entities/notification_page.dart';
import 'package:customer_app/features/notifications/presentation/widgets/notification_list_body.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Future<void> pump(WidgetTester tester, NotificationPage page) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: NotificationListBody(page: page, onTap: (_) {}, onLoadMore: () {}),
        ),
      ),
    );
    await tester.pump();
  }

  testWidgets('boş listede empty state gösterilir', (tester) async {
    await pump(tester, const NotificationPage(items: [], page: 1, totalPages: 1));

    expect(find.text('No notifications'), findsOneWidget);
    expect(find.text('Notifications will appear here'), findsOneWidget);
    expect(find.byType(TextButton), findsNothing);
  });

  testWidgets('son sayfada kart gösterilir, load-more butonu yok', (tester) async {
    await pump(
      tester,
      const NotificationPage(
        items: [
          NotificationItem(
            id: '1',
            title: 'Randevu',
            body: '1 saat sonra',
            type: 'APPOINTMENT',
            createdAt: '2026-01-12',
          ),
        ],
        page: 1,
        totalPages: 1,
      ),
    );

    expect(find.byType(TextButton), findsNothing);
    expect(find.text('Randevu'), findsOneWidget);
  });

  testWidgets('sayfa varsa load-more butonu gösterilir', (tester) async {
    await pump(
      tester,
      const NotificationPage(
        items: [
          NotificationItem(
            id: '1',
            title: 'Randevu',
            body: 'b',
            type: 'SYSTEM',
            createdAt: '2026-01-12',
          ),
        ],
        page: 1,
        totalPages: 2,
      ),
    );

    expect(find.byType(TextButton), findsOneWidget);
  });
}
