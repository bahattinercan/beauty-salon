import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class SalonInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const SalonInfoCard({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: colors.shadowCard,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: colors.secondary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.spa, color: colors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 13, color: colors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
