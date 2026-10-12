import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_detail.dart';

/// Haftalık çalışma saatleri. Bugünün satırı vurgulanır, kapalı gün
/// `s.closed` ile gösterilir (domain katmanı l10n'e erişemez).
class WorkingHoursSection extends StatelessWidget {
  final SalonDetail salon;

  const WorkingHoursSection({super.key, required this.salon});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final rows = salon.weeklyWorkingHours;
    final todayIndex = DateTime.now().weekday - 1;

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              s.workingHours,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            for (final row in rows)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SizedBox(
                      width: 96,
                      child: Text(
                        s.dayNames(context)[row.dayIndex],
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: row.dayIndex == todayIndex
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: row.isOpen ? colors.textPrimary : colors.textHint,
                        ),
                      ),
                    ),
                    if (row.isOpen)
                      Expanded(
                        child: Text(
                          '${row.openTime} - ${row.closeTime}',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      )
                    else
                      Text(
                        s.closed,
                        style: TextStyle(
                          fontSize: 13,
                          color: colors.textHint,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    if (row.dayIndex == todayIndex)
                      Icon(Icons.circle, size: 6, color: colors.primary),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
