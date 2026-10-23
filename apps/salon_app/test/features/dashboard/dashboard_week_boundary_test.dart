import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/core/network/api_client.dart';
import 'package:salon_app/core/network/api_provider.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';
import 'package:salon_app/features/dashboard/data/dashboard_provider.dart';

import '../../core/fake_api.dart';

/// Ayın ilk günlerinde haftalık grafiğin önceki aya taşan günleri görebilmesi
/// (`from = min(ay başı, bugün-6)`) için sınır testleri.
///
/// [FakeServerBackend] gerçek API gibi davranır: `/appointments/salon/:id`
/// isteğine yalnızca `from`/`to` aralığına düşen randevuları döner. Böylece
/// sorgu aralığı dar kalırsa haftalık kova gerçekten 0 olur — test, düzeltmenin
/// yokluğunda kırılacak biçimde yazılmıştır.
void main() {
  group('dashboardQueryRange', () {
    test('ayın 3\'ünde from önceki aya (bugün-6) düşer', () {
      final range = dashboardQueryRange(DateTime(2026, 10, 3));

      expect(range.to, '2026-10-03');
      expect(range.monthStart, '2026-10-01');
      // Bugün-6 = 27 Eylül → ay başından önce, aralığın başı önceki aydadır.
      expect(range.from, '2026-09-27');
      expect(range.from.compareTo(range.monthStart), lessThan(0));
    });

    test('ayın 20\'sinde from hâlâ ay başıdır (davranış değişmez)', () {
      final range = dashboardQueryRange(DateTime(2026, 10, 20));

      expect(range.to, '2026-10-20');
      expect(range.monthStart, '2026-10-01');
      expect(range.from, '2026-10-01');
    });

    test('ayın 3\'ünde 7 günlük kova aralığın tamamını kapsar', () {
      final now = DateTime(2026, 10, 3);
      final range = dashboardQueryRange(now);
      final chartDays = dashboardChartDays(now);

      expect(chartDays, [
        '2026-09-27',
        '2026-09-28',
        '2026-09-29',
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
      ]);
      expect(chartDays.first, range.from);
      expect(chartDays.last, range.to);
      // İlk 4 kova önceki ayda: eski (from = ay başı) sorguda bu günler kapsam dışıydı.
      final previousMonthDays =
          chartDays.where((d) => d.compareTo(range.monthStart) < 0).toList();
      expect(previousMonthDays, hasLength(4));
      for (final day in chartDays) {
        expect(day.compareTo(range.from), greaterThanOrEqualTo(0));
        expect(day.compareTo(range.to), lessThanOrEqualTo(0));
      }
    });

    test('ay ortasında 7 günlük kova ayın içinde kalır', () {
      final now = DateTime(2026, 10, 20);
      final range = dashboardQueryRange(now);
      final chartDays = dashboardChartDays(now);

      expect(chartDays.first, '2026-10-14');
      expect(chartDays.last, '2026-10-20');
      expect(chartDays.where((d) => d.compareTo(range.monthStart) < 0), isEmpty);
      expect(range.from, '2026-10-01');
    });
  });

  group('DashboardNotifier haftalık sınır (ay başı)', () {
    test('bugün = ayın 3\'ü: istek from=bugün-6 gider, 7 kova da dolu gelir', () async {
      final now = DateTime(2026, 10, 3);
      final chartDays = dashboardChartDays(now);
      // Her kova günü için birer randevu; önceki ay günleri de dahil.
      final backend = FakeServerBackend(_appointmentsOn(chartDays));
      final container = _container(backend, now);

      final data = await _load(container);

      // Tek istek atıldı ve aralığı önceki aya taşındı.
      expect(backend.requestCount, 1);
      expect(backend.lastQuery?['from'], '2026-09-27');
      expect(backend.lastQuery?['to'], '2026-10-03');
      expect((backend.lastQuery?['from'] as String).compareTo(backend.lastQuery?['to'] as String), lessThan(0));

      expect(data.weeklyChart, [1, 1, 1, 1, 1, 1, 1]);
      expect(data.weekCount, 7);
      expect(data.todayCount, 1);
      // Gelir yalnızca ay içindeki (1–3 Ekim) tamamlanmış randevulardan gelir.
      expect(data.monthRevenue, 3 * 100.0);
    });

    test('bugün = ayın 20\'si: istek hâlâ ay başından gider', () async {
      final now = DateTime(2026, 10, 20);
      final chartDays = dashboardChartDays(now);
      final backend = FakeServerBackend(_appointmentsOn(chartDays));
      final container = _container(backend, now);

      final data = await _load(container);

      expect(backend.requestCount, 1);
      expect(backend.lastQuery?['from'], '2026-10-01');
      expect(backend.lastQuery?['to'], '2026-10-20');
      expect(data.weeklyChart, [1, 1, 1, 1, 1, 1, 1]);
      expect(data.weekCount, 7);
      // 1–20 Ekim arasındaki tüm randevular gelire girer (7 kova + 6 ek gün).
      expect(data.monthRevenue, 7 * 100.0);
    });
  });
}

