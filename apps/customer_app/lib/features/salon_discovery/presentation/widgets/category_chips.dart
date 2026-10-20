import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/category_labels.dart';
import '../../domain/entities/service_category.dart';

/// Backend'den gelen kategorilerle tek seçimli chip satırı.
class CategoryChips extends StatelessWidget {
  final List<ServiceCategory> categories;
  final String? selectedId;
  final ValueChanged<String?> onSelect;

  const CategoryChips({
    super.key,
    required this.categories,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    Widget chip(String label, bool isSelected, VoidCallback onTap) => GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? colors.primary : colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? colors.primary : colors.secondaryDark,
              ),
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? colors.onPrimary : colors.textPrimary,
              ),
            ),
          ),
        );

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        chip(s.catAll, selectedId == null, () => onSelect(null)),
        ...categories.map((category) => chip(
              categoryLabel(s, category.name),
              selectedId == category.id,
              () => onSelect(category.id),
            )),
      ],
    );
  }
}
