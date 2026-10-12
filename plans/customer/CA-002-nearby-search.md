# CA-002 — Yakındaki Salonlar (Nearby Search)

**Öncelik:** 🟡 Orta
**Tahmini Efor:** 3-4 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

API endpoint mevcut: `GET /salons/nearby?latitude=&longitude=&radius=`. `geolocator` paketi zaten `pubspec.yaml`'da. Ama Flutter tarafında **hiçbir yerde kullanılmıyor**. `HomeScreen`'te "Yakınımdaki Salonlar" bölümü tüm salonları rating'e göre sıralıyor (mesafe bilgisi yok).

---

## Backend Referans

```
GET /api/v1/salons/nearby?latitude=41.00&longitude=28.98&radius=10
Query params:
  - latitude: required (double)
  - longitude: required (double)
  - radius: optional (int, default 10, km)

Response:
{
  success: true,
  data: [
    {
      id: "...",
      name: "...",
      address: "...",
      latitude: 41.001,
      longitude: 28.99,
      distance: 1.2,      // ← yeni field! km cinsinden
      ratingAvg: 4.5,
      reviewCount: 23,
      logoUrl: "...",
      coverImageUrl: "...",
      priceRange: 2,
      ...
    }
  ]
}
```

---

## Yapılacak Dosyalar

### 1. Domain Layer

#### `lib/features/salon_discovery/domain/entities/salon.dart` → güncelle

`distance` field ekle:
```dart
class Salon {
  final String id;
  final String name;
  final String address;
  final String? city;
  final String? district;
  final double ratingAvg;
  final int reviewCount;
  final String? logoUrl;
  final String? coverImageUrl;
  final int priceRange;
  final double? distance;       // ← YENİ

  // ... existing getters

  String get distanceLabel {
    if (distance == null) return '';
    if (distance! < 1) return '${(distance! * 1000).toInt()} m';
    return '${distance!.toStringAsFixed(1)} km';
  }
}
```

#### `lib/features/salon_discovery/domain/entities/salon.dart` → `SalonModel` extension güncelle

```dart
extension SalonModelX on SalonModel {
  Salon toEntity() => Salon(
    // ... existing fields
    distance: distance,  // ← YENİ
  );
}
```

#### `lib/features/salon_discovery/data/models/salon_model.dart` → güncelle

```dart
@freezed
sealed class SalonModel with _$SalonModel {
  const factory SalonModel({
    // ... existing fields
    double? distance,       // ← YENİ
  }) = _SalonModel;
  
  // json key: @JsonKey(name: 'distance')
}
```

### 2. Data Layer

#### `lib/features/salon_discovery/data/datasources/salons_remote_datasource.dart` → güncelle

Mevcut dosyaya metod ekle:
```dart
Future<List<SalonModel>> getNearbySalons({
  required double latitude,
  required double longitude,
  int radius = 10,
});
```

**API çağrısı:**
```dart
@override
Future<List<SalonModel>> getNearbySalons({
  required double latitude,
  required double longitude,
  int radius = 10,
}) async {
  final response = await _apiClient.get(
    ApiConstants.nearbySalons,
    queryParameters: {
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
    },
  );
  final data = (response.data['data'] as List?) ?? [];
  return data
      .map((json) => SalonModel.fromJson(json as Map<String, dynamic>))
      .toList();
}
```

#### `lib/features/salon_discovery/domain/usecases/get_nearby_salons_usecase.dart` (YENİ)

```dart
@injectable
class GetNearbySalonsUseCase {
  final SalonsRepository _repository;
  GetNearbySalonsUseCase(this._repository);

  Future<Either<Failure, List<Salon>>> call({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) => _repository.getNearbySalons(
        latitude: latitude, longitude: longitude, radius: radius,
      );
}
```

#### `lib/features/salon_discovery/domain/repositories/salons_repository.dart` → güncelle

```dart
Future<Either<Failure, List<Salon>>> getNearbySalons({
  required double latitude,
  required double longitude,
  int radius,
});
```

#### `lib/features/salon_discovery/data/repositories/salons_repository_impl.dart` → güncelle

Implement ekle.

### 3. Presentation — Provider

#### `lib/features/salon_discovery/presentation/providers/salons_provider.dart` → güncelle

```dart
// Mevcut salonsProvider yanına:

final nearbySalonsProvider = StateNotifierProvider<NearbySalonsNotifier, AsyncValue<List<Salon>>>((ref) {
  return NearbySalonsNotifier(ref);
});

class NearbySalonsNotifier extends StateNotifier<AsyncValue<List<Salon>>> {
  final Ref ref;
  NearbySalonsNotifier(this.ref) : super(const AsyncLoading());

  Future<void> fetchNearby({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) async {
    state = const AsyncLoading();
    try {
      final result = await getIt<GetNearbySalonsUseCase>()(
        latitude: latitude, longitude: longitude, radius: radius,
      );
      state = result.fold(
        (failure) => AsyncError(failure.message, StackTrace.current),
        (salons) => AsyncData(salons),
      );
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
```

### 4. Home Screen — Güncelleme

#### `lib/features/home/presentation/screens/home_screen.dart` → güncelle

**Yapılacaklar:**

1. Konum izni iste (ilk açılışta)
2. Konumu al
3. `nearbySalonsProvider`'dan nearby salonları çek
4. "Yakınımdaki Salonlar" bölümünü nearby sonuçlarla doldur

