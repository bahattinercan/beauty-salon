import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../salon/data/salon_provider.dart';

class SalonAppointment {
  final String id;
  final String date;
  final String startTime;
  final String endTime;
  final String status;
  final String customerName;
  final String? customerPhone;
  final String serviceName;
  final double servicePrice;
  final String? staffName;
  final String? note;

  const SalonAppointment({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.customerName,
    this.customerPhone,
    required this.serviceName,
    required this.servicePrice,
    this.staffName,
    this.note,
  });

  factory SalonAppointment.fromJson(Map<String, dynamic> j) => SalonAppointment(
        id: j['id']?.toString() ?? '',
        date: j['date']?.toString() ?? '',
        startTime: j['startTime']?.toString() ?? '',
        endTime: j['endTime']?.toString() ?? '',
        status: j['status']?.toString() ?? 'PENDING',
        customerName: j['customer']?['fullName']?.toString() ?? 'Müşteri',
        customerPhone: j['customer']?['phone']?.toString(),
        serviceName: j['service']?['name']?.toString() ?? '',
        servicePrice: (j['service']?['price'] as num?)?.toDouble() ?? 0,
        staffName: j['staff']?['fullName']?.toString(),
        note: j['note']?.toString(),
      );
}

final salonAppointmentsProvider =
    AsyncNotifierProvider<SalonAppointmentsNotifier, List<SalonAppointment>>(
        SalonAppointmentsNotifier.new);

class SalonAppointmentsNotifier
    extends AsyncNotifier<List<SalonAppointment>> {
  @override
  Future<List<SalonAppointment>> build() => _fetch();

  Future<List<SalonAppointment>> _fetch({String? date, String? status}) async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return [];

    final params = <String, dynamic>{};
    if (date != null) params['date'] = date;
    if (status != null) params['status'] = status;

    final res = await ApiClient().dio.get(
      '/appointments/salon/${salon.id}',
      queryParameters: params.isEmpty ? null : params,
    );
    final list = (res.data['data'] as List?) ?? [];
    return list
        .map((e) => SalonAppointment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> refresh({String? date, String? status}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(date: date, status: status));
  }

  Future<void> updateStatus(String id, String newStatus) async {
    await ApiClient().dio.patch('/appointments/$id/status', data: {'status': newStatus});
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> cancel(String id) async {
    await ApiClient().dio.patch('/appointments/$id/cancel');
    state = await AsyncValue.guard(_fetch);
  }
}
