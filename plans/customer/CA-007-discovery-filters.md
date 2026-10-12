# CA-007 — Salon Discovery Gelişmiş Filtreler

**Öncelik:** 🟢 Düşük
**Tahmini Efor:** 2-3 saat
**Kapsam:** `apps/customer_app/` (Flutter)
**Durum:** ✅ Uygulandı (2026-07-27) — filtreler backend'e gönderiliyor, analyze temiz, 113 test geçiyor

---

## Özet

`DiscoverScreen`'de sadece `search` var. API `GET /salons` endpoint'i şu parametreleri destekliyor ama kullanılmıyor:
- `sortBy: 'rating' | 'newest'`
- `minRating` (1-5)
- `priceRange` (1-3)
- `verified` (boolean)

UI'da filtre butonu bile yok.

---

## Backend Referans

```
GET /api/v1/salons?search=&sortBy=&minRating=&priceRange=&verified=&page=&limit=
```

---

## Yapılacak Değişiklikler

### 1. Salons Provider — Güncelleme

#### `lib/features/salon_discovery/presentation/providers/salons_provider.dart` → güncelle

**State'e filtre alanları ekle:**

```dart
class SalonsNotifier extends StateNotifier<AsyncValue<List<Salon>>> {
  // Mevcut state yanına:
  String _sortBy = 'rating';           // rating | newest
  double _minRating = 0;
  int _priceRange = 0;                 // 0 = any, 1-3
  bool _showVerifiedOnly = false;
  String _searchQuery = '';

  // ... existing code

  Future<void> loadSalons() async {
    state = const AsyncLoading();
    try {
      final result = await getIt<GetSalonsUseCase>()(
        search: _searchQuery,
        sortBy: _sortBy,
        minRating: _minRating > 0 ? _minRating : null,
        priceRange: _priceRange > 0 ? _priceRange : null,
        verified: _showVerifiedOnly ? true : null,
      );
      state = result.fold(
        (failure) => AsyncError(failure.message, StackTrace.current),
        (salons) => AsyncData(salons),
      );
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  // Filtre setter'ları
  void setSortBy(String sortBy) {
    _sortBy = sortBy;
    loadSalons();
  }

  void setMinRating(double rating) {
    _minRating = rating;
    loadSalons();
  }

  void setPriceRange(int range) {
    _priceRange = range;
    loadSalons();
  }

  void setShowVerifiedOnly(bool value) {
    _showVerifiedOnly = value;
    loadSalons();
  }

  void resetFilters() {
    _sortBy = 'rating';
    _minRating = 0;
    _priceRange = 0;
    _showVerifiedOnly = false;
    loadSalons();
  }

  // Aktif filtre sayısı (badge için)
  int get activeFilterCount {
    int count = 0;
    if (_minRating > 0) count++;
    if (_priceRange > 0) count++;
    if (_showVerifiedOnly) count++;
    return count;
  }
}
```

### 2. UseCase — Güncelleme

#### `lib/features/salon_discovery/domain/usecases/get_salons_usecase.dart` → güncelle

```dart
Future<Either<Failure, List<Salon>>> call({
  String? search,
  String? sortBy,
  double? minRating,
  int? priceRange,
  bool? verified,
}) => _repository.getSalons(
  search: search,
  sortBy: sortBy,
  minRating: minRating,
  priceRange: priceRange,
  verified: verified,
);
```

#### `lib/features/salon_discovery/domain/repositories/salons_repository.dart` → güncelle

```dart
Future<Either<Failure, List<Salon>>> getSalons({
  String? search,
  String? sortBy,
  double? minRating,
  int? priceRange,
  bool? verified,
});
```

#### `lib/features/salon_discovery/data/datasources/salons_remote_datasource.dart` → güncelle

```dart
Future<List<SalonModel>> getSalons({
  String? search,
  String? sortBy,
  double? minRating,
  int? priceRange,
  bool? verified,
}) async {
  final queryParameters = <String, dynamic>{};
  if (search != null && search.isNotEmpty) queryParameters['search'] = search;
  if (sortBy != null) queryParameters['sortBy'] = sortBy;
  if (minRating != null) queryParameters['minRating'] = minRating;
  if (priceRange != null) queryParameters['priceRange'] = priceRange;
  if (verified != null) queryParameters['verified'] = verified;

  final response = await _apiClient.get(ApiConstants.salons, queryParameters: queryParameters);
  final data = (response.data['data'] as List?) ?? [];
  return data.map((json) => SalonModel.fromJson(json as Map<String, dynamic>)).toList();
}
```

