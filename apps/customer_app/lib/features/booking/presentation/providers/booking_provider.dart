import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/services/notification_service.dart';
import '../../../appointments/presentation/providers/appointments_provider.dart';
import '../../../salon_detail/domain/entities/salon_detail.dart';
import '../../../salon_detail/domain/usecases/get_salon_detail_usecase.dart';
import '../../domain/entities/booking_slot.dart';
import '../../domain/usecases/create_booking_usecase.dart';
import '../../domain/usecases/get_available_slots_usecase.dart';

/// Booking akışının tüm business state'i. Ekran yalnızca bunu okur
/// (CLAUDE.md §5: server data State sınıfında tutulmaz).
class BookingState {
  final SalonDetail salon;
  final int step;
  final int? serviceIndex;
  final int? staffIndex; // -1 = herhangi bir personel
  final DateTime date;
  final String? time;
  final List<BookingSlot> slots;
  final bool loadingSlots;
  final bool submitting;
  final String? error;

  const BookingState({
    required this.salon,
    this.step = 0,
    this.serviceIndex,
    this.staffIndex,
    required this.date,
    this.time,
    this.slots = const [],
    this.loadingSlots = false,
    this.submitting = false,
    this.error,
  });

  SalonDetailService? get service =>
      serviceIndex == null ? null : salon.services[serviceIndex!];

  String? get staffName =>
      staffIndex == null || staffIndex == -1 ? null : salon.staff[staffIndex!].fullName;

  bool canProceed() {
    if (submitting) return false;
    switch (step) {
      case 0:
        return serviceIndex != null;
      case 1:
        return staffIndex != null;
      case 2:
        return time != null;
      case 3:
        return true;
      default:
        return false;
    }
  }

  BookingState copyWith({
    int? step,
    int? serviceIndex,
    int? staffIndex,
    DateTime? date,
    String? time,
    List<BookingSlot>? slots,
    bool? loadingSlots,
    bool? submitting,
    String? error,
  }) =>
      BookingState(
        salon: salon,
        step: step ?? this.step,
        serviceIndex: serviceIndex ?? this.serviceIndex,
        staffIndex: staffIndex ?? this.staffIndex,
        date: date ?? this.date,
        time: time ?? this.time,
        slots: slots ?? this.slots,
        loadingSlots: loadingSlots ?? this.loadingSlots,
        submitting: submitting ?? this.submitting,
        error: error ?? this.error,
      );
}

class BookingNotifier extends AsyncNotifier<BookingState> {
  final String salonId;
  BookingNotifier(this.salonId);

  @override
  Future<BookingState> build() async {
    final result = await getIt<GetSalonDetailUseCase>()(salonId);
    return result.fold(
      (failure) => throw failure,
      (salon) => BookingState(
        salon: salon,
        date: DateTime.now().add(const Duration(days: 1)),
      ),
    );
  }

  BookingState? get _current => state.asData?.value;

  void selectService(int index) {
    final s = _current;
    if (s == null) return;
    state = AsyncData(s.copyWith(
      serviceIndex: index,
      staffIndex: null,
      time: null,
      slots: const [],
    ));
  }

  void selectStaff(int index) {
    final s = _current;
    if (s == null) return;
    state = AsyncData(s.copyWith(staffIndex: index, time: null, slots: const []));
  }

  void selectTime(String time) {
    final s = _current;
    if (s == null) return;
    state = AsyncData(s.copyWith(time: time));
  }

  void nextStep() {
    final s = _current;
    if (s == null) return;
    final next = s.step + 1;
    state = AsyncData(s.copyWith(step: next));
    if (next == 2) loadSlots();
  }

  void backStep() {
    final s = _current;
    if (s == null || s.step == 0) return;
    state = AsyncData(s.copyWith(step: s.step - 1, error: null));
  }

  Future<void> setDate(DateTime date) async {
    final s = _current;
    if (s == null) return;
    state = AsyncData(s.copyWith(date: date, time: null, slots: const []));
    await loadSlots();
  }

  Future<void> loadSlots() async {
    final s = _current;
    if (s == null) return;
    final service = s.service;
    final staffId = _resolveStaffId(s);
    if (service == null || staffId == null) return;

    state = AsyncData(s.copyWith(loadingSlots: true, slots: const [], time: null));

    final result = await getIt<GetAvailableSlotsUseCase>()(
      salonId: salonId,
      staffId: staffId,
      serviceId: service.id,
      date: _dateToString(s.date),
    );

    final cur = _current;
    if (cur == null) return;
    state = AsyncData(cur.copyWith(
      loadingSlots: false,
      slots: result.fold((_) => const <BookingSlot>[], (slots) => slots),
    ));
  }

  /// Başarılıysa appointment id döner, hata durumunda null.
  Future<String?> submit(String note) async {
    final s = _current;
    if (s == null) return null;
    final service = s.service;
    final time = s.time;
    if (service == null || time == null) return null;

    state = AsyncData(s.copyWith(submitting: true, error: null));

    final result = await getIt<CreateBookingUseCase>()(
      salonId: salonId,
      staffId: _resolveStaffId(s),
      serviceId: service.id,
      date: _dateToString(s.date),
      startTime: time,
      note: note.trim().isEmpty ? null : note.trim(),
    );

    return result.fold(
      (failure) {
        final cur = _current;
        if (cur != null) state = AsyncData(cur.copyWith(error: failure.message));
        return null;
      },
      (appointmentId) async {
        final cur = _current;
        if (cur != null) state = AsyncData(cur.copyWith(submitting: false));

        ref.read(appointmentsProvider.notifier).refresh();

        final timeParts = time.split(':');
        final appointmentDateTime = DateTime(
          s.date.year,
          s.date.month,
          s.date.day,
          int.parse(timeParts[0]),
          int.parse(timeParts[1]),
        );

        await NotificationService.scheduleAppointmentReminder(
          appointmentId: appointmentId,
          salonName: s.salon.name,
          serviceName: service.name,
          appointmentDateTime: appointmentDateTime,
        );

        return appointmentId;
      },
    );
  }

  String? _resolveStaffId(BookingState s) {
    if (s.staffIndex != null && s.staffIndex != -1) {
      return s.salon.staff[s.staffIndex!].id;
    }
    final service = s.service;
    if (service == null || s.salon.staff.isEmpty) return null;
    return s.salon.staff
        .firstWhere(
          (m) => m.serviceNames.contains(service.name),
          orElse: () => s.salon.staff.first,
        )
        .id;
  }

  static String _dateToString(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

final bookingProvider =
    AsyncNotifierProvider.family<BookingNotifier, BookingState, String>(
      BookingNotifier.new,
    );
