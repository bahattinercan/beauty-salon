import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/services/notification_service.dart';
import '../../domain/entities/appointment.dart';
import '../../domain/usecases/cancel_appointment_usecase.dart';
import '../../domain/usecases/get_appointments_usecase.dart';

class AppointmentsNotifier extends AsyncNotifier<List<Appointment>> {
  @override
  Future<List<Appointment>> build() => _fetch();

  Future<List<Appointment>> _fetch() async {
    final result = await getIt<GetAppointmentsUseCase>()();
    return result.fold((_) => [], (appointments) => appointments);
  }

  Future<void> cancel(String id) async {
    await getIt<CancelAppointmentUseCase>()(id);
    await NotificationService.cancelReminder(id);
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}

final appointmentsProvider =
    AsyncNotifierProvider<AppointmentsNotifier, List<Appointment>>(
  AppointmentsNotifier.new,
);
