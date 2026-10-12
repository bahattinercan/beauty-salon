# CA-008 — Salon Detay Eksik Bölümler

**Öncelik:** 🟢 Düşük
**Tahmini Efor:** 3-4 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

`SalonDetailScreen`'te eksik alanlar:
1. **`galleryImages`** — fotoğraf galerisi section (API'de var, Flutter'da yok)
2. **`description`** — salon açıklaması (API'de var, Flutter'da yok)
3. **`priceRange`** — fiyat aralığı gösterimi (₺ / ₺₺ / ₺₺₺)
4. **`workingHours`** — tüm haftalık çalışma saatleri (şu an sadece bugünün saatleri)
5. **`latitude` / `longitude`** — koordinatlar (Directions butonu için gerekli)

---

## Backend Referans

```json
{
  "id": "...",
  "name": "...",
  "description": "Güzellik ve spa merkezi...",
  "priceRange": 2,
  "galleryImages": ["https://cdn.../img1.jpg", "https://cdn.../img2.jpg"],
  "latitude": 41.00,
  "longitude": 28.98,
  "workingHours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    "wednesday": { "open": "09:00", "close": "18:00" },
    "thursday": { "open": "09:00", "close": "18:00" },
    "friday": { "open": "09:00", "close": "18:00" },
    "saturday": { "open": "10:00", "close": "16:00" },
    "sunday": { "open": null, "close": null }
  }
}
```

---

## 1. Domain Model — Güncelleme

### `lib/features/salon_detail/domain/entities/salon_detail.dart` → güncelle

```dart
class SalonDetail {
  final String id;
  final String name;
  final String address;
  final String? phone;
  final String? city;
  final String? district;
  final double ratingAvg;
  final int reviewCount;
  final String? logoUrl;
  final String? coverImageUrl;
  final double? latitude;
  final double? longitude;
  final int priceRange;           // ← YENİ
  final String? description;      // ← YENİ
  final List<String> galleryImages;  // ← YENİ
  final Map<String, dynamic> workingHours;
  final List<SalonDetailService> services;
  final List<SalonDetailStaff> staff;

  const SalonDetail({
    // ... existing
    this.priceRange = 0,
    this.description,
    this.galleryImages = const [],
    // ...
  });

  // Yeni getter'lar
  String get priceRangeLabel {
    switch (priceRange) {
      case 1: return '₺';
      case 2: return '₺₺';
      case 3: return '₺₺₺';
      default: return '';
    }
  }

  // Bugünün saatleri (mevcut)
  String get todayHours {
    const days = [
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday',
    ];
    final today = days[DateTime.now().weekday - 1];
    final hours = workingHours[today] as Map?;
    if (hours == null || hours['open'] == null) return 'Kapalı';
    return '${hours['open']} - ${hours['close']}';
  }

  // Yeni: Tüm hafta çalışma saatleri
  List<WorkingHoursRow> get weeklyWorkingHours {
    const days = [
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday',
    ];
    return days.map((day) {
      final hours = workingHours[day] as Map? ?? {};
      return WorkingHoursRow(
        day: day,
        isOpen: hours['open'] != null,
        openTime: hours['open']?.toString(),
        closeTime: hours['close']?.toString(),
      );
    }).toList();
  }
}

class WorkingHoursRow {
  final String day;
  final bool isOpen;
  final String? openTime;
  final String? closeTime;
  
  const WorkingHoursRow({
    required this.day,
    required this.isOpen,
    this.openTime,
    this.closeTime,
  });
}
```

### `lib/features/salon_detail/data/models/salon_detail_model.dart` → güncelle

```dart
class SalonDetailModel {
  // ... existing fields
  
  final int priceRange;
  final String? description;
  final List<String> galleryImages;

  factory SalonDetailModel.fromJson(Map<String, dynamic> json) => SalonDetailModel(
    // ... existing
    priceRange: (json['priceRange'] as num?)?.toInt() ?? 0,
    description: json['description'] as String?,
    galleryImages: (json['galleryImages'] as List?)
            ?.map((e) => e as String)
            .toList() ?? [],
    // latitude/longitude zaten var ise ekle
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    // ...
  );

  SalonDetail toEntity() => SalonDetail(
    // ... existing
    priceRange: priceRange,
    description: description,
    galleryImages: galleryImages,
    latitude: latitude,
    longitude: longitude,
    // ...
  );
}
```

---

## 2. Salon Detail Screen — Güncelleme

### `lib/features/salon_detail/presentation/screens/salon_detail_screen.dart`

#### (a) Salon info section — priceRange ekle

```dart
// _infoRow'dan sonra ekle:
if (salon.priceRangeLabel.isNotEmpty) ...[
  const SizedBox(height: 4),
  _infoRow(
    Icons.attach_money,
    salon.priceRangeLabel,
    color: colors.success,
  ),
],
```

#### (b) Description section — salon info'dan sonra ekle

```dart
if (salon.description != null && salon.description!.isNotEmpty) ...[
  const SizedBox(height: 16),
  Text(
    salon.description!,
    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: colors.textSecondary,
          height: 1.6,
        ),
  ),
],
```

#### (c) Gallery section — salon info'dan sonra ekle

