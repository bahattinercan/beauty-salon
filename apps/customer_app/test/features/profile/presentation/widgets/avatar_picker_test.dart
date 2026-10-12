import 'package:customer_app/features/profile/presentation/widgets/avatar_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _pump(WidgetTester tester, AvatarPicker widget) async {
  await tester.pumpWidget(MaterialApp(home: Scaffold(body: widget)));
  await tester.pump();
}

void main() {
  group('AvatarPicker', () {
    testWidgets('avatar yoksa initials gösterilir', (tester) async {
      await _pump(tester, const AvatarPicker(initials: 'AB'));

      expect(find.text('AB'), findsOneWidget);
    });

    testWidgets('yüklenirken spinner gösterilir ve buton devre dışı', (tester) async {
      var tapped = false;
      await _pump(
        tester,
        AvatarPicker(initials: 'AB', uploading: true, onTap: () => tapped = true),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.tap(find.byIcon(Icons.camera_alt));
      await tester.pump();
      expect(tapped, isFalse);
    });

    testWidgets('kamera rozetine tap fonksiyonu çağırır', (tester) async {
      var tapped = false;
      await _pump(tester, AvatarPicker(initials: 'AB', onTap: () => tapped = true));

      await tester.tap(find.byIcon(Icons.camera_alt));
      await tester.pump();
      expect(tapped, isTrue);
    });
  });
}
