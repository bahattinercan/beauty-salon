import '../../../../core/extensions/string_extensions.dart';
import '../../../../core/extensions/datetime_extensions.dart';

class SalonDetailService {
  final String id;
  final String name;
  final double price;
  final int durationMinutes;
  final String? categoryName;

  const SalonDetailService({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
    this.categoryName,
  });
}

class SalonDetailStaff {
  final String id;
  final String fullName;
  final String? title;
  final String? bio;
  final String? avatarUrl;
  final List<String> serviceNames;

  const SalonDetailStaff({
    required this.id,
    required this.fullName,
    this.title,
    this.bio,
    this.avatarUrl,
    this.serviceNames = const [],
  });

  String get initials => fullName.initials;
}

class SalonReview {
  final String id;
  final String customerName;
  final String customerInitials;
  final int rating;
  final String? comment;
  final String? reply;
  final String? serviceName;
  final String createdAt;
  final List<String> images;

  const SalonReview({
    required this.id,
    required this.customerName,
    required this.customerInitials,
    required this.rating,
    this.comment,
    this.reply,
    this.serviceName,
    required this.createdAt,
    this.images = const [],
  });

  String get timeAgo => DateTime.tryParse(createdAt)?.timeAgoTr ?? '';
}

class WorkingHoursRow {
  final String day;
  final bool isOpen;
  final String? openTime;
  final String? closeTime;

  const WorkingHoursRow({
    required this.day,
    required this.isOpen,
    this.openTime,
    this.closeTime,
  });

  /// `dayNames` listesi Pazartesi ile başladığı için weekday 1 → index 0.
  int get dayIndex => days.indexOf(day);

  static const List<String> days = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday',
  ];
}

class SalonDetail {
  final String id;
  final String name;
  final String address;
  final String? phone;
  final String? city;
  final String? district;
  final double ratingAvg;
  final int reviewCount;
  final String? logoUrl;
  final String? coverImageUrl;
  final double? latitude;
  final double? longitude;
  final Map<String, dynamic> workingHours;
  final List<SalonDetailService> services;
  final List<SalonDetailStaff> staff;
  final List<String> galleryImages;
  final int priceRange;
  final String? description;

  const SalonDetail({
    required this.id,
    required this.name,
    required this.address,
    this.phone,
    this.city,
    this.district,
    required this.ratingAvg,
    required this.reviewCount,
    this.logoUrl,
    this.coverImageUrl,
    this.latitude,
    this.longitude,
    this.workingHours = const {},
    this.services = const [],
    this.staff = const [],
    this.galleryImages = const [],
    this.priceRange = 0,
    this.description,
  });

  String get priceRangeLabel {
    switch (priceRange) {
      case 1:
        return '₺';
      case 2:
        return '₺₺';
      case 3:
        return '₺₺₺';
      default:
        return '';
    }
  }

  /// Bugünün satırı. Kapalıysa null döner — "Kapalı" metni l10n olduğu için
  /// presentation'da `s.closed` ile gösterilir (domain l10n'e erişemez).
  String? get todayHours {
    final row = weeklyWorkingHours[DateTime.now().weekday - 1];
    return row.isOpen ? '${row.openTime} - ${row.closeTime}' : null;
  }

  /// Tüm haftanın çalışma saatleri. `open == null` → kapalı gün.
  List<WorkingHoursRow> get weeklyWorkingHours {
    return WorkingHoursRow.days.map((day) {
      final hours = workingHours[day] as Map? ?? const {};
      final open = hours['open'];
      return WorkingHoursRow(
        day: day,
        isOpen: open != null,
        openTime: open?.toString(),
        closeTime: hours['close']?.toString(),
      );
    }).toList();
  }
}
