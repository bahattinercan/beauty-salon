import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/booking_slot.dart';
import '../models/booking_slot_model.dart';

abstract class BookingRemoteDataSource {
  Future<List<BookingSlot>> getAvailableSlots({
    required String salonId,
    required String staffId,
    required String serviceId,
    required String date,
  });

  Future<String> createBooking({
    required String salonId,
    String? staffId,
    required String serviceId,
    required String date,
    required String startTime,
    String? note,
  });
}

@Injectable(as: BookingRemoteDataSource)
class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final ApiClient _apiClient;
  BookingRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<BookingSlot>> getAvailableSlots({
    required String salonId,
    required String staffId,
    required String serviceId,
    required String date,
  }) async {
    final response = await _apiClient.get(
      ApiConstants.availableSlots,
      queryParameters: {
        'salonId': salonId,
        'staffId': staffId,
        'serviceId': serviceId,
        'date': date,
      },
    );
    final data = response.data['data'];
    final slots = data is List ? data : <dynamic>[];
    return slots
        .map((s) => BookingSlotModel.fromJson(s as Map<String, dynamic>).toEntity())
        .toList();
  }

  @override
  Future<String> createBooking({
    required String salonId,
    String? staffId,
    required String serviceId,
    required String date,
    required String startTime,
    String? note,
  }) async {
    final body = <String, dynamic>{
      'salonId': salonId,
      'serviceId': serviceId,
      'date': date,
      'startTime': startTime,
      'staffId': ?staffId,
      if (note != null && note.isNotEmpty) 'note': note,
    };
    final response =
        await _apiClient.post(ApiConstants.appointments, data: body);
    return response.data?['id']?.toString() ?? salonId;
  }
}
