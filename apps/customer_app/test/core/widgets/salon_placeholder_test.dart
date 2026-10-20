import 'package:customer_app/core/widgets/salon_placeholder.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SalonPlaceholder deterministik tohumlama', () {
    test('aynı id her çağrıda aynı paleti ve ikonunu verir', () {
      const id = 'b53e9d24-5f2f-404e-a038-4011c6307f79';
      final a = SalonPlaceholder.paletteFor(id);
      final b = SalonPlaceholder.paletteFor(id);
      expect(a, b);
      expect(SalonPlaceholder.iconFor(id), SalonPlaceholder.iconFor(id));
    });

    // 12 kartın hepsi özdeş mor blokta duruyordu; amaç en az 4 farklı varyant.
    test('farklı idler çeşitli palet üretir (tek renk bloğu regresyonuna karşı)',
        () {
      final palettes = <String>{};
      final icons = <IconData>{};
      for (var i = 0; i < 12; i++) {
        final seed = 'salon-$i';
        palettes.add(SalonPlaceholder.paletteFor(seed).map((c) => c.toARGB32()).join(','));
        icons.add(SalonPlaceholder.iconFor(seed));
      }
      expect(palettes.length, greaterThanOrEqualTo(4));
      expect(icons.length, greaterThanOrEqualTo(3));
    });

    test('boş tohum çökmez, varsayılana düşer', () {
      expect(SalonPlaceholder.paletteFor(''), isNotEmpty);
      expect(SalonPlaceholder.iconFor(''), Icons.spa);
    });
  });

  testWidgets('SalonPlaceholder Semantics etiketiyle render edilir',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Center(
          child: SizedBox(
            width: 260,
            child: SalonPlaceholder(
              seed: 'salon-1',
              semanticsLabel: 'Elegance Beauty Studio',
              height: 140,
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.byType(SalonPlaceholder), findsOneWidget);
    expect(
      tester.getRect(find.byType(SalonPlaceholder)).height,
      closeTo(140, 0.5),
    );
  });
}
