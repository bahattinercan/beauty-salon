import 'package:fpdart/fpdart.dart';
import 'package:geolocator/geolocator.dart';
import 'package:injectable/injectable.dart';
import '../error/failures.dart';
import 'geolocation.dart';

/// Konum izni + konum okuma. Exception yalnızca burada yakalanır ve
/// `Failure`'a çevrilir (CLAUDE.md §3).
@injectable
class LocationService {
  Future<Either<Failure, Geolocation>> getCurrent() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        return const Left(LocationFailure('Konum servisi kapalı'));
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return const Left(LocationPermissionDeniedFailure());
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
        ),
      );

      return Right(
        Geolocation(latitude: position.latitude, longitude: position.longitude),
      );
    } on PermissionDeniedException {
      return const Left(LocationPermissionDeniedFailure());
    } on LocationServiceDisabledException {
      return const Left(LocationFailure('Konum servisi kapalı'));
    } catch (_) {
      return const Left(LocationFailure());
    }
  }

  Future<void> openAppSettings() => Geolocator.openAppSettings();
}
