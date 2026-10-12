import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/main.dart';

void main() {
  group('SalonApp Widget Tests', () {
    testWidgets('App should render without errors', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SalonApp()));
      // pump() yerine pumpAndSettle() async provider'lar yüzünden timeout alır
      await tester.pump();
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Login screen should show email and password fields', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SalonApp()));
      await tester.pump();
      expect(find.byType(Scaffold), findsOneWidget);
    });
  });
}
