import 'package:flutter/material.dart';

class AppColors {
  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color secondary;
  final Color secondaryDark;
  final Color accent;
  final Color accentLight;
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color textPrimary;
  final Color textSecondary;
  final Color textHint;
  final Color success;
  final Color error;
  final Color warning;
  final Color info;
  final Color starFilled;
  final Color starEmpty;

  // Gölge tokenları (AP-001/SA-001 kuralı): gölge YALNIZCA açık temada.
  // Koyu tema yüzeyleri üst üste binince gölge görünmüyor; ayrım kenarlıkla
  // yapılıyor, bu yüzden koyuda gölgelerin opaklığı 0.
  final Color shadowCard;      // kartlar (eski %4 siyah)
  final Color shadowRaised;    // öne çıkan kart / bölüm (eski %5-6)
  final Color shadowFloat;     // sabit alta çubuk / yüzen öğe (eski %8)
  final Color shadowPill;      // alt gezinme hapı (eski %22)

  // Fotoğraf üstü karartmalar: gölge değil, her iki temada da kalır.
  final Color coverScrimButton; // kapak üstü dairesel buton (eski %42 siyah)
  final Color coverScrimFade;   // kapak altı degrade karartma (eski %50)
  final Color divider;

  // ── Aksan / yüzey tokenları (CA-019) ────────────────────────────────────
  // `onPrimary`: primary dolgusu ÜZERİNDEKI metin rengi. Dark temada primary
  // açıldığı için (#9C82DC) beyaz metin AA altına düşüyordu; dark'ta koyu metin
  // (#14110D) 5.84:1 verir. Bu yüzden primary üzerine metin/ikon her zaman bu
  // token'dan gelir, `Colors.white` yazılmaz.
  final Color onPrimary;
  // `accentLime`: CA-021 (LX-001) ile ARTIK ŞAMPANYA ALTINIDIR (#C6A664 light /
  // #D8B872 dark). Ad tarihsel olduğu için korundu. YALNIZCA dolgu, kenarlık,
  // hairline ve ikon rengidir; metin rengi olarak KULLANILAMAZ (light'ta yüzey
  // üzerinde 2.28:1) — bu yüzden her zaman `onAccentLime` ile çift halinde
  // kullanılır (app_colors_test.dart + scripts/wcag_tokens.js denetler).
  final Color accentLime;
  final Color onAccentLime;
  final Color navPill;
  final Color onNavPill;
  final Color heroSurface;
  // `onBanner`: `bannerGradient` ÜZERİNDEKI metin rengi. Her iki temada da
  // beyaz: banner gradyanının EN AÇIK durağı bilinçli olarak light #4E3893 ve
  // dark #3A2A6E'de sabitlendi (beyaz ile sırasıyla 9.09:1 ve 10.9:1 → AA/AAA).
  // app_colors_test.dart hem başlangıç hem bitiş durağını denetler.
  final Color onBanner;

  final LinearGradient primaryGradient;
  final LinearGradient bannerGradient;
  final LinearGradient softGradient;
  final LinearGradient goldGradient;
  final LinearGradient darkBannerGradient;

  // `ctaGradient`: birincil CTA dolgusu. primaryGradient'ten farklı olarak her iki
  // ucunda da `onPrimary` metni WCAG AA'yi geçirir (primaryGradient'in açık ucu
  // light'ta beyaz metinle 3.22:1, dark'ta ~2.1:1 kalıyordu).
  final LinearGradient ctaGradient;

  const AppColors._({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.secondary,
    required this.secondaryDark,
    required this.accent,
    required this.accentLight,
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.textPrimary,
    required this.textSecondary,
    required this.textHint,
    required this.success,
    required this.error,
    required this.warning,
    required this.info,
    required this.starFilled,
    required this.starEmpty,
    required this.shadowCard,
    required this.shadowRaised,
    required this.shadowFloat,
    required this.shadowPill,
    required this.coverScrimButton,
    required this.coverScrimFade,
    required this.divider,
    required this.onPrimary,
    required this.accentLime,
    required this.onAccentLime,
    required this.navPill,
    required this.onNavPill,
    required this.heroSurface,
    required this.onBanner,
    required this.primaryGradient,
    required this.bannerGradient,
    required this.softGradient,
    required this.goldGradient,
    required this.darkBannerGradient,
    required this.ctaGradient,
  });