**Akış:**
```dart
@override
void initState() {
  super.initState();
  _checkLocationPermission();
}

Future<void> _checkLocationPermission() async {
  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.deniedForever) return; // izin verilmez
  
  await _fetchNearby();
}

Future<void> _fetchNearby() async {
  final position = await Geolocator.getCurrentPosition();
  ref.read(nearbySalonsProvider.notifier).fetchNearby(
    latitude: position.latitude,
    longitude: position.longitude,
    radius: 5,
  );
}
```

**"Yakınımdaki Salonlar" bölümü:**
```dart
// Mevcut slivers yanına ekle:

// Nearby section — BEFORE "Top Rated"
SliverToBoxAdapter(
  child: _SectionHeader(
    title: s.homeNearby,
    seeAllLabel: s.homeSeeAll,
    onSeeAll: () => context.go('/discover'),
  ),
),

SliverToBoxAdapter(
  child: ref.watch(nearbySalonsProvider).when(
    loading: () => SizedBox(
      height: 260,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: 3,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(right: 16),
          child: SalonCardShimmer(),
        ),
      ),
    ),
    error: (_, __) => const SizedBox.shrink(), // hata varsa nearby gösterme
    data: (salons) {
      if (salons.isEmpty) return const SizedBox.shrink();
      return SizedBox(
        height: 260,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: salons.length,
          itemBuilder: (context, index) {
            final salon = salons[index];
            return Padding(
              padding: const EdgeInsets.only(right: 16),
              child: SalonCard(
                id: salon.id,
                name: salon.name,
                address: salon.address,
                rating: salon.ratingAvg,
                reviewCount: salon.reviewCount,
                distance: salon.distanceLabel,  // ← YENİ: mesafe göster
                priceRange: salon.priceRangeLabel,
                imageUrl: salon.coverImageUrl ?? salon.logoUrl ?? '',
                isFavorite: favorites.contains(salon.id),
                onFavoriteTap: () => 
                    ref.read(favoritesProvider.notifier).toggle(salon.id),
              ),
            );
          },
        ),
      );
    },
  ),
),
```

### 5. Konum İzin UI

Konum izni reddedilirse kullanıcıya bilgi ver:
```dart
if (permission == LocationPermission.deniedForever) {
  // SnackBar veya dialog göster:
  // "Konum izni reddedildi. Ayarlardan izin verin."
  // Veya sadece nearby bölümünü gizle
}
```

### 6. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
String get homeNearby       => isEn ? 'Nearby Salons'   : 'Yakınımdaki Salonlar';
String get nearbyLoading    => isEn ? 'Loading nearby...' : 'Yakınlar yükleniyor...';
String get locationDenied   => isEn ? 'Location access denied' : 'Konum izni reddedildi';
String let locationDeniedBody => isEn ? 'Enable location in settings to see nearby salons' : 'Yakındaki salonları görmek için ayarlardan konum izni verin';
```

### 7. API Constants

#### `lib/core/constants/api_constants.dart` → kontrol et

`nearbySalons` zaten var olmalı. Yoksa ekle:
```dart
static const String nearbySalons = '/salons/nearby';
```

---

## Test Senaryoları

1. **İlk açılış:** Konum izni popup → izin ver → nearby salonlar göster
2. **İzin reddedildi:** Nearby bölümü gösterilmez (veya "konum izni gerekli" mesajı)
3. **Konum izni reddedildi (sürekli):** Snackbar göster
4. **Nearby sonuç yok:** Bölüm gizli (hiçbir şey gösterme)
5. **Nearby sonuç var:** Mesafe badge göster (örn: "1.2 km")
6. **Radius değiştir:** `radius=5` → daha az sonuç
7. **Error handling:** API hatası → hata gösterme (sessiz geç)

---

## Dikkat Edilecekler

1. **Konum izni iki kez:** `checkPermission()` + `requestPermission()` — race condition yok.
2. **Permission denied forever:** Bu durumda kullanıcıyı ayarlara yönlendir (`openAppSettings()`).
3. **Performance:** Nearby API tek çağrı. `salonsProvider` (tüm salonlar) zaten başka yerde yükleniyor — conflict yok.
4. **SalonCard mesafe:** `distanceLabel` artık `double?` → string conversion widget'ta yapılıyor.
5. **HomeScreen `initState` async:** `initState`'da `await` kullanma. `Future.microtask` veya `_checkLocationPermission()`'i direkt çağır.
6. **Location permission Android:** `android/app/src/main/AndroidManifest.xml`'de permission'lar zaten var olmalı:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```

---

## Güncelleme (2026-07-27)

Konum artık tek kaynaktan okunuyor: `presentation/providers/location_provider.dart`
(`AsyncNotifier<Geolocation?>`, `LocationService` üzerinden; hata `Failure` olarak thrown).

- `nearbySalonsProvider` artık `fetchNearby()` almıyor — `build()` içinde `locationProvider`'ı izliyor ve konum gelince `GET /salons/nearby?radius=` çağrıyor. Konum yoksa boş liste (Home bölümü gizli).
- `HomeScreen`'teki `initState` + `locationFlowStarted` guard'ı kaldırıldı; izin reddi `ref.listen(locationProvider, ...)` ile yakalanıp snackbar gösteriliyor.
- Discover aynı provider'ı kullanıyor: konum yokken mesafe filtresi uygulanmaz, kullanıcıya hint gösterilir.

Böylece Home ve Discover iki farklı konum kaynağına bakmıyor; izin bir kez soruluyor, iki ekran da aynı state'i görüyor.
