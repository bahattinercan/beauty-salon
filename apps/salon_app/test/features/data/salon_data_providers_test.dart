import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/appointments/data/appointments_provider.dart';
import 'package:salon_app/features/dashboard/data/dashboard_provider.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';
import 'package:salon_app/features/salon/data/salon_provider.dart';
import 'package:salon_app/features/services/data/services_provider.dart';
import 'package:salon_app/features/staff/data/staff_provider.dart';
import '../../core/fake_api.dart';

void main() {
  group('SalonNotifier', () {
    test('build() salon bilgisini parse eder', () async {
      final container = makeContainer(
        FakeApi(responses: {'/salons/owner/my-salons': salonResponses}),
      );
      await settle(container, authProvider);

      final salon = await container.read(salonProvider.notifier).build();
      expect(salon, isNotNull);
      expect(salon!.id, 'salon-1');
      expect(salon.name, 'Güzellik Merkezi');
      expect(salon.ratingAvg, 4.5);
    });

    test('updateInfo() PATCH gönderir', () async {
      final api = FakeApi(responses: {'/salons/owner/my-salons': salonResponses});
      final container = makeContainer(api);
      await settle(container, authProvider);
      await settle(container, salonProvider);


      await container.read(salonProvider.notifier).updateInfo({'name': 'Yeni Ad'});
      expect(api.called('PATCH', '/salons/salon-1'), true);
    });

    test('requestEmailChange() doğru endpointi çağırır', () async {
      final api = FakeApi(responses: {'/salons/owner/my-salons': salonResponses});
      final container = makeContainer(api);
      await settle(container, authProvider);
      await settle(container, salonProvider);


      await container.read(salonProvider.notifier)
          .requestEmailChange('yeni@test.com', verifyVia: 'email');
      expect(api.called('POST', '/salons/salon-1/request-email-change'), true);
    });

    test('API 500 hatası build() sırasında throw eder', () async {
      final api = FakeApi(
        responses: {'/salons/owner/my-salons': null},
        statusCodes: {'/salons/owner/my-salons': 500},
      );
      final container = makeContainer(api);
      await settle(container, authProvider);

      expect(
        () => container.read(salonProvider.notifier).build(),
        throwsA(isA<DioException>()),
      );
    });
  });

  group('ServicesNotifier', () {
    final responses = {
      '/salons/owner/my-salons': salonResponses,
      '/salons/salon-1/services': {
        'data': [
          {
            'id': 'svc-1',
            'name': 'Saç kesimi',
            'durationMinutes': 45,
            'price': 350,
            'description': 'Yıkanmış ve şekillendirilmiş',
            'isActive': true,
            'category': {'id': 'cat-1', 'name': 'Saç'},
          },
          {
            'id': 'svc-2',
            'name': 'Masaj',
            'durationMinutes': 60,
            'price': 600,
            'isActive': false,
          },
        ],
      },
    };

    test('build() hizmetleri parse eder (fiyat, süre, kategori)', () async {
      final container = makeContainer(FakeApi(responses: responses));
      await settle(container, authProvider);

      final services = await container.read(servicesProvider.notifier).build();
      expect(services, hasLength(2));
      expect(services.first.name, 'Saç kesimi');
      expect(services.first.price, 350);
      expect(services.first.durationMinutes, 45);
      expect(services.first.categoryName, 'Saç');
      expect(services.last.isActive, false);
    });

    test('create() POST eder ve listeyi yeniden getirir', () async {
      final api = FakeApi(responses: responses);
      final container = makeContainer(api);
      await settle(container, authProvider);
      await settle(container, salonProvider);


      await container.read(servicesProvider.notifier)
          .create({'name': 'Peeling', 'price': 500, 'durationMinutes': 30});

      expect(api.called('POST', '/salons/salon-1/services'), true);
      expect(await container.read(servicesProvider.notifier).build(), hasLength(2));
    });

    test('editService() PATCH, delete() DELETE gönderir', () async {
      final api = FakeApi(responses: responses);
      final container = makeContainer(api);
      await settle(container, authProvider);

      await container.read(servicesProvider.notifier).editService('svc-1', {'price': 400});
      await container.read(servicesProvider.notifier).delete('svc-2');

      expect(api.called('PATCH', '/services/svc-1'), true);
      expect(api.called('DELETE', '/services/svc-2'), true);
    });
  });

  group('StaffNotifier', () {
    final responses = {
      '/salons/owner/my-salons': salonResponses,
      '/salons/salon-1/staff': {
        'data': [
          {
            'id': 'st-1',
            'fullName': 'Elif Kaya',
            'title': 'Kuzey',
            'isActive': true,
            'ratingAvg': 4.8,
            'services': [
              {'id': 'svc-1', 'name': 'Saç kesimi'},
            ],
          },
        ],
      },
    };

    test('build() çalışanları ve servis isimlerini parse eder', () async {
      final container = makeContainer(FakeApi(responses: responses));
      await settle(container, authProvider);

      final staff = await container.read(staffProvider.notifier).build();
      expect(staff, hasLength(1));
      expect(staff.first.fullName, 'Elif Kaya');
      expect(staff.first.serviceNames, ['Saç kesimi']);
      expect(staff.first.serviceIds, ['svc-1']);
      expect(staff.first.ratingAvg, 4.8);
    });

    test('create() /salons/{id}/staff POST eder', () async {
      final api = FakeApi(responses: responses);
      final container = makeContainer(api);
      await settle(container, authProvider);
      await settle(container, salonProvider);


      await container.read(staffProvider.notifier)
          .create({'fullName': 'Zeynep', 'title': 'Uzman'});
      expect(api.called('POST', '/salons/salon-1/staff'), true);
    });
  });

  group('SalonAppointmentsNotifier', () {
    final responses = {
      '/salons/owner/my-salons': salonResponses,
      '/appointments/salon/salon-1': {
        'data': [
          {
            'id': 'ap-1',
            'date': '2026-10-12',
            'startTime': '10:00',
            'endTime': '10:45',
            'status': 'CONFIRMED',
            'customer': {'fullName': 'Merve', 'phone': '0555 111 22 33'},
            'service': {'name': 'Saç kesimi', 'price': 350},
            'staff': {'fullName': 'Elif Kaya'},
          },
        ],
      },
    };

    test('build() randevuları parse eder', () async {
      final container = makeContainer(FakeApi(responses: responses));
      await settle(container, authProvider);

      final list = await container.read(salonAppointmentsProvider.notifier).build();
      expect(list, hasLength(1));
      expect(list.first.customerName, 'Merve');
      expect(list.first.servicePrice, 350);
      expect(list.first.staffName, 'Elif Kaya');
      expect(list.first.status, 'CONFIRMED');
    });

    test('refresh(date, status) randevu endpointini tekrar çağırır', () async {
      final api = FakeApi(responses: responses);
      final container = makeContainer(api);
      await settle(container, authProvider);

      await container.read(salonAppointmentsProvider.notifier)
          .refresh(date: '2026-10-12', status: 'CONFIRMED');
      expect(api.called('GET', '/appointments/salon/salon-1'), true);
    });

    test('updateStatus() PATCH /appointments/{id}/status gönderir', () async {
      final api = FakeApi(responses: responses);
      final container = makeContainer(api);
      await settle(container, authProvider);

      await container.read(salonAppointmentsProvider.notifier)
          .updateStatus('ap-1', 'COMPLETED');
      expect(api.called('PATCH', '/appointments/ap-1/status'), true);
    });

    test('salon yoksa randevular boş döner', () async {
      final container = makeContainer(
        FakeApi(responses: {'/salons/owner/my-salons': {'data': []}}),
      );
      await settle(container, authProvider);

      final list = await container.read(salonAppointmentsProvider.notifier).build();
      expect(list, isEmpty);
    });
  });

  group('DashboardNotifier', () {
    // Tarih bugüne göre kurulur: aralıklı tek istek bugünü kapsamalı.
    final now = DateTime.now();
    final today = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final appt = {
      'id': 'ap-1',
      'date': today,
      'startTime': '10:00',
      'endTime': '10:45',
      'status': 'COMPLETED',
      'customer': {'fullName': 'Merve'},
      'service': {'name': 'Saç kesimi', 'price': 350},
    };

    test('build() haftalık chart ve gelir istatistiklerini üretir', () async {
      final container = makeContainer(FakeApi(responses: {
        '/salons/owner/my-salons': salonResponses,
        '/appointments/salon/salon-1': {'data': [appt]},
      }));
      await settle(container, authProvider);

      final data = await container.read(dashboardProvider.notifier).build();
      expect(data.weeklyChart, hasLength(7));
      expect(data.weekCount, greaterThan(0));
      expect(data.monthRevenue, greaterThan(0));
    });

    test('build() randevular için tek istek yapar (gün başına N+1 yok)', () async {
      final api = FakeApi(responses: {
        '/salons/owner/my-salons': salonResponses,
        '/appointments/salon/salon-1': {'data': [appt]},
      });
      final container = makeContainer(api);
      await settle(container, authProvider);

      await container.read(dashboardProvider.future);
      final apptCalls = api.requests.where((r) => r.contains('/appointments/salon/')).length;
      expect(apptCalls, 1);
    });

    test('salon yoksa istatistikler sıfır döner', () async {
      final container = makeContainer(
        FakeApi(responses: {'/salons/owner/my-salons': {'data': []}}),
      );
      await settle(container, authProvider);

      final data = await container.read(dashboardProvider.notifier).build();
      expect(data.todayCount, 0);
      expect(data.weekCount, 0);
      expect(data.monthRevenue, 0);
    });
  });
}
