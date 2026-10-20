import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../l10n/app_strings.dart';

/// Uygulama genelinde tutarlı "yükleniyor / boş / hata" durumları.

// Tema tokenları extension değil; AppColors.of tema parlaklığına göre set seçer,
// böylece düz MaterialApp ile yazılan testler de doğru tema setini alır.
AppColors _colors(BuildContext context) =>
    AppColors.of(context);
///
/// Ekranlar artık kendi başına CircularProgressIndicator veya düz metin
/// yerine SkeletonList / EmptyState / ErrorState kullanıyor.

/// Bağımlılıksız skeleton: opaklık nabız efektiyle animasyonlu.
class Skeleton extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const Skeleton({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = 8,
  });

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors(context);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final pulse = 0.30 + 0.30 * (1 - (2 * _controller.value - 1).abs());
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: c.surfaceVariant.withValues(alpha: pulse + 0.2),
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        );
      },
    );
  }
}

class SkeletonList extends StatelessWidget {
  final int count;
  final double itemHeight;

  const SkeletonList({super.key, this.count = 3, this.itemHeight = 110});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (int i = 0; i < count; i++)
          Padding(
            padding: EdgeInsets.only(bottom: i == count - 1 ? 0 : 12),
            child: Skeleton(height: itemHeight, borderRadius: 16),
          ),
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  final String message;
  final String? subMessage;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.message,
    this.subMessage,
    this.icon = Icons.inbox_outlined,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final c = _colors(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 56, color: c.textHint),
          const SizedBox(height: 14),
          Text(
            message,
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: c.textSecondary),
            textAlign: TextAlign.center,
          ),
          if (subMessage != null) ...[
            const SizedBox(height: 6),
            Text(subMessage!,
                style: TextStyle(fontSize: 13, color: c.textHint),
                textAlign: TextAlign.center),
          ],
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 14),
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorState({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {

    final c = _colors(context);
    final s = S.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off, size: 48, color: c.textHint),
          const SizedBox(height: 12),
          Text(s.errorLoading, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(message, style: TextStyle(fontSize: 12, color: c.textSecondary), textAlign: TextAlign.center),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(backgroundColor: c.primary),
              child: Text(s.retry, style: TextStyle(color: c.onPrimary)),
            ),
          ],
        ],
      ),
    );
  }
}

/// AsyncValue'ı tutarlı biçimde render eder.
class AsyncStateView<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget? skeleton;
  final Widget? empty;
  final bool Function(T data)? isEmpty;
  final VoidCallback? onRetry;

  const AsyncStateView({
    super.key,
    required this.value,
    required this.data,
    this.skeleton,
    this.empty,
    this.isEmpty,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => skeleton ?? const SkeletonList(),
      error: (error, _) => ErrorState(message: error.toString(), onRetry: onRetry),
      data: (value) {
        final emptyCheck = isEmpty;
        if (emptyCheck != null && emptyCheck(value)) {
          return empty ?? EmptyState(message: S.of(context).noResults);
        }
        return data(value);
      },
    );
  }
}
