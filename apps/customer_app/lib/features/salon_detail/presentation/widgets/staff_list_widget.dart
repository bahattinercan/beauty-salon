import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_detail.dart';

class StaffListWidget extends StatelessWidget {
  final List<SalonDetailStaff> staff;

  const StaffListWidget({super.key, required this.staff});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    if (staff.isEmpty) {
      return Center(
        child: Text(S.of(context).staffEmpty,
            style: TextStyle(color: colors.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: staff.length,
      itemBuilder: (context, index) {
        final person = staff[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: colors.shadowCard,
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: colors.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      person.initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(person.fullName,
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w600)),
                      if (person.title != null) ...[
                        const SizedBox(height: 3),
                        Text(person.title!,
                            style: TextStyle(
                                fontSize: 13,
                                color: colors.textSecondary)),
                      ],
                      if (person.serviceNames.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: person.serviceNames.map((s) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: colors.secondary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(s,
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: colors.primaryDark,
                                      fontWeight: FontWeight.w500)),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
