import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class SearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onSubmit;

  const SearchField({super.key, required this.controller, required this.onSubmit});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.secondaryDark),
      ),
      child: Row(
        children: [
          Icon(Icons.search, size: 20, color: colors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: s.discoverSearchHint,
                hintStyle: TextStyle(color: colors.textHint),
                border: InputBorder.none,
              ),
              onSubmitted: onSubmit,
            ),
          ),
        ],
      ),
    );
  }
}

class SortMenu extends StatelessWidget {
  final ValueChanged<String> onSelected;

  const SortMenu({super.key, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return PopupMenuButton<String>(
      onSelected: onSelected,
      color: colors.surface,
      itemBuilder: (_) => [
        PopupMenuItem(value: 'distance', child: Text(s.discoverSortDistance)),
        PopupMenuItem(value: 'rating', child: Text(s.discoverSortRating)),
        PopupMenuItem(value: 'newest', child: Text(s.discoverSortNewest)),
        PopupMenuItem(value: 'price_low', child: Text(s.discoverSortPriceLow)),
        PopupMenuItem(value: 'price_high', child: Text(s.discoverSortPriceHigh)),
      ],
    );
  }
}
