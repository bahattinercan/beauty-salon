import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_detail.dart';

class ServiceListWidget extends StatelessWidget {
  final List<SalonDetailService> services;

  const ServiceListWidget({super.key, required this.services});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    if (services.isEmpty) {
      return Center(
        child: Text(s.servicesEmpty, style: TextStyle(color: colors.textSecondary)),
      );
    }

    final Map<String, List<SalonDetailService>> grouped = {};
    for (final svc in services) {
      final cat = svc.categoryName ?? s.serviceOther;
      grouped.putIfAbsent(cat, () => []).add(svc);
    }

    final categories = grouped.entries.toList();

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final entry = categories[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (index > 0) const SizedBox(height: 20),
            Text(
              entry.key,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: colors.textPrimary),
            ),
            const SizedBox(height: 10),
            ...entry.value.map((service) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colors.surfaceVariant),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: colors.secondary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(_categoryIcon(entry.key), color: colors.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(service.name,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  Icon(Icons.access_time, size: 12, color: colors.textSecondary),
                                  const SizedBox(width: 3),
                                  Text('${service.durationMinutes} ${s.serviceDurationMin}',
                                      style: TextStyle(fontSize: 12, color: colors.textSecondary)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${service.price.toStringAsFixed(0)} ₺',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: colors.primary),
                        ),
                      ],
                    ),
                  ),
                )),
          ],
        );
      },
    );
  }

  IconData _categoryIcon(String category) {
    switch (category) {
      case 'Saç': return Icons.content_cut;
      case 'Tırnak': return Icons.brush;
      case 'Cilt Bakımı': return Icons.face;
      case 'Makyaj': return Icons.palette;
      case 'Epilasyon': return Icons.spa;
      default: return Icons.self_improvement;
    }
  }
}
