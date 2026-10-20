import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/booking_provider.dart';

class StaffOption extends StatelessWidget {
  final bool isSelected;
  final IconData? icon;
  final String? initials;
  final String name;
  final String subtitle;
  final VoidCallback onTap;

  const StaffOption({
    super.key,
    required this.isSelected,
    required this.name,
    required this.subtitle,
    required this.onTap,
    this.icon,
    this.initials,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? colors.primary : Colors.transparent,
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: isSelected ? colors.primary : colors.secondary,
                child: icon != null
                    ? Icon(icon, color: isSelected ? colors.onPrimary : colors.primary)
                    : Text(
                        initials ?? '?',
                        style: TextStyle(
                          color: isSelected ? colors.onPrimary : colors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    if (subtitle.isNotEmpty)
                      Text(subtitle,
                          style: TextStyle(fontSize: 12, color: colors.textSecondary)),
                  ],
                ),
              ),
              if (isSelected) Icon(Icons.check_circle, color: colors.primary, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class StaffStep extends StatelessWidget {
  final BookingState state;
  final ValueChanged<int> onSelect;

  const StaffStep({super.key, required this.state, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        StaffOption(
          isSelected: state.staffIndex == -1,
          icon: Icons.shuffle,
          name: s.bookingAnyStaff,
          subtitle: s.bookingAnyStaffSub,
          onTap: () => onSelect(-1),
        ),
        ...List.generate(state.salon.staff.length, (i) {
          final member = state.salon.staff[i];
          return StaffOption(
            isSelected: state.staffIndex == i,
            initials: member.initials,
            name: member.fullName,
            subtitle: member.title ?? '',
            onTap: () => onSelect(i),
          );
        }),
      ],
    );
  }
}
