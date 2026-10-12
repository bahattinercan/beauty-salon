import 'dart:math';

class Salon {
  final String id;
  final String name;
  final String address;
  final String? city;
  final String? district;
  final double ratingAvg;
  final int reviewCount;
  final String? logoUrl;
  final String? coverImageUrl;
  final int priceRange;

  /// Kullanıcının konumuna uzaklık (km). `nearby` endpoint'inden gelir ya da
  /// konum bilinçliyken istemci tarafında hesaplanır.
  final double? distance;

  final double? latitude;
  final double? longitude;

  final String? phone;

  const Salon({
    required this.id,
    required this.name,
    required this.address,
    this.city,
    this.district,
    required this.ratingAvg,
    required this.reviewCount,
    this.logoUrl,
    this.coverImageUrl,
    this.priceRange = 0,
    this.distance,
    this.latitude,
    this.longitude,
    this.phone,
  });

  /// Mesafeyi dolduran kopya (entity immutable).
  Salon withDistance(double km) => Salon(
        id: id,
        name: name,
        address: address,
        city: city,
        district: district,
        ratingAvg: ratingAvg,
        reviewCount: reviewCount,
        logoUrl: logoUrl,
        coverImageUrl: coverImageUrl,
        priceRange: priceRange,
        distance: km,
        latitude: latitude,
        longitude: longitude,
        phone: phone,
      );

  /// Haversine (km). Saf Dart — domain katmanı Flutter/third-party import etmez.
  double? distanceKmTo(double fromLat, double fromLng) {
    if (latitude == null || longitude == null) return null;

    const earthRadiusKm = 6371.0;
    double rad(double deg) => deg * pi / 180;

    final dLat = rad(latitude! - fromLat) / 2;
    final dLng = rad(longitude! - fromLng) / 2;
    final a = sin(dLat) * sin(dLat) +
        cos(rad(fromLat)) * cos(rad(latitude!)) * sin(dLng) * sin(dLng);

    return 2 * earthRadiusKm * asin(sqrt(a));
  }

  String get priceRangeLabel {
    switch (priceRange) {
      case 1:
        return '₺';
      case 2:
        return '₺₺';
      case 3:
        return '₺₺₺';
      default:
        return '';
    }
  }

  /// Okunur mesafe etiketi, ör. `'340 m'`, `'1.2 km'`. Mesafe yoksa boş.
  String get distanceLabel {
    final d = distance;
    if (d == null) return '';
    if (d < 1) return '${(d * 1000).round()} m';
    return '${d.toStringAsFixed(1)} km';
  }

  String get locationLabel {
    if (district != null && city != null) return '$district, $city';
    if (city != null) return city!;
    return address;
  }
}
