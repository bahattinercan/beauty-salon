import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/service_category.dart';
import '../../domain/usecases/get_categories_usecase.dart';

/// Discover kategori chip'leri backend'den gelir (`GET /categories`).
class CategoriesNotifier extends AsyncNotifier<List<ServiceCategory>> {
  @override
  Future<List<ServiceCategory>> build() => _fetch();

  Future<List<ServiceCategory>> _fetch() async {
    final result = await getIt<GetCategoriesUseCase>()();
    return result.fold((failure) => throw failure, (categories) => categories);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}

final categoriesProvider =
    AsyncNotifierProvider<CategoriesNotifier, List<ServiceCategory>>(
      CategoriesNotifier.new,
    );
