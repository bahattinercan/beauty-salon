import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../auth/data/auth_provider.dart';

class WorkingDay {
  final String open;
  final String close;
  final bool isClosed;

  const WorkingDay({required this.open, required this.close, required this.isClosed});

  factory WorkingDay.fromJson(Map<String, dynamic> j) => WorkingDay(
        open: j['open']?.toString() ?? '09:00',
        close: j['close']?.toString() ?? '18:00',
        isClosed: j['isClosed'] as bool? ?? false,
      );

  String get displayTimeRange {
    if (isClosed) return 'Kapalı';
    return '$open - $close';
  }

  Map<String, dynamic> toJson() => {'open': open, 'close': close, 'isClosed': isClosed};

  static WorkingDay get defaultOpen => const WorkingDay(open: '09:00', close: '18:00', isClosed: false);
  static WorkingDay get defaultClosed => const WorkingDay(open: '09:00', close: '18:00', isClosed: true);
}

const kDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

class SalonInfo {
  final String id;
  final String name;
  final String? address;
  final String? phone;
  final String? email;
  final String? description;
  final double ratingAvg;
  final int reviewCount;
  final Map<String, WorkingDay> workingHours;
  final bool isVerified;
  final String? logoUrl;
  final String? coverImageUrl;
  final List<String> galleryImages;

  const SalonInfo({
    required this.id,
    required this.name,
    this.address,
    this.phone,
    this.email,
    this.description,
    required this.ratingAvg,
    required this.reviewCount,
    required this.workingHours,
    this.isVerified = false,
    this.logoUrl,
    this.coverImageUrl,
    this.galleryImages = const [],
  });

  factory SalonInfo.fromJson(Map<String, dynamic> j) {
    final raw = j['workingHours'];
    final Map<String, WorkingDay> hours = {};
    if (raw is Map) {
      for (final key in kDayKeys) {
        if (raw[key] is Map) {
          hours[key] = WorkingDay.fromJson(Map<String, dynamic>.from(raw[key] as Map));
        }
      }
    }
    return SalonInfo(
      id: j['id']?.toString() ?? '',
      name: j['name']?.toString() ?? '',
      address: j['address']?.toString(),
      phone: j['phone']?.toString(),
      email: j['email']?.toString(),
      description: j['description']?.toString(),
      ratingAvg: (j['ratingAvg'] as num?)?.toDouble() ?? 0.0,
      reviewCount: (j['reviewCount'] as num?)?.toInt() ?? 0,
      workingHours: hours,
      isVerified: (j['isVerified'] as bool?) ?? false,
      logoUrl: j['logoUrl']?.toString(),
      coverImageUrl: j['coverImageUrl']?.toString(),
      galleryImages: (j['galleryImages'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .where((e) => e.isNotEmpty)
          .toList(),
    );
  }
}

final salonProvider = AsyncNotifierProvider<SalonNotifier, SalonInfo?>(SalonNotifier.new);

class SalonNotifier extends AsyncNotifier<SalonInfo?> {
  @override
  Future<SalonInfo?> build() => _fetch();

  Future<SalonInfo?> _fetch() async {
    final auth = ref.read(authProvider).asData?.value;
    if (auth == null || !auth.isLoggedIn) return null;

    final response = await ApiClient().dio.get('/salons/owner/my-salons');
    final list = response.data['data'] as List?;
    if (list == null || list.isEmpty) return null;
    return SalonInfo.fromJson(list.first as Map<String, dynamic>);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> updateInfo(Map<String, dynamic> data) async {
    final id = state.asData?.value?.id;
    if (id == null) return;
    await ApiClient().dio.patch('/salons/$id', data: data);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> requestEmailChange(String newEmail, {String verifyVia = 'email'}) async {
    final id = state.asData?.value?.id;
    if (id == null) return;
    await ApiClient().dio.post('/salons/$id/request-email-change', data: {'newEmail': newEmail, 'verifyVia': verifyVia});
  }

  Future<void> confirmEmailChange(String token) async {
    final id = state.asData?.value?.id;
    if (id == null) return;
    await ApiClient().dio.post('/salons/$id/confirm-email-change', data: {'token': token});
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> requestPhoneChange(String newPhone, {String verifyVia = 'sms'}) async {
    final id = state.asData?.value?.id;
    if (id == null) return;
    await ApiClient().dio.post('/salons/$id/request-phone-change', data: {'newPhone': newPhone, 'verifyVia': verifyVia});
  }

  Future<void> confirmPhoneChange(String token) async {
    final id = state.asData?.value?.id;
    if (id == null) return;
    await ApiClient().dio.post('/salons/$id/confirm-phone-change', data: {'token': token});
    state = await AsyncValue.guard(_fetch);
  }

  // SA-003: Salon soft delete
  Future<void> deleteSalon(String salonId) async {
    final api = ApiClient();
    await api.dio.delete('/salons/$salonId');
    state = const AsyncData(null);
  }
}
