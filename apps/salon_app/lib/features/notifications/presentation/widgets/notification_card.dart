import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/notification_item.dart';

/// Bildirim listesinde tek kart: başlık, gövde, tür etiketi, yerel tarih.
/// Okunmamış kart sol vurgu çizgisi + `secondary` zeminle ayrılır.
class NotificationCard extends StatelessWidget {
  final NotificationItem notification;
  final VoidCallback onTap;

  const NotificationCard({super.key, required this.notification, required this.onTap});

  /// Tür → ikon. Backend ENUM: APPOINTMENT, REVIEW, ORDER, SYSTEM.
  static IconData iconFor(String type) => switch (type) {
        'APPOINTMENT' => Icons.calendar_today,
        'REVIEW' => Icons.rate_review,
        'ORDER' => Icons.shopping_bag,
        'SYSTEM' => Icons.info_outline,
        _ => Icons.notifications_none,
      };

  /// `dd.MM.yyyy HH:mm` — cihazın yerel saatine çevrilmiş, Türkçe biçim.
  static String formatDate(DateTime date) {
    String two(int v) => v.toString().padLeft(2, '0');
    final local = date.toLocal();
    return '${two(local.day)}.${two(local.month)}.${local.year} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final unread = notification.isUnread;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: unread ? c.secondary : c.surface,
        borderRadius: BorderRadius.circular(2),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(2),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              border: Border(
                left: BorderSide(
                  color: unread ? c.primary : Colors.transparent,
                  width: 3,
                ),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: unread ? c.primary.withValues(alpha: 0.12) : c.surfaceVariant,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(iconFor(notification.type), size: 18, color: c.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                          color: c.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        notification.body,
                        style: TextStyle(fontSize: 13, height: 1.3, color: c.textSecondary),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          if (notification.createdAt != null)
                            Text(
                              formatDate(notification.createdAt!),
                              style: TextStyle(fontSize: 11, color: c.textHint),
                            ),
                          if (unread) ...[
                            const SizedBox(width: 8),
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
