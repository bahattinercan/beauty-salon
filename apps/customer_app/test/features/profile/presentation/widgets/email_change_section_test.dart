import 'package:customer_app/features/profile/presentation/widgets/email_change_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late TextEditingController emailController;

  setUp(() => emailController = TextEditingController(text: 'ada@ornek.com'));
  tearDown(() => emailController.dispose());

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: EmailChangeSection(
              emailController: emailController,
              originalEmail: 'ada@ornek.com',
            ),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  group('EmailChangeSection', () {
    testWidgets('başlangıçta kod alanı yok, gönder butonu var', (tester) async {
      await pump(tester);

      expect(find.text('Send Verification Code'), findsOneWidget);
      expect(find.text('Confirm Email Change'), findsNothing);
    });

    testWidgets('e-posta değişmediyse kod gönderilmez', (tester) async {
      await pump(tester);

      await tester.tap(find.text('Send Verification Code'));
      await tester.pump();

      expect(find.text('Same as current email'), findsOneWidget);
      expect(find.text('Confirm Email Change'), findsNothing);
    });

    testWidgets('geçersiz e-posta formatında uyarı gösterilir', (tester) async {
      emailController.text = 'ada@';

      await pump(tester);
      await tester.tap(find.text('Send Verification Code'));
      await tester.pump();

      expect(find.text('Enter a valid email'), findsOneWidget);
    });
  });
}
