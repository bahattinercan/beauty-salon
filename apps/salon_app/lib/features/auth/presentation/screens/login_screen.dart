import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../data/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final authAsync = ref.watch(authProvider);
    final isLoading = authAsync.isLoading;

    ref.listen(authProvider, (_, next) {
      if (next.hasValue && next.value!.isLoggedIn) {
        context.go('/dashboard');
      }
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error.toString()), backgroundColor: Colors.red),
        );
      }
    });

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
          // Gradient top section
          Container(
            decoration: const BoxDecoration(
              gradient: AppColors.headerGradient,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
            ),
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 48,
              left: 24,
              right: 24,
              bottom: 40,
            ),
            child: Column(
              children: [
                Container(
                  width: 76, height: 76,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Icon(Icons.store_rounded, size: 40, color: Colors.white),
                ),
                const SizedBox(height: 16),
                Text(s.appTitle,
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5)),
                const SizedBox(height: 6),
                Text(s.loginSubtitle,
                    style: const TextStyle(fontSize: 14, color: Colors.white70),
                    textAlign: TextAlign.center),
              ],
            ),
          ),
          // Form section
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: s.emailLabel,
                        prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary),
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return s.emailRequired;
                        if (!val.contains('@')) return s.emailInvalid;
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: s.passwordLabel,
                        prefixIcon: const Icon(Icons.lock_outlined, color: AppColors.primary),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: c.textHint),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return s.passwordRequired;
                        if (val.length < 6) return s.passwordMinLength;
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => _showForgotPasswordDialog(context, s),
                              child: Text(s.forgotPassword, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: Text(s.isEn ? 'Don\'t have an account? Register' : 'Hesabın yok mu? Kayıt Ol', style: const TextStyle(color: AppColors.primary)),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)], begin: Alignment.centerLeft, end: Alignment.centerRight),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                      ),
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          minimumSize: const Size(double.infinity, 52),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: isLoading
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text(s.loginButton, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
          ),
        ),
      ),
    );
  }

  void _login() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).login(
      _emailController.text.trim(),
      _passwordController.text,
    );
  }

  void _showForgotPasswordDialog(BuildContext context, S s) {
    final emailCtrl = TextEditingController(text: _emailController.text.trim());
    bool sending = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(s.forgotPasswordTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(s.forgotPasswordBody, style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: s.emailLabel,
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: const OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
            ElevatedButton(
              onPressed: sending ? null : () async {
                final email = emailCtrl.text.trim();
                if (email.isEmpty || !email.contains('@')) return;
                setDialogState(() => sending = true);
                try {
                  await ref.read(authProvider.notifier).forgotPassword(email);
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    _showResetPasswordDialog(context, s, email);
                  }
                } catch (e) {
                  setDialogState(() => sending = false);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: sending
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(s.sendCode),
            ),
          ],
        ),
      ),
    );
  }

  void _showResetPasswordDialog(BuildContext context, S s, String email) {
    final codeCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    bool confirming = false;
    bool obscure = true;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(s.resetPasswordTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(s.resetPasswordBody(email), style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: codeCtrl,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                decoration: const InputDecoration(counterText: '', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                  labelText: s.newPassword,
                  prefixIcon: const Icon(Icons.lock_outlined),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setDialogState(() => obscure = !obscure),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
            ElevatedButton(
              onPressed: confirming ? null : () async {
                if (codeCtrl.text.length < 6 || passCtrl.text.length < 6) return;
                setDialogState(() => confirming = true);
                try {
                  await ref.read(authProvider.notifier).resetPassword(email, codeCtrl.text, passCtrl.text);
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(s.passwordResetSuccess)),
                    );
                  }
                } catch (e) {
                  setDialogState(() => confirming = false);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: confirming
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(s.confirm),
            ),
          ],
        ),
      ),
    );
  }
}
