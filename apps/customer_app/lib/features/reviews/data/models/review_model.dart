import '../../domain/entities/review.dart';

class ReviewModel {
  final String id;
  final String salonId;
  final String salonName;
  final String? salonLogoUrl;
  final int rating;
  final String? comment;
  final String? salonReply;
  final DateTime createdAt;

  const ReviewModel({
    required this.id,
    required this.salonId,
    required this.salonName,
    this.salonLogoUrl,
    required this.rating,
    this.comment,
    this.salonReply,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    final salon = (json['salon'] as Map<String, dynamic>?) ?? {};
    return ReviewModel(
      id: (json['id']?.toString()) ?? '',
      salonId: (salon['id']?.toString()) ?? '',
      salonName: (salon['name']?.toString()) ?? '',
      salonLogoUrl: salon['logoUrl']?.toString(),
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment']?.toString(),
      salonReply: json['salonReply']?.toString(),
      createdAt: DateTime.tryParse((json['createdAt']?.toString()) ?? '') ?? DateTime.now(),
    );
  }

  Review toEntity() => Review(
        id: id,
        salonId: salonId,
        salonName: salonName,
        salonLogoUrl: salonLogoUrl,
        rating: rating,
        comment: comment,
        salonReply: salonReply,
        createdAt: createdAt,
      );
}
