import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

/// Home kategori şeridi: 64px daire + alt etiket.
///
/// Eski `CategoryChip` (60x60 kare, seçilince mor dolgu) yerinedir; fark
/// daire formu ve seçimin **lime halka** ile işaretlenmesi. Lime yalnızca
/// aksan olarak kullanılır — metin/ikon rengi olarak değil (kontrast 1.31:1).
class CategoryCircleChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const CategoryCircleChip({
    super.key,
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: Padding(
        padding: const EdgeInsets.only(right: 14),
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: isSelected ? colors.primary : colors.heroSurface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    // Seçim işareti: lime halka (dolgu üzerinde değil, yanında).
                    color: isSelected
                        ? colors.accentLime
                        : colors.primary.withValues(alpha: 0.12),
                    width: isSelected ? 3 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: colors.primary.withValues(alpha: 0.28),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : const [],
                ),
                child: Icon(
                  icon,
                  color: isSelected ? colors.onPrimary : colors.primary,
                  size: 26,
                ),
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: 64,
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected ? colors.primary : colors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
