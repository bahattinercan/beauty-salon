import '../../domain/entities/booking_slot.dart';

class BookingSlotModel {
  final String time;
  final bool available;

  const BookingSlotModel({required this.time, required this.available});

  factory BookingSlotModel.fromJson(Map<String, dynamic> json) =>
      BookingSlotModel(
        time: (json['time'] as String?) ?? '',
        available: (json['available'] as bool?) ?? false,
      );

  BookingSlot toEntity() => BookingSlot(time: time, available: available);
}
