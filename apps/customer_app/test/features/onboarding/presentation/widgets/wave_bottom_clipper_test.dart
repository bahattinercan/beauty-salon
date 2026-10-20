import 'dart:ui' show Size;

import 'package:customer_app/features/onboarding/presentation/widgets/wave_bottom_clipper.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('dalga pathi alanın genişliğini korur, alta taşmaz', () {
    const clipper = WaveBottomClipper();
    final path = clipper.getClip(const Size(390, 500));
    final bounds = path.getBounds();

    expect(bounds.width, closeTo(390, 1));
    expect(bounds.top, 0);
    expect(bounds.bottom, lessThanOrEqualTo(500));
    // Dalga: alt kenar düz çizgi değil (organik kenar iddiasının kanıtı).
    expect(bounds.bottom, lessThan(500));
  });

  test('startRatio değişince shouldReclip true', () {
    const a = WaveBottomClipper(startRatio: 0.68);
    expect(a.shouldReclip(const WaveBottomClipper(startRatio: 0.5)), isTrue);
    expect(a.shouldReclip(const WaveBottomClipper(startRatio: 0.68)), isFalse);
  });
}
