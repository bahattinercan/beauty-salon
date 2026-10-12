import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';

abstract class FavoritesRepository {
  Future<Either<Failure, Set<String>>> getFavoriteIds();
  Future<Either<Failure, Unit>> toggle(String salonId);
}
