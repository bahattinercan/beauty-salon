import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_header.dart';
import '../widgets/auth_password_field.dart';
import '../widgets/email_field.dart';
import '../widgets/email_display_card.dart';
import '../widgets/gradient_button.dart';
import '../widgets/otp_section.dart';

/// OTP + yeni şifre ile şifre sıfırlama ekranı.
/// `initialEmail` forgot-password akışından gelir (salt-okunur gösterilir);
/// boşsa (derin link) kullanıcı e-postayı kendisi girer.
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  bool _isResending = false;

  /// OTP kutularından birleştirilen 6 haneli kod.
  String _otpCode = '';

  bool get _emailFixed => (widget.initialEmail ?? '').isNotEmpty;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String? _validatePassword(String? value) {
    final s = S.of(context);
    if (value == null || value.isEmpty) return s.passwordRequired;
    if (value.length < 6) return s.passwordMinLength;
    return null;
  }

  String? _validateConfirm(String? value) {
    final s = S.of(context);
    if (value == null || value.isEmpty) return s.passwordRequired;
    if (value != _passwordController.text) return s.passwordMismatch;
    return null;
  }

  void _showSnackBar(String message, {bool isError = true}) {
    final colors = AppColors.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? colors.error : colors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showAuthError() {
    final authState = ref.read(authNotifierProvider);
    if (authState is AuthError) {
      _showSnackBar(authState.message);
      ref.read(authNotifierProvider.notifier).clearError();
    }
  }

  Future<void> _handleReset() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final success = await ref.read(authNotifierProvider.notifier).resetPassword(
          email: _emailController.text.trim(),
          token: _otpCode,
          newPassword: _passwordController.text,
        );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success) {
      _showSnackBar(S.of(context).resetPasswordSuccess, isError: false);
      context.goNamed(RouteNames.login);
    } else {
      _showAuthError();
    }
  }

  Future<void> _handleResend() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() => _isResending = true);
    final success = await ref.read(authNotifierProvider.notifier).forgotPassword(email);
    if (!mounted) return;
    setState(() => _isResending = false);

    if (success) {
      _showSnackBar(S.of(context).codeSent, isError: false);
    } else {
      _showAuthError();
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
            icon: Icons.password_rounded,
            title: s.resetPasswordTitle,
            backRoute: RouteNames.forgotPassword,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 24, 28, 28),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_emailFixed)
                      EmailDisplayCard(email: _emailController.text)
                    else
                      EmailField(controller: _emailController),
                    OtpSection(
                      label: s.otpLabel,
                      validator: (code) =>
                          (code == null || code.length != 6) ? s.otpInvalid : null,
                      onChanged: (code) => _otpCode = code,
                      canResend: !_isLoading,
                      isResending: _isResending,
                      onResend: _handleResend,
                    ),
                    const SizedBox(height: 4),
                    AuthPasswordField(
                      controller: _passwordController,
                      label: s.newPassword,
                      obscure: _obscurePassword,
                      onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
                      validator: _validatePassword,
                    ),
                    const SizedBox(height: 16),
                    AuthPasswordField(
                      controller: _confirmController,
                      label: s.newPasswordConfirm,
                      obscure: _obscureConfirm,
                      onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      textInputAction: TextInputAction.done,
                      validator: _validateConfirm,
                      onFieldSubmitted: (_) => _handleReset(),
                    ),
                    const SizedBox(height: 32),
                    GradientButton(
                      isLoading: _isLoading,
                      label: s.resetPasswordButton,
                      onPressed: _handleReset,
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
