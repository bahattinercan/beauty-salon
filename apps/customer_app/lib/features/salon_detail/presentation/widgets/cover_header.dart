import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/media_url.dart';
import '../../domain/entities/salon_detail.dart';

class CircleIconButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const CircleIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.iconColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.all(4),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: colors.coverScrimButton,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
      ),
    );
  }
}

class CoverHeader extends StatelessWidget {
  final SalonDetail salon;
  final bool isFavorite;
  final VoidCallback onBack;
  final VoidCallback onFavorite;
  final VoidCallback onShare;

  const CoverHeader({
    super.key,
    required this.salon,
    required this.isFavorite,
    required this.onBack,
    required this.onFavorite,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      // Header kapandığında beyaz ikonlar açık zeminde kalıp görünmez oluyordu
      // (kontrast ~2.3:1). Kapanmış halde marka rengi zemin kullanılır.
      backgroundColor: colors.primaryDark,
      foregroundColor: Colors.white,
      leading: CircleIconButton(icon: Icons.arrow_back, onTap: onBack),
      actions: [
        CircleIconButton(
          icon: isFavorite ? Icons.favorite : Icons.favorite_border,
          iconColor: isFavorite ? colors.error : Colors.white,
          onTap: onFavorite,
        ),
        const SizedBox(width: 8),
        CircleIconButton(icon: Icons.share_outlined, onTap: onShare),
        const SizedBox(width: 12),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            salon.coverImageUrl != null
                ? Image.network(
                    resolveMediaUrl(salon.coverImageUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => _placeholder(colors),
                  )
                : _placeholder(colors),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      colors.coverScrimFade,
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(AppColors colors) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [colors.primary, colors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: const Center(child: Icon(Icons.spa, size: 80, color: Colors.white24)),
      );
}
