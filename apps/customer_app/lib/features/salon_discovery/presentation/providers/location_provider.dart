import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/services/geolocation.dart';
import '../../../../core/services/location_service.dart';

/// Konum tek kaynaktan okunur (Home ve Discover aynı provider'ı kullanır).
/// Hata `Failure` olarak thrown → `AsyncError`; ekranlar `error` tipine göre
/// davranır (ör. `LocationPermissionDeniedFailure` için snackbar).
/// Discover için hata = "konum yok": mesafe filtresi uygulanmaz, liste boşalmaz.
class LocationNotifier extends AsyncNotifier<Geolocation?> {
  @override
  Future<Geolocation?> build() async {
    final result = await getIt<LocationService>().getCurrent();
    return result.fold((failure) => throw failure, (location) => location);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final result = await getIt<LocationService>().getCurrent();
      return result.fold((failure) => throw failure, (location) => location);
    });
  }
}

final locationProvider =
    AsyncNotifierProvider<LocationNotifier, Geolocation?>(LocationNotifier.new);
