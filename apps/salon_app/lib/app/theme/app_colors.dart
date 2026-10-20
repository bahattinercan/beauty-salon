import 'package:flutter/material.dart';

/// salon_app renk sözleşmesi.
///
/// Aynı token adları `customer_app` (CA-019) ve admin panelinde (AP-001,
/// `globals.css`) kullanılıyor; üç arayüz de aynı rol sözlüğünü paylaşıyor.
///
/// **Sözleşme maddeleri**
/// 1. Widget içinde ham `Color(0xFF..)` yazılmaz; daima `AppColors.of(context).<rol>`.
/// 2. Her **dolgunun** bir `on*` eşi vardır (`onPrimary`, `onAccentLime`, `onNavPill`,
///    `onBanner`). Dark temada marka **açılıyor**; bu yüzden dolgu üstüne beyaz yazmak
///    kontrastı AA altına düşürüyor. Dolgu üstündeki metin/ikon daima `on*` token'ından gelir.
/// 3. `accentLime` **yalnızca dolgudur** (CTA, "Yeni" rozeti, aktif gezinme). Beyaz üstünde
///    1.3:1 olduğu için metin/ikon olarak kullanılamaz; daima `onAccentLime` ile çift halinde.
/// 4. Durum renkleri (`success/error/warning/info`) **metin olarak** WCAG AA geçer,
///    süs rengi değildir (`info`'nun eski değeri #5B8DEF yüzey üstünde 3.9:1'de kalıyordu).
/// 5. Gradyanların üstüne yazılacak renk `onBanner`/`ctaGradient` ucundan türür; sabit beyaz yazılmaz.
///
/// Bu maddeler `test/app/theme/app_colors_test.dart` tarafından denetlenir:
/// eşik altı çift = başarısız test.
class AppColors {
  // ── Marka ────────────────────────────────────────────────────────────────
  final Color primary;
  final Color primaryDark;
  final Color primaryLight;

  // ── Yüzeyler ─────────────────────────────────────────────────────────────
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  /// Rozet / chip zemini (light lila, dark mor yüzey). Eski `AppThemeColors.secondary`.
  final Color secondary;
  /// Chip / kart kenarlığı. Eski `AppThemeColors.secondaryDark`.
  final Color secondaryDark;
  final Color divider;

  // ── Vurgular ─────────────────────────────────────────────────────────────
  final Color accent;
  final Color accentLight;

  // ── Metin ────────────────────────────────────────────────────────────────
  final Color textPrimary;
  final Color textSecondary;
  /// En soluk metin — ama hâlâ AA eşiğinin üstünde olmak zorunda.
  final Color textHint;

  // ── Durum renkleri (metin olarak okunabilir) ─────────────────────────────
  final Color success;
  final Color error;
  final Color warning;
  final Color info;

  // ── Puan ─────────────────────────────────────────────────────────────────
  final Color starFilled;
  final Color starEmpty;

  // ── Dolgu üstü metin eşleri (madde 2) ────────────────────────────────────
  final Color onPrimary;

  /// Yalnızca dolgu (madde 3).
  final Color accentLime;
  final Color onAccentLime;

  /// Koyu gezinme hapı (mobil tasarım dili).
  final Color navPill;
  final Color onNavPill;
  final Color onNavPillMuted;

  /// Özet / promo yüzeyi (mobil `heroSurface`).
  final Color heroSurface;

  /// Gradyan banner üstündeki metin.
  final Color onBanner;

  // ── Gradyanlar ───────────────────────────────────────────────────────────
  final LinearGradient primaryGradient;
  final LinearGradient headerGradient;
  final LinearGradient bannerGradient;
  final LinearGradient softGradient;
  final LinearGradient ctaGradient;
  /// Istatistik karti dolgulari. Her kart kendi rengini tasir; HIÇBIRI
  /// ham hex ile degil, bu tokenlarla verilir (test: her iki uçta da onPrimary AA).
  final LinearGradient infoGradient;
  final LinearGradient successGradient;
  final LinearGradient warningGradient;

  // ── Gölge tokenları ──────────────────────────────────────────────────────
  /// AP-001 kuralı: gölge YALNIZCA açık temada. Koyu tema yüzeyleri üst üste
  /// binince gölge görünmüyor, kenarlık ayrımı gerekiyor; bu yüzden koyuda
  /// gölgeler opaklık 0 ile kapatılır (widget tarafinda `c.shadowCard`).
  final Color shadowCard;
  final Color shadowRaised;

  const AppColors._({
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.secondary,
    required this.secondaryDark,
    required this.divider,
    required this.accent,
    required this.accentLight,
    required this.textPrimary,
    required this.textSecondary,
    required this.textHint,
    required this.success,
    required this.error,
    required this.warning,
    required this.info,
    required this.starFilled,
    required this.starEmpty,
    required this.onPrimary,
    required this.accentLime,
    required this.onAccentLime,
    required this.navPill,
    required this.onNavPill,
    required this.onNavPillMuted,
    required this.heroSurface,
    required this.onBanner,
    required this.primaryGradient,
    required this.headerGradient,
    required this.bannerGradient,
    required this.softGradient,
    required this.ctaGradient,
    required this.infoGradient,
    required this.successGradient,
    required this.warningGradient,
    required this.shadowCard,
    required this.shadowRaised,
  });

  static const AppColors light = AppColors._(
    primary: Color(0xFF7C5CBF),
    primaryDark: Color(0xFF5A42A0),
    primaryLight: Color(0xFF9D82D4),
    background: Color(0xFFFAFAFC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF5F3FA),
    secondary: Color(0xFFF0EBF8),
    secondaryDark: Color(0xFFD9CEEE),
    divider: Color(0xFFEEEBF8),
    accent: Color(0xFF5B8DEF),
    accentLight: Color(0xFF93B8F7),
    textPrimary: Color(0xFF1E1B2E),
    textSecondary: Color(0xFF5A5370),
    textHint: Color(0xFF6E6785),
    success: Color(0xFF2F7D57),
    error: Color(0xFFB32B38),
    warning: Color(0xFF8A5A00),
    info: Color(0xFF1F5FA8),
    starFilled: Color(0xFFBF7B00), // yuzey ustunde 3.15:1 (ikon esigi 3:1),
    starEmpty: Color(0xFFE0E0E0),
    onPrimary: Color(0xFFFFFFFF),
    accentLime: Color(0xFFC9F04F),
    onAccentLime: Color(0xFF12131F),
    navPill: Color(0xFF12131F),
    onNavPill: Color(0xFFFFFFFF),
    onNavPillMuted: Color(0xFFA9A3B8),
    heroSurface: Color(0xFFE8E5FA),
    onBanner: Color(0xFFFFFFFF),
    // Gradyan durakları rastgele değil: üstüne yazılacak metnin (onBanner / onPrimary)
    // HER iki uçta da AA vermesi şart. Eski açık uç #9B7FE0 beyaz üstünde 3.23:1,
    // #8B6DD1 ise 4.03:1'de kalıyordu.
    primaryGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF6644B8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    headerGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF5A42A0)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF4A3298)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFFF0EBF8), Color(0xFFFAFAFC)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF7C5CBF), Color(0xFF5A42A0)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    infoGradient: LinearGradient(
      colors: [Color(0xFF3D6FD4), Color(0xFF1F5FA8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    successGradient: LinearGradient(
      colors: [Color(0xFF2F7D57), Color(0xFF1F6B44)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    warningGradient: LinearGradient(
      colors: [Color(0xFF996100), Color(0xFF7F5000)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    shadowCard: Color(0x0A000000),   // %4 siyah
    shadowRaised: Color(0x0F000000),  // %6 siyah
  );

  static const AppColors dark = AppColors._(
    // Dark'ta marka AÇILIR; üstündeki metin `onPrimary` koyu kalmazsa okunmaz (madde 2).
    primary: Color(0xFF9D82D4),
    primaryDark: Color(0xFF7C5CBF),
    primaryLight: Color(0xFFBBA8E5),
    background: Color(0xFF0F0D17),
    surface: Color(0xFF1C1828),
    surfaceVariant: Color(0xFF2A2440),
    secondary: Color(0xFF241D38),
    secondaryDark: Color(0xFF3D3360),
    divider: Color(0xFF2D2B47),
    accent: Color(0xFF7AAEF5),
    accentLight: Color(0xFFA3C4FA),
    textPrimary: Color(0xFFF0ECFF),
    textSecondary: Color(0xFF9E97B4),
    textHint: Color(0xFF8B84A8),
    success: Color(0xFF5CC98A),
    error: Color(0xFFF07080),
    warning: Color(0xFFFFBF5A),
    info: Color(0xFF7AAEF5),
    starFilled: Color(0xFFFFBF5A),
    starEmpty: Color(0xFF3D3360),
    onPrimary: Color(0xFF1C1828),
    accentLime: Color(0xFFC9F04F),
    onAccentLime: Color(0xFF12131F),
    navPill: Color(0xFF1C1828),
    onNavPill: Color(0xFFF0ECFF),
    onNavPillMuted: Color(0xFFA9A3B8),
    heroSurface: Color(0xFF2A2440),
    onBanner: Color(0xFFF0ECFF),
    // Dark'ta gradyan açılır ama üstündeki metin koyu (`onPrimary`) — beyaz yazmak
    // #7C5CBF üzerinde 4.38:1'e düşüyordu.
    primaryGradient: LinearGradient(
      colors: [Color(0xFFBBA8E5), Color(0xFF9D82D4)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    headerGradient: LinearGradient(
      colors: [Color(0xFF5A3FA8), Color(0xFF6A4CB4)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF5A3FA8), Color(0xFF6A4CB4)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFF2A2440), Color(0xFF0F0D17)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFFBBA8E5), Color(0xFF9D82D4)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    infoGradient: LinearGradient(
      colors: [Color(0xFF7AAEF5), Color(0xFF4C86DE)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    successGradient: LinearGradient(
      colors: [Color(0xFF5CC98A), Color(0xFF3FA96F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    warningGradient: LinearGradient(
      colors: [Color(0xFFFFBF5A), Color(0xFFE39414)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    shadowCard: Color(0x00000000),   // koyu temada gölge yok
    shadowRaised: Color(0x00000000)
  );

  /// Tek erişim noktası: tema hangisiyse o set. Widget tarafında tema kontrolü yapılmaz.
  static AppColors of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}

/// Kısa erişim: `context.c.surface`.
extension AppColorsX on BuildContext {
  AppColors get colors => AppColors.of(this);
}