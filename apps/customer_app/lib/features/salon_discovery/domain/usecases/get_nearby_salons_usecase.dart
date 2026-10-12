import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/salon.dart';
import '../repositories/salons_repository.dart';

@injectable
class GetNearbySalonsUseCase {
  final SalonsRepository _repository;
  GetNearbySalonsUseCase(this._repository);

  Future<Either<Failure, List<Salon>>> call({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) =>
      _repository.getNearbySalons(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
}
