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
    // LX-001: dark primary #9C82DC + onPrimary #14110D = 5.95:1.
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

    // accentLime artık ŞAMPANYA altınıdır (CA-021/LX-001): light #C6A664 yüzey
    // üzerinde 2.29:1, dark #D8B872 8.85:1. Dark'te kontrast yeterli olsa da kural
    // temadır: accentLime YALNIZCA dolgu/kenarlık/ikon olur, üstündeki metin daima
    // onAccentLime'den gelir. Bu test birinin accentLime'ı foreground yapmasını
    // erken yakalar.
    test('lime (şampanya) light zeminde metin olarak KULLANILAMAZ (< 3:1)', () {
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

    // Banner üstündeki karşılama/başlık metni: LX-001 durakları light #4E3893 → #2A1F52,
    // dark #3A2A6E → #1E1440; en düşük çift 9.09:1 (eskiden light'ta #8B6DD1 ile
    // 4.05:1'di). Gradyan durakları token testi ile kilitli.
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
  // LX-001 (CA-021) Lux Editorial paleti: token hexleri ve gradyan durakları burada
  // kilitlidir. Kontrast kapıları yukarıdaki group'lardadır; bu group tasarımın
  // KENDİSİNİ kilitler, böylece token sessizce değişirse test kırmızı olur.
  group('LX-001 Lux Editorial paleti kilitli', () {
    test('light tokenları beklenen hexlerde', () {
      final c = AppColors.light;
      expect(c.background, const Color(0xFFF4EEE3));
      expect(c.surface, const Color(0xFFFFFDF8));
      expect(c.surfaceVariant, const Color(0xFFF1E9DC));
      expect(c.divider, const Color(0xFFE3D9C7));
      expect(c.textPrimary, const Color(0xFF1A1815));
      expect(c.textSecondary, const Color(0xFF5C5449));
      expect(c.textHint, const Color(0xFF736959));
      expect(c.primary, const Color(0xFF4E3893));
      expect(c.primaryDark, const Color(0xFF43307F));
      expect(c.primaryLight, const Color(0xFF6B4FB8));
      expect(c.onPrimary, const Color(0xFFFFFFFF));
      expect(c.secondary, const Color(0xFFEFE6D8));
      expect(c.secondaryDark, const Color(0xFFE0D3BE));
      expect(c.accent, const Color(0xFF7C5CBF));
      expect(c.accentLight, const Color(0xFFA98FD8));
      expect(c.accentLime, const Color(0xFFC6A664));
      expect(c.onAccentLime, const Color(0xFF1A1815));
      expect(c.navPill, const Color(0xFF1A1815));
      expect(c.onNavPill, const Color(0xFFF4EEE3));
      expect(c.heroSurface, const Color(0xFFEFE6D8));
      expect(c.onBanner, const Color(0xFFFFFFFF));
      expect(c.starFilled, const Color(0xFFA87B1F));
      expect(c.starEmpty, const Color(0xFFDDD3C2));
      expect(c.success, const Color(0xFF2F6B4F));
      expect(c.error, const Color(0xFFA8323C));
      expect(c.warning, const Color(0xFF7A5200));
      expect(c.info, const Color(0xFF2A5A8C));
      expect(c.shadowCard, const Color(0x0D1A1815));
      expect(c.shadowRaised, const Color(0x121A1815));
      expect(c.shadowFloat, const Color(0x1A1A1815));
      expect(c.shadowPill, const Color(0x381A1815));
    });

    test('dark tokenları beklenen hexlerde', () {
      final c = AppColors.dark;
      expect(c.background, const Color(0xFF14110D));
      expect(c.surface, const Color(0xFF221C16));
      expect(c.surfaceVariant, const Color(0xFF2C241C));
      expect(c.divider, const Color(0xFF332B22));
      expect(c.textPrimary, const Color(0xFFF4EDE1));
      expect(c.textSecondary, const Color(0xFFBDB2A0));
      expect(c.textHint, const Color(0xFF9A8F7C));
      expect(c.primary, const Color(0xFF9C82DC));
      expect(c.primaryDark, const Color(0xFF8F72D8));
      expect(c.primaryLight, const Color(0xFFB29AE8));
      expect(c.onPrimary, const Color(0xFF14110D));
      expect(c.secondary, const Color(0xFF2C241C));
      expect(c.secondaryDark, const Color(0xFF3D3327));
      expect(c.accent, const Color(0xFFB29AE8));
      expect(c.accentLight, const Color(0xFFC9B6F0));
      expect(c.accentLime, const Color(0xFFD8B872));
      expect(c.onAccentLime, const Color(0xFF14110D));
      expect(c.navPill, const Color(0xFF0E0B08));
      expect(c.onNavPill, const Color(0xFFF4EDE1));
      expect(c.heroSurface, const Color(0xFF2C241C));
      expect(c.onBanner, const Color(0xFFFFFFFF));
      expect(c.starFilled, const Color(0xFFD8B872));
      expect(c.starEmpty, const Color(0xFF3D3327));
      expect(c.success, const Color(0xFF6FC08F));
      expect(c.error, const Color(0xFFF08A8A));
      expect(c.warning, const Color(0xFFE0B060));
      expect(c.info, const Color(0xFF8AB4E8));
      for (final s in [
        c.shadowCard,
        c.shadowRaised,
        c.shadowFloat,
        c.shadowPill,
      ]) {
        expect(s, const Color(0x00000000));
      }
    });

    test('gradyan durakları LX-001 ile güncel', () {
      final l = AppColors.light, d = AppColors.dark;
      expect(l.primaryGradient.colors,
          [const Color(0xFF6B4FB8), const Color(0xFF4E3893)]);
      expect(l.bannerGradient.colors,
          [const Color(0xFF4E3893), const Color(0xFF2A1F52)]);
      expect(l.softGradient.colors,
          [const Color(0xFFF1E9DC), const Color(0xFFF4EEE3)]);
      expect(l.goldGradient.colors,
          [const Color(0xFFC6A664), const Color(0xFFE4D3A3)]);
      expect(l.darkBannerGradient.colors,
          [const Color(0xFF3A2A6E), const Color(0xFF1E1440)]);
      expect(l.ctaGradient.colors,
          [const Color(0xFF4E3893), const Color(0xFF43307F)]);
      expect(d.primaryGradient.colors,
          [const Color(0xFFB29AE8), const Color(0xFF8F72D8)]);
      expect(d.bannerGradient.colors,
          [const Color(0xFF3A2A6E), const Color(0xFF1E1440)]);
      expect(d.softGradient.colors,
          [const Color(0xFF2C241C), const Color(0xFF14110D)]);
      expect(d.goldGradient.colors,
          [const Color(0xFFD8B872), const Color(0xFF8F6F3A)]);
      expect(d.darkBannerGradient.colors,
          [const Color(0xFF3A2A6E), const Color(0xFF1E1440)]);
      expect(d.ctaGradient.colors,
          [const Color(0xFF8F72D8), const Color(0xFF9C82DC)]);
      // begin/end LX-001 ile DEĞİŞMEDİ.
      expect(l.bannerGradient.begin, Alignment.topLeft);
      expect(l.bannerGradient.end, Alignment.bottomCenter);
      expect(d.bannerGradient.begin, Alignment.topLeft);
      expect(d.bannerGradient.end, Alignment.bottomCenter);
    });
  });

  group('gölge ve puan tokenları (SA-001 ile aynı kapı)', () {
    // AP-001/SA-001 kurali: gölge yalnizca açık temada; koyuda yüzey ayrımı
    // kenarlıkla yapılır, gölge koyu zeminde kaybolur.
    test('açık temada gölgeler görünür, koyu temada kapalı', () {
      for (final c in [AppColors.light.shadowCard, AppColors.light.shadowRaised,
            AppColors.light.shadowFloat, AppColors.light.shadowPill]) {
        expect(c.a, greaterThanOrEqualTo(0.01));
        expect(c.a, lessThanOrEqualTo(0.25));
      }
      for (final c in [AppColors.dark.shadowCard, AppColors.dark.shadowRaised,
            AppColors.dark.shadowFloat, AppColors.dark.shadowPill]) {
        expect(c.a, 0.0);
      }
    });

    // Fotoğraf üstü karartma gölge değildir; iki temada da kalmalı.
    test('kapak karartma tokenları iki temada da korunuyor', () {
      expect(AppColors.dark.coverScrimButton.a, greaterThanOrEqualTo(0.30));
      expect(AppColors.dark.coverScrimFade.a, greaterThanOrEqualTo(0.30));
    });

    // Yildiz bir ikon: WCAG non-text esigi 3:1. Eski deger (#FFB547) yuzey
    // üzerinde 1.76:1'di; LX-001 ile light #A87B1F (3.74:1), dark #D8B872 (8.85:1).
    test('yildiz dolgusu yüzey üzerinde >= 3:1 (light + dark)', () {
      expect(contrastRatio(AppColors.light.starFilled, AppColors.light.surface),
          greaterThanOrEqualTo(3.0));
      expect(contrastRatio(AppColors.light.starFilled, AppColors.light.background),
          greaterThanOrEqualTo(3.0));
      expect(contrastRatio(AppColors.dark.starFilled, AppColors.dark.surface),
          greaterThanOrEqualTo(3.0));
      expect(contrastRatio(AppColors.dark.starFilled, AppColors.dark.background),
          greaterThanOrEqualTo(3.0));
    });
  });
}
