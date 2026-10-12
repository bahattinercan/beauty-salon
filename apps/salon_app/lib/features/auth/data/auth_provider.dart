import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';

class AuthState {
  final bool isLoggedIn;
  final String? salonOwnerId;
  final String? fullName;

  const AuthState({
    required this.isLoggedIn,
    this.salonOwnerId,
    this.fullName,
  });

  const AuthState.initial() : isLoggedIn = false, salonOwnerId = null, fullName = null;
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  final _storage = const FlutterSecureStorage();

  @override
  Future<AuthState> build() async {
    final token = await _storage.read(key: 'access_token');
    final userId = await _storage.read(key: 'user_id');
    final fullName = await _storage.read(key: 'user_name');
    if (token != null && userId != null) {
      return AuthState(isLoggedIn: true, salonOwnerId: userId, fullName: fullName);
    }
    return const AuthState.initial();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final response = await ApiClient().dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data['data'] as Map<String, dynamic>?;
      if (data == null) throw const FormatException('Invalid login response');
      final user = data['user'] as Map<String, dynamic>?;
      if (user == null) throw const FormatException('Invalid user data');

      if (user['role'] != 'SALON_OWNER') {
        throw Exception('Bu uygulama yalnızca salon sahiplerine özeldir.');
      }

      await _storage.write(key: 'access_token', value: data['accessToken']?.toString() ?? '');
      await _storage.write(key: 'refresh_token', value: data['refreshToken']?.toString() ?? '');
      await _storage.write(key: 'user_id', value: user['id']?.toString() ?? '');
      await _storage.write(key: 'user_name', value: user['fullName']?.toString() ?? '');

      state = AsyncData(AuthState(
        isLoggedIn: true,
        salonOwnerId: user['id']?.toString(),
        fullName: user['fullName']?.toString(),
      ));
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? 'Giriş başarısız.';
      state = AsyncError(msg, StackTrace.current);
    } catch (e) {
      state = AsyncError(e.toString(), StackTrace.current);
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await ApiClient().dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> forgotPassword(String email) async {
    await ApiClient().dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword(String email, String token, String newPassword) async {
    await ApiClient().dio.post('/auth/reset-password', data: {
      'email': email,
      'token': token,
      'newPassword': newPassword,
    });
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = const AsyncData(AuthState.initial());
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = const AsyncLoading();
    try {
      final response = await ApiClient().dio.post('/auth/register', data: {
        'fullName': fullName,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'role': 'SALON_OWNER',
      });

      final data = response.data['data'] as Map<String, dynamic>?;
      if (data == null) throw const FormatException('Invalid register response');
      final user = data['user'] as Map<String, dynamic>?;
      if (user == null) throw const FormatException('Invalid user data');

      await _storage.write(key: 'access_token', value: data['accessToken']?.toString() ?? '');
      await _storage.write(key: 'refresh_token', value: data['refreshToken']?.toString() ?? '');
      await _storage.write(key: 'user_id', value: user['id']?.toString() ?? '');
      await _storage.write(key: 'user_name', value: user['fullName']?.toString() ?? '');

      state = AsyncData(AuthState(
        isLoggedIn: true,
        salonOwnerId: user['id']?.toString(),
        fullName: user['fullName']?.toString(),
      ));
    } on DioException catch (e) {
      final msg = e.response?.data?['message']?.toString() ?? 'Kayıt başarısız.';
      state = AsyncError(msg, StackTrace.current);
    } catch (e) {
      state = AsyncError(e.toString(), StackTrace.current);
    }
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
