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
  final LinearGradient primaryGradient;
  final LinearGradient bannerGradient;
  final LinearGradient softGradient;
  final LinearGradient goldGradient;
  final LinearGradient darkBannerGradient;

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
    required this.primaryGradient,
    required this.bannerGradient,
    required this.softGradient,
    required this.goldGradient,
    required this.darkBannerGradient,
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
    starFilled: Color(0xFFFFB547),
    starEmpty: Color(0xFFE0E0E0),
    primaryGradient: LinearGradient(
      colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    bannerGradient: LinearGradient(
      colors: [Color(0xFF8B6DD1), Color(0xFF5A3FA8)],
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
  );

  static AppColors of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}
