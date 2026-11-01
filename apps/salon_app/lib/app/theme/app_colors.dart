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
/// 3. `accentLime` artık şampanya altınıdır (`#C6A664` / `#D8B872`) ve **yalnızca dolgudur**
///    (CTA, "Yeni" rozeti, aktif gezinme). Açık yüzeyde metin olarak 2.29:1'de kaldığı için
///    metin/ikon olarak kullanılamaz; daima `onAccentLime` ile çift halinde.
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
    primary: Color(0xFF4E3893),
    primaryDark: Color(0xFF43307F),
    primaryLight: Color(0xFF6B4FB8),
    background: Color(0xFFF4EEE3),
    surface: Color(0xFFFFFDF8),
    surfaceVariant: Color(0xFFF1E9DC),
    secondary: Color(0xFFEFE6D8),
    secondaryDark: Color(0xFFE0D3BE),
    divider: Color(0xFFE3D9C7),
    accent: Color(0xFF7C5CBF),
    accentLight: Color(0xFFA98FD8),
    textPrimary: Color(0xFF1A1815),
    textSecondary: Color(0xFF5C5449),
    textHint: Color(0xFF736959),
    success: Color(0xFF2F6B4F),
    error: Color(0xFFA8323C),
    warning: Color(0xFF7A5200),
    info: Color(0xFF2A5A8C),
    starFilled: Color(0xFFA87B1F), // yuzey ustunde 3.74:1 (ikon esigi 3:1),
    starEmpty: Color(0xFFDDD3C2),
    onPrimary: Color(0xFFFFFFFF),
    accentLime: Color(0xFFC6A664), // sampanya altini (LX-001) — yalnizca dolgu
    onAccentLime: Color(0xFF1A1815),
    navPill: Color(0xFF1A1815),
    onNavPill: Color(0xFFF4EEE3),
    onNavPillMuted: Color(0xFFB7AC99), // koyu hap ustunde 7.91:1
    heroSurface: Color(0xFFEFE6D8),
    onBanner: Color(0xFFFFFFFF),
    // Gradyan durakları rastgele değil: üstüne yazılacak metnin (onBanner / onPrimary)
    // HER iki uçta da AA vermesi şart. Eski açık uç #9B7FE0 beyaz üstünde 3.23:1,
    // #8B6DD1 ise 4.03:1'de kalıyordu. LX-001 sonrası en zayıf uç 6.11:1 (primaryGradient).
    primaryGradient: LinearGradient(
      colors: [Color(0xFF6B4FB8), Color(0xFF4E3893)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    headerGradient: LinearGradient(
      colors: [Color(0xFF4E3893), Color(0xFF2A1F52)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF4E3893), Color(0xFF2A1F52)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFFF1E9DC), Color(0xFFF4EEE3)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF4E3893), Color(0xFF43307F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    infoGradient: LinearGradient(
      colors: [Color(0xFF3A6EA5), Color(0xFF2A5A8C)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    successGradient: LinearGradient(
      colors: [Color(0xFF2F6B4F), Color(0xFF24573E)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    warningGradient: LinearGradient(
      colors: [Color(0xFF7A5200), Color(0xFF5E3F00)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    shadowCard: Color(0x0D1A1815),   // %5 isi siyah
    shadowRaised: Color(0x121A1815),  // %7 isi siyah
  );

  static const AppColors dark = AppColors._(
    // Dark'ta marka AÇILIR; üstündeki metin `onPrimary` koyu kalmazsa okunmaz (madde 2).
    primary: Color(0xFF9C82DC),
    primaryDark: Color(0xFF8F72D8),
    primaryLight: Color(0xFFB29AE8),
    background: Color(0xFF14110D),
    surface: Color(0xFF221C16),
    surfaceVariant: Color(0xFF2C241C),
    secondary: Color(0xFF2C241C),
    secondaryDark: Color(0xFF3D3327),
    divider: Color(0xFF332B22),
    accent: Color(0xFFB29AE8),
    accentLight: Color(0xFFC9B6F0),
    textPrimary: Color(0xFFF4EDE1),
    textSecondary: Color(0xFFBDB2A0),
    textHint: Color(0xFF9A8F7C),
    success: Color(0xFF6FC08F),
    error: Color(0xFFF08A8A),
    warning: Color(0xFFE0B060),
    info: Color(0xFF8AB4E8),
    starFilled: Color(0xFFD8B872),
    starEmpty: Color(0xFF3D3327),
    onPrimary: Color(0xFF14110D),
    accentLime: Color(0xFFD8B872), // sampanya altini (LX-001) — yalnizca dolgu
    onAccentLime: Color(0xFF14110D),
    navPill: Color(0xFF0E0B08),
    onNavPill: Color(0xFFF4EDE1),
    onNavPillMuted: Color(0xFFA79C88), // koyu hap ustunde 7.25:1
    heroSurface: Color(0xFF2C241C),
    onBanner: Color(0xFFFFFFFF),
    // Dark'ta gradyan AÇILIR (primary/cta) ve üstündeki metin koyu (`onPrimary`) kalır;
    // banner/header ise koyu kalır, üstüne beyaz (`onBanner`) yazar — en zayıf uç 4.99:1.
    primaryGradient: LinearGradient(
      colors: [Color(0xFFB29AE8), Color(0xFF8F72D8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    headerGradient: LinearGradient(
      colors: [Color(0xFF3A2A6E), Color(0xFF1E1440)],
      begin: Alignment.topLeft,
      end: Alignment.bottomCenter,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF3A2A6E), Color(0xFF1E1440)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    softGradient: LinearGradient(
      colors: [Color(0xFF2C241C), Color(0xFF14110D)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    ctaGradient: LinearGradient(
      colors: [Color(0xFF8F72D8), Color(0xFF9C82DC)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    infoGradient: LinearGradient(
      colors: [Color(0xFF8AB4E8), Color(0xFF6E9BD8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    successGradient: LinearGradient(
      colors: [Color(0xFF6FC08F), Color(0xFF55A876)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    warningGradient: LinearGradient(
      colors: [Color(0xFFE0B060), Color(0xFFC0913F)],
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