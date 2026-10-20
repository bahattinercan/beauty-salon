import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/onboarding_provider.dart';
import '../widgets/onboarding_art.dart';
import '../widgets/page_dots.dart';

/// İlk açılışta gösterilen tanıtım (CA-019 WP2).
///
/// Slayt içerikleri sunum katmanındadır: çeviri `S.of(context)`'ten gelir.
/// Kalıcılık ("bir kez göster") domain'dedir (`OnboardingRepository`).
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  static const List<String> _slideIcons = ['spa', 'content_cut', 'face'];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(onboardingProvider.notifier).complete();
    if (!mounted) return;
    // Giriş yapmış kullanıcı (örn. "Tanıtımı tekrar göster") router
    // redirect'i ile /home'a gider; burada yalnızca login hedeflenir.
    context.goNamed(RouteNames.login);
  }

  void _next(int slideCount) {
    if (_page < slideCount - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    final slides = [
      (title: s.onboarding1Title, body: s.onboarding1Body),
      (title: s.onboarding2Title, body: s.onboarding2Body),
      (title: s.onboarding3Title, body: s.onboarding3Body),
    ];
    final isLast = _page == slides.length - 1;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 12, 0),
              child: Row(
                children: [
                  Text(
                    s.brandName,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.4,
                      color: colors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _finish,
                    style: TextButton.styleFrom(
                      foregroundColor: colors.textSecondary,
                    ),
                    child: Text(s.onboardingSkip),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: slides.length,
                onPageChanged: (index) => setState(() => _page = index),
                itemBuilder: (context, index) {
                  final slide = slides[index];
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        // Görsel hem yüksekliğe hem genişliğe bağlanır: salt
                        // `Expanded` dalga ile metin arasında boşluk bırakıyor,
                        // salt `AspectRatio` geniş ekranda (web/tablet) taşma
                        // yapıyordu (RenderFlex overflow).
                        final artHeight = (constraints.maxHeight * 0.62).clamp(
                            160.0, constraints.maxWidth * 1.15);
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              height: artHeight,
                              width: double.infinity,
                              child: OnboardingArt(
                                iconName:
                                    _slideIcons[index % _slideIcons.length],
                                index: index,
                              ),
                            ),
                            const SizedBox(height: 18),
                            Text(
                              slide.title,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                height: 1.15,
                                letterSpacing: -0.6,
                                color: colors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              slide.body,
                              style: TextStyle(
                                fontSize: 15,
                                height: 1.45,
                                color: colors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                          ],
                        );
                      },
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: Row(
                children: [
                  PageDots(count: slides.length, currentIndex: _page),
                  const Spacer(),
                  SizedBox(
                    width: 58,
                    height: 58,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: colors.accentLime,
                        boxShadow: [
                          BoxShadow(
                            color: colors.accentLime.withValues(alpha: 0.45),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: IconButton(
                        key: const Key('onboarding-next'),
                        iconSize: 26,
                        color: colors.onAccentLime,
                        tooltip: isLast ? s.onboardingStart : s.onboardingNext,
                        onPressed: () => _next(slides.length),
                        icon: Icon(
                          isLast
                              ? Icons.check_rounded
                              : Icons.arrow_forward_rounded,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
