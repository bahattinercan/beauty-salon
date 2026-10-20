import 'dart:math' as math;

import 'package:customer_app/app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// WCAG 2.1 göreli parlaklık ve kontrast oranı.
/// Üretim kodunda renk hesabı yapmıyoruz; bu yardımcı yalnızca tema token
/// sözleşmesini test etmesi için buradadır.
double _relativeLuminance(Color c) {
  double lin(double v) =>
      v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  final r = lin(c.r), g = lin(c.g), b = lin(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

double contrastRatio(Color a, Color b) {
  final la = _relativeLuminance(a), lb = _relativeLuminance(b);
  final hi = la > lb ? la : lb;
  final lo = la > lb ? lb : la;
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  group('yeni tokenlar (CA-019) tanımlı', () {
    for (final entry in {'light': AppColors.light, 'dark': AppColors.dark}.entries) {
      test('${entry.key} temasında 8 yeni token dolu', () {
        final c = entry.value;
        for (final color in [
          c.divider,
          c.onPrimary,
          c.onBanner,
          c.accentLime,
          c.onAccentLime,
          c.navPill,
          c.onNavPill,
          c.heroSurface,
        ]) {
          expect(color, isA<Color>());
          expect(color.a, 1.0, reason: '${entry.key} tokenı opak olmalı');
        }
      });
    }
  });

  group('WCAG AA sözleşmesi', () {
    test('light: primary dolgusu üzerinde metin >= 4.5:1', () {
      expect(contrastRatio(AppColors.light.onPrimary, AppColors.light.primary),
          greaterThanOrEqualTo(4.5));
    });

    // Dark temada primary açılır; beyaz metin 3.19:1'e düşüyordu (regresyon kilidi).
    test('dark: primary dolgusu üzerinde metin >= 4.5:1', () {
      expect(contrastRatio(AppColors.dark.onPrimary, AppColors.dark.primary),
          greaterThanOrEqualTo(4.5));
    });

    test('lime CTA dolgusu üzerinde metin her iki temada >= 4.5:1', () {
      expect(
          contrastRatio(AppColors.light.onAccentLime, AppColors.light.accentLime),
          greaterThanOrEqualTo(4.5));
      expect(
          contrastRatio(AppColors.dark.onAccentLime, AppColors.dark.accentLime),
          greaterThanOrEqualTo(4.5));
    });

    // Lime light temada metin/ikon olarak kullanılamaz (beyaz zeminde ~1.31:1).
    // Dark zeminde kontrastı yeterli olsa da kural temadır: lime YALNIZCA dolguda
    // kullanılır, üstündeki metin daima onAccentLime olur. Bu test birinin
    // accentLime'ı foreground yapmasını erken yakalar.
    test('lime light zeminde metin olarak KULLANILAMAZ (< 3:1)', () {
      expect(contrastRatio(AppColors.light.accentLime, AppColors.light.surface),
          lessThan(3.0));
      expect(
          contrastRatio(AppColors.light.accentLime, AppColors.light.background),
          lessThan(3.0));
    });

    test('bottom nav pill: zemin üzerinde etiket metni >= 4.5:1', () {
      expect(contrastRatio(AppColors.light.onNavPill, AppColors.light.navPill),
          greaterThanOrEqualTo(4.5));
      expect(contrastRatio(AppColors.dark.onNavPill, AppColors.dark.navPill),
          greaterThanOrEqualTo(4.5));
    });

    test('hero promo yüzeyinde gövde metni >= 4.5:1', () {
      expect(
          contrastRatio(
              AppColors.light.textPrimary, AppColors.light.heroSurface),
          greaterThanOrEqualTo(4.5));
      expect(
          contrastRatio(AppColors.dark.textPrimary, AppColors.dark.heroSurface),
          greaterThanOrEqualTo(4.5));
    });

    test('nav aktifi: lime ikon koyu pill üzerinde okunur', () {
      expect(contrastRatio(AppColors.light.accentLime, AppColors.light.navPill),
          greaterThanOrEqualTo(4.5));
      expect(contrastRatio(AppColors.dark.accentLime, AppColors.dark.navPill),
          greaterThanOrEqualTo(4.5));
    });

    // Auth CTA'sı ctaGradient kullanır; gradyanın her iki ucunda da onPrimary
    // okunur olmalı (primaryGradient'in açık ucu AA altında kalıyordu).
    test('CTA gradyanının iki ucunda da onPrimary >= 4.5:1', () {
      for (final c in [AppColors.light, AppColors.dark]) {
        for (final stop in c.ctaGradient.colors) {
          expect(contrastRatio(c.onPrimary, stop), greaterThanOrEqualTo(4.5));
        }
      }
    });

    // Banner üstündeki karşılama/başlık metni: light temada en açık durak
    // #8B6DD1 iken beyaz 4.05:1 kalıyordu (alpha'lı satır 3.35:1) -> AA ihlali.
    // Gradyan durakları artık token testi ile kilitli.
    test('banner gradyanının her iki ucunda da onBanner >= 4.5:1', () {
      for (final c in [AppColors.light, AppColors.dark]) {
        for (final stop in c.bannerGradient.colors) {
          expect(contrastRatio(c.onBanner, stop), greaterThanOrEqualTo(4.5),
              reason: 'banner durağı $stop üstünde metin okunmuyor');
        }
      }
    });
  });

  group('gövde metni iki temada da AA', () {
    test('textPrimary / surface', () {
      expect(
          contrastRatio(
              AppColors.light.textPrimary, AppColors.light.surface),
          greaterThanOrEqualTo(4.5));
      expect(
          contrastRatio(AppColors.dark.textPrimary, AppColors.dark.surface),
          greaterThanOrEqualTo(4.5));
    });
  });
}
