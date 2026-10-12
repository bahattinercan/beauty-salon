import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/review_page.dart';
import '../../domain/entities/salon_detail.dart';

abstract class SalonDetailRepository {
  Future<Either<Failure, SalonDetail>> getSalonDetail(String salonId);
  Future<Either<Failure, ReviewPage>> getSalonReviews({
    required String salonId,
    int page,
    int limit,
  });
}
