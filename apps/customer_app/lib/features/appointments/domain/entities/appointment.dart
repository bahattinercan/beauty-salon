import '../../../../core/utils/turkish_date_utils.dart';

class AppointmentSalon {
  final String id;
  final String name;
  final String? address;

  const AppointmentSalon({
    required this.id,
    required this.name,
    this.address,
  });
}

class AppointmentStaff {
  final String id;
  final String fullName;

  const AppointmentStaff({required this.id, required this.fullName});
}

class AppointmentService {
  final String id;
  final String name;
  final double price;
  final int durationMinutes;

  const AppointmentService({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
  });
}

class Appointment {
  final String id;
  final String date;
  final String startTime;
  final String endTime;
  final String status;
  final String? note;
  final AppointmentSalon salon;
  final AppointmentStaff? staff;
  final AppointmentService? service;

  const Appointment({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.note,
    required this.salon,
    this.staff,
    this.service,
  });

  bool get isUpcoming =>
      (status == 'PENDING' || status == 'CONFIRMED') &&
      DateTime.tryParse(date)
              ?.isAfter(DateTime.now().subtract(const Duration(days: 1))) ==
          true;

  bool get isPast => status == 'COMPLETED' || status == 'NO_SHOW';

  bool get isCancelled => status == 'CANCELLED';

  String get formattedDate {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return TurkishDateUtils.formatDate(dt);
  }

  String get formattedTime => '$startTime - $endTime';
}
