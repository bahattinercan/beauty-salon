import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/time_format.dart';
import '../../../../core/widgets/category_icon.dart';
import '../../../salon_detail/domain/entities/salon_detail.dart';
import '../providers/booking_provider.dart';

class ServiceBar extends StatelessWidget {
  final SalonDetailService service;

  const ServiceBar({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colors.primary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              service.name,
              style: const TextStyle(
                  color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
          Text(
            '${service.price.toStringAsFixed(0)} ₺',
            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class ServiceStep extends StatelessWidget {
  final BookingState state;
  final ValueChanged<int> onSelect;

  const ServiceStep({super.key, required this.state, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final services = state.salon.services;

    if (services.isEmpty) return Center(child: Text(s.bookingNoServices));

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      itemCount: services.length,
      itemBuilder: (context, i) {
        final service = services[i];
        final isSelected = state.serviceIndex == i;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: GestureDetector(
            onTap: () => onSelect(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isSelected ? colors.primary.withValues(alpha: 0.06) : colors.surface,
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
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isSelected ? colors.primary : colors.secondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      categoryIcon(service.categoryName ?? ''),
                      color: isSelected ? colors.onPrimary : colors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.name,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: isSelected ? colors.primary : colors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 14, color: colors.textSecondary),
                            const SizedBox(width: 4),
                            Text(
                              formatDuration(service.durationMinutes),
                              style: TextStyle(fontSize: 12, color: colors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${service.price.toStringAsFixed(0)} ₺',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? colors.primary : colors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: isSelected
                        ? Icon(Icons.check_circle,
                            color: colors.primary, size: 24, key: const ValueKey(true))
                        : Icon(Icons.circle_outlined,
                            color: colors.textHint, size: 24, key: const ValueKey(false)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
