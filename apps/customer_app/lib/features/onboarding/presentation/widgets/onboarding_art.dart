import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/category_icon.dart';
import 'wave_bottom_clipper.dart';

/// Onboarding slaytının görsel alanı.
///
/// Gerçek fotoğraf yok (seed'de salon görselleri boş, `assets/` yok) — bu yüzden
/// gradyan yüzey + büyük kategori ikonu kullanılır. Fotoğraf boru hattı
/// kurulursa yalnızca bu dosya değiştirilir.
class OnboardingArt extends StatelessWidget {
  final String iconName;
  final int index;

  const OnboardingArt({
    super.key,
    required this.iconName,
    required this.index,
  });

  static const List<String> _iconNames = ['spa', 'content_cut', 'face'];
  static const List<List<Color>> _tints = [
    [Color(0x337C5CBF), Color(0x1A5B8DEF)],
    [Color(0x335B8DEF), Color(0x1A4CAF7D)],
    [Color(0x33B58AE0), Color(0x1A7C5CBF)],
  ];

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final tint = _tints[index % _tints.length];
    final icon = categoryIcon(iconName.isNotEmpty ? iconName : _iconNames[index % 3]);

    return ClipPath(
      clipper: const WaveBottomClipper(),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.heroSurface, colors.surfaceVariant],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              right: -40,
              top: -30,
              child: _blob(160, tint[0]),
            ),
            Positioned(
              left: -56,
              top: 60,
              child: _blob(130, tint[1]),
            ),
            Center(
              child: Container(
                width: 118,
                height: 118,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: colors.surface,
                  boxShadow: [
                    BoxShadow(
                      color: colors.primary.withValues(alpha: 0.14),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(icon, size: 56, color: colors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _blob(double size, Color color) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
        ),
      );
}