/// Her gün için bir COMPLETED randevu (100 TL) üretir.
List<Map<String, dynamic>> _appointmentsOn(List<String> days) => [
      for (var i = 0; i < days.length; i++)
        {
          'id': 'ap-$i',
          'date': days[i],
          'startTime': '10:00',
          'endTime': '10:45',
          'status': 'COMPLETED',
          'customer': {'fullName': 'Müşteri $i'},
          'service': {'name': 'Saç kesimi', 'price': 100},
        },
    ];

ProviderContainer _container(FakeServerBackend backend, DateTime now) => ProviderContainer(
      overrides: [
        apiClientProvider.overrideWithValue(backend.client()),
        authProvider.overrideWith(() => FakeAuthNotifier()),
        dashboardNowProvider.overrideWithValue(() => now),
      ],
    );

Future<DashboardData> _load(ProviderContainer container) async {
  await settle(container, authProvider);
  final data = await container.read(dashboardProvider.future);
  container.dispose();
  return data;
}

/// Gerçek API'nin davranışını taklit eden sahte backend: randevuları yalnızca
/// `from`/`to` aralığına göre süzer ve istek parametrelerini kaydeder.
class FakeServerBackend {
  final List<Map<String, dynamic>> appointments;
  final List<Map<String, dynamic>> _requests = [];

  FakeServerBackend(this.appointments);

  int get requestCount => _requests.length;
  Map<String, dynamic>? get lastQuery =>
      _requests.isEmpty ? null : _requests.last;

  ApiClient client() {
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost:3000/api/v1'));
    dio.interceptors.add(_BackendInterceptor(this));
    return ApiClient(dio: dio);
  }

  void _record(Map<String, dynamic> query) => _requests.add(query);

  List<Map<String, dynamic>> _inRange(Map<String, dynamic> query) {
    final from = query['from']?.toString();
    final to = query['to']?.toString();
    return appointments.where((a) {
      final day = a['date'].toString().split('T').first;
      if (from != null && day.compareTo(from) < 0) return false;
      if (to != null && day.compareTo(to) > 0) return false;
      return true;
    }).toList();
  }
}

class _BackendInterceptor extends Interceptor {
  final FakeServerBackend backend;
  _BackendInterceptor(this.backend);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/salons/owner/my-salons') {
      handler.resolve(Response(
        requestOptions: options,
        statusCode: 200,
        data: salonResponses,
      ));
      return;
    }

    if (options.path.startsWith('/appointments/salon/')) {
      backend._record(Map<String, dynamic>.from(options.queryParameters));
      handler.resolve(Response(
        requestOptions: options,
        statusCode: 200,
        data: {'success': true, 'data': backend._inRange(options.queryParameters)},
      ));
      return;
    }

    handler.resolve(Response(
      requestOptions: options,
      statusCode: 404,
      data: {'success': false, 'message': 'Bilinmeyen path: ${options.path}'},
    ));
  }
}
