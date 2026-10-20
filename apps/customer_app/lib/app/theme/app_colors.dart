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
  // açıldığı için (#9D82D4) beyaz metin 3.19:1'e düşüyor, WCAG AA altına
  // iniyordu; dark'ta koyu metin 5.44:1 verir. Bu yüzden primary üzerine
  // metin/ikon her zaman bu token'dan gelir, `Colors.white` yazılmaz.
  final Color onPrimary;
  // `accentLime`: yalnızca CTA dolgusu, "Yeni" rozeti ve aktif nav ikonu.
  // Beyaz zeminde metin olarak KULLANILAMAZ (1.31:1) — bu yüzden her zaman
  // `onAccentLime` ile çift halinde kullanılır (app_colors_test.dart denetler).
  final Color accentLime;
  final Color onAccentLime;
  final Color navPill;
  final Color onNavPill;
  final Color heroSurface;
  // `onBanner`: `bannerGradient` ÜZERİNDEKI metin rengi. Her iki temada da
  // beyaz: banner gradyanının EN AÇIK durağı bilinçli olarak #7C5CBF'de
  // sabitlendi (beyaz ile 5.05:1 → AA). Light temada eskiden açık durak
  // #8B6DD1'di → 4.05:1, alpha'lı karşılama metni 3.35:1 (AA ihlaliydi).
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
    primary: Color(0xFF7C5CBF),
    primaryDark: Color(0xFF5A42A0),
    primaryLight: Color(0xFF9D82D4),
    secondary: Color(0xFFF0EBF8),
    secondaryDark: Color(0xFFD9CEEE),
    accent: Color(0xFF5B8DEF),
    accentLight: Color(0xFF93B8F7),
    background: Color(0xFFFAFAFC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF5F3FA),
    textPrimary: Color(0xFF1E1B2E),
    textSecondary: Color(0xFF6B6580),
    textHint: Color(0xFFBBB5CC),
    success: Color(0xFF4CAF7D),
    error: Color(0xFFE05C6C),
    warning: Color(0xFFFFB547),
    info: Color(0xFF5B8DEF),
    starFilled: Color(0xFFBF7B00), // yuzey ustunde 3.47:1 (ikon esigi 3:1),
    starEmpty: Color(0xFFE0E0E0),
    shadowCard: Color(0x0A000000),
    shadowRaised: Color(0x0D000000),
    shadowFloat: Color(0x14000000),
    shadowPill: Color(0x38000000),
    coverScrimButton: Color(0x6B000000),
    coverScrimFade: Color(0x80000000),
    divider: Color(0xFFEEEBF8),
    onPrimary: Color(0xFFFFFFFF),
    accentLime: Color(0xFFC9F04F),
    onAccentLime: Color(0xFF12131F),
    navPill: Color(0xFF12131F),
    onNavPill: Color(0xFFFFFFFF),
    heroSurface: Color(0xFFE8E5FA),
    onBanner: Color(0xFFFFFFFF),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF4A3298)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFFF0EBF8), Color(0xFFFAFAFC)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    darkBannerGradient: LinearGradient(
      colors: [Color(0xFF8B6DD1), Color(0xFF5A3FA8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF5A42A0)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  );

  static const AppColors dark = AppColors._(
    primary: Color(0xFF9D82D4),
    primaryDark: Color(0xFF7C5CBF),
    primaryLight: Color(0xFFBBA8E5),
    secondary: Color(0xFF241D38),
    secondaryDark: Color(0xFF3D3360),
    accent: Color(0xFF7AAEF5),
    accentLight: Color(0xFFA3C4FA),
    background: Color(0xFF0F0D17),
    surface: Color(0xFF1C1828),
    surfaceVariant: Color(0xFF2A2440),
    textPrimary: Color(0xFFF0ECFF),
    textSecondary: Color(0xFF9E97B4),
    textHint: Color(0xFF5A5473),
    success: Color(0xFF5CC98A),
    error: Color(0xFFF07080),
    warning: Color(0xFFFFBF5A),
    info: Color(0xFF7AAEF5),
    starFilled: Color(0xFFFFBF5A),
    starEmpty: Color(0xFF3D3360),
    shadowCard: Color(0x00000000),
    shadowRaised: Color(0x00000000),
    shadowFloat: Color(0x00000000),
    shadowPill: Color(0x00000000),
    coverScrimButton: Color(0x6B000000),
    coverScrimFade: Color(0x80000000),
    divider: Color(0xFF2D2B47),
    // Dark temada primary açılır → üstündeki metin koyu olmalı (5.44:1).
    onPrimary: Color(0xFF1C1828),
    accentLime: Color(0xFFC9F04F),
    onAccentLime: Color(0xFF12131F),
    navPill: Color(0xFF1C1828),
    onNavPill: Color(0xFFF0ECFF),
    heroSurface: Color(0xFF2A2440),
    onBanner: Color(0xFFFFFFFF),
    primaryGradient: LinearGradient(
      colors: [Color(0xFFBBA8E5), Color(0xFF7C5CBF)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF5A3FA8), Color(0xFF7C5CBF)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFF2A2440), Color(0xFF0F0D17)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    goldGradient: LinearGradient(
      colors: [Color(0xFFBBA8E5), Color(0xFF7C5CBF)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    darkBannerGradient: LinearGradient(
      colors: [Color(0xFF5A3FA8), Color(0xFF7C5CBF)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFFBBA8E5), Color(0xFF9D82D4)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  );

  static AppColors of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}
