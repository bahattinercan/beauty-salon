import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/salon.dart';

part 'salon_model.freezed.dart';
part 'salon_model.g.dart';

@freezed
sealed class SalonModel with _$SalonModel {
  const factory SalonModel({
    @JsonKey(defaultValue: '') required String id,
    @JsonKey(defaultValue: '') required String name,
    @Default('') String address,
    String? city,
    String? district,
    @Default(0.0) double ratingAvg,
    @Default(0) int reviewCount,
    String? logoUrl,
    String? coverImageUrl,
    @Default(0) int priceRange,
    double? distance,
    double? latitude,
    double? longitude,
    String? phone,
    DateTime? createdAt,
  }) = _SalonModel;

  factory SalonModel.fromJson(Map<String, dynamic> json) =>
      _$SalonModelFromJson(json);
}

extension SalonModelX on SalonModel {
  Salon toEntity() => Salon(
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
        distance: distance,
        latitude: latitude,
        longitude: longitude,
        phone: phone,
        createdAt: createdAt,
      );
}