### 3. Discover Screen — Filtre UI

#### `lib/features/salon_discovery/presentation/screens/discover_screen.dart` → güncelle

##### (a) Filtre butonu ekle (AppBar'a)

```dart
// AppBar actions'a ekle:
IconButton(
  icon: Stack(
    children: [
      Icon(Icons.tune, color: colors.textSecondary),
      if (ref.watch(salonsProvider.notifier).activeFilterCount > 0)
        Positioned(
          right: 0,
          top: 0,
          child: Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: colors.error,
              shape: BoxShape.circle,
            ),
          ),
        ),
    ],
  ),
  onPressed: _showFilterBottomSheet,
),
```

##### (b) `_showFilterBottomSheet` fonksiyonu

```dart
void _showFilterBottomSheet(BuildContext context) {
  final colors = AppColors.of(context);
  final s = S.of(context);
  final notifier = ref.read(salonsProvider.notifier);

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.8,
      minChildSize: 0.4,
      expand: false,
      builder: (_, controller) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
        ),
        child: ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            // Header
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.surfaceVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              s.discoverFilter,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Sort by
            Text(
              s.discoverSortBy,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _filterChip(
                  context,
                  s.discoverSortRating,
                  notifier._sortBy == 'rating',
                  onTap: () => notifier.setSortBy('rating'),
                ),
                _filterChip(
                  context,
                  s.discoverSortNewest,
                  notifier._sortBy == 'newest',
                  onTap: () => notifier.setSortBy('newest'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Min Rating
            Text(
              s.discoverMinRating,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Row(
              children: List.generate(5, (index) {
                final rating = index + 1;
                final isSelected = notifier._minRating >= rating;
                return GestureDetector(
                  onTap: () => notifier.setMinRating(rating.toDouble()),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      isSelected ? Icons.star_rounded : Icons.star_border_rounded,
                      color: colors.accent,
                      size: 32,
                    ),
                  ),
                );
              }),
            ),
            if (notifier._minRating > 0)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${notifier._minRating.toInt()} ${s.discoverStarsAndUp}',
                  style: TextStyle(fontSize: 12, color: colors.textSecondary),
                ),
              ),
            const SizedBox(height: 20),

            // Price Range
            Text(
              s.discoverPriceRange,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _filterChip(
                  context,
                  '₺',
                  notifier._priceRange == 1,
                  onTap: () => notifier.setPriceRange(1),
                ),
                _filterChip(
                  context,
                  '₺₺',
                  notifier._priceRange == 2,
                  onTap: () => notifier.setPriceRange(2),
                ),
                _filterChip(
                  context,
                  '₺₺₺',
                  notifier._priceRange == 3,
                  onTap: () => notifier.setPriceRange(3),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Verified only
            SwitchListTile(
              title: Text(s.discoverVerified),
              value: notifier._showVerifiedOnly,
              onChanged: (v) => notifier.setShowVerifiedOnly(v),
              activeColor: colors.primary,
            ),
            const SizedBox(height: 16),

            // Reset button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  notifier.resetFilters();
                  Navigator.pop(ctx);
                },
                child: Text(s.discoverReset),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ),
  );
}

Widget _filterChip(BuildContext context, String label, bool isSelected, {required VoidCallback onTap}) {
  final colors = AppColors.of(context);
  return FilterChip(
    label: Text(label),
    selected: isSelected,
    selectedColor: colors.primary.withValues(alpha: 0.15),
    checkmarkColor: colors.primary,
    onSelected: (_) => onTap(),
    labelStyle: TextStyle(
      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
      color: isSelected ? colors.primary : colors.textSecondary,
    ),
  );
}
```

