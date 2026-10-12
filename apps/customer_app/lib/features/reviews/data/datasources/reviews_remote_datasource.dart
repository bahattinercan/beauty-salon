import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/review_model.dart';

abstract class ReviewsRemoteDataSource {
  Future<List<ReviewModel>> getMyReviews();
  Future<void> createReview({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,
  });
}

@Injectable(as: ReviewsRemoteDataSource)
class ReviewsRemoteDataSourceImpl implements ReviewsRemoteDataSource {
  final ApiClient _apiClient;
  ReviewsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<ReviewModel>> getMyReviews() async {
    final response = await _apiClient.get(ApiConstants.myReviews);
    final data = response.data['data'];
    final list = data is List ? data : <dynamic>[];
    return list
        .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> createReview({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,
  }) async {
    await _apiClient.post(ApiConstants.reviews, data: {
      'appointmentId': appointmentId,
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
      if (images != null && images.isNotEmpty) 'images': images,
    });
  }
}
