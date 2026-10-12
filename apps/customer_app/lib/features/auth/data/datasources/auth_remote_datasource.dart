import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<({UserModel user, String accessToken, String refreshToken})> login(
      String email, String password);

  Future<({UserModel user, String accessToken, String refreshToken})> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  });

  Future<void> logout();

  /// Şifre sıfırlama kodu (OTP) gönderir.
  Future<void> forgotPassword(String email);

  /// OTP + yeni şifre ile şifreyi sıfırlar.
  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  });
}

@Injectable(as: AuthRemoteDataSource)
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;
  AuthRemoteDataSourceImpl(this._apiClient);

  @override
  Future<({UserModel user, String accessToken, String refreshToken})> login(
      String email, String password) async {
    final response = await _apiClient.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    final data = (response.data['data'] as Map<String, dynamic>?) ?? {};
    return (
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>? ?? {}),
      accessToken: (data['accessToken'] as String?) ?? '',
      refreshToken: (data['refreshToken'] as String?) ?? '',
    );
  }

  @override
  Future<({UserModel user, String accessToken, String refreshToken})> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    final body = <String, dynamic>{
      'fullName': fullName,
      'email': email,
      'password': password,
      'role': 'CUSTOMER',
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    };
    final response = await _apiClient.post(ApiConstants.register, data: body);
    final data = (response.data['data'] as Map<String, dynamic>?) ?? {};
    return (
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>? ?? {}),
      accessToken: (data['accessToken'] as String?) ?? '',
      refreshToken: (data['refreshToken'] as String?) ?? '',
    );
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post(ApiConstants.logout);
    } catch (_) {
      // Sunucu hatası logout'u engellemez
    }
  }

  @override
  Future<void> forgotPassword(String email) async {
    await _apiClient.post(
      ApiConstants.forgotPassword,
      data: {'email': email},
    );
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String token,
    required String newPassword,
  }) async {
    await _apiClient.post(
      ApiConstants.resetPassword,
      data: {
        'email': email,
        'token': token,
        'newPassword': newPassword,
      },
    );
  }
}
