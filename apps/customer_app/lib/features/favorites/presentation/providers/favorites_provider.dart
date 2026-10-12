import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/usecases/get_favorite_ids_usecase.dart';
import '../../domain/usecases/toggle_favorite_usecase.dart';

class FavoritesNotifier extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() async {
    final result = await getIt<GetFavoriteIdsUseCase>()();
    return result.fold((_) => {}, (ids) => ids);
  }

  bool isFavorite(String salonId) =>
      state.asData?.value.contains(salonId) ?? false;

  Future<void> toggle(String salonId) async {
    final current = state.asData?.value ?? {};
    // Optimistic update
    if (current.contains(salonId)) {
      state = AsyncData(Set.from(current)..remove(salonId));
    } else {
      state = AsyncData(Set.from(current)..add(salonId));
    }
    final result = await getIt<ToggleFavoriteUseCase>()(salonId);
    result.fold((_) => state = AsyncData(current), (_) => null);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    final result = await getIt<GetFavoriteIdsUseCase>()();
    state = result.fold(
      (_) => const AsyncData({}),
      (ids) => AsyncData(ids),
    );
  }
}

final favoritesProvider = AsyncNotifierProvider<FavoritesNotifier, Set<String>>(
  FavoritesNotifier.new,
);
