import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class PageDots extends StatelessWidget {
  final int count;
  final int currentIndex;

  const PageDots({
    super.key,
    required this.count,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Semantics(
      // Ekran okuyucu için konum bilgisi; görsel noktalar anlamsız olurdu.
      label: '${currentIndex + 1} / $count',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(count, (index) {
          final isActive = index == currentIndex;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            margin: const EdgeInsets.only(right: 6),
            width: isActive ? 22 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: isActive ? colors.primary : colors.textHint.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(999),
            ),
          );
        }),
      ),
    );
  }
}
