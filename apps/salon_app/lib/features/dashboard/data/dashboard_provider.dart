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
    final now = DateTime.now();
    final today = _dateStr(now);
    final monthStart = _dateStr(DateTime(now.year, now.month, 1));
    final weekStart = _dateStr(now.subtract(const Duration(days: 6)));
    // Haftalık grafik son 7 günü, gelir kartı ayın tamamını istiyor.
    // Aralığın başı ikisinin minimumu olmalı; aksi halde ay başında (ör. 3 Ekim)
    // son 7 günün bir kısmı sorgu kapsamı dışında kalıp grafikte 0 görünüyordu.
    final from = weekStart.compareTo(monthStart) < 0 ? weekStart : monthStart;

    // Tek istek: from -> bugün. Önceki hali gün başına istek atıyor,
    // dashboard açılışında ~39 istek (1 + 7 + 31) üretip rate limit'i (100/dk) tetikliyordu.
    final res = await api.dio.get(
      '/appointments/salon/${salon.id}',
      queryParameters: {'from': from, 'to': today},
    );
    final rangeList = ((res.data['data'] as List?) ?? [])
        .map((e) => DashboardAppointment.fromJson(e as Map<String, dynamic>))
        .toList();

    final todayList = rangeList.where((a) => _dayOf(a.date) == today).toList();
    final weeklyChart = List.generate(7, (i) {
      final day = _dateStr(now.subtract(Duration(days: 6 - i)));
      return rangeList.where((a) => _dayOf(a.date) == day).length;
    });

    // Gelir yalnızca ay içindeki randevlardan hesaplanır (from ay başından önce olabilir).
    double monthRevenue = 0;
    for (final appt in rangeList) {
      if (appt.status == 'COMPLETED' &&
          appt.servicePrice != null &&
          _dayOf(appt.date).compareTo(monthStart) >= 0) {
        monthRevenue += appt.servicePrice!;
      }
    }

    return DashboardData(
      todayCount: todayList.length,
      weekCount: weeklyChart.reduce((a, b) => a + b),
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

  /// API bazen tam ISO timestamp döndürüyor; karşılaştırma için YYYY-MM-DD'e indirgenir.
  String _dayOf(String date) => date.split('T').first;
}
