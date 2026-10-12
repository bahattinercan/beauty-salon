import 'package:customer_app/features/auth/presentation/screens/reset_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _pumpScreen(
  WidgetTester tester, {
  String? initialEmail,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        home: ResetPasswordScreen(initialEmail: initialEmail),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  testWidgets('ResetPasswordScreen hatasız render edilir (email sabit)',
      (tester) async {
    await _pumpScreen(tester, initialEmail: 'user@example.com');

    expect(find.text('Reset Password'), findsWidgets);
    expect(find.text('user@example.com'), findsOneWidget);
    // 6 OTP kutusu + 2 şifre alanı
    expect(find.byType(TextField), findsNWidgets(8));
    expect(find.text('Reset Password'), findsWidgets);
  });

  testWidgets('ResetPasswordScreen email parametresizken email alanı çizer',
      (tester) async {
    await _pumpScreen(tester);

    // email + yeni şifre + tekrar (OTP kutuları TextField'dir)
    expect(find.byType(TextFormField), findsNWidgets(3));
  });

  testWidgets('eksik OTP ile gönderimde validasyon hatası gösterilir',
      (tester) async {
    await _pumpScreen(tester, initialEmail: 'user@example.com');

    final resetButton = find.text('Reset Password').last;
    await tester.ensureVisible(resetButton);
    await tester.pumpAndSettle();
    await tester.tap(resetButton);
    await tester.pump();

    expect(find.text('Enter the 6-digit code'), findsOneWidget);
  });
}
