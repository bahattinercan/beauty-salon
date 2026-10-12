import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class AuthLogo extends StatelessWidget {
  const AuthLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(22),
          ),
          child: const Icon(Icons.spa_rounded, color: Colors.white, size: 42),
        ),
        const SizedBox(height: 16),
        const Text(
          'Beauty Salon',
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          S.of(context).loginSubtitleBrand,
          style: const TextStyle(fontSize: 14, color: Colors.white70, letterSpacing: 0.3),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class AuthFooterLinks extends StatelessWidget {
  const AuthFooterLinks({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Column(
      children: [
        TextButton(
          onPressed: () => context.goNamed(RouteNames.forgotPassword),
          style: TextButton.styleFrom(
            foregroundColor: colors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          ),
          child: Text(
            s.forgotPasswordLink,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('${s.noAccount} ',
                style: TextStyle(fontSize: 14, color: colors.textSecondary)),
            GestureDetector(
              onTap: () => context.goNamed(RouteNames.register),
              child: Text(
                s.registerLink,
                style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w600, color: colors.primary),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
