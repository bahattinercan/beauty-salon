import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/salon.dart';
import '../entities/salon_filter.dart';

abstract class SalonsRepository {
  Future<Either<Failure, List<Salon>>> getSalons(SalonFilter filter);

  Future<Either<Failure, List<Salon>>> getNearbySalons({
    required double latitude,
    required double longitude,
    int radius,
  });
}
