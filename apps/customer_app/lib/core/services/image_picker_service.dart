import 'dart:io';

import 'package:fpdart/fpdart.dart';
import 'package:image_picker/image_picker.dart';
import 'package:injectable/injectable.dart';
import '../error/failures.dart';

/// Tek bir fotoğraf seçimi. Exception yalnızca burada yakalanır ve
/// `Failure`'a çevrilir (CLAUDE.md §3).
@injectable
class ImagePickerService {
  final ImagePicker _picker;
  ImagePickerService(this._picker);

  Future<Either<Failure, File>> pickImage(
    ImageSource source, {
    double maxSize = 1920,
    int quality = 85,
  }) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: maxSize,
        maxHeight: maxSize,
        imageQuality: quality,
      );

      if (picked == null) {
        return const Left(ImagePickFailure('Fotoğraf seçilmedi'));
      }

      return Right(File(picked.path));
    } catch (e) {
      return Left(ImagePickFailure(e.toString()));
    }
  }
}
