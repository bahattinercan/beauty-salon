import '../../domain/entities/appointment.dart';

class AppointmentSalonModel {
  final String id;
  final String name;
  final String? address;

  const AppointmentSalonModel({required this.id, required this.name, this.address});

  factory AppointmentSalonModel.fromJson(Map<String, dynamic> json) =>
      AppointmentSalonModel(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        address: json['address'] as String?,
      );

  AppointmentSalon toEntity() =>
      AppointmentSalon(id: id, name: name, address: address);
}

class AppointmentStaffModel {
  final String id;
  final String fullName;

  const AppointmentStaffModel({required this.id, required this.fullName});

  factory AppointmentStaffModel.fromJson(Map<String, dynamic> json) =>
      AppointmentStaffModel(
        id: (json['id'] as String?) ?? '',
        fullName: (json['fullName'] as String?) ?? '',
      );

  AppointmentStaff toEntity() => AppointmentStaff(id: id, fullName: fullName);
}

class AppointmentServiceModel {
  final String id;
  final String name;
  final double price;
  final int durationMinutes;

  const AppointmentServiceModel({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
  });

  factory AppointmentServiceModel.fromJson(Map<String, dynamic> json) =>
      AppointmentServiceModel(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? '',
        price: (json['price'] as num?)?.toDouble() ?? 0.0,
        durationMinutes: (json['durationMinutes'] as int?) ?? 0,
      );

  AppointmentService toEntity() =>
      AppointmentService(id: id, name: name, price: price, durationMinutes: durationMinutes);
}

class AppointmentModel {
  final String id;
  final String date;
  final String startTime;
  final String endTime;
  final String status;
  final String? note;
  final AppointmentSalonModel salon;
  final AppointmentStaffModel? staff;
  final AppointmentServiceModel? service;

  const AppointmentModel({
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

  factory AppointmentModel.fromJson(Map<String, dynamic> json) => AppointmentModel(
        id: (json['id'] as String?) ?? '',
        date: (json['date'] as String?) ?? '',
        startTime: (json['startTime'] as String?) ?? '',
        endTime: (json['endTime'] as String?) ?? '',
        status: (json['status'] as String?) ?? '',
        note: json['note'] as String?,
        salon: json['salon'] != null
            ? AppointmentSalonModel.fromJson(json['salon'] as Map<String, dynamic>)
            : const AppointmentSalonModel(id: '', name: ''),
        staff: json['staff'] != null
            ? AppointmentStaffModel.fromJson(json['staff'] as Map<String, dynamic>)
            : null,
        service: json['service'] != null
            ? AppointmentServiceModel.fromJson(json['service'] as Map<String, dynamic>)
            : null,
      );

  Appointment toEntity() => Appointment(
        id: id,
        date: date,
        startTime: startTime,
        endTime: endTime,
        status: status,
        note: note,
        salon: salon.toEntity(),
        staff: staff?.toEntity(),
        service: service?.toEntity(),
      );
}
