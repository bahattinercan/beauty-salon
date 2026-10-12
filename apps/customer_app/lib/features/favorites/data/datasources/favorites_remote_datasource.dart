import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';

abstract class FavoritesRemoteDataSource {
  Future<Set<String>> getFavoriteIds();
  Future<void> toggle(String salonId);
}

@Injectable(as: FavoritesRemoteDataSource)
class FavoritesRemoteDataSourceImpl implements FavoritesRemoteDataSource {
  final ApiClient _apiClient;
  FavoritesRemoteDataSourceImpl(this._apiClient);

  @override
  Future<Set<String>> getFavoriteIds() async {
    final response = await _apiClient.get(ApiConstants.favorites);
    final items = response.data['data'] as List? ?? [];
    return items.map((e) => e['id'] as String).toSet();
  }

  @override
  Future<void> toggle(String salonId) async {
    await _apiClient.post('${ApiConstants.favorites}/$salonId');
  }
}
