import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_profile_model.dart';

abstract class UserRemoteDataSource {
  Future<UserProfileModel> getProfile();
  Future<UserProfileModel> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  });
  Future<void> requestEmailChange(String newEmail);
  Future<void> confirmEmailChange({required String token});
}

@Injectable(as: UserRemoteDataSource)
class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  final ApiClient _apiClient;
  UserRemoteDataSourceImpl(this._apiClient);

  @override
  Future<UserProfileModel> getProfile() async {
    final response = await _apiClient.get(ApiConstants.profile);
    final data = (response.data['data'] as Map<String, dynamic>?) ?? {};
    return UserProfileModel.fromJson(data);
  }

  @override
  Future<UserProfileModel> updateProfile({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) async {
    final body = <String, dynamic>{
      'fullName': ?fullName,
      'phone': ?phone,
      'avatarUrl': ?avatarUrl,
    };
    final response =
        await _apiClient.patch(ApiConstants.profile, data: body);
    final data = (response.data['data'] as Map<String, dynamic>?) ?? {};
    return UserProfileModel.fromJson(data);
  }

  @override
  Future<void> requestEmailChange(String newEmail) async {
    await _apiClient.post(
      ApiConstants.requestEmailChange,
      data: {'newEmail': newEmail},
    );
  }

  @override
  Future<void> confirmEmailChange({required String token}) async {
    await _apiClient.post(ApiConstants.confirmEmailChange, data: {'token': token});
  }
}
