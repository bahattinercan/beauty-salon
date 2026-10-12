import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:injectable/injectable.dart';
import '../network/api_client.dart';

@module
abstract class AppModule {
  @lazySingleton
  ApiClient get apiClient => ApiClient();

  @lazySingleton
  FlutterSecureStorage get secureStorage => const FlutterSecureStorage();

  @lazySingleton
  ImagePicker get imagePicker => ImagePicker();
}
