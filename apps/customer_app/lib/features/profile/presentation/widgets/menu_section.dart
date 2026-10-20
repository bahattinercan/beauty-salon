import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class ProfileMenuItem {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Widget? trailing;

  ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.trailing,
  });
}

class MenuSection extends StatelessWidget {
  final List<ProfileMenuItem> items;

  const MenuSection({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: colors.shadowCard,
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return Column(
            children: [
              ListTile(
                leading: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: colors.secondary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: colors.primary, size: 20),
                ),
                title: Text(item.title,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                trailing: item.trailing ?? Icon(Icons.chevron_right, color: colors.textHint),
                onTap: item.onTap,
              ),
              if (index < items.length - 1) const Divider(height: 1, indent: 66),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class ProfileHeader extends StatelessWidget {
  final String? initials;
  final String? fullName;
  final String? email;
  final bool isLoading;

  const ProfileHeader({
    super.key,
    required this.initials,
    required this.fullName,
    required this.email,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      decoration: BoxDecoration(gradient: colors.bannerGradient),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 24,
        left: 20,
        right: 20,
        bottom: 32,
      ),
      child: Column(
        children: [
          Container(
            width: 86,
            height: 86,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.2),
              border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 2.5),
            ),
            child: Center(
              child: isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      initials ?? '?',
                      style: const TextStyle(
                          fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            fullName ?? '',
            style: const TextStyle(
                fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            email ?? '',
            style: const TextStyle(fontSize: 13, color: Colors.white70),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              s.profileMember,
              style: const TextStyle(
                  fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class StatsRow extends StatelessWidget {
  final List<String> values;
  final List<String> labels;

  const StatsRow({super.key, required this.values, required this.labels});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    Widget stat(String value, String label) => Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: colors.primary)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 12, color: colors.textSecondary)),
          ],
        );

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: colors.primary.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          stat(values[0], labels[0]),
          Container(width: 1, height: 36, color: colors.surfaceVariant),
          stat(values[1], labels[1]),
          Container(width: 1, height: 36, color: colors.surfaceVariant),
          stat(values[2], labels[2]),
        ],
      ),
    );
  }
}
