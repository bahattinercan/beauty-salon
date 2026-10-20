import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../app/widgets/brand_surface.dart';

/// Gradyanlı karşılama başlığı + arama girişi.
///
/// Not: `SalonCarousel` eskiden bu dosyanın içindeydi; WP3'te
/// `salon_carousel.dart`'a taşındı (banner ile ilgisi yoktu).
class BannerHeader extends StatelessWidget {
  const BannerHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return BrandSurface(
             child: Container(
                  decoration: BoxDecoration(
                    gradient: colors.bannerGradient,
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
                  ),
                  // Eskiden sabit `top: 52` idi; `home_screen` içeriği zaten `SafeArea`
                  // ile sarmaladığı için çentikli cihazda üstte ~24px fazladan boşluk
                  // açıyordu (çentik yüksekliği kadar değil, sabit 52).
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.homeWelcome,
                                  // `onBanner`: gradyanın en açık durağında 5.05:1 (AA).
                                  // Alpha'lı beyaz (0.75) 3.35:1'e düşüyordu → kaldırıldı.
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: colors.onBanner,
                                        fontWeight: FontWeight.w500,
                                        letterSpacing: 0.3,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  s.homeDiscover,
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: colors.onBanner,
                                        letterSpacing: -0.5,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: colors.onBanner.withValues(alpha: 0.18),
                              shape: BoxShape.circle,
                              border: Border.all(color: colors.onBanner.withValues(alpha: 0.25)),
                            ),
                            child: Icon(Icons.person, color: colors.onBanner, size: 22),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      Semantics(
                        button: true,
                        label: s.homeSearchHintFull,
                        child: GestureDetector(
                          onTap: () => context.goNamed(RouteNames.discover),
                          behavior: HitTestBehavior.opaque,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: [
                                BoxShadow(
                                  color: colors.primaryDark.withValues(alpha: 0.18),
                                  blurRadius: 14,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.search, color: colors.textHint, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    s.homeSearchHintFull,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(color: colors.textHint, fontSize: 14),
                                  ),
                                ),
                                Icon(
                                  Icons.tune_rounded,
                                  color: colors.primary,
                                  size: 20,
                                ),
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
}
