import 'dart:convert';
import '../../domain/entities/salon_detail.dart';

class SalonDetailServiceModel {
  final String id;
  final String name;
  final double price;
  final int durationMinutes;
  final String? categoryName;

  const SalonDetailServiceModel({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
    this.categoryName,
  });

  factory SalonDetailServiceModel.fromJson(Map<String, dynamic> json) =>
      SalonDetailServiceModel(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        durationMinutes: (json['durationMinutes'] as int?) ?? 0,
        categoryName: (json['category'] as Map<String, dynamic>?)?['name'] as String?,
      );

  SalonDetailService toEntity() => SalonDetailService(
        id: id,
        name: name,
        price: price,
        durationMinutes: durationMinutes,
        categoryName: categoryName,
      );
}

class SalonDetailStaffModel {
  final String id;
  final String fullName;
  final String? title;
  final String? bio;
  final String? avatarUrl;
  final List<String> serviceNames;

  const SalonDetailStaffModel({
    required this.id,
    required this.fullName,
    this.title,
    this.bio,
    this.avatarUrl,
    this.serviceNames = const [],
  });

  factory SalonDetailStaffModel.fromJson(Map<String, dynamic> json) {
    final services = (json['services'] as List?)
            ?.map((s) => (s as Map<String, dynamic>)['name']?.toString() ?? '')
            .where((name) => name.isNotEmpty)
            .toList() ??
        [];
    return SalonDetailStaffModel(
      id: (json['id'] as String?) ?? '',
      fullName: (json['fullName'] as String?) ?? '',
      title: json['title'] as String?,
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      serviceNames: services,
    );
  }

  SalonDetailStaff toEntity() => SalonDetailStaff(
        id: id,
        fullName: fullName,
        title: title,
        bio: bio,
        avatarUrl: avatarUrl,
        serviceNames: serviceNames,
      );
}

class SalonReviewModel {
  final String id;
  final String customerName;
  final String customerInitials;
  final int rating;
  final String? comment;
  final String? reply;
  final String? serviceName;
  final String createdAt;
  final List<String> images;

  const SalonReviewModel({
    required this.id,
    required this.customerName,
    required this.customerInitials,
    required this.rating,
    this.comment,
    this.reply,
    this.serviceName,
    required this.createdAt,
    this.images = const [],
  });

  factory SalonReviewModel.fromJson(Map<String, dynamic> json) {
    final customer = (json['customer'] as Map<String, dynamic>?) ?? {};
    final fullName = customer['fullName']?.toString() ?? 'Misafir';
    final parts = fullName.trim().split(' ');
    final customerName = parts.isNotEmpty ? parts.first : 'Misafir';
    final initials = parts.length >= 2
        ? '${parts.first[0]}${parts.last[0]}'.toUpperCase()
        : fullName.isNotEmpty
            ? fullName[0].toUpperCase()
            : '?';
    final appointment = (json['appointment'] as Map<String, dynamic>?) ?? {};
    final service = (appointment['service'] as Map<String, dynamic>?) ?? {};
    return SalonReviewModel(
      id: (json['id'] as String?) ?? '',
      customerName: customerName,
      customerInitials: initials,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment']?.toString(),
      reply: json['salonReply']?.toString(),
      serviceName: service['name']?.toString(),
      createdAt: (json['createdAt'] as String?) ?? '',
      images: (json['images'] as List?)
          ?.map((e) => e?.toString() ?? '')
          .where((e) => e.isNotEmpty)
          .toList() ??
          const [],
    );
  }

  SalonReview toEntity() => SalonReview(
        id: id,
        customerName: customerName,
        customerInitials: customerInitials,
        rating: rating,
        comment: comment,
        reply: reply,
        serviceName: serviceName,
        createdAt: createdAt,
        images: images,
      );
}

Map<String, dynamic> _parseWorkingHours(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is String) {
    try {
      final parsed = jsonDecode(value);
      if (parsed is Map<String, dynamic>) return parsed;
    } catch (_) {}
  }
  return {};
}

class SalonDetailModel {
  final String id;
  final String name;
  final String address;
  final String? phone;
  final String? city;
  final String? district;
  final double ratingAvg;
  final int reviewCount;
  final String? logoUrl;
  final String? coverImageUrl;
  final double? latitude;
  final double? longitude;
  final Map<String, dynamic> workingHours;
  final List<SalonDetailServiceModel> services;
  final List<SalonDetailStaffModel> staff;
  final List<String> galleryImages;
  final int priceRange;
  final String? description;

  const SalonDetailModel({
    required this.id,
    required this.name,
    required this.address,
    this.phone,
    this.city,
    this.district,
    required this.ratingAvg,
    required this.reviewCount,
    this.logoUrl,
    this.coverImageUrl,
    this.latitude,
    this.longitude,
    this.workingHours = const {},
    this.services = const [],
    this.staff = const [],
    this.galleryImages = const [],
    this.priceRange = 0,
    this.description,
  });

  factory SalonDetailModel.fromJson(Map<String, dynamic> json) => SalonDetailModel(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        address: (json['address'] as String?) ?? '',
        phone: json['phone'] as String?,
        city: json['city'] as String?,
        district: json['district'] as String?,
        ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0.0,
        reviewCount: (json['reviewCount'] as int?) ?? 0,
        logoUrl: json['logoUrl'] as String?,
        coverImageUrl: json['coverImageUrl'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        workingHours: _parseWorkingHours(json['workingHours']),
        services: (json['services'] as List?)
                ?.map((s) => SalonDetailServiceModel.fromJson(s as Map<String, dynamic>))
                .toList() ??
            [],
        staff: (json['staff'] as List?)
                ?.map((s) => SalonDetailStaffModel.fromJson(s as Map<String, dynamic>))
                .toList() ??
            [],
        galleryImages: (json['galleryImages'] as List<dynamic>? ?? []).map((e) => e.toString()).toList(),
        priceRange: (json['priceRange'] as num?)?.toInt() ?? 0,
        description: json['description']?.toString(),
      );

  SalonDetail toEntity() => SalonDetail(
        id: id,
        name: name,
        address: address,
        phone: phone,
        city: city,
        district: district,
        ratingAvg: ratingAvg,
        reviewCount: reviewCount,
        logoUrl: logoUrl,
        coverImageUrl: coverImageUrl,
        latitude: latitude,
        longitude: longitude,
        workingHours: workingHours,
        services: services.map((s) => s.toEntity()).toList(),
        staff: staff.map((s) => s.toEntity()).toList(),
        galleryImages: galleryImages,
        priceRange: priceRange,
        description: description,
      );
}
