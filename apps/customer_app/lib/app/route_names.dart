/// go_router route name'leri. Call site'larda string literal yerine
/// bu sabitler kullanılır (CLAUDE.md §9: named routes zorunlu).
class RouteNames {
  RouteNames._();

  static const login = 'login';
  static const register = 'register';
  static const forgotPassword = 'forgotPassword';
  static const resetPassword = 'resetPassword';

  static const home = 'home';
  static const discover = 'discover';
  static const appointments = 'appointments';
  static const profile = 'profile';

  static const salonDetail = 'salonDetail';
  static const booking = 'booking';
  static const writeReview = 'writeReview';

  static const favorites = 'favorites';
  static const editProfile = 'editProfile';
  static const myReviews = 'myReviews';
  static const notifications = 'notifications';
}
