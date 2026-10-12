import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final colors = AppColors.of(context);
    return Container(color: colors.surface, child: tabBar);
  }

  @override
  bool shouldRebuild(covariant TabBarDelegate old) => false;
}
