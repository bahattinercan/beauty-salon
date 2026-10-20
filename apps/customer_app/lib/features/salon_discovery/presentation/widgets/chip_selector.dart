import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class ChipOption {
  final String value;
  final String label;

  const ChipOption(this.value, this.label);
}

/// Etiket listesi + seçili küme üzerinden toggle yapan chip satırı.
class ChipSelector extends StatelessWidget {
  final List<ChipOption> options;
  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final bool pill;

  const ChipSelector({
    super.key,
    required this.options,
    required this.selected,
    required this.onToggle,
    this.pill = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Wrap(
      spacing: pill ? 8 : 10,
      runSpacing: pill ? 8 : 0,
      children: options.map((option) {
        final isSelected = selected.contains(option.value);

        return GestureDetector(
          onTap: () => onToggle(option.value),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: EdgeInsets.symmetric(
              horizontal: pill ? 14 : 20,
              vertical: pill ? 8 : 10,
            ),
            decoration: BoxDecoration(
              color: isSelected ? (pill ? colors.secondary : colors.primary) : colors.surface,
              borderRadius: BorderRadius.circular(pill ? 20 : 10),
              border: Border.all(
                color: isSelected ? colors.primary : colors.secondaryDark,
                width: isSelected ? (pill ? 1.5 : 2) : 1,
              ),
            ),
            child: Text(
              option.label,
              style: TextStyle(
                fontSize: pill ? 13 : 15,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? (pill ? colors.primaryDark : colors.onPrimary) : colors.textPrimary,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
