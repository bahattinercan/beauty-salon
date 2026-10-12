import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/locale_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

Future<void> showLanguagePicker(
  BuildContext context,
  WidgetRef ref,
  AppColors colors,
) {
  final s = S.of(context);

  return showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.surfaceVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text(s.selectLanguage,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ListTile(
              leading: const Text('🇹🇷', style: TextStyle(fontSize: 24)),
              title: Text(s.langTurkish),
              trailing: s.lang == 'tr' ? Icon(Icons.check, color: colors.primary) : null,
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('tr'));
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Text('🇬🇧', style: TextStyle(fontSize: 24)),
              title: Text(s.langEnglish),
              trailing: s.lang == 'en' ? Icon(Icons.check, color: colors.primary) : null,
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('en'));
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    ),
  );
}

Future<void> showLogoutDialog(
  BuildContext context,
  WidgetRef ref,
  AppColors colors,
) {
  final s = S.of(context);

  return showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(s.logoutTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
      content: Text(s.logoutContent),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
        ElevatedButton(
          onPressed: () async {
            Navigator.pop(ctx);
            await ref.read(authNotifierProvider.notifier).logout();
            if (context.mounted) context.goNamed(RouteNames.login);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: colors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(s.logoutConfirm),
        ),
      ],
    ),
  );
}
