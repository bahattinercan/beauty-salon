import '../error/failures.dart';

/// `AsyncValue.error` durumunda hata metnini okunur hale getirir:
/// `Failure` ise mesajı, değilse `toString()`.
extension ErrorMessage on Object {
  String get displayMessage => this is Failure ? (this as Failure).message : toString();
}
