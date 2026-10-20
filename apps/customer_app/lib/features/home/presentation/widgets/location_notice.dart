import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

/// Konum izni reddedildiğinde gösterilen satır içi bilgi kartı.
///
/// Eskiden `home_screen.dart` içinde duruyordu; dosya satır limiti (≤180)
/// ve tekrar kullanılabilirlik için buraya alındı.
class LocationNotice extends StatelessWidget {
  final VoidCallback onOpenSettings;

  const LocationNotice({super.key, required this.onOpenSettings});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: colors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.warning.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.location_off_outlined, color: colors.warning, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              s.locationDeniedBody,
              style: TextStyle(fontSize: 13, color: colors.textPrimary),
            ),
          ),
          TextButton(
            onPressed: onOpenSettings,
            style: TextButton.styleFrom(foregroundColor: colors.primary),
            child: Text(
              s.profileSettings,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
