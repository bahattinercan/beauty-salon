import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/review_page.dart';
import '../../domain/entities/salon_detail.dart';
import '../models/salon_detail_model.dart';

abstract class SalonDetailRemoteDataSource {
  Future<SalonDetail> getSalonDetail(String salonId);
  Future<ReviewPage> getSalonReviews({
    required String salonId,
    int page,
    int limit,
  });
}

@Injectable(as: SalonDetailRemoteDataSource)
class SalonDetailRemoteDataSourceImpl implements SalonDetailRemoteDataSource {
  final ApiClient _apiClient;
  SalonDetailRemoteDataSourceImpl(this._apiClient);

  @override
  Future<SalonDetail> getSalonDetail(String salonId) async {
    final response = await _apiClient.get('${ApiConstants.salons}/$salonId');
    return SalonDetailModel.fromJson(response.data['data'] as Map<String, dynamic>)
        .toEntity();
  }

  @override
  Future<ReviewPage> getSalonReviews({
    required String salonId,
    int page = 1,
    int limit = 10,
  }) async {
    final response = await _apiClient.get(
      '${ApiConstants.salonReviews}/$salonId',
      queryParameters: {'page': page, 'limit': limit},
    );

    // Backend sayfalı yanıt veriyor: data.data = liste, data.meta = sayfa bilgisi.
    final payload = response.data['data'];
    final meta = payload is Map ? payload['meta'] : null;
    final items = payload is Map
        ? (payload['data'] as List? ?? const [])
        : (payload as List? ?? const []);

    return ReviewPage(
      reviews: items
          .map((e) => SalonReviewModel.fromJson(e as Map<String, dynamic>).toEntity())
          .toList(),
      page: meta is Map ? (meta['page'] as int? ?? page) : page,
      totalPages: meta is Map ? (meta['totalPages'] as int? ?? 1) : 1,
      total: meta is Map ? (meta['total'] as int? ?? items.length) : items.length,
    );
  }
}
