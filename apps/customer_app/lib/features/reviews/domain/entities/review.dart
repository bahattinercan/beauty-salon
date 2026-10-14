import '../../../../core/extensions/datetime_extensions.dart';

class Review {
  final String id;
  final String salonId;
  final String salonName;
  final String? salonLogoUrl;
  final int rating;
  final String? comment;
  final String? salonReply;
  final DateTime createdAt;
  final List<String> images;

  const Review({
    required this.id,
    required this.salonId,
    required this.salonName,
    this.salonLogoUrl,
    required this.rating,
    this.comment,
    this.salonReply,
    required this.createdAt,
    this.images = const [],
  });

  /// Türkçe göreli zaman ("22h" yerine "Bugün"/"3 gün önce").
  String get timeAgo => createdAt.timeAgoTr;
}