```dart
if (salon.galleryImages.isNotEmpty) ...[
  const SizedBox(height: 16),
  SizedBox(
    height: 140,
    child: ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 20),
      itemCount: salon.galleryImages.length,
      itemBuilder: (context, index) {
        final url = salon.galleryImages[index];
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: url,
              width: 160,
              height: 120,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(
                width: 160,
                height: 120,
                color: colors.secondary,
              ),
              errorWidget: (_, __, ___) => Container(
                width: 160,
                height: 120,
                color: colors.secondary,
                child: const Icon(Icons.image, color: Colors.white24),
              ),
            ),
          ),
        );
      },
    ),
  ),
],
```

#### (d) Working Hours section — salon info'dan sonra ekle

```dart
const SizedBox(height: 16),
_buildWorkingHours(salon),
```

```dart
Widget _buildWorkingHours(SalonDetail salon) {
  final colors = AppColors.of(context);
  final s = S.of(context);
  final rows = salon.weeklyWorkingHours;

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        s.workingHours,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
      const SizedBox(height: 8),
      ...rows.map((row) {
        final dayName = s.dayNames(context)[row.day == 'monday' ? 0 :
          row.day == 'tuesday' ? 1 :
          row.day == 'wednesday' ? 2 :
          row.day == 'thursday' ? 3 :
          row.day == 'friday' ? 4 :
          row.day == 'saturday' ? 5 : 6];
        
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              SizedBox(
                width: 90,
                child: Text(
                  dayName,
                  style: TextStyle(
                    fontSize: 13,
                    color: row.isOpen ? colors.textPrimary : colors.textHint,
                  ),
                ),
              ),
              if (row.isOpen)
                Expanded(
                  child: Text(
                    '${row.openTime} - ${row.closeTime}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                )
              else
                Text(
                  s.closed,
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textHint,
                    fontStyle: FontStyle.italic,
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    ],
  );
}
```

---

## 3. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
// Salon detail extras
String get workingHours     => isEn ? 'Working Hours'   : 'Çalışma Saatleri';
String get closed           => isEn ? 'Closed'          : 'Kapalı';
String get description      => isEn ? 'About'           : 'Hakkında';
String get gallery          => isEn ? 'Gallery'         : 'Galeri';
```

---

## Test Senaryoları

1. **Gallery:** 3+ fotoğraf → horizontal scroll grid
2. **Description:** Salon açıklaması var → göster
3. **Price range:** ₺ / ₺₺ / ₺₺₺ göster
4. **Working hours:** Tüm hafta saatleri göster
5. **Closed day:** "Kapalı" göster (italic)
6. **No gallery:** Gallery section gizli
7. **No description:** Description section gizli
8. **No price range:** Price range gösterilmez

---

## Dikkat Edilecekler

1. **Gallery horizontal:** `ListView(scrollDirection: Axis.horizontal)` — yatay scroll.
2. **Working hours map key:** `workingHours['monday']` vs `workingHours['Monday']` — API formatına uy.
3. **Closed day:** `open == null` → kapalı.
4. **Description overflow:** `maxLines` yok — tam göster (scrollable zaten).
5. **Price range:** `priceRange = 0` ise gösterme (varsayılan değilse).

---

## Uygulanan (2026-07-27)

Plan maddelerinin bir kısmı (gallery, description, priceRange) CA-017 refactor'ünde zaten uygulanmıştı. Bu turda kalanlar tamamlandı:

**Domain (`salon_detail.dart`):**
- `latitude` / `longitude` alanları eklendi (`double?`)
- `WorkingHoursRow` sınıfı + `weeklyWorkingHours` getter'ı (7 gün, `open == null` → kapalı)
- `WorkingHoursRow.days` sabiti Pazartesi→index 0 hizalaması için (`dayIndex`)
- `todayHours` artık `String?`: kapalı gün `null` döner. Domain l10n'e erişemediği için "Kapalı" metni presentation'da `s.closed` ile üretiliyor (domain'de hardcoded Türkçe metin kaldırıldı).

**Data (`salon_detail_model.dart`):** `latitude`/`longitude` parse + `toEntity` aktarımı.

**Presentation:**
- Yeni `widgets/working_hours_section.dart` (78 satır): başlık, 7 satır, bugünün satırı bold + nokta ile vurgulanır, kapalı gün `s.closed` (italic)
- `SalonInfoSection` Directions butonu koordinat varsa `query=lat,lng` kullanıyor, yoksa ad+adres araması (`_mapsQuery`)

**Strings:** `workingHours`, `closed`.

**Testler (150 test, analyze temiz):**
- `salon_detail_test.dart` — priceRange etiketleri, 7 günlük hafta, kapalı gün, `dayIndex`, boş `workingHours`, `todayHours` null
- `salon_detail_model_test.dart` — lat/lng/gallery/description/priceRange parse, JSON string `workingHours`, eksik alan varsayılanları, `toEntity`
- `working_hours_section_test.dart` — başlık + 7 gün, açık gün saat aralığı, kapalı gün `Closed`, eksik günlerin kapalı sayılması
  - Widget sliver döndürdüğü için test `CustomScrollView` içinde pump edildi (sliver, box parent altında hata verir).

**Not:** `dart format` bu dosyada repo stilinden sapıyor (199 → 232 satır); dosya repo stiline geri yazıldı.
