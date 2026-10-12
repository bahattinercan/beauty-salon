import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/geolocation.dart';
import '../../domain/entities/salon.dart';
import '../../domain/entities/salon_filter.dart';

class DiscoverState {
  final SalonFilter filter;

  const DiscoverState({this.filter = const SalonFilter()});

  DiscoverState copyWith({SalonFilter? filter}) =>
      DiscoverState(filter: filter ?? this.filter);
}

class DiscoverNotifier extends Notifier<DiscoverState> {
  /// `?category=` query parametresi — `GET /categories`'ten gelen kategori id'si.
  final String? initialCategoryId;

  DiscoverNotifier(this.initialCategoryId);

  @override
  DiscoverState build() => DiscoverState(
        filter: initialCategoryId == null
            ? const SalonFilter()
            : SalonFilter(categoryId: initialCategoryId),
      );

  /// `null` = "Tümü".
  void setCategory(String? categoryId) => state = state.copyWith(
        filter: state.filter.copyWith(categoryId: categoryId),
      );

  void setSort(String value) =>
      state = state.copyWith(filter: state.filter.copyWith(sortBy: value));

  void setQuery(String value) =>
      state = state.copyWith(filter: state.filter.copyWith(search: value.trim()));

  void setFilter(SalonFilter filter) => state = state.copyWith(filter: filter);

  void clear() => state = const DiscoverState();

  /// Backend'in desteklemediği kısım istemci tarafında uygulanır:
  /// mesafe sıralaması/filtresi ve fiyat sıralaması. `distance` ya `nearby`
  /// endpoint'inden gelir ya da konum bilinçliyken haversine ile hesaplanır.
  /// Konum yokken mesafe filtresi uygulanmaz (filtre anlamsız olur, liste
  /// boşalmaz). `rating`/`newest` sıralaması backend'de yapılır.
  List<Salon> applyClientFilter(List<Salon> salons, Geolocation? location) {
    final filter = state.filter;

    // Konum bilinçliyken mesafeyi kartta göstermek için entity'ye yazılır.
    final enriched = salons.map((salon) {
      if (salon.distance != null || location == null) return salon;
      final km = salon.distanceKmTo(location.latitude, location.longitude);
      return km == null ? salon : salon.withDistance(km);
    }).toList();

    final list = filter.maxDistanceKm > 0 && location != null
        ? enriched
            .where((s) => (s.distance ?? double.infinity) <= filter.maxDistanceKm)
            .toList()
        : enriched;

    switch (filter.sortBy) {
      case 'price_low':
        list.sort((a, b) => a.priceRange.compareTo(b.priceRange));
      case 'price_high':
        list.sort((a, b) => b.priceRange.compareTo(a.priceRange));
      case 'distance':
        list.sort((a, b) =>
            (a.distance ?? double.infinity).compareTo(b.distance ?? double.infinity));
    }

    return list;
  }
}

final discoverProvider =
    NotifierProvider.family<DiscoverNotifier, DiscoverState, String?>(
      DiscoverNotifier.new,
    );
