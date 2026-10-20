import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

/// Home'daki kampanya kartı (Booksy referansı: yumuşak lavanta yüzey + lime CTA).
///
/// Kampanya API'si olmadığı için metin **statiktir** (l10n) — bkz. plan §7.
/// Fotoğraf boru hattı olmadığından sağdaki görsel de vektörel kalır.
class HeroPromoCard extends StatelessWidget {
  final VoidCallback? onTap;

  const HeroPromoCard({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Semantics(
      button: true,
      label: '${s.homePromoTitle}. ${s.homePromoCta}',
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
          decoration: BoxDecoration(
            color: colors.heroSurface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: colors.primary.withValues(alpha: 0.10)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.homePromoKicker,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.1,
                            color: colors.primary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          s.homePromoTitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                            letterSpacing: -0.4,
                            color: colors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          s.homePromoBody,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            height: 1.35,
                            color: colors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Vektörel "indirim" rozeti: fotoğraf yok, ama kartın sağ
                  // tarafı boş kalmasın diye marka gradyanlı yumuşak bir küp.
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      gradient: colors.ctaGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      Icons.local_offer_rounded,
                      color: colors.onPrimary,
                      size: 28,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Lime yalnızca DOLGU olarak: üstünde koyu metin (14.1:1, AAA).
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: colors.accentLime,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      s.homePromoCta,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: colors.onAccentLime,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 15,
                      color: colors.onAccentLime,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
