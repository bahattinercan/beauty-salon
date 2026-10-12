import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/review_page.dart';
import '../../domain/repositories/salon_detail_repository.dart';

@injectable
class GetSalonReviewsUseCase {
  final SalonDetailRepository _repository;
  GetSalonReviewsUseCase(this._repository);

  Future<Either<Failure, ReviewPage>> call({
    required String salonId,
    int page = 1,
    int limit = 10,
  }) =>
      _repository.getSalonReviews(salonId: salonId, page: page, limit: limit);
}
