import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/snackbar.dart';
import '../../domain/usecases/confirm_email_change_usecase.dart';
import '../../domain/usecases/request_email_change_usecase.dart';
import '../providers/user_provider.dart';
import 'app_text_field.dart';

/// İki adımlı e-posta değişikliği: kod gönder → kodu doğrula.
/// Hata handling `fold` ile (presentation'da `try/catch` yok, CLAUDE.md §3).
class EmailChangeSection extends ConsumerStatefulWidget {
  const EmailChangeSection({
    super.key,
    required this.emailController,
    required this.originalEmail,
  });

  final TextEditingController emailController;
  final String originalEmail;

  @override
  ConsumerState<EmailChangeSection> createState() => _EmailChangeSectionState();
}

class _EmailChangeSectionState extends ConsumerState<EmailChangeSection> {
  static final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  final _codeController = TextEditingController();
  String _currentEmail = '';
  bool _codeSent = false;
  bool _isRequesting = false;
  bool _isConfirming = false;

  @override
  void initState() {
    super.initState();
    _currentEmail = widget.originalEmail;
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final s = S.of(context);
    final email = widget.emailController.text.trim();

    if (email == _currentEmail) {
      showAppSnackBar(context, s.emailSameAsCurrent, isError: true);
      return;
    }
    if (!_emailRegex.hasMatch(email)) {
      showAppSnackBar(context, s.emailInvalidField, isError: true);
      return;
    }

    setState(() => _isRequesting = true);
    final result = await getIt<RequestEmailChangeUseCase>()(email);
    if (!mounted) return;
    setState(() => _isRequesting = false);

    result.fold(
      (failure) => showAppSnackBar(context, failure.message, isError: true),
      (_) {
        setState(() => _codeSent = true);
        showAppSnackBar(context, s.codeSent);
      },
    );
  }

  Future<void> _confirm() async {
    final s = S.of(context);
    final code = _codeController.text.trim();

    if (code.length != 6) {
      showAppSnackBar(context, s.otpInvalid, isError: true);
      return;
    }

    setState(() => _isConfirming = true);
    final result = await getIt<ConfirmEmailChangeUseCase>()(token: code);
    if (!mounted) return;
    setState(() => _isConfirming = false);

    result.fold(
      (failure) => showAppSnackBar(context, failure.message, isError: true),
      (_) {
        final newEmail = widget.emailController.text.trim();
        ref.invalidate(userProvider);
        setState(() {
          _currentEmail = newEmail;
          _codeSent = false;
          _codeController.clear();
        });
        showAppSnackBar(context, s.emailChangeSuccess);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text(
          _codeSent ? s.codeSent : s.emailChangeHint,
          style: TextStyle(fontSize: 12, color: colors.textSecondary),
        ),
        const SizedBox(height: 10),
        if (_codeSent) ...[
          AppTextField(
            controller: _codeController,
            label: s.otpLabel,
            icon: Icons.lock_outline,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 10),
          _ActionButton(
            label: s.confirmEmailChangeBtn,
            busy: _isConfirming,
            filled: true,
            onPressed: _isConfirming ? null : _confirm,
          ),
        ] else
          _ActionButton(
            label: s.sendVerificationCode,
            busy: _isRequesting,
            filled: false,
            onPressed: _isRequesting ? null : _sendCode,
          ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final bool busy;
  final bool filled;
  final VoidCallback? onPressed;

  const _ActionButton({
    required this.label,
    required this.busy,
    required this.filled,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    if (filled) {
      return ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: busy
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(label,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
      );
    }

    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: colors.primary,
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(color: colors.primary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: busy
          ? SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: colors.primary),
            )
          : Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
    );
  }
}
