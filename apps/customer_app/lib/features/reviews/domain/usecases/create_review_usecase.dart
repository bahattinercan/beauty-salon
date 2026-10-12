import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/reviews_repository.dart';

@injectable
class CreateReviewUseCase {
  final ReviewsRepository _repository;
  CreateReviewUseCase(this._repository);

  Future<Either<Failure, Unit>> call({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,
  }) =>
      _repository.createReview(
        appointmentId: appointmentId,
        rating: rating,
        comment: comment,
        images: images,
      );
}
