import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';

abstract class UploadRepository {
  Future<Either<Failure, List<String>>> uploadFiles(List<String> filePaths);
}
