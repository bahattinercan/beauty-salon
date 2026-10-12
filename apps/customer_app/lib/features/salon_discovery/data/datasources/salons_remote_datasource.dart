import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/salon_filter.dart';
import '../models/salon_model.dart';

abstract class SalonsRemoteDataSource {
  Future<List<SalonModel>> getSalons(SalonFilter filter);

  Future<List<SalonModel>> getNearbySalons({
    required double latitude,
    required double longitude,
    int radius = 10,
  });
}

@Injectable(as: SalonsRemoteDataSource)
class SalonsRemoteDataSourceImpl implements SalonsRemoteDataSource {
  final ApiClient _apiClient;
  SalonsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<SalonModel>> getSalons(SalonFilter filter) async {
    final response = await _apiClient.get(
      ApiConstants.salons,
      queryParameters: filter.toQueryParameters(),
    );
    final outer = response.data['data'];
    final List items =
        outer is Map ? (outer['data'] as List? ?? []) : (outer as List? ?? []);
    return items
        .map((e) => SalonModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<SalonModel>> getNearbySalons({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.nearbySalons,
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'radius': radius,
      },
    );
    // Backend paginated yanıt döner: { success, data: { data: [...], meta } }
    final outer = response.data['data'];
    final List items =
        outer is Map ? (outer['data'] as List? ?? []) : (outer as List? ?? []);
    return items
        .map((e) => SalonModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
