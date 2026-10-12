// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'salon_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SalonModel _$SalonModelFromJson(Map<String, dynamic> json) => _SalonModel(
  id: json['id'] as String? ?? '',
  name: json['name'] as String? ?? '',
  address: json['address'] as String? ?? '',
  city: json['city'] as String?,
  district: json['district'] as String?,
  ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0.0,
  reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
  logoUrl: json['logoUrl'] as String?,
  coverImageUrl: json['coverImageUrl'] as String?,
  priceRange: (json['priceRange'] as num?)?.toInt() ?? 0,
  distance: (json['distance'] as num?)?.toDouble(),
  latitude: (json['latitude'] as num?)?.toDouble(),
  longitude: (json['longitude'] as num?)?.toDouble(),
  phone: json['phone'] as String?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$SalonModelToJson(_SalonModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'address': instance.address,
      'city': instance.city,
      'district': instance.district,
      'ratingAvg': instance.ratingAvg,
      'reviewCount': instance.reviewCount,
      'logoUrl': instance.logoUrl,
      'coverImageUrl': instance.coverImageUrl,
      'priceRange': instance.priceRange,
      'distance': instance.distance,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'phone': instance.phone,
      'createdAt': instance.createdAt?.toIso8601String(),
    };
