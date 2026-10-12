import '../../app/environment.dart';

class ApiConstants {
  ApiConstants._();

  static String get baseUrl => ApiEnvironment.baseUrl;

  /// Media/CDN base URL for images
  static String get mediaUrl => ApiEnvironment.mediaUrl;

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Users
  static const String profile = '/users/me';
  static const String requestEmailChange = '/users/me/request-email-change';
  static const String confirmEmailChange = '/users/me/confirm-email-change';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsUnreadCount = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';

  // Salons
  static const String salons = '/salons';
  static const String nearbySalons = '/salons/nearby';

  // Appointments
  static const String appointments = '/appointments';
  static const String myAppointments = '/appointments/my';
  static const String availableSlots = '/appointments/available-slots';

  // Reviews
  static const String reviews = '/reviews';
  static const String myReviews = '/reviews/my';
  static const String salonReviews = '/reviews/salon';

  // Favorites
  static const String favorites = '/favorites';

  // Categories
  static const String categories = '/categories';

  // Upload
  static const String uploadSingle = '/upload/single';
  static const String uploadMultiple = '/upload/multiple';
}
