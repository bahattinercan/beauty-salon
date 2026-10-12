import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/favorites_repository.dart';

@injectable
class GetFavoriteIdsUseCase {
  final FavoritesRepository _repository;
  GetFavoriteIdsUseCase(this._repository);

  Future<Either<Failure, Set<String>>> call() => _repository.getFavoriteIds();
}
