import 'package:flutter/foundation.dart';
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

/// Dashboard'ın "bugün"ü. Testler sabit bir tarih vermek için override eder;
/// varsayılan davranış (cihaz saati) değişmez.
@visibleForTesting
final dashboardNowProvider = Provider<DateTime Function()>((ref) => DateTime.now);

/// `YYYY-MM-DD` biçimi (API'nin beklediği tarih formatı).
String dashboardDateStr(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

/// Dashboard sorgu aralığı: `from = min(ay başı, bugün-6)`, `to = bugün`.
///
/// Haftalık grafik son 7 günü (bugün-6 … bugün), gelir kartı ayın tamamını
/// istiyor; aralığın başı ikisinin minimumu olmalı. Aksi halde ay başında
/// (ör. 3 Ekim) son 7 günün bir kısmı sorgu kapsamı dışında kalıp grafikte 0
/// görünüyordu. Tek istek korunur, ekstra çağrı yoktur.
typedef DashboardQueryRange = ({String from, String to, String monthStart});

DashboardQueryRange dashboardQueryRange(DateTime now) {
  final today = dashboardDateStr(now);
  final monthStart = dashboardDateStr(DateTime(now.year, now.month, 1));
  final weekStart = dashboardDateStr(now.subtract(const Duration(days: 6)));
  final from = weekStart.compareTo(monthStart) < 0 ? weekStart : monthStart;
  return (from: from, to: today, monthStart: monthStart);
}

/// Haftalık grafiğin 7 kovası: bugün-6 … bugün (artan sırada).
List<String> dashboardChartDays(DateTime now) =>
    List.generate(7, (i) => dashboardDateStr(now.subtract(Duration(days: 6 - i))));

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
    final now = ref.read(dashboardNowProvider)();
    final range = dashboardQueryRange(now);
    final today = range.to;
    final monthStart = range.monthStart;

    // Tek istek: from -> bugün. Önceki hali gün başına istek atıyor,
    // dashboard açılışında ~39 istek (1 + 7 + 31) üretip rate limit'i (100/dk) tetikliyordu.
    final res = await api.dio.get(
      '/appointments/salon/${salon.id}',
      queryParameters: {'from': range.from, 'to': range.to},
    );
    final rangeList = ((res.data['data'] as List?) ?? [])
        .map((e) => DashboardAppointment.fromJson(e as Map<String, dynamic>))
        .toList();

    final todayList = rangeList.where((a) => _dayOf(a.date) == today).toList();
    final chartDays = dashboardChartDays(now);
    final weeklyChart = List.generate(
      7,
      (i) => rangeList.where((a) => _dayOf(a.date) == chartDays[i]).length,
    );

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

  /// API bazen tam ISO timestamp döndürüyor; karşılaştırma için YYYY-MM-DD'e indirgenir.
  String _dayOf(String date) => date.split('T').first;
}
