import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/review.dart';

abstract class ReviewsRepository {
  Future<Either<Failure, List<Review>>> getMyReviews();
  Future<Either<Failure, Unit>> createReview({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,
  });
}
