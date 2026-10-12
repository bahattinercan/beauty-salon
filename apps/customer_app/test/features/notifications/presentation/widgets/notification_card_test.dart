import 'package:customer_app/features/notifications/domain/entities/notification_item.dart';
import 'package:customer_app/features/notifications/presentation/widgets/notification_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const n = NotificationItem(
    id: '1',
    title: 'Randevu hatırlatması',
    body: 'Randevunuz 1 saat sonra',
    type: 'APPOINTMENT',
    createdAt: '2026-01-12T14:30:00Z',
  );

  Future<void> pump(WidgetTester tester, {required bool unread, VoidCallback? onTap}) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: NotificationCard(
            notification: unread ? n : n.copyWith(isRead: true),
            onTap: onTap ?? () {},
          ),
        ),
      ),
    );
    await tester.pump();
  }

  group('NotificationCard', () {
    testWidgets('başlık, gövde ve tip etiketi gösterilir', (tester) async {
      await pump(tester, unread: true);

      expect(find.text('Randevu hatırlatması'), findsOneWidget);
      expect(find.text('Randevunuz 1 saat sonra'), findsOneWidget);
      expect(find.text('Appointment'), findsOneWidget);
    });

    testWidgets('tap callback çağrılır', (tester) async {
      var tapped = false;
      await pump(tester, unread: true, onTap: () => tapped = true);

      await tester.tap(find.byType(InkWell));
      await tester.pump();

      expect(tapped, isTrue);
    });

    testWidgets('okunmuş kartta tip etiketi yine gösterilir, timeAgo boş değil',
        (tester) async {
      await pump(tester, unread: false);

      expect(find.text('Appointment'), findsOneWidget);
      expect(find.textContaining('ay önce'), findsOneWidget);
    });
  });
}
