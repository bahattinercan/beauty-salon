import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:customer_app/features/salon_detail/presentation/widgets/working_hours_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const salon = SalonDetail(
    id: '1',
    name: 'Salon',
    address: 'Adres',
    ratingAvg: 4.5,
    reviewCount: 2,
    workingHours: {
      'monday': {'open': '09:00', 'close': '18:00'},
      'tuesday': {'open': '09:30', 'close': '17:30'},
      'wednesday': {'open': '10:00', 'close': '17:00'},
      'thursday': {'open': '09:15', 'close': '18:15'},
      'friday': {'open': '09:45', 'close': '16:45'},
      'saturday': {'open': '10:00', 'close': '16:00'},
      'sunday': {'open': null, 'close': null},
    },
  );

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          // WorkingHoursSection bir sliver döndürüyor (SalonInfoSection gibi),
          // bu yüzden sliver parent içinde test edilmeli.
          body: CustomScrollView(slivers: [WorkingHoursSection(salon: salon)]),
        ),
      ),
    );
    await tester.pump();
  }

  group('WorkingHoursSection', () {
    testWidgets('başlık ve 7 gün satırı gösterilir', (tester) async {
      await pump(tester);

      expect(find.text('Working Hours'), findsOneWidget);
      expect(find.text('Monday'), findsOneWidget);
      expect(find.text('Sunday'), findsOneWidget);
    });

    testWidgets('açık gün saat aralığını, kapalı gün Closed gösterir', (tester) async {
      await pump(tester);

      expect(find.text('09:00 - 18:00'), findsOneWidget);
      expect(find.text('Closed'), findsOneWidget);
    });
    testWidgets('kapalı gün listesi eksik günleri de kapalı sayar', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomScrollView(
              slivers: [
                WorkingHoursSection(
                  salon: const SalonDetail(
                    id: '1',
                    name: 'Salon',
                    address: 'Adres',
                    ratingAvg: 0,
                    reviewCount: 0,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Closed'), findsNWidgets(7));
    });
  });
}
