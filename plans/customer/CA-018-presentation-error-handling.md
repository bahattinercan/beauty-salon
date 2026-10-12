# CA-018 — Presentation Katmanında Hata Yönetimi (try/catch ve throw temizliği)

**Öncelik:** 🟡 Orta
**Durum:** ✅ Uygulandı (2026-07-27)
**Kapsam:** `apps/customer_app/lib/`
**Kural:** CLAUDE.md §3 — exception **yalnızca Data katmanında** yakalanır ve `Failure`'a çevrilir; Presentation'da `try/catch` yasak, `Either.fold()` kullanılır

---

## Özet

CA-014 sonrası Presentation'da kalan 3 ihlal ve 1 tip kaybı:

| # | Yer | İhlal |
|---|-----|-------|
| 1 | `features/salon_detail/presentation/providers/salon_detail_provider.dart:11` | `throw Exception(failure.message)` — Failure tipi kayboluyor |
| 2 | `features/home/presentation/screens/home_screen.dart:44-66` | `try/catch` + `Geolocator` widget'tan doğrudan çağrılıyor |
| 3 | `features/reviews/presentation/screens/write_review_screen.dart:345-363` | `try/catch` + `ImagePicker()` widget içinde instantiate ediliyor (§4) |
| 4 | `features/booking/presentation/screens/booking_screen.dart` | Server data (`slots`, `submitError`) `State` sınıfında (§5) |

---

## 1. Failure'lar — `core/error/failures.dart`

```dart
class LocationFailure extends Failure {
  const LocationFailure([super.message = 'Konum alınamadı']);
}

class LocationPermissionDeniedFailure extends Failure {
  const LocationPermissionDeniedFailure([super.message = 'Konum izni reddedildi']);
}

class ImagePickFailure extends Failure {
  const ImagePickFailure([super.message = 'Fotoğraf seçilemedi']);
}
```

---

## 2. `LocationService` — Geolocator widget'tan çıkar

Yeni dosya: `lib/core/services/location_service.dart`

```dart
@injectable
class LocationService {
  Future<Either<Failure, Geolocation>> getCurrent() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        return const Left(LocationPermissionDeniedFailure());
      }
      if (permission == LocationPermission.denied) {
        return const Left(LocationPermissionDeniedFailure());
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      return Right(Geolocation(pos.latitude, pos.longitude));
    } on PermissionDeniedException {
      return const Left(LocationPermissionDeniedFailure());
    } catch (_) {
      return const Left(LocationFailure());
    }
  }
}
```

`app_module.dart`'a ekle:
```dart
@module
abstract class AppModule {
  @lazySingleton
  LocationService get locationService => const LocationService();
}
```

`home_screen._initNearby()` artık:
```dart
Future<void> _initNearby() async {
  final result = await getIt<LocationService>().getCurrent();
  if (!mounted) return;
  result.fold(
    (failure) {
      if (failure is LocationPermissionDeniedFailure) _showLocationDeniedSnackBar();
      // diğer hallerde bölüm sessiz kalır
    },
    (geo) => ref.read(nearbySalonsProvider.notifier)
        .fetchNearby(latitude: geo.latitude, longitude: geo.longitude),
  );
}
```