  static const AppColors light = AppColors._(
    primary: Color(0xFF4E3893),
    primaryDark: Color(0xFF43307F),
    primaryLight: Color(0xFF6B4FB8),
    secondary: Color(0xFFEFE6D8),
    secondaryDark: Color(0xFFE0D3BE),
    accent: Color(0xFF7C5CBF),
    accentLight: Color(0xFFA98FD8),
    background: Color(0xFFF4EEE3),
    surface: Color(0xFFFFFDF8),
    surfaceVariant: Color(0xFFF1E9DC),
    textPrimary: Color(0xFF1A1815),
    textSecondary: Color(0xFF5C5449),
    textHint: Color(0xFF736959),
    success: Color(0xFF2F6B4F),
    error: Color(0xFFA8323C),
    warning: Color(0xFF7A5200),
    info: Color(0xFF2A5A8C),
    starFilled: Color(0xFFA87B1F), // yuzey ustunde 3.74:1 (ikon esigi 3:1),
    starEmpty: Color(0xFFDDD3C2),
    shadowCard: Color(0x0D1A1815), // %5
    shadowRaised: Color(0x121A1815), // %7
    shadowFloat: Color(0x1A1A1815), // %10
    shadowPill: Color(0x381A1815), // %22
    coverScrimButton: Color(0x6B000000),
    coverScrimFade: Color(0x80000000),
    divider: Color(0xFFE3D9C7),
    onPrimary: Color(0xFFFFFFFF),
    accentLime: Color(0xFFC6A664), // sampanya altini (CA-021) — yalnizca dolgu
    onAccentLime: Color(0xFF1A1815),
    navPill: Color(0xFF1A1815),
    onNavPill: Color(0xFFF4EEE3),
    heroSurface: Color(0xFFEFE6D8),
    onBanner: Color(0xFFFFFFFF),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF6B4FB8), Color(0xFF4E3893)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF4E3893), Color(0xFF2A1F52)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFFF1E9DC), Color(0xFFF4EEE3)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFFC6A664), Color(0xFFE4D3A3)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    darkBannerGradient: LinearGradient(
      colors: [Color(0xFF3A2A6E), Color(0xFF1E1440)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF4E3893), Color(0xFF43307F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  );

  static const AppColors dark = AppColors._(
    primary: Color(0xFF9C82DC),
    primaryDark: Color(0xFF8F72D8),
    primaryLight: Color(0xFFB29AE8),
    secondary: Color(0xFF2C241C),
    secondaryDark: Color(0xFF3D3327),
    accent: Color(0xFFB29AE8),
    accentLight: Color(0xFFC9B6F0),
    background: Color(0xFF14110D),
    surface: Color(0xFF221C16),
    surfaceVariant: Color(0xFF2C241C),
    textPrimary: Color(0xFFF4EDE1),
    textSecondary: Color(0xFFBDB2A0),
    textHint: Color(0xFF9A8F7C),
    success: Color(0xFF6FC08F),
    error: Color(0xFFF08A8A),
    warning: Color(0xFFE0B060),
    info: Color(0xFF8AB4E8),
    starFilled: Color(0xFFD8B872),
    starEmpty: Color(0xFF3D3327),
    shadowCard: Color(0x00000000),
    shadowRaised: Color(0x00000000),
    shadowFloat: Color(0x00000000),
    shadowPill: Color(0x00000000),
    coverScrimButton: Color(0x6B000000),
    coverScrimFade: Color(0x80000000),
    divider: Color(0xFF332B22),
    // Dark temada primary açılır → üstündeki metin koyu olmalı (5.84:1).
    onPrimary: Color(0xFF14110D),
    accentLime: Color(0xFFD8B872), // sampanya altini (CA-021) — yalnizca dolgu
    onAccentLime: Color(0xFF14110D),
    navPill: Color(0xFF0E0B08),
    onNavPill: Color(0xFFF4EDE1),
    heroSurface: Color(0xFF2C241C),
    onBanner: Color(0xFFFFFFFF),
    primaryGradient: LinearGradient(
      colors: [Color(0xFFB29AE8), Color(0xFF8F72D8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF3A2A6E), Color(0xFF1E1440)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFF2C241C), Color(0xFF14110D)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFFD8B872), Color(0xFF8F6F3A)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    darkBannerGradient: LinearGradient(
      colors: [Color(0xFF3A2A6E), Color(0xFF1E1440)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF8F72D8), Color(0xFF9C82DC)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  );

  static AppColors of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}
