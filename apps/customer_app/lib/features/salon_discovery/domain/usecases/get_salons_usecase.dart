import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/salon.dart';
import '../entities/salon_filter.dart';
import '../repositories/salons_repository.dart';

@injectable
class GetSalonsUseCase {
  final SalonsRepository _repository;
  GetSalonsUseCase(this._repository);

  Future<Either<Failure, List<Salon>>> call(SalonFilter filter) =>
      _repository.getSalons(filter);
}
