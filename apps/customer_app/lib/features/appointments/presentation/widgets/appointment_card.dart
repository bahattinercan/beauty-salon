import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class AppointmentCard extends StatelessWidget {
  final String salonName;
  final String serviceName;
  final String staffName;
  final String date;
  final String time;
  final String status;
  final VoidCallback onTap;
  final VoidCallback? onCancel;
  final VoidCallback? onReview;
  final VoidCallback? onRebook;

  const AppointmentCard({super.key, 
    required this.salonName,
    required this.serviceName,
    required this.staffName,
    required this.date,
    required this.time,
    required this.status,
    required this.onTap,
    this.onCancel,
    this.onReview,
    this.onRebook,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: colors.shadowRaised,
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.secondary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.spa, color: colors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(salonName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Text(serviceName, style: TextStyle(fontSize: 13, color: colors.textSecondary)),
                      ],
                    ),
                  ),
                  _buildStatusBadge(context, colors),
                ],
              ),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: _buildInfoChip(Icons.person, staffName, colors)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildInfoChip(Icons.calendar_today, date, colors)),
                ],
              ),
              const SizedBox(height: 8),
              _buildInfoChip(Icons.access_time, time, colors),
              if (onCancel != null || onReview != null || onRebook != null) ...[
                const SizedBox(height: 14),
                const Divider(height: 1),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onRebook != null)
                      TextButton.icon(
                        onPressed: onRebook,
                        icon: const Icon(Icons.replay, size: 16),
                        label: Text(S.of(context).appointmentsRebook),
                        style: TextButton.styleFrom(foregroundColor: colors.primary),
                      ),
                    if (onReview != null)
                      TextButton.icon(
                        onPressed: onReview,
                        icon: const Icon(Icons.rate_review, size: 16),
                        label: Text(S.of(context).appointmentsReview),
                        style: TextButton.styleFrom(foregroundColor: colors.accent),
                      ),
                    if (onCancel != null)
                      TextButton.icon(
                        onPressed: onCancel,
                        icon: const Icon(Icons.close, size: 16),
                        label: Text(S.of(context).appointmentsCancelAction),
                        style: TextButton.styleFrom(foregroundColor: colors.error),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context, AppColors colors) {
    Color bgColor;
    Color textColor;
    String label;

    final s = S.of(context);
    switch (status) {
      case 'CONFIRMED':
        bgColor = colors.success.withValues(alpha: 0.15);
        textColor = colors.success;
        label = s.statusConfirmed;
      case 'PENDING':
        bgColor = colors.warning.withValues(alpha: 0.15);
        textColor = colors.warning;
        label = s.statusPending;
      case 'COMPLETED':
        bgColor = colors.info.withValues(alpha: 0.15);
        textColor = colors.info;
        label = s.statusCompleted;
      case 'CANCELLED':
        bgColor = colors.error.withValues(alpha: 0.15);
        textColor = colors.error;
        label = s.statusCancelled;
      default:
        bgColor = colors.surfaceVariant;
        textColor = colors.textSecondary;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
    );
  }

  Widget _buildInfoChip(IconData icon, String text, AppColors colors) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: colors.textSecondary),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: TextStyle(fontSize: 12, color: colors.textSecondary),
            // Tarih ("15 Ekim 2026, Perşembe") iki satıra sarabilmeli; eskiden
            // tek satırda "...Perşe…" olarak kesiliyordu.
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
