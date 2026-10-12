abstract class TurkishDateUtils {
  static const List<String> months = [
    '',
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  static const List<String> days = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ];

  /// Returns a formatted date string: "15 Mart 2025, Cumartesi".
  static String formatDate(DateTime dt) {
    final dayName = days[(dt.weekday - 1) % 7];
    return '${dt.day} ${months[dt.month]} ${dt.year}, $dayName';
  }
}
