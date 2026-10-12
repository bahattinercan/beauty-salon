import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/time_format.dart';
import '../providers/booking_provider.dart';

class ConfirmRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const ConfirmRow({super.key, required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: colors.textSecondary),
          const SizedBox(width: 10),
          Text(label, style: TextStyle(fontSize: 13, color: colors.textSecondary)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class ConfirmStep extends StatelessWidget {
  final BookingState state;
  final TextEditingController noteController;

  const ConfirmStep({super.key, required this.state, required this.noteController});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final service = state.service!;
    final staffName = state.staffName ?? s.bookingAnyStaff;
    final monthNames = s.monthNames(context);
    final dayNames = s.dayNames(context);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.spa, size: 36, color: colors.primary),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      state.salon.name,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(),
              const SizedBox(height: 12),
              ConfirmRow(icon: Icons.content_cut, label: s.bookingConfirmService, value: service.name),
              ConfirmRow(
                icon: Icons.monetization_on_outlined,
                label: s.bookingConfirmFee,
                value: '${service.price.toStringAsFixed(0)} ₺',
              ),
              ConfirmRow(
                icon: Icons.access_time,
                label: s.bookingConfirmDuration,
                value: formatDuration(service.durationMinutes),
              ),
              ConfirmRow(icon: Icons.person, label: s.bookingConfirmStaff, value: staffName),
              ConfirmRow(
                icon: Icons.calendar_today,
                label: s.bookingConfirmDate,
                value: '${state.date.day} ${monthNames[state.date.month - 1]}, '
                    '${dayNames[state.date.weekday - 1]}',
              ),
              ConfirmRow(icon: Icons.schedule, label: s.bookingConfirmTime, value: state.time ?? '-'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: noteController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: s.bookingNoteHint,
            hintStyle: TextStyle(color: colors.textHint),
            filled: true,
            fillColor: colors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }
}
