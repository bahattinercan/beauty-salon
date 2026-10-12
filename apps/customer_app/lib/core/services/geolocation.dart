/// Pure Dart konum değeri. `geolocator` paketi service katmanında kalır,
/// domain ve presentation bu tipi görür.
class Geolocation {
  final double latitude;
  final double longitude;

  const Geolocation({required this.latitude, required this.longitude});
}
