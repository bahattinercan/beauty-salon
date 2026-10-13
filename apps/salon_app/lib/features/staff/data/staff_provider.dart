import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_provider.dart';
import '../../salon/data/salon_provider.dart';

class StaffMember {
  final String id;
  final String fullName;
  final String? title;
  final String? phone;
  final String? email;
  final bool isActive;
  final List<String> serviceNames;
  final List<String> serviceIds;
  final double? ratingAvg;

  const StaffMember({
    required this.id,
    required this.fullName,
    this.title,
    this.phone,
    this.email,
    required this.isActive,
    required this.serviceNames,
    required this.serviceIds,
    this.ratingAvg,
  });

  factory StaffMember.fromJson(Map<String, dynamic> j) => StaffMember(
        id: j['id']?.toString() ?? '',
        fullName: j['fullName']?.toString() ?? '',
        title: j['title']?.toString(),
        phone: j['phone']?.toString(),
        email: j['email']?.toString(),
        isActive: j['isActive'] as bool? ?? true,
        serviceNames: ((j['services'] as List?)
                ?.map((s) => (s as Map<String, dynamic>)['name']?.toString() ?? '')
                .toList()) ??
            [],
        serviceIds: ((j['services'] as List?)
                ?.map((s) => (s as Map<String, dynamic>)['id']?.toString() ?? '')
                .toList()) ??
            [],
        ratingAvg: (j['ratingAvg'] as num?)?.toDouble(),
      );
}

final staffProvider = AsyncNotifierProvider<StaffNotifier, List<StaffMember>>(StaffNotifier.new);

class StaffNotifier extends AsyncNotifier<List<StaffMember>> {
  @override
  Future<List<StaffMember>> build() => _fetch();

  Future<List<StaffMember>> _fetch() async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return [];
    final res = await ref.read(apiClientProvider).dio.get('/salons/${salon.id}/staff');
    final list = res.data['data'] as List? ?? [];
    return list.map((e) => StaffMember.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> create(Map<String, dynamic> data) async {
    final salon = ref.read(salonProvider).asData?.value;
    if (salon == null) return;
    await ref.read(apiClientProvider).dio.post('/salons/${salon.id}/staff', data: data);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> editStaff(String id, Map<String, dynamic> data) async {
    await ref.read(apiClientProvider).dio.patch('/staff/$id', data: data);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> delete(String id) async {
    await ref.read(apiClientProvider).dio.delete('/staff/$id');
    state = await AsyncValue.guard(_fetch);
  }
}
