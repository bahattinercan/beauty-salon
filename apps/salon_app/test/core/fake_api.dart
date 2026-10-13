import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:salon_app/core/network/api_client.dart';
import 'package:salon_app/core/network/api_provider.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';

/// Sahte API istemcisi: istenen path'lere önceden tanımlı JSON gövdeleri döner,
/// network'e hiç çıkmaz. Yapılan istekler [requests] listesine kaydedilir.
class FakeApi {
  final Map<String, Object?> responses;
  final Map<String, int> statusCodes;
  final List<String> requests = [];

  FakeApi({
    required this.responses,
    Map<String, int>? statusCodes,
  }) : statusCodes = statusCodes ?? {};

  ApiClient client() {
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'));
    dio.interceptors.add(_FakeInterceptor(this));
    return ApiClient(dio: dio);
  }

  /// path -> "METHOD path" biçiminde yapılan istekler
  bool called(String method, String path) =>
      requests.contains('$method $path');
}

class _FakeInterceptor extends Interceptor {
  final FakeApi api;

  _FakeInterceptor(this.api);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    api.requests.add('${options.method} ${options.path}');

    final status = api.statusCodes[options.path] ?? 200;
    if (status >= 400) {
      handler.reject(DioException(
        requestOptions: options,
        response: Response(
          requestOptions: options,
          statusCode: status,
          data: {'success': false, 'message': 'Test hatası'},
        ),
      ));
      return;
    }

    handler.resolve(Response(
      requestOptions: options,
      statusCode: status,
      data: api.responses[options.path],
    ));
  }
}

class FakeAuthNotifier extends AuthNotifier {
  @override
  Future<AuthState> build() async =>
      const AuthState(isLoggedIn: true, salonOwnerId: 'owner-1', fullName: 'Test Owner');
}

const _salonPayload = {
  'data': [
    {
      'id': 'salon-1',
      'name': 'Güzellik Merkezi',
      'address': 'Kadıköy',
      'phone': '0212 000 00 00',
      'email': 'salon@test.com',
      'ratingAvg': 4.5,
      'reviewCount': 12,
    }
  ],
};

/// AsyncNotifier'ların build() futures'ı resolve olana kadar bekler.
Future<void> settle(
  ProviderContainer container,
  AsyncNotifierProvider<AsyncNotifier<Object?>, Object?> provider,
) async {
  for (int i = 0; i < 50; i++) {
    final value = container.read(provider);
    if (value is AsyncData || value is AsyncError) return;
    await Future.delayed(const Duration(milliseconds: 20));
  }
}

ProviderContainer makeContainer(FakeApi api) {
  return ProviderContainer(
    overrides: [
      apiClientProvider.overrideWithValue(api.client()),
      authProvider.overrideWith(() => FakeAuthNotifier()),
    ],
  );
}

const salonResponses = _salonPayload;
