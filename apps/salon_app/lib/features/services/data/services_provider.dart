import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../salon/data/salon_provider.dart';

class ServiceCategory {
  final String id;
  final String name;

  const ServiceCategory({required this.id, required this.name});

  factory ServiceCategory.fromJson(Map<String, dynamic> j) =>
      ServiceCategory(id: j['id']?.toString() ?? '', name: j['name']?.toString() ?? '');
}

class SalonService {
  final String id;
  final String name;
  final String? categoryId;
  final String? categoryName;
  final int durationMinutes;
  final double price;
  final String? description;
  final bool isActive;

  const SalonService({
    required this.id,
    required this.name,
    this.categoryId,
    this.categoryName,
    required this.durationMinutes,
    required this.price,
    this.description,
    required this.isActive,
  });

  factory SalonService.fromJson(Map<String, dynamic> j) => SalonService(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        categoryId: j['category']?['id']?.toString(),
        categoryName: j['category']?['name']?.toString(),
        durationMinutes: (j['durationMinutes'] as num?)?.toInt() ?? 30,
        price: (j['price'] as num?)?.toDouble() ?? 0,
        description: j['description']?.toString(),
        isActive: j['isActive'] as bool? ?? true,
      );
}

final categoriesProvider = FutureProvider<List<ServiceCategory>>((ref) async {
  final res = await ApiClient().dio.get('/categories');
  final list = (res.data['data'] as List?) ?? [];
  return list.map((e) => ServiceCategory.fromJson(e as Map<String, dynamic>)).toList();
});

final servicesProvider =
    AsyncNotifierProvider<ServicesNotifier, List<SalonService>>(ServicesNotifier.new);

class ServicesNotifier extends AsyncNotifier<List<SalonService>> {
  @override
  Future<List<SalonService>> build() => _fetch();

  Future<List<SalonService>> _fetch() async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return [];
    final res = await ApiClient().dio.get('/salons/${salon.id}/services');
    final list = (res.data['data'] as List?) ?? [];
    return list.map((e) => SalonService.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> create(Map<String, dynamic> data) async {
    final salon = ref.read(salonProvider).asData?.value;
    if (salon == null) return;
    await ApiClient().dio.post('/salons/${salon.id}/services', data: data);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> editService(String id, Map<String, dynamic> data) async {
    await ApiClient().dio.patch('/services/$id', data: data);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> delete(String id) async {
    await ApiClient().dio.delete('/services/$id');
    state = await AsyncValue.guard(_fetch);
  }
}
