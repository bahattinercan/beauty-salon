import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Tema iskeleti. Renk vermez; renk daima `AppColors` sözleşmesinden gelir.
///
/// `lightTheme` ve `darkTheme` AYNI `_build`den geçer: tek fark token setidir.
/// Bu yüzden iki tema arasında yapısal sapma (dark'ta `Colors.white`, ham hex,
/// `primaryLight` ile beyaz yazı gibi) oluşamaz.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => _build(AppColors.light);
  static ThemeData get darkTheme => _build(AppColors.dark);

  static ThemeData _build(AppColors c) {
    return ThemeData(
      useMaterial3: true,
      brightness: c == AppColors.dark ? Brightness.dark : Brightness.light,
      fontFamily: 'Poppins',
      colorScheme: ColorScheme(
        brightness: c == AppColors.dark ? Brightness.dark : Brightness.light,
        primary: c.primary,
        onPrimary: c.onPrimary,
        secondary: c.secondary,
        onSecondary: c.textPrimary,
        surface: c.surface,
        onSurface: c.textPrimary,
        surfaceContainerHighest: c.surfaceVariant,
        error: c.error,
        onError: c.onPrimary,
        outline: c.secondaryDark,
        outlineVariant: c.divider,
      ),
      scaffoldBackgroundColor: c.background,
      canvasColor: c.surface,
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: c.surface,
        foregroundColor: c.textPrimary,
        titleTextStyle: TextStyle(
          fontFamily: 'Poppins',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
          letterSpacing: -0.3,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: c.navPill,
        selectedItemColor: c.onNavPill,
        unselectedItemColor: c.onNavPillMuted,
        selectedLabelStyle: const TextStyle(
            fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle:
            const TextStyle(fontFamily: 'Poppins', fontSize: 12),
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shadowColor: Colors.transparent,
        color: c.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: c.divider),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
              fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.primary,
          side: BorderSide(color: c.primary, width: 1.5),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
              fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: c.primary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceVariant,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: TextStyle(color: c.textHint, fontSize: 14),
        labelStyle: TextStyle(color: c.textSecondary, fontSize: 14),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: c.primary, width: 1.5)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: c.error, width: 1.5)),
        focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: c.error, width: 1.5)),
      ),
      dividerTheme: DividerThemeData(color: c.divider, thickness: 1),
      chipTheme: ChipThemeData(
        backgroundColor: c.secondary,
        labelStyle: TextStyle(
            fontFamily: 'Poppins', fontSize: 13, color: c.textPrimary),
        side: BorderSide(color: c.secondaryDark),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: c.navPill,
        contentTextStyle: TextStyle(color: c.onNavPill),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: c.textPrimary),
      ),
    );
  }
}
