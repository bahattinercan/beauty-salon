import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/state_view.dart';
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
    final c = AppColors.of(context);

    if (page.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 64),
        child: EmptyState(
          icon: Icons.notifications_none,
          message: 'Henüz bildiriminiz yok',
          subMessage: 'Randevu ve yorum hareketleri burada görünecek.',
        ),
      );
    }

    return Column(
      children: [
        for (final n in page.items)
          NotificationCard(notification: n, onTap: () => onTap(n.id)),
        if (page.loadingMore)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Center(child: CircularProgressIndicator(color: c.primary)),
          )
        else if (page.hasNextPage)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: TextButton(
              onPressed: onLoadMore,
              child: Text('Daha fazla göster (${page.total - page.items.length})'),
            ),
          ),
      ],
    );
  }
}
