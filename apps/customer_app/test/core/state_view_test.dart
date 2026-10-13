import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/core/widgets/state_view.dart';

void main() {
  group('AsyncStateView', () {
    testWidgets('loading durumunda skeleton gösterir', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AsyncStateView<String>(
            value: const AsyncLoading(),
            data: (v) => Text(v),
            skeleton: const SkeletonList(count: 2, itemHeight: 40),
          ),
        ),
      );
      expect(find.byType(SkeletonList), findsOneWidget);
      expect(find.byType(Skeleton), findsNWidgets(2));
    });

    testWidgets('error durumunda retry butonu çalışır', (tester) async {
      int retries = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: AsyncStateView<String>(
            value: AsyncError(Exception('network'), StackTrace.current),
            data: (v) => Text(v),
            onRetry: () => retries++,
          ),
        ),
      );

      expect(find.byType(ErrorState), findsOneWidget);
      await tester.tap(find.byType(ElevatedButton));
      expect(retries, 1);
    });

    testWidgets('boş veri EmptyState gösterir', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AsyncStateView<List<String>>(
            value: const AsyncData(<String>[]),
            data: (list) => Text('data'),
            isEmpty: (list) => list.isEmpty,
            empty: const EmptyState(message: 'Sonuç yok', subMessage: 'Filtreleri temizle'),
          ),
        ),
      );

      expect(find.byType(EmptyState), findsOneWidget);
      expect(find.text('Sonuç yok'), findsOneWidget);
      expect(find.text('Filtreleri temizle'), findsOneWidget);
      expect(find.text('data'), findsNothing);
    });
  });
}
