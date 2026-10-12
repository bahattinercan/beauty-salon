import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/service_category.dart';

abstract class CategoriesRepository {
  Future<Either<Failure, List<ServiceCategory>>> getCategories();
}
