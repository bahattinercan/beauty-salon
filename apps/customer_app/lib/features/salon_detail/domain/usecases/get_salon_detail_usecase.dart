import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/salon_detail.dart';
import '../../domain/repositories/salon_detail_repository.dart';

@injectable
class GetSalonDetailUseCase {
  final SalonDetailRepository _repository;
  GetSalonDetailUseCase(this._repository);

  Future<Either<Failure, SalonDetail>> call(String salonId) =>
      _repository.getSalonDetail(salonId);
}
