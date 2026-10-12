import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../entities/service_category.dart';
import '../repositories/categories_repository.dart';

@injectable
class GetCategoriesUseCase {
  final CategoriesRepository _repository;
  GetCategoriesUseCase(this._repository);

  Future<Either<Failure, List<ServiceCategory>>> call() =>
      _repository.getCategories();
}
