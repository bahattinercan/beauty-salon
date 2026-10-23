import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../repositories/upload_repository.dart';

@injectable
class UploadFilesUseCase {
  final UploadRepository _repository;
  UploadFilesUseCase(this._repository);

  Future<Either<Failure, List<String>>> call(List<String> filePaths) =>
      _repository.uploadFiles(filePaths);
}
