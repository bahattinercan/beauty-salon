import 'package:flutter/material.dart';
import '../../core/l10n/app_strings.dart';
import '../theme/app_colors.dart';

class NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

/// Koyu pill gezinme çubuğu (Booksy referansı: koyu zemin, aktif öğe beyaz
/// daire + lime ikon).
///
/// Eski `BottomNavigationBar` yerine kullanılır; tema bloğu
/// (`bottomNavigationBarTheme`) fallback olarak bırakıldı.
class PillBottomNav extends StatelessWidget {
  final List<NavItem> items;
  final int currentIndex;
  final ValueChanged<int> onTap;

  /// Pill'in kendi yüksekliği sabittir; ekranların verdiği alt boşluk
  /// (`reservedHeight`) bundan türetilir, böylece "içerik pill'in altında
  /// kaldı" sürprizi olmaz (eskiden 92 sabit tahmindı, ~10px fazla).
  static const double pillHeight = 72;
  static const double bottomGap = 12;
  static const double reservedHeight = pillHeight + bottomGap;

  static double insetOf(BuildContext context) =>
      MediaQuery.paddingOf(context).bottom + reservedHeight;

  const PillBottomNav({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Semantics(
      container: true,
      child: Container(
        margin: EdgeInsets.fromLTRB(16, 0, 16, bottomInset + bottomGap),
        // Yükseklik sabit DEĞİL, alt sınırdır: metin ölçeği büyürse pill
        // uzar (taşma yerine), ayrılan boşluk da taban olarak kalır.
        constraints: const BoxConstraints(minHeight: pillHeight),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: colors.navPill,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 22,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: _NavSlot(
                  item: items[i],
                  active: i == currentIndex,
                  onTap: () => onTap(i),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NavSlot extends StatelessWidget {
  final NavItem item;
  final bool active;
  final VoidCallback onTap;

  const _NavSlot({
    required this.item,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Semantics(
      button: true,
      selected: active,
      label: item.label,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              width: 44,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                // Aktif öğe: koyu pill üzerinde açık daire; ikon lime.
                color: active ? colors.onNavPill : Colors.transparent,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                active ? item.activeIcon : item.icon,
                size: 20,
                color: active ? colors.navPill : colors.onNavPill.withValues(alpha: 0.55),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                color: active
                    ? colors.onNavPill
                    : colors.onNavPill.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Etiketleri l10n'den üreten hazır liste (MainScaffold kullanır).
List<NavItem> navItemsOf(S s) => [
      NavItem(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: s.navHome,
      ),
      NavItem(
        icon: Icons.explore_outlined,
        activeIcon: Icons.explore,
        label: s.navDiscover,
      ),
      NavItem(
        icon: Icons.calendar_today_outlined,
        activeIcon: Icons.calendar_today,
        label: s.navAppointments,
      ),
      NavItem(
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        label: s.navProfile,
      ),
    ];
