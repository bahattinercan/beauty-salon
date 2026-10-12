import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/salon.dart';
import '../../domain/entities/salon_filter.dart';
import '../../domain/usecases/get_nearby_salons_usecase.dart';
import '../../domain/usecases/get_salons_usecase.dart';
import 'location_provider.dart';

/// Filtre key'li salon listesi: filtre değişince provider yeniden kurulur ve
/// backend'e `GET /salons?...` ile gider (CA-007).
class SalonsNotifier extends AsyncNotifier<List<Salon>> {
  final SalonFilter filter;
  SalonsNotifier(this.filter);

  @override
  Future<List<Salon>> build() => _fetch();

  Future<List<Salon>> _fetch() async {
    final result = await getIt<GetSalonsUseCase>()(filter);
    return result.fold((failure) => throw failure, (salons) => salons);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}

final salonsProvider =
    AsyncNotifierProvider.family<SalonsNotifier, List<Salon>, SalonFilter>(
      SalonsNotifier.new,
    );

/// Konum bazlı "Yakınımdaki Salonlar" listesi: `locationProvider`'ı izler,
/// konum gelince `GET /salons/nearby?radius=` ile doldurur. Konum yoksa boş
/// liste döner (Home bölümü gizli kalır).
class NearbySalonsNotifier extends AsyncNotifier<List<Salon>> {
  final int radius;
  NearbySalonsNotifier({this.radius = 10});

  @override
  Future<List<Salon>> build() async {
    final location = ref.watch(locationProvider).asData?.value;
    if (location == null) return const <Salon>[];

    final result = await getIt<GetNearbySalonsUseCase>()(
      latitude: location.latitude,
      longitude: location.longitude,
      radius: radius,
    );
    return result.fold((failure) => throw failure, (salons) => salons);
  }
}

final nearbySalonsProvider =
    AsyncNotifierProvider<NearbySalonsNotifier, List<Salon>>(
      NearbySalonsNotifier.new,
    );
