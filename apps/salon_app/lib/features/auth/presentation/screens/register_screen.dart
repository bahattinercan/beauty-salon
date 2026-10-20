import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../data/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final s = S.of(context);
    final authAsync = ref.watch(authProvider);
    final isLoading = authAsync.isLoading;

    ref.listen(authProvider, (_, next) {
      if (next.hasValue && next.value!.isLoggedIn) {
        context.go('/dashboard');
      }
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error.toString()),
            backgroundColor: c.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
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
          Container(
            decoration: BoxDecoration(
              gradient: c.headerGradient,
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
                    color: c.onBanner.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Icon(Icons.person_add_rounded, size: 40, color: c.onPrimary),
                ),
                const SizedBox(height: 16),
                Text(s.appTitle,
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: c.onPrimary, letterSpacing: -0.5)),
                const SizedBox(height: 6),
                Text(s.registerSubtitle,
                    style: TextStyle(fontSize: 14, color: c.onPrimary.withValues(alpha: 0.82)),
                    textAlign: TextAlign.center),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: s.fullName,
                        prefixIcon: Icon(Icons.person_outline, color: c.primary),
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return s.fullNameRequired;
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: s.emailLabel,
                        prefixIcon: Icon(Icons.email_outlined, color: c.primary),
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
                        prefixIcon: Icon(Icons.lock_outlined, color: c.primary),
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
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirm,
                      decoration: InputDecoration(
                        labelText: s.newPasswordConfirm,
                        prefixIcon: Icon(Icons.lock_outlined, color: c.primary),
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: c.textHint),
                          onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                        ),
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return s.passwordRequired;
                        if (val != _passwordController.text) return s.passwordsDoNotMatch;
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [c.primaryGradient.colors[0], c.primaryGradient.colors[1]],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: c.primary.withValues(alpha: 0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          )
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: (isLoading || _nameController.text.trim().isEmpty) ? null : _register,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          minimumSize: const Size(double.infinity, 52),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: isLoading
                            ? SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(color: c.onPrimary, strokeWidth: 2),
                              )
                            : Text(s.registerButton,
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.onPrimary)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Align(
                      child: TextButton(
                        onPressed: () => context.pop(),
                        child: Text(s.backToLogin, style: TextStyle(color: c.primary)),
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

  void _register() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(authProvider.notifier).register(
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
  }
}
