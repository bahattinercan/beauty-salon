import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/favorites_repository.dart';

@injectable
class ToggleFavoriteUseCase {
  final FavoritesRepository _repository;
  ToggleFavoriteUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String salonId) =>
      _repository.toggle(salonId);
}
