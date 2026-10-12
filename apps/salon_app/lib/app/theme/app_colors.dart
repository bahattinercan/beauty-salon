import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary - Purple / Lavender
  static const Color primary = Color(0xFF7C5CBF);
  static const Color primaryDark = Color(0xFF5A42A0);
  static const Color primaryLight = Color(0xFF9D82D4);

  // Secondary - Soft Lavender
  static const Color secondary = Color(0xFFF0EBF8);
  static const Color secondaryDark = Color(0xFFD9CEEE);

  // Accent - Warm Mauve
  static const Color accent = Color(0xFFB39DDB);
  static const Color accentLight = Color(0xFFCFC2E8);

  // Background
  static const Color background = Color(0xFFFAFAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F3FA);

  // Text
  static const Color textPrimary = Color(0xFF1E1B2E);
  static const Color textSecondary = Color(0xFF6B6580);
  static const Color textHint = Color(0xFFBBB5CC);

  // Status
  static const Color success = Color(0xFF4CAF7D);
  static const Color error = Color(0xFFE05C6C);
  static const Color warning = Color(0xFFFFB547);
  static const Color info = Color(0xFF5B8DEF);

  // Star rating
  static const Color starFilled = Color(0xFFFFB547);
  static const Color starEmpty = Color(0xFFE0E0E0);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient headerGradient = LinearGradient(
    colors: [Color(0xFF8B6DD1), Color(0xFF5A3FA8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomCenter,
  );
}
