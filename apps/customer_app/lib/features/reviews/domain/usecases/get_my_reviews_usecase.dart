import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/review.dart';
import '../repositories/reviews_repository.dart';

@injectable
class GetMyReviewsUseCase {
  final ReviewsRepository _repository;
  GetMyReviewsUseCase(this._repository);

  Future<Either<Failure, List<Review>>> call() => _repository.getMyReviews();
}
