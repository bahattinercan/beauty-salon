import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/notification_item.dart';

/// Bildirim kartı. Okunmamış kartta sol vurgu çizgisi + açık zemin var.
class NotificationCard extends StatelessWidget {
  final NotificationItem notification;
  final VoidCallback onTap;

  const NotificationCard({
    super.key,
    required this.notification,
    required this.onTap,
  });

  static IconData iconFor(String type) {
    switch (type) {
      case 'APPOINTMENT':
        return Icons.calendar_today;
      case 'REVIEW':
        return Icons.rate_review;
      case 'ORDER':
        return Icons.shopping_bag;
      case 'SYSTEM':
        return Icons.info;
      default:
        return Icons.notifications;
    }
  }

  static String labelFor(S s, String type) {
    switch (type) {
      case 'APPOINTMENT':
        return s.typeAppointment;
      case 'REVIEW':
        return s.typeReview;
      case 'ORDER':
        return s.typeOrder;
      case 'SYSTEM':
        return s.typeSystem;
      default:
        return s.typeSystem;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final unread = !notification.isRead;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: unread ? colors.secondary : colors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border(left: BorderSide(
            color: unread ? colors.primary : Colors.transparent,
            width: 3,
          )),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(iconFor(notification.type), size: 20, color: colors.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: unread ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: TextStyle(fontSize: 13, color: colors.textSecondary, height: 1.3),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        labelFor(s, notification.type),
                        style: TextStyle(fontSize: 11, color: colors.primary),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        notification.timeAgo,
                        style: TextStyle(fontSize: 11, color: colors.textHint),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
