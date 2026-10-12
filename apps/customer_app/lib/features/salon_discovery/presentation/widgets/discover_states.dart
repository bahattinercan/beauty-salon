import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class EmptyState extends StatelessWidget {
  final String message;
  final VoidCallback onClear;

  const EmptyState({super.key, required this.message, required this.onClear});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: colors.textHint),
          const SizedBox(height: 16),
          Text(message,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w600, color: colors.textSecondary)),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onClear,
            child: Text(s.discoverClearFilters, style: TextStyle(color: colors.primary)),
          ),
        ],
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorState({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off, size: 48, color: colors.textHint),
          const SizedBox(height: 12),
          Text(s.homeSalonsNotLoaded,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(message,
              style: TextStyle(fontSize: 12, color: colors.textSecondary),
              textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(backgroundColor: colors.primary),
            child: Text(s.retry, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
