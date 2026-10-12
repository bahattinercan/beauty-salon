import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/booking_slot.dart';

class DateStrip extends StatelessWidget {
  final DateTime selected;
  final ValueChanged<DateTime> onSelect;

  const DateStrip({super.key, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final dayAbbrs = S.of(context).dayAbbrs(context);

    return SizedBox(
      height: 80,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 14,
        itemBuilder: (context, index) {
          final date = DateTime.now().add(Duration(days: index + 1));
          final isSelected = selected.day == date.day &&
              selected.month == date.month &&
              selected.year == date.year;

          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => onSelect(date),
              child: Container(
                width: 56,
                decoration: BoxDecoration(
                  color: isSelected ? colors.primary : colors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? colors.primary : colors.secondaryDark),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      dayAbbrs[date.weekday - 1],
                      style: TextStyle(fontSize: 11, color: colors.textSecondary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${date.day}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : colors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class SlotGrid extends StatelessWidget {
  final List<BookingSlot> slots;
  final String? selected;
  final ValueChanged<String> onSelect;

  const SlotGrid({
    super.key,
    required this.slots,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: slots.map((slot) {
        final available = slot.available;
        final isSelected = selected == slot.time;

        Color bg, fg, border;
        if (isSelected) {
          bg = colors.primary;
          fg = Colors.white;
          border = colors.primary;
        } else if (!available) {
          bg = colors.error.withValues(alpha: 0.08);
          fg = colors.error.withValues(alpha: 0.5);
          border = colors.error.withValues(alpha: 0.15);
        } else {
          bg = colors.surface;
          fg = colors.textPrimary;
          border = colors.secondaryDark;
        }

        return SizedBox(
          width: 80,
          child: GestureDetector(
            onTap: available ? () => onSelect(slot.time) : null,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: border),
              ),
              child: available
                  ? Center(
                      child: Text(slot.time,
                          style: TextStyle(fontSize: 14, color: fg, fontWeight: FontWeight.w500)),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(slot.time, style: TextStyle(fontSize: 13, color: fg)),
                        const SizedBox(width: 4),
                        Icon(Icons.person, size: 12, color: fg),
                      ],
                    ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
