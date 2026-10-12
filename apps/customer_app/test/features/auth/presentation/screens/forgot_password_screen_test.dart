import 'package:customer_app/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> _pumpScreen(WidgetTester tester) async {
  await tester.pumpWidget(
    const ProviderScope(
      child: MaterialApp(home: ForgotPasswordScreen()),
    ),
  );
  await tester.pump();
}

void main() {
  testWidgets('ForgotPasswordScreen hatasız render edilir', (tester) async {
    await _pumpScreen(tester);

    expect(find.text('Forgot Password'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
    expect(find.text('Send Code'), findsOneWidget);
  });

  testWidgets('boş e-posta ile gönderimde validasyon hatası gösterilir',
      (tester) async {
    await _pumpScreen(tester);

    await tester.tap(find.text('Send Code'));
    await tester.pump();

    expect(find.text('Email is required'), findsOneWidget);
  });
}
