import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_provider.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';
import '../providers/user_provider.dart';
import '../widgets/menu_section.dart';
import '../widgets/profile_dialogs.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final userAsync = ref.watch(userProvider);
    final user = userAsync.asData?.value;
    final isDark = ref.watch(themeProvider).asData?.value == ThemeMode.dark;

    return Scaffold(
      backgroundColor: colors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: ProfileHeader(
              initials: user?.initials,
              fullName: user?.fullName,
              email: user?.email,
              isLoading: userAsync.isLoading,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                StatsRow(
                  values: const ['12', '5', '8'],
                  labels: [s.statAppointments, s.statFavorites, s.statReviews],
                ),
                const SizedBox(height: 20),
                MenuSection(items: [
                  ProfileMenuItem(
                    icon: Icons.person_outline,
                    title: s.profileEdit,
                    onTap: () => context.pushNamed(RouteNames.editProfile),
                  ),
                  ProfileMenuItem(
                    icon: Icons.favorite_border,
                    title: s.profileFavorites,
                    onTap: () => context.pushNamed(RouteNames.favorites),
                  ),
                  ProfileMenuItem(
                    icon: Icons.calendar_today_outlined,
                    title: s.profileAppHistory,
                    onTap: () => context.goNamed(RouteNames.appointments),
                  ),
                  ProfileMenuItem(
                    icon: Icons.rate_review_outlined,
                    title: s.profileMyReviews,
                    onTap: () => context.pushNamed(RouteNames.myReviews),
                  ),
                ]),
                const SizedBox(height: 16),
                MenuSection(items: [
                  ProfileMenuItem(
                    icon: Icons.notifications_outlined,
                    title: s.profileNotifications,
                    onTap: () => context.pushNamed(RouteNames.notifications),
                    trailing: _UnreadBadge(count: ref.watch(unreadCountProvider).asData?.value ?? 0),
                  ),
                  ProfileMenuItem(
                    icon: Icons.language,
                    title: s.profileLanguage,
                    onTap: () => showLanguagePicker(context, ref, colors),
                    trailing: Text(s.currentLang,
                        style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                  ),
                  ProfileMenuItem(
                    icon: Icons.dark_mode_outlined,
                    title: s.profileDarkMode,
                    onTap: () => ref.read(themeProvider.notifier).toggle(),
                    trailing: Switch(
                      value: isDark,
                      onChanged: (_) => ref.read(themeProvider.notifier).toggle(),
                      activeThumbColor: colors.primary,
                    ),
                  ),
                ]),
                const SizedBox(height: 16),
                MenuSection(items: [
                  ProfileMenuItem(icon: Icons.help_outline, title: s.profileHelp, onTap: () {}),
                  ProfileMenuItem(
                      icon: Icons.privacy_tip_outlined, title: s.profilePrivacy, onTap: () {}),
                  ProfileMenuItem(icon: Icons.info_outline, title: s.profileAbout, onTap: () {}),
                ]),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => showLogoutDialog(context, ref, colors),
                    icon: Icon(Icons.logout, color: colors.error),
                    label: Text(s.profileLogout, style: TextStyle(color: colors.error)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: BorderSide(color: colors.error),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Beauty Salon v1.0.0',
                    style: TextStyle(fontSize: 12, color: colors.textHint)),
                const SizedBox(height: 20),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

/// Profil menüsündeki okunmamış bildirim rozeti; sayı 0 ise gösterilmez.
class _UnreadBadge extends StatelessWidget {
  final int count;

  const _UnreadBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();

    final colors = AppColors.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: colors.error,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
            color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