### 4. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
// Discover filters
String get discoverSortBy       => isEn ? 'Sort By'           : 'Sıralama';
String get discoverSortNewest   => isEn ? 'Newest'            : 'En Yeni';
String get discoverVerified     => isEn ? 'Verified Salons'   : 'Onaylı Salonlar';
String get discoverVerifiedSub  => isEn ? 'Show verified only' : 'Sadece onaylıları göster';
```

---

## Test Senaryoları

1. **Sort by rating:** Salonlar rating'e göre sıralanır
2. **Sort by newest:** Salonlar en yene göre sıralanır
3. **Min rating:** 4 yıldız seç → sadece 4+ salonlar göster
4. **Price range:** ₺ seç → sadece ₺ salonlar göster
5. **Verified only:** Toggle → sadece onaylı salonlar
6. **Combined filters:** Rating + price + verified birlikte çalışır
7. **Reset:** "Sıfırla" → tüm filtreler temizlenir
8. **Badge:** Aktif filtre sayısı badge'de gösterilir
9. **Search + filters:** Arama + filtreler birlikte çalışır

---

## Dikkat Edilecekler

1. **API parametre validation:** `minRating` 1-5 arası, `priceRange` 1-3 arası.
2. **Real-time filter:** Filtre değiştiğinde `loadSalons()` otomatik çağrılır.
3. **Provider state:** `salonsProvider` notifier'ın internal state'lerine diğer provider'lardan erişim dikkatli olmalı.
4. **DiscoverScreen category filter:** Mevcut category filter ile çakışmamalı.
5. **Performance:** Her filtre değişikliği API çağrısı yapar — debouncing gerekmez (kullanıcı son seçimi yapar).

---

## Uygulanan (2026-07-27)

Plan metnindeki `StateNotifier` + `_priceRange` tasarımı uygulandı ama iki yerde düzeltildi:

**1. Filtre domain'e taşındı** — `domain/entities/salon_filter.dart` (`SalonFilter`):
`search, categoryId, minRating, priceRange, verifiedOnly, sortBy, maxDistanceKm` + `toQueryParameters()`.
Riverpod family key'i olduğu için `==`/`hashCode` elle yazıldı.

**2. Kategori chip'leri backend'den geliyor** — `GET /categories` artık kullanılıyor:
`ServiceCategory` entity + `CategoryModel` + `CategoriesRemoteDataSource` + `CategoriesRepositoryImpl` + `GetCategoriesUseCase` + `categoriesProvider`.
Ekrandeki sabit `['Tümü','Saç',...]` listesi kaldırıldı; chip'ler gerçek kategori id'leriyle seçiliyor. Home da aynı kategorileri kullanıyor ve `?category=<id>` ile geçiyor.

**3. `salonsProvider` artık filtre key'li family:**
`AsyncNotifierProvider.family<SalonsNotifier, List<Salon>, SalonFilter>` — filtre değişince provider yeniden kurulur ve backend'e `GET /salons?search=&categoryId=&minRating=&priceRange=&verified=&sortBy=` gider. Home ve Favorites `const SalonFilter()` (filtresiz) kullanıyor.

**4. Filter sheet:** fiyat çoklu seçimden tek seçime döndü (API tek `priceRange` alıyor), `verified` toggle'ı eklendi, çoklu `services` bölümü kaldırıldı (kategori seçimi chip satırında, API tek `categoryId` alıyor). Sort menüye `newest` eklendi.

**5. İstemci tarafında kalanlar** (`DiscoverNotifier.applyClientFilter`):
- `price_low` / `price_high` — backend desteklemiyor.
- `distance` — backend `sortBy` olarak desteklemiyor.
- `maxDistanceKm` — `distance` yalnızca `nearby` endpoint'inde dolu geliyor; mesafesi bilinmeyen salonlar filtre dışı bırakılmaz.

**Testler:** `salon_filter_test.dart` (query parametreleri, copyWith, hash), `get_categories_usecase_test.dart`, `discover_provider_test.dart` (mesafe + fiyat sırası). `get_salons_usecase_test.dart` yeni imzaya göre güncellendi (`registerFallbackValue(const SalonFilter())` gerekli).

**Mesafe filtresi artık gerçekten çalışıyor (2026-07-27, ikinci tur):**
`nearby` endpoint'i `categoryId`/`priceRange`/`verified`/`minRating` desteklemediği için Discover tek kaynak olarak `/salons`'ı (sunucu tarafı filtreler) kullanmaya devam ediyor; mesafe istemci tarafında hesaplanıyor:
- `SalonModel`/`Salon` artık `latitude`/`longitude` taşıyor.
- `Salon.distanceKmTo(lat, lng)` — haversine, saf Dart (domain). `apps/api/src/utils/helpers.js`'deki `calculateDistance` ile aynı formül.
- `presentation/providers/location_provider.dart` — `LocationService` tek noktadan okunur; izin yoksa `null` (liste boşalmaz, kullanıcıya hint gösterilir).
- `applyClientFilter(salons, location)` mesafeyi entity'ye yazar (`withDistance`), böylece kartta `distanceLabel` görünür; `distance` sıralaması da bu mesafeyi kullanır.
- Konum yokken mesafe filtresi uygulanmaz — anlamsız olurdu, listeyi boşaltırdı.

Testler: `salon_test.dart` (haversine + `distanceLabel`), `discover_provider_test.dart` (konumla filtre + mesafenin entity'ye yazılması).
