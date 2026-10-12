import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

String? validateEmail(S s, String? value) {
  if (value == null || value.trim().isEmpty) return s.emailRequired;
  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
    return s.emailInvalid;
  }
  return null;
}

class EmailField extends StatelessWidget {
  final TextEditingController controller;
  final bool autofocus;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onFieldSubmitted;

  const EmailField({
    super.key,
    required this.controller,
    this.autofocus = false,
    this.textInputAction = TextInputAction.next,
    this.onFieldSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      textInputAction: textInputAction,
      autofocus: autofocus,
      validator: (value) => validateEmail(s, value),
      onFieldSubmitted: onFieldSubmitted,
      decoration: InputDecoration(
        labelText: s.emailLabel,
        hintText: s.emailHint,
        prefixIcon: Icon(Icons.email_outlined, color: colors.textHint),
      ),
    );
  }
}
