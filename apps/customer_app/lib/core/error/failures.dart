abstract class Failure {
  final String message;
  const Failure(this.message);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'İnternet bağlantısı yok']);
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([super.message = 'Oturum süresi doldu']);
}

class LocationFailure extends Failure {
  const LocationFailure([super.message = 'Konum alınamadı']);
}

class LocationPermissionDeniedFailure extends Failure {
  const LocationPermissionDeniedFailure([super.message = 'Konum izni reddedildi']);
}

class ImagePickFailure extends Failure {
  const ImagePickFailure([super.message = 'Fotoğraf seçilemedi']);
}