> `Geolocation` = `core/services/geolocation.dart` içindeki küçük pure Dart record/class (domain'e Flutter importu girmemesi için `geolocator` paketi service'te kalır, domain'e sadece `double lat, double lng` veya pure tip taşınır).

---

## 3. `ImagePickerService` — image_picker widget'tan çıkar

Yeni dosya: `lib/core/services/image_picker_service.dart`

```dart
@injectable
class ImagePickerService {
  final ImagePicker _picker;
  ImagePickerService(this._picker);

  Future<Either<Failure, File>> pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source, maxWidth: 1920, maxHeight: 1920, imageQuality: 85,
      );
      if (picked == null) return const Left(ImagePickFailure('Fotoğraf seçilmedi'));
      return Right(File(picked.path));
    } catch (e) {
      return Left(ImagePickFailure(e.toString()));
    }
  }
}
```

`app_module.dart`:
```dart
@lazySingleton
ImagePicker get imagePicker => ImagePicker();

@lazySingleton
ImagePickerService get imagePickerService => ImagePickerService(imagePicker);
```

Widget tarafı (`write_review_screen`): `try/catch` kaldırılır, `fold()` ile snackbar gösterilir. `showDialog<ImageSource>` UI seçimi widget'ta kalır (ephemeral UI), sadece plugin çağrısı service'e gider.

---

## 4. `salon_detail_provider` — throw yerine Either

**Seçenek A (önerilen, minimal):** `Exception(failure.message)` yerine typed `Failure` fırlat, screen `AsyncValue.error` durumunda `error is Failure ? (error as Failure).message : ...` kullanır.

```dart
final salonDetailProvider =
    FutureProvider.family<SalonDetail, String>((ref, salonId) async {
  final result = await getIt<GetSalonDetailUseCase>()(salonId);
  return result.fold((failure) => throw failure, (detail) => detail);
});
```

**Seçenek B (kurala tam uyum):** provider `Either<Failure, SalonDetail>` döner, screen `fold()` ile render eder. Daha fazla değişiklik gerektirir (`salon_detail_screen.dart` 441 satır, CA-017 ile birlikte yapılmalı).

> Aynı kalıp `my_reviews_provider` ve `salons_provider` için de geçerli: şu an `fold((_) => [], ...)` ile hataları **sessizce yutuyor** — kullanıcı hata olduğunu görmüyor. En azından `AsyncError` olarak taşımalı.

---

## 5. `booking_screen` — server data State'ten çıkar

CLAUDE.md §5: "Business logic and server data must never live in a `State` class."

```dart
// features/booking/presentation/providers/booking_provider.dart
class BookingNotifier extends AsyncNotifier<BookingState> { ... }
```

Screen sadece `ref.watch(bookingProvider)` okur, `notifier.selectService(...)`, `notifier.loadSlots()`, `notifier.submit()` çağırır. `setState` yalnızca step animasyonu gibi ephemeral şeyler için kalır (tercihen hiç).

Bu iş CA-017 §1 ile aynı dosyada, birlikte yapılmalı.

---

## 6. Testler

CA-015 ile birlikte:
- `LocationService` testleri: permission denied / deniedForever / exception → doğru Failure
- `ImagePickerService` testleri: null seçim, exception → `ImagePickFailure`
- `BookingNotifier` testleri: slot yükleme hatası → `state.error`

---

## Sonuç (uygulanan)

```bash
grep -rn "try {\|catch" lib/features/*/presentation/ lib/app/   # 0
grep -rn "ImagePicker()\|Geolocator\." lib/features/            # 0
# throw kalanlar yalnızca typed Failure (Riverpod AsyncError için): 4 provider
```

- `LocationService` + `ImagePickerService` eklendi, `AppModule`'da `@lazySingleton ImagePicker` kayıtlı.
- `salons_provider`, `my_reviews_provider`, `salon_detail_provider`, `booking_provider` artık `fold((failure) => throw failure, ...)` → hata UI'a (`e.displayMessage`) taşınıyor; sessizce `[]` yutma yok.
- `BookingNotifier` (`AsyncNotifier` family, arg = salonId) salon detail'i kendisi çekiyor; `BookingScreen` artık `ConsumerStatefulWidget` ve yalnızca `_noteController` (ephemeral) tutuyor. `booking_screen.dart` 720 satır → CA-017 §1 hâlâ geçerli.

---

## Doğrulama

```bash
cd apps/customer_app
grep -rn "try {\|catch" lib/features/*/presentation/ lib/app/   # hedef: 0
grep -rn "throw " lib/features/*/presentation/                   # hedef: 0 (veya yalnızca typed Failure)
grep -rn "ImagePicker()\|Geolocator\." lib/features/            # hedef: 0
flutter analyze && flutter test
```
