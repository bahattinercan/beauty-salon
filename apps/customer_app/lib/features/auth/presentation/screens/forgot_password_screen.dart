import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_header.dart';
import '../widgets/email_field.dart';
import '../widgets/gradient_button.dart';

/// E-posta girilip şifre sıfırlama kodu (OTP) gönderilen ekran.
/// Başarılıysa reset-password ekranına e-posta parametresiyle geçilir.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _showErrorSnackBar(String message) {
    final colors = AppColors.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: colors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Future<void> _handleSendCode() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final email = _emailController.text.trim();
    final success = await ref.read(authNotifierProvider.notifier).forgotPassword(email);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success) {
      context.pushNamed(RouteNames.resetPassword, queryParameters: {'email': email});
    } else {
      final authState = ref.read(authNotifierProvider);
      if (authState is AuthError) {
        _showErrorSnackBar(authState.message);
        ref.read(authNotifierProvider.notifier).clearError();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Scaffold(
      backgroundColor: colors.background,
      body: Column(
        children: [
          AuthHeader(
            icon: Icons.lock_reset_rounded,
            title: s.forgotPasswordTitle,
            subtitle: s.forgotPasswordSubtitle,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 28, 28, 28),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    EmailField(
                      controller: _emailController,
                      autofocus: true,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _handleSendCode(),
                    ),
                    const SizedBox(height: 32),
                    GradientButton(
                      isLoading: _isLoading,
                      label: s.sendCode,
                      onPressed: _handleSendCode,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.arrow_back_rounded, size: 16, color: colors.textSecondary),
                        const SizedBox(width: 4),
                        TextButton(
                          onPressed: () => context.goNamed(RouteNames.login),
                          style: TextButton.styleFrom(
                            foregroundColor: colors.textSecondary,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                          child: Text(s.loginLink),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
