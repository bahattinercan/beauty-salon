import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/notification_page.dart';
import 'notification_card.dart';

/// Bildirim listesi gövdesi: boş durum, kartlar ve load-more.
class NotificationListBody extends StatelessWidget {
  final NotificationPage page;
  final void Function(String id) onTap;
  final VoidCallback onLoadMore;

  const NotificationListBody({
    super.key,
    required this.page,
    required this.onTap,
    required this.onLoadMore,
  });

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final colors = AppColors.of(context);

    if (page.items.isEmpty) {
      return Column(
        children: [
          Icon(Icons.notifications_none, size: 48, color: colors.textHint),
          const SizedBox(height: 12),
          Text(s.notificationsEmpty, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(s.notificationsEmptySub, style: TextStyle(fontSize: 13, color: colors.textSecondary)),
        ],
      );
    }

    return Column(
      children: [
        for (final n in page.items) NotificationCard(notification: n, onTap: () => onTap(n.id)),
        if (page.loadingMore)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (page.hasNextPage)
          TextButton(onPressed: onLoadMore, child: Text(s.loadMore)),
      ],
    );
  }
}
