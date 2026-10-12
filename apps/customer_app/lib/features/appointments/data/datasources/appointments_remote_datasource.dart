import 'package:injectable/injectable.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/appointment.dart';
import '../models/appointment_model.dart';

abstract class AppointmentsRemoteDataSource {
  Future<List<Appointment>> getMyAppointments();
  Future<void> cancelAppointment(String id);
}

@Injectable(as: AppointmentsRemoteDataSource)
class AppointmentsRemoteDataSourceImpl implements AppointmentsRemoteDataSource {
  final ApiClient _apiClient;
  AppointmentsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<Appointment>> getMyAppointments() async {
    final response = await _apiClient.get(ApiConstants.myAppointments);
    final data = response.data['data'];
    final items = data is List ? data : <dynamic>[];
    return items
        .map((e) => AppointmentModel.fromJson(e as Map<String, dynamic>).toEntity())
        .toList();
  }

  @override
  Future<void> cancelAppointment(String id) async {
    await _apiClient.patch('/appointments/$id/cancel');
  }
}
