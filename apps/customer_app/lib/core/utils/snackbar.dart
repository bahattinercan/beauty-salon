import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Tek satırlık snackbar gösterimi — presentation katmanında tekrarlanan
/// `ScaffoldMessenger` bloklarını sadeleştirir.
void showAppSnackBar(
  BuildContext context,
  String message, {
  bool isError = false,
}) {
  final colors = AppColors.of(context);
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: isError ? colors.error : colors.success,
    ),
  );
}
