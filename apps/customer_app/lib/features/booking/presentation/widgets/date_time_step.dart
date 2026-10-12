import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/time_format.dart';
import '../providers/booking_provider.dart';
import 'date_strip.dart';

class DateTimeStep extends StatelessWidget {
  final BookingState state;
  final ValueChanged<DateTime> onSelectDate;
  final ValueChanged<String> onSelectTime;
  final VoidCallback onLoadSlots;

  const DateTimeStep({
    super.key,
    required this.state,
    required this.onSelectDate,
    required this.onSelectTime,
    required this.onLoadSlots,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final service = state.service;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          s.bookingSelectDate,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),
        DateStrip(selected: state.date, onSelect: onSelectDate),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              s.bookingSelectTime,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            if (service != null && state.slots.isEmpty && !state.loadingSlots)
              TextButton.icon(
                onPressed: onLoadSlots,
                icon: const Icon(Icons.refresh, size: 16),
                label: Text(s.bookingLoadTimes),
                style: TextButton.styleFrom(foregroundColor: colors.primary),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (state.loadingSlots)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          )
        else if (state.slots.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: colors.textSecondary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    s.bookingSelectDateFirst,
                    style: TextStyle(fontSize: 13, color: colors.textSecondary),
                  ),
                ),
              ],
            ),
          )
        else
          SlotGrid(
            slots: state.slots,
            selected: state.time,
            onSelect: onSelectTime,
          ),
      ],
    );
  }
}

class TimeSummaryBar extends StatelessWidget {
  final BookingState state;

  const TimeSummaryBar({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final service = state.service;
    final time = state.time;
    if (service == null || time == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: colors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.primary.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(Icons.schedule, size: 16, color: colors.primary),
            const SizedBox(width: 8),
            Text(
              '$time  →  ${addMinutes(time, service.durationMinutes)}',
              style: TextStyle(
                fontSize: 13,
                color: colors.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            Icon(Icons.check_circle, size: 16, color: colors.primary),
          ],
        ),
      ),
    );
  }
}
