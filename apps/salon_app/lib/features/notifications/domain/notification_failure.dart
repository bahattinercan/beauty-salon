/// Bildirim akışındaki kullanıcıya gösterilebilir hata.
///
/// salon_app'te `fpdart`/`Either` yok (yeni bağımlılık yasak); veri katmanı bu
/// istisnayı fırlatır, `AsyncValue.guard` yakalar.
class NotificationFailure implements Exception {
  /// Kullanıcıya gösterilecek Türkçe mesaj.
  final String message;

  const NotificationFailure(this.message);

  @override
  String toString() => message;
}
