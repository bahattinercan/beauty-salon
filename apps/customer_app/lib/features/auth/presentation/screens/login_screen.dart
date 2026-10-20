import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/auth_provider.dart';
import '../widgets/email_field.dart';
import '../widgets/auth_footer_links.dart';
import '../widgets/auth_password_field.dart';
import '../widgets/gradient_button.dart';
import '../../../../app/widgets/brand_surface.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  String? _validatePassword(String? value) {
    final s = S.of(context);
    if (value == null || value.isEmpty) return s.passwordRequired;
    if (value.length < 6) return s.passwordMinLength;
    return null;
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    await ref.read(authNotifierProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );

    if (!mounted) return;
    setState(() => _isLoading = false);

    final authState = ref.read(authNotifierProvider);
    if (authState is AuthAuthenticated) {
      context.goNamed(RouteNames.home);
    } else if (authState is AuthError) {
      _showErrorSnackBar(authState.message);
      ref.read(authNotifierProvider.notifier).clearError();
    }
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

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Scaffold(
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          // stretch: gradient başlık ekranın tamamını kaplamalı (Column varsayılanı
          // center olduğu için Container çocuğun genişliğine daralıyordu).
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrandSurface(
              child: Container(
                            decoration: BoxDecoration(gradient: colors.bannerGradient),
                            padding: EdgeInsets.only(
                              top: MediaQuery.of(context).padding.top + 48,
                              left: 28,
                              right: 28,
                              bottom: 40,
                            ),
                            child: const AuthLogo(),
                          ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
                child: Column(
                  children: [
                    Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          EmailField(
                            controller: _emailController,
                            onFieldSubmitted: (_) => _handleLogin(),
                          ),
                          const SizedBox(height: 16),
                          AuthPasswordField(
                            controller: _passwordController,
                            label: s.passwordLabel,
                            obscure: _obscurePassword,
                            onToggle: () =>
                                setState(() => _obscurePassword = !_obscurePassword),
                            textInputAction: TextInputAction.done,
                            validator: _validatePassword,
                            onFieldSubmitted: (_) => _handleLogin(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    GradientButton(
                      isLoading: _isLoading,
                      label: s.loginButton,
                      onPressed: _handleLogin,
                    ),
                    const SizedBox(height: 4),
                    const AuthFooterLinks(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
