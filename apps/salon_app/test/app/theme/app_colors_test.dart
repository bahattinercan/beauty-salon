import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/app/theme/app_colors.dart';

/// WCAG 2.1 göreli parlaklık ve kontrast oranı.
/// Üretim kodunda renk hesabı yapılmıyor; bu yardımcılar yalnızca tema token
/// sözleşmesini denetlemek için burada.
double _relativeLuminance(Color c) {
  double lin(double v) =>
      v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  final r = lin(c.r), g = lin(c.g), b = lin(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

double contrastRatio(Color a, Color b) {
  final la = _relativeLuminance(a), lb = _relativeLuminance(b);
  final hi = la > lb ? la : lb;
  final lo = la < lb ? la : lb;
  return (hi + 0.05) / (lo + 0.05);
}

const _themes = {'light': AppColors.light, 'dark': AppColors.dark};

void main() {
  group('token sözleşmesi (AP-001 / CA-019)', () {
    for (final entry in _themes.entries) {
      test('${entry.key} temasında sözleşme tokenları dolu ve opak', () {
        final c = entry.value;
        for (final color in [
          c.divider,
          c.onPrimary,
          c.onBanner,
          c.accentLime,
          c.onAccentLime,
          c.navPill,
          c.onNavPill,
          c.onNavPillMuted,
          c.heroSurface,
        ]) {
          expect(color, isA<Color>());
          expect(color.a, 1.0, reason: '${entry.key} tokenı opak olmalı');
        }
      });
    }

    // Eski AppColors `static const` idi: dark seti yoktu. `of(context)` iki temayı
    // de döndürmeli ve token adları customer_app ile birebir aynı olmalı.
    test('light ve dark aynı rol sözlüğünü taşıyor', () {
      final l = AppColors.light, d = AppColors.dark;
      for (final pair in [
        (l.primary, d.primary),
        (l.surface, d.surface),
        (l.textHint, d.textHint),
        (l.success, d.success),
        (l.navPill, d.navPill),
      ]) {
        expect(pair.$1, isNot(pair.$2),
            reason: 'iki temada aynı değer => token rolü değil sabit renk');
      }
    });
  });

  group('WCAG AA: dolgu üstü metin daima on* tokenından', () {
    for (final entry in _themes.entries) {
      final c = entry.value;
      test('${entry.key}: primary dolgusu üzerinde metin >= 4.5:1', () {
        expect(contrastRatio(c.onPrimary, c.primary),
            greaterThanOrEqualTo(4.5));
      });
      test('${entry.key}: lime CTA dolgusu üzerinde metin >= 4.5:1', () {
        expect(contrastRatio(c.onAccentLime, c.accentLime),
            greaterThanOrEqualTo(4.5));
      });
      test('${entry.key}: gezinme hapı üzerinde etiket >= 4.5:1', () {
        expect(contrastRatio(c.onNavPill, c.navPill), greaterThanOrEqualTo(4.5));
        expect(contrastRatio(c.onNavPillMuted, c.navPill),
            greaterThanOrEqualTo(4.5));
      });
      test('${entry.key}: hero yüzeyinde gövde metni >= 4.5:1', () {
        expect(contrastRatio(c.textPrimary, c.heroSurface),
            greaterThanOrEqualTo(4.5));
        expect(contrastRatio(c.textSecondary, c.heroSurface),
            greaterThanOrEqualTo(4.5));
      });
      test('${entry.key}: rozet zemini üzerinde metin >= 4.5:1', () {
        expect(contrastRatio(c.textPrimary, c.secondary),
            greaterThanOrEqualTo(4.5));
      });
    }

    // Lime light temada metin/ikon olarak kullanılamaz (beyaz üstünde ~1.3:1).
    // Bu test, birinin `accentLime`'ı foreground yapmasını erken yakalar.
    test('lime açık zeminde metin olarak KULLANILAMAZ (< 3:1)', () {
      // LX-001 sonrası şampanya: yüzeyde 2.29, zemide 2.01, variantta 1.93:1 —
      // ikon eşiğinin (3:1) altında, yani metin/ikon olamaz; daima onAccentLime.
      expect(contrastRatio(AppColors.light.accentLime, AppColors.light.surface),
          lessThan(3.0));
      expect(
          contrastRatio(AppColors.light.accentLime, AppColors.light.background),
          lessThan(3.0));
      expect(
          contrastRatio(AppColors.light.accentLime, AppColors.light.surfaceVariant),
          lessThan(3.0));
    });

    test('nav aktifi: lime ikon koyu hap üzerinde okunur', () {
      expect(contrastRatio(AppColors.light.accentLime, AppColors.light.navPill),
          greaterThanOrEqualTo(4.5));
      expect(contrastRatio(AppColors.dark.accentLime, AppColors.dark.navPill),
          greaterThanOrEqualTo(4.5));
    });
  });

  group('WCAG AA: gövde ve durum renkleri METİN olarak', () {
    for (final entry in _themes.entries) {
      final c = entry.value;
      test('${entry.key} temasında metinler yüzey üzerinde >= 4.5:1', () {
        for (final pair in [
          (c.textPrimary, c.surface),
          (c.textSecondary, c.surface),
          (c.textHint, c.surface),
          (c.textPrimary, c.background),
          (c.textSecondary, c.background),
          (c.textHint, c.background),
          (c.textPrimary, c.surfaceVariant),
        ]) {
          expect(contrastRatio(pair.$1, pair.$2), greaterThanOrEqualTo(4.5),
              reason: 'metin ${pair.$1} yüzey ${pair.$2} üzerinde okunmuyor');
        }
      });

      test('${entry.key} temasında durum renkleri metin olarak >= 4.5:1', () {
        for (final status in [c.success, c.error, c.warning, c.info]) {
          expect(contrastRatio(status, c.surface), greaterThanOrEqualTo(4.5),
              reason: 'durum rengi $status yüzey ${c.surface} üzerinde AA değil');
        }
      });
    }
  });

  group('WCAG AA: gradyanların HER iki ucu da okunur', () {
    // Eski duraklar kırık çıktı: header #8B6DD1 beyaz üstünde 4.03:1,
    // primary #9B7FE0 3.23:1, dark header #7C5CBF koyu lacivert yazıyla 4.38:1.
    for (final entry in _themes.entries) {
      final c = entry.value;
      test('${entry.key}: header/banner gradyanı onBanner ile >= 4.5:1', () {
        for (final g in [c.headerGradient, c.bannerGradient]) {
          for (final stop in g.colors) {
            expect(contrastRatio(c.onBanner, stop), greaterThanOrEqualTo(4.5),
                reason: 'banner durağı $stop üzerinde metin okunmuyor');
          }
        }
      });
      test('${entry.key}: primary/cta/stat gradyanı onPrimary ile >= 4.5:1', () {
        // Stat kartı gradyanları (info/success/warning) de dolgu: üstlerindeki
        // metin daima onPrimary — iki uç da AA vermek zorunda (madde 5).
        for (final g in [
          c.primaryGradient,
          c.ctaGradient,
          c.infoGradient,
          c.successGradient,
          c.warningGradient,
        ]) {
          for (final stop in g.colors) {
            expect(contrastRatio(c.onPrimary, stop), greaterThanOrEqualTo(4.5),
                reason: 'gradyan durağı $stop üzerinde metin okunmuyor');
          }
        }
      });
      test('${entry.key}: soft gradyan üzerinde gövde metni >= 4.5:1', () {
        for (final stop in c.softGradient.colors) {
          expect(contrastRatio(c.textPrimary, stop), greaterThanOrEqualTo(4.5));
        }
      });
    }
  });
  group('LX-001 palet kilitleri (değer kaynağı: plans/saloon/SA-002)', () {
    // Kontrast kapıları tek başına yeterli değil: bir token palet dışına çıkıp
    // "AA geçen başka bir renk"e dönüşebilir. Bu test değerleri birebir kilitler,
    // eşiği düşürmez; palet değişecekse önce SA-002 ve 08-design-system.md değişir.
    test('light seti LX-001 değerleriyle birebir', () {
      final c = AppColors.light;
      for (final p in <(Color, int)>[
        (c.background, 0xFFF4EEE3),
        (c.surface, 0xFFFFFDF8),
        (c.surfaceVariant, 0xFFF1E9DC),
        (c.divider, 0xFFE3D9C7),
        (c.textPrimary, 0xFF1A1815),
        (c.textSecondary, 0xFF5C5449),
        (c.textHint, 0xFF736959),
        (c.primary, 0xFF4E3893),
        (c.primaryDark, 0xFF43307F),
        (c.primaryLight, 0xFF6B4FB8),
        (c.onPrimary, 0xFFFFFFFF),
        (c.secondary, 0xFFEFE6D8),
        (c.secondaryDark, 0xFFE0D3BE),
        (c.accent, 0xFF7C5CBF),
        (c.accentLight, 0xFFA98FD8),
        (c.accentLime, 0xFFC6A664), // ad korunur, deger sampanya altini
        (c.onAccentLime, 0xFF1A1815),
        (c.navPill, 0xFF1A1815),
        (c.onNavPill, 0xFFF4EEE3),
        (c.onNavPillMuted, 0xFFB7AC99),
        (c.heroSurface, 0xFFEFE6D8),
        (c.onBanner, 0xFFFFFFFF),
        (c.starFilled, 0xFFA87B1F),
        (c.starEmpty, 0xFFDDD3C2),
        (c.success, 0xFF2F6B4F),
        (c.error, 0xFFA8323C),
        (c.warning, 0xFF7A5200),
        (c.info, 0xFF2A5A8C),
        (c.shadowCard, 0x0D1A1815),
        (c.shadowRaised, 0x121A1815),
      ]) {
        expect(p.$1, Color(p.$2));
      }
    });

    test('dark seti LX-001 değerleriyle birebir', () {
      final c = AppColors.dark;
      for (final p in <(Color, int)>[
        (c.background, 0xFF14110D),
        (c.surface, 0xFF221C16),
        (c.surfaceVariant, 0xFF2C241C),
        (c.divider, 0xFF332B22),
        (c.textPrimary, 0xFFF4EDE1),
        (c.textSecondary, 0xFFBDB2A0),
        (c.textHint, 0xFF9A8F7C),
        (c.primary, 0xFF9C82DC),
        (c.primaryDark, 0xFF8F72D8),
        (c.primaryLight, 0xFFB29AE8),
        (c.onPrimary, 0xFF14110D),
        (c.secondary, 0xFF2C241C),
        (c.secondaryDark, 0xFF3D3327),
        (c.accent, 0xFFB29AE8),
        (c.accentLight, 0xFFC9B6F0),
        (c.accentLime, 0xFFD8B872),
        (c.onAccentLime, 0xFF14110D),
        (c.navPill, 0xFF0E0B08),
        (c.onNavPill, 0xFFF4EDE1),
        (c.onNavPillMuted, 0xFFA79C88),
        (c.heroSurface, 0xFF2C241C),
        (c.onBanner, 0xFFFFFFFF),
        (c.starFilled, 0xFFD8B872),
        (c.starEmpty, 0xFF3D3327),
        (c.success, 0xFF6FC08F),
        (c.error, 0xFFF08A8A),
        (c.warning, 0xFFE0B060),
        (c.info, 0xFF8AB4E8),
        (c.shadowCard, 0x00000000),
        (c.shadowRaised, 0x00000000),
      ]) {
        expect(p.$1, Color(p.$2));
      }
    });

    // LX-001 kuralı: şampanya (accentLime) asla metin rengi olmaz; yalnızca dolgu,
    // kenarlık, hairline, ikon. Ölçüm kapısı yukarıdaki 'lime' testinde: koyu temada
    // şampanya koyu zemine karşı 8.85:1 okunur olur, bu yüzden kapı yalnızca açık
    // zeminde anlamlıdır (renk tek başına yetmez, kullanım yasağı SA-002'de yazılı).
  });

  group('gölge ve puan tokenları', () {
    // AP-001 kuralı: gölge yalnızca açık temada; koyuda yüzey ayrımı kenarlıkla.
    test('açık temada gölge tokenları görünür, koyumda kapalı', () {
      expect(AppColors.light.shadowCard.a,
          inInclusiveRange(0.01, 0.25));
      expect(AppColors.light.shadowRaised.a,
          inInclusiveRange(0.01, 0.25));
      expect(AppColors.dark.shadowCard.a, 0.0);
      expect(AppColors.dark.shadowRaised.a, 0.0);
    });

    // Yildiz bir ikondur: WCAG non-text 3:1. Eski deger (#FFB547) yuzey ustunde 1.76:1'di.
    for (final entry in _themes.entries) {
      test('${entry.key}: yildiz dolgusu yuzey üzerinde >= 3:1', () {
        expect(contrastRatio(entry.value.starFilled, entry.value.surface),
            greaterThanOrEqualTo(3.0));
        expect(contrastRatio(entry.value.starFilled, entry.value.surfaceVariant),
            greaterThanOrEqualTo(3.0));
      });
    }
  });
}
