import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import 'otp_input_field.dart';

class OtpSection extends StatelessWidget {
  final String label;
  final String? Function(String?)? validator;
  final ValueChanged<String> onChanged;
  final bool canResend;
  final bool isResending;
  final VoidCallback onResend;

  const OtpSection({
    super.key,
    required this.label,
    required this.onChanged,
    required this.canResend,
    required this.isResending,
    required this.onResend,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(height: 10),
        OtpInputField(length: 6, validator: validator, onChanged: onChanged),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: canResend && !isResending ? onResend : null,
            style: TextButton.styleFrom(
              foregroundColor: colors.primary,
              textStyle: const TextStyle(fontSize: 13),
            ),
            child: isResending
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(s.resendCode),
          ),
        ),
      ],
    );
  }
}
