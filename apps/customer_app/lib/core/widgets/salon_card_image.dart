import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../app/theme/app_colors.dart';
import '../network/media_url.dart';
import 'salon_placeholder.dart';

class CardBadge extends StatelessWidget {
  final String text;
  final Color background;
  final Color textColor;
  final double letterSpacing;

  const CardBadge({
    super.key,
    required this.text,
    required this.background,
    required this.textColor,
    this.letterSpacing = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
          letterSpacing: letterSpacing,
        ),
      ),
    );
  }
}

class SalonCardImage extends StatelessWidget {
  final String imageUrl;
  final String distance;
  final String priceRange;
  final bool isFavorite;
  final VoidCallback? onFavoriteTap;

  /// Görsel yokken kullanılacak yer tutucunun tohumu (`salon.id`) ve adı.
  final String seed;
  final String salonName;

  /// `distance` boşsa konum çipi bununla gösterilir (discover: ilçe adı).
  final String locationFallback;
  /// Verilirse görsel yüksekliği sabit yerine bu oranla belirlenir
  /// (grid kartı 4/5). `null` → [imageHeight].
  final double? aspectRatio;
  /// Rozet: "Yeni" (lime dolgu + koyu metin).
  final bool isNew;
  final String newBadgeLabel;
  /// Verilirse alt sağda puan çipi gösterilir (nötr koyu `navPill`),
  /// [priceRange] rozetinin yerini alır.
  final String? scoreLabel;

  const SalonCardImage({
    super.key,
    required this.imageUrl,
    required this.distance,
    required this.priceRange,
    required this.isFavorite,
    this.onFavoriteTap,
    this.seed = '',
    this.salonName = '',
    this.locationFallback = '',
    this.aspectRatio,
    this.isNew = false,
    this.newBadgeLabel = '',
    this.scoreLabel,
  });

  static const double imageHeight = 140;
  static const BorderRadius topRadius =
      BorderRadius.vertical(top: Radius.circular(16));

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    // Boş URL'de CachedNetworkImage'ı hiç denemiyoruz: boş string ile hata
    // durumuna düşüyor ve gereksiz ağ isteği çıkıyordu.
    final resolved = resolveMediaUrl(imageUrl);
    // Yüksekliği dışarıdan (SizedBox / AspectRatio) alan bir görsel parçası:
    // kart medyası sabit 140 olabilir, grid kartı 4/5 oranında.
    Widget mediaArt() => ClipRRect(
          borderRadius: topRadius,
          child: resolved.isEmpty
              ? SalonPlaceholder(
                  seed: seed,
                  semanticsLabel: salonName,
                  borderRadius: topRadius,
                )
              : CachedNetworkImage(
                  imageUrl: resolved,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => SalonPlaceholder(
                    seed: seed,
                    semanticsLabel: salonName,
                    borderRadius: topRadius,
                  ),
                  errorWidget: (context, url, error) => SalonPlaceholder(
                    seed: seed,
                    semanticsLabel: salonName,
                    borderRadius: topRadius,
                  ),
                ),
        );

    final image = mediaArt();

    final overlay = Stack(
      children: [
        Positioned.fill(child: image),
        // right: 56 → konum chip'i kalp butonunun altına girmesin (dar kart).
        Positioned(
          top: 10,
          left: 10,
          right: 56,
          child: Align(
            alignment: Alignment.centerLeft,
            child: CardBadge(
              text: distance.isNotEmpty ? distance : locationFallback,
              background: Colors.white.withValues(alpha: 0.92),
              textColor: const Color(0xFF1A1023),
            ),
          ),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: GestureDetector(
            onTap: onFavoriteTap,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isFavorite ? Icons.favorite : Icons.favorite_border,
                size: 18,
                color: isFavorite ? colors.primary : colors.textSecondary,
              ),
            ),
          ),
        ),
        if (isNew && newBadgeLabel.isNotEmpty)
          Positioned(
            bottom: 10,
            left: 10,
            // lime yalnızca DOLGU: üstünde onAccentLime (14.1:1, AAA).
            child: CardBadge(
              text: newBadgeLabel,
              background: colors.accentLime,
              textColor: colors.onAccentLime,
            ),
          ),
        if (scoreLabel != null)
          Positioned(
            bottom: 10,
            right: 10,
            // Puan çipi: eski `accent` mavi + beyaz (dark'ta AA altıydı) yerine
            // nötr koyu zemin + açık metin → kartta 4 renk yerine 3 renk.
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: colors.navPill,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star_rounded, size: 14, color: colors.onNavPill),
                  const SizedBox(width: 3),
                  Text(
                    scoreLabel!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: colors.onNavPill,
                    ),
                  ),
                ],
              ),
            ),
          )
        else if (priceRange.isNotEmpty)
          Positioned(
            bottom: 10,
            right: 10,
            child: CardBadge(
              text: priceRange,
              background: colors.primary,
              textColor: colors.onPrimary,
              // ₺ glifleri 12px'te birbirine değiyordu.
              letterSpacing: 1.5,
            ),
          ),
      ],
    );

    final ratio = aspectRatio;
    // Grid kartı oranla (4/5), carousel kartı sabit yükseklikle.
    return ratio != null
        ? AspectRatio(aspectRatio: ratio, child: overlay)
        : SizedBox(
            height: imageHeight,
            width: double.infinity,
            child: overlay,
          );
  }
}
