import 'package:flutter/material.dart';

@immutable
class AppThemeColors extends ThemeExtension<AppThemeColors> {
  const AppThemeColors({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.secondaryBg,
    required this.secondaryBorder,
    required this.textSecondary,
    required this.textHint,
  });

  final Color background;
  final Color surface;
  final Color surfaceVariant;
  /// Light lavender badge background in light mode / dark purple in dark mode
  final Color secondaryBg;
  /// Chip/card border color
  final Color secondaryBorder;
  final Color textSecondary;
  final Color textHint;

  static const light = AppThemeColors(
    background: Color(0xFFFAFAFC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF5F3FA),
    secondaryBg: Color(0xFFF0EBF8),
    secondaryBorder: Color(0xFFD9CEEE),
    textSecondary: Color(0xFF6B6580),
    textHint: Color(0xFFBBB5CC),
  );

  static const dark = AppThemeColors(
    background: Color(0xFF0F0D17),
    surface: Color(0xFF1C1828),
    surfaceVariant: Color(0xFF2A2440),
    secondaryBg: Color(0xFF241D38),
    secondaryBorder: Color(0xFF3D3360),
    textSecondary: Color(0xFF9E97B4),
    textHint: Color(0xFF5A5473),
  );

  @override
  AppThemeColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceVariant,
    Color? secondaryBg,
    Color? secondaryBorder,
    Color? textSecondary,
    Color? textHint,
  }) =>
      AppThemeColors(
        background: background ?? this.background,
        surface: surface ?? this.surface,
        surfaceVariant: surfaceVariant ?? this.surfaceVariant,
        secondaryBg: secondaryBg ?? this.secondaryBg,
        secondaryBorder: secondaryBorder ?? this.secondaryBorder,
        textSecondary: textSecondary ?? this.textSecondary,
        textHint: textHint ?? this.textHint,
      );

  @override
  AppThemeColors lerp(AppThemeColors? other, double t) {
    if (other == null) return this;
    return AppThemeColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      secondaryBg: Color.lerp(secondaryBg, other.secondaryBg, t)!,
      secondaryBorder: Color.lerp(secondaryBorder, other.secondaryBorder, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textHint: Color.lerp(textHint, other.textHint, t)!,
    );
  }
}

/// Kısa erişim: `context.colors.surface` gibi
extension AppThemeColorsX on BuildContext {
  AppThemeColors get colors => Theme.of(this).extension<AppThemeColors>()!;
}
