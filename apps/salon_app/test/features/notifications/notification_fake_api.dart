import 'package:dio/dio.dart';
import 'package:salon_app/core/network/api_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Bildirim uçları için sahte Dio: isteği yakalar, verilen handler'ın yanıtını döner.
class FakeNotificationApi {
  FakeNotificationApi(this.handler);

  /// İstek bazlı yanıt üretici (path + query'ye göre dallanabilir).
  final Response<dynamic> Function(RequestOptions options) handler;

  final List<RequestOptions> requests = [];

  ApiClient client() {
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(options);
          try {
            final response = this.handler(options);
            final status = response.statusCode ?? 200;
            if (status >= 400) {
              handler.reject(
                DioException(
                  requestOptions: options,
                  response: response,
                  type: DioExceptionType.badResponse,
                ),
              );
              return;
            }
            handler.resolve(response);
          } on DioException catch (e) {
            handler.reject(e);
          }
        },
      ),
    );
    return ApiClient(dio: dio);
  }

  /// "PATCH /notifications/n1/read" biçiminde çağrı kayıtları.
  List<String> get calls => requests.map((r) => '${r.method} ${r.path}').toList();

  bool called(String method, String path) => calls.contains('$method $path');
}

Response<dynamic> jsonResponse(RequestOptions options, Object? body, {int status = 200}) =>
    Response<dynamic>(requestOptions: options, statusCode: status, data: body);

/// Backend `successResponse` zarfı: `{ success, data: { data, meta } }`.
Map<String, dynamic> pageBody(
  List<Map<String, dynamic>> items, {
  int page = 1,
  int totalPages = 1,
  int? total,
}) =>
    {
      'success': true,
      'data': {
        'data': items,
        'meta': {
          'total': total ?? items.length,
          'page': page,
          'limit': 20,
          'totalPages': totalPages,
        },
      },
    };

Map<String, dynamic> unreadCountBody(int count) => {
      'success': true,
      'data': {'count': count},
    };

Map<String, dynamic> notificationJson({
  required String id,
  String title = 'Yeni randevu',
  String body = 'Ayşe Yılmaz randevu oluşturdu',
  String type = 'APPOINTMENT',
  bool isRead = false,
  String createdAt = '2026-02-10T09:30:00.000Z',
}) =>
    {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'data': {'appointmentId': 'appt-1'},
      'isRead': isRead,
      'createdAt': createdAt,
    };

/// AsyncNotifier'ın build() future'ı çözülene kadar bekler.
Future<void> settle(AsyncValue<Object?> Function() read) async {
  for (var i = 0; i < 100; i++) {
    final value = read();
    if (value is AsyncData || value is AsyncError) return;
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}
