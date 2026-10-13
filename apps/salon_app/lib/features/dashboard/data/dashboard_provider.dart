import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_provider.dart';
import '../../salon/data/salon_provider.dart';

class DashboardAppointment {
  final String id;
  final String startTime;
  final String endTime;
  final String customerName;
  final String? customerPhone;
  final String serviceName;
  final String? staffName;
  final String status;
  final String date;
  final double? servicePrice;

  const DashboardAppointment({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.customerName,
    this.customerPhone,
    required this.serviceName,
    this.staffName,
    required this.status,
    required this.date,
    this.servicePrice,
  });

  factory DashboardAppointment.fromJson(Map<String, dynamic> j) {
    return DashboardAppointment(
      id: j['id']?.toString() ?? '',
      startTime: j['startTime']?.toString() ?? '',
      endTime: j['endTime']?.toString() ?? '',
      customerName: j['customer']?['fullName']?.toString() ?? 'Müşteri',
      customerPhone: j['customer']?['phone']?.toString(),
      serviceName: j['service']?['name']?.toString() ?? '',
      staffName: j['staff']?['fullName']?.toString(),
      status: j['status']?.toString() ?? 'PENDING',
      date: j['date']?.toString() ?? '',
      servicePrice: (j['service']?['price'] as num?)?.toDouble(),
    );
  }
}

class DashboardData {
  final int todayCount;
  final int weekCount;
  final double monthRevenue;
  final double avgRating;
  final List<DashboardAppointment> todayAppointments;
  final List<int> weeklyChart; // 7 gün randevu sayısı

  const DashboardData({
    required this.todayCount,
    required this.weekCount,
    required this.monthRevenue,
    required this.avgRating,
    required this.todayAppointments,
    required this.weeklyChart,
  });
}

final dashboardProvider = AsyncNotifierProvider<DashboardNotifier, DashboardData>(DashboardNotifier.new);

class DashboardNotifier extends AsyncNotifier<DashboardData> {
  @override
  Future<DashboardData> build() => _fetch();

  Future<DashboardData> _fetch() async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) {
      return const DashboardData(
        todayCount: 0, weekCount: 0, monthRevenue: 0,
        avgRating: 0, todayAppointments: [], weeklyChart: [0, 0, 0, 0, 0, 0, 0],
      );
    }

    final api = ref.read(apiClientProvider);
    final today = _dateStr(DateTime.now());

    // Bugünkü randevular
    final todayRes = await api.dio.get(
      '/appointments/salon/${salon.id}',
      queryParameters: {'date': today},
    );
    final todayList = ((todayRes.data['data'] as List?) ?? [])
        .map((e) => DashboardAppointment.fromJson(e as Map<String, dynamic>))
        .toList();

    // Haftalık chart — paralel çağrı (N+1 düzeltildi)
    final now = DateTime.now();
    final weeklyChartFuture = Future.wait(
      List.generate(7, (i) async {
        final day = now.subtract(Duration(days: 6 - i));
        final res = await api.dio.get(
          '/appointments/salon/${salon.id}',
          queryParameters: {'date': _dateStr(day)},
        );
        return ((res.data['data'] as List?)?.length ?? 0);
      }),
    );
    final weeklyChart = await weeklyChartFuture;
    final weekTotal = weeklyChart.reduce((a, b) => a + b);

    // SA-001: Bu ayki tüm günler için paralel çağrı ile aylık gelir hesabı
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final monthlyFutures = List.generate(daysInMonth, (i) async {
      final day = DateTime(now.year, now.month, i + 1);
      if (day.isAfter(now)) return <DashboardAppointment>[];
      final res = await api.dio.get(
        '/appointments/salon/${salon.id}',
        queryParameters: {'date': _dateStr(day)},
      );
      return ((res.data['data'] as List?) ?? [])
          .map((e) => DashboardAppointment.fromJson(e as Map<String, dynamic>))
          .toList();
    });
    final monthlyAppointments = (await Future.wait(monthlyFutures)).expand((x) => x);
    double monthRevenue = 0;
    for (final appt in monthlyAppointments) {
      if (appt.status == 'COMPLETED' && appt.servicePrice != null) {
        monthRevenue += appt.servicePrice!;
      }
    }

    return DashboardData(
      todayCount: todayList.length,
      weekCount: weekTotal,
      monthRevenue: monthRevenue,
      avgRating: salon.ratingAvg,
      todayAppointments: todayList,
      weeklyChart: weeklyChart,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  String _dateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
