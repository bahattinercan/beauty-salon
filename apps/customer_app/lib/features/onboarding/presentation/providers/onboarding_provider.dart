import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/injection.dart';
import '../../domain/usecases/get_onboarding_seen_usecase.dart';
import '../../domain/usecases/mark_onboarding_seen_usecase.dart';
import '../../domain/usecases/reset_onboarding_seen_usecase.dart';

/// `true` = onboarding daha önce gösterilmiş.
class OnboardingNotifier extends AsyncNotifier<bool> {
  @override
  Future<bool> build() async {
    final result = await getIt<GetOnboardingSeenUseCase>()();
    return result.fold((_) => false, (seen) => seen);
  }

  Future<void> complete() async {
    final result = await getIt<MarkOnboardingSeenUseCase>()();
    // Yazma başarısız olsa bile kullanıcı giriş ekranında kilitli kalmasın;
    // bayrak bir dahaki açılışta tekrar sorulur.
    result.fold(
      (_) => state = const AsyncData(true),
      (_) => state = const AsyncData(true),
    );
  }

  /// Profil > Ayarlar: "Tanıtımı tekrar göster".
  Future<void> replay() async {
    await getIt<ResetOnboardingSeenUseCase>()();
    state = const AsyncData(false);
  }
}

final onboardingProvider =
    AsyncNotifierProvider<OnboardingNotifier, bool>(OnboardingNotifier.new);
