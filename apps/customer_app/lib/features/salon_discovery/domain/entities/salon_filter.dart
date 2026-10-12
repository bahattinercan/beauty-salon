/// Discover filtrelerinin saf durumu. Riverpod family key'i olarak kullanılır,
/// bu yüzden değer eşitliği (`==` / `hashCode`) zorunlu.
class SalonFilter {
  final String search;

  /// `GET /categories`'ten gelen gerçek kategori id'si. `null` = tümü.
  final String? categoryId;

  final double minRating;

  /// 0 = filtresiz, 1-3 = ₺/₺₺/₺₺₺.
  final int priceRange;

  final bool verifiedOnly;

  /// `rating` | `newest` backend'e gider; `price_low`/`price_high`/`distance`
  /// backend desteklemediği için istemci tarafında uygulanır.
  final String sortBy;

  /// 0 = filtresiz. Backend `radius` olarak alır, istemci `distance` ile kıyaslar.
  final double maxDistanceKm;

  const SalonFilter({
    this.search = '',
    this.categoryId,
    this.minRating = 0,
    this.priceRange = 0,
    this.verifiedOnly = false,
    this.sortBy = 'rating',
    this.maxDistanceKm = 0,
  });

  bool get hasActiveFilters =>
      categoryId != null ||
      minRating > 0 ||
      priceRange > 0 ||
      verifiedOnly ||
      maxDistanceKm > 0;

  SalonFilter copyWith({
    String? search,
    String? categoryId,
    double? minRating,
    int? priceRange,
    bool? verifiedOnly,
    String? sortBy,
    double? maxDistanceKm,
  }) =>
      SalonFilter(
        search: search ?? this.search,
        categoryId: categoryId ?? this.categoryId,
        minRating: minRating ?? this.minRating,
        priceRange: priceRange ?? this.priceRange,
        verifiedOnly: verifiedOnly ?? this.verifiedOnly,
        sortBy: sortBy ?? this.sortBy,
        maxDistanceKm: maxDistanceKm ?? this.maxDistanceKm,
      );

  /// `GET /salons` query parametreleri. Boş/varsayılan değerler gönderilmez.
  Map<String, String> toQueryParameters({int limit = 50}) {
    final params = <String, String>{'limit': '$limit'};
    if (search.isNotEmpty) params['search'] = search;
    if (categoryId != null) params['categoryId'] = categoryId!;
    if (minRating > 0) params['minRating'] = minRating.toString();
    if (priceRange > 0) params['priceRange'] = '$priceRange';
    if (verifiedOnly) params['verified'] = 'true';
    if (sortBy == 'rating' || sortBy == 'newest') params['sortBy'] = sortBy;
    return params;
  }

  @override
  bool operator ==(Object other) =>
      other is SalonFilter &&
      other.search == search &&
      other.categoryId == categoryId &&
      other.minRating == minRating &&
      other.priceRange == priceRange &&
      other.verifiedOnly == verifiedOnly &&
      other.sortBy == sortBy &&
      other.maxDistanceKm == maxDistanceKm;

  @override
  int get hashCode => Object.hash(
        search,
        categoryId,
        minRating,
        priceRange,
        verifiedOnly,
        sortBy,
        maxDistanceKm,
      );
}
