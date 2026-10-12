import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../app/theme/app_colors.dart';

/// 6 haneli doğrulama kodu (OTP) girişi.
///
/// `Form` içinde kullanılır; değer `FormField<String>` olarak saklanır,
/// böylece `Form.validate()` ile `validator` tetiklenir ve hata metni
/// kutuların altında gösterilir. Tamamlanan koda `onCompleted` ile erişilir.
class OtpInputField extends StatefulWidget {
  const OtpInputField({
    super.key,
    this.length = 6,
    this.validator,
    this.onChanged,
    this.onCompleted,
    this.autofocus = false,
  });

  final int length;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onCompleted;
  final bool autofocus;

  @override
  State<OtpInputField> createState() => _OtpInputFieldState();
}

class _OtpInputFieldState extends State<OtpInputField> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;

  int get _length => widget.length;

  String get _value => _controllers.map((c) => c.text).join();

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_length, (_) => TextEditingController());
    _focusNodes = List.generate(_length, (_) => FocusNode());
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _handleChanged(int index, String text, FormFieldState<String> state) {
    // Yapıştırma / hızlı giriş: tek kutuya uzun kod düşerse dağıt.
    if (index == 0 && text.length > 1) {
      final digits = text.replaceAll(RegExp(r'\D'), '');
      for (var j = 0; j < digits.length && j < _length; j++) {
        _controllers[j].text = digits[j];
      }
      final last = digits.length < _length ? digits.length : _length - 1;
      _focusNodes[last].requestFocus();
    } else if (text.isNotEmpty && index < _length - 1) {
      _focusNodes[index + 1].requestFocus();
    } else if (text.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    final value = _value;
    state.didChange(value);
    widget.onChanged?.call(value);
    if (value.length == _length) {
      FocusScope.of(context).unfocus();
      widget.onCompleted?.call(value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return FormField<String>(
      validator: widget.validator,
      builder: (state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: List.generate(_length * 2 - 1, (i) {
                // Çift indisler kutu, tek indisler 8px boşluk.
                if (i.isOdd) return const SizedBox(width: 8);
                final index = i ~/ 2;
                return Expanded(
                  child: SizedBox(
                    height: 54,
                    child: TextField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      autofocus: widget.autofocus && index == 0,
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      textInputAction: index == _length - 1
                          ? TextInputAction.done
                          : TextInputAction.next,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        if (index > 0) LengthLimitingTextInputFormatter(1),
                      ],
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: colors.surface,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: colors.surfaceVariant),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: colors.surfaceVariant),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              BorderSide(color: colors.primary, width: 2),
                        ),
                      ),
                      onChanged: (text) => _handleChanged(index, text, state),
                    ),
                  ),
                );
              }),
            ),
            if (state.hasError)
              Padding(
                padding: const EdgeInsets.only(top: 8, left: 4),
                child: Text(
                  state.errorText ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
