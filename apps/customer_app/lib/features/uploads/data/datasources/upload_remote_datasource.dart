import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';

abstract class UploadRemoteDataSource {
  Future<List<String>> uploadFiles(List<String> filePaths);
}

@Injectable(as: UploadRemoteDataSource)
class UploadRemoteDataSourceImpl implements UploadRemoteDataSource {
  final ApiClient _apiClient;
  UploadRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<String>> uploadFiles(List<String> filePaths) =>
      _apiClient.uploadFiles(ApiConstants.uploadMultiple, filePaths);
}
