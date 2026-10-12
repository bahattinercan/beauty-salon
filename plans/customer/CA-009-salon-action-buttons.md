# CA-009 — Salon Detay Action Button'ları (Call / Directions / Share)

**Öncelik:** 🟡 Orta
**Tahmini Efor:** 1-2 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

`SalonDetailScreen`'te 3 action chip var:
1. **"Ara"** (Call) → `onTap: () => {}` — boş
2. **"Yol Tarifi"** (Directions) → `onTap: () => {}` — boş
3. **"Paylaş"** (Share) → `onTap: () => {}` — boş

Her üçü de `url_launcher` ve `share_plus` paketlerini gerektiriyor. Paketler `pubspec.yaml`'da **yok**.

---

## Yapılacaklar

### 1. pubspec.yaml — Paket Ekle

```yaml
dependencies:
  # ... existing
  url_launcher: ^6.3.1
  share_plus: ^9.1.0
```

Sonra: `flutter pub get`

### 2. Salon Detail Screen — Güncelleme

#### `lib/features/salon_detail/presentation/screens/salon_detail_screen.dart`

##### (a) Import ekle
```dart
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
```

##### (b) `_buildActionChip` — güncelle

**"Ara" (Call) button:**
```dart
// ESKİ:
_buildActionChip(Icons.phone, S.of(context).salonCall),

// YENİ:
if (salon.phone != null)
  _buildActionChip(
    Icons.phone,
    S.of(context).salonCall,
    onTap: () => _makePhoneCall(salon.phone!),
  ),
```

**"Yol Tarifi" (Directions) button:**
```dart
// ESKİ:
_buildActionChip(Icons.directions, S.of(context).salonDirections),

// YENİ:
_buildActionChip(
  Icons.directions,
  S.of(context).salonDirections,
  onTap: () => _openDirections(salon),
),
```

**"Paylaş" (Share) button:**

AppBar'daki share icon ve bottom action chip — her ikisini de güncelle:

```dart
// AppBar'daki share button:
_buildCircleButton(
  icon: Icons.share_outlined,
  onTap: () => _shareSalon(salon),
),
```

##### (c) Helper metodlar ekle

```dart
// Telefon arama
Future<void> _makePhoneCall(String phoneNumber) async {
  final uri = Uri.parse('tel:$phoneNumber');
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  } else {
    final s = S.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Telefon arama desteklenmiyor: $phoneNumber')),
    );
  }
}

// Yol tarifi aç
Future<void> _openDirections(SalonDetail salon) async {
  final coordinates = '${salon.latitude ?? 0},${salon.longitude ?? 0}';
  final name = Uri.encodeComponent(salon.name);
  
  // Apple Maps vs Google Maps
  final iosUri = Uri.parse('maps://?q=$coordinates&query=$name');
  final androidUri = Uri.parse('geo:$coordinates?q=$name');
  
  // Platform check
  if (Platform.isIOS) {
    if (await canLaunchUrl(iosUri)) {
      await launchUrl(iosUri, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: Google Maps web
      await _openGoogleMaps(salon);
    }
  } else {
    final googleUri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$coordinates&destination_name=$name',
    );
    if (await canLaunchUrl(googleUri)) {
      await launchUrl(googleUri, mode: LaunchMode.externalApplication);
    } else {
      final s = S.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Yol tarifi açılamadı')),
      );
    }
  }
}

Future<void> _openGoogleMaps(SalonDetail salon) async {
  final coordinates = '${salon.latitude ?? 0},${salon.longitude ?? 0}';
  final name = Uri.encodeComponent(salon.name);
  final uri = Uri.parse(
    'https://www.google.com/maps/dir/?api=1&destination=$coordinates&destination_name=$name',
  );
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

// Salon bilgisi paylaş
Future<void> _shareSalon(SalonDetail salon) async {
  final text = '''${salon.name}
${salon.address}
⭐ ${salon.ratingAvg.toStringAsFixed(1)} ($salon.reviewCount yorum)''';
  
  try {
    await Share.share(text);
  } catch (e) {
    final s = S.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Paylaşım başarısız: $e')),
    );
  }
}
```

### 3. SalonDetail Entity — Latitude/Longitude Ekle

#### `lib/features/salon_detail/domain/entities/salon_detail.dart` → güncelle

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
  final double? latitude;       // ← YENİ
  final double? longitude;      // ← YENİ
  final Map<String, dynamic> workingHours;
  final List<SalonDetailService> services;
  final List<SalonDetailStaff> staff;

  const SalonDetail({
    // ... existing
    this.latitude,
    this.longitude,
    // ...
  });
}
```

#### `lib/features/salon_detail/data/models/salon_detail_model.dart` → güncelle

```dart
class SalonDetailModel {
  // ... existing fields
  
  final double? latitude;
  final double? longitude;

  factory SalonDetailModel.fromJson(Map<String, dynamic> json) => SalonDetailModel(
    // ... existing
    latitude: (json['latitude'] as num?)?.toDouble(),
    longitude: (json['longitude'] as num?)?.toDouble(),
    // ...
  );
}
```

### 4. Strings (opsiyonel)

#### `lib/core/l10n/app_strings.dart` → yoksa ekle
```dart
// Salon detail action errors
String get callFailed     => isEn ? 'Could not make a call' : 'Arama yapılamadı';
String get directionsFailed => isEn ? 'Could not open directions' : 'Yol tarifi açılamadı';
String get shareFailed    => isEn ? 'Sharing failed' : 'Paylaşım başarısız';
```

---

## Test Senaryoları

1. **Ara:** Telefon numarası var → tıkla → telefon uygulaması açılır → numara otomatik dolar
2. **Ara (no phone):** Telefon numarası yok → "Ara" chip gizli
3. **Yol Tarifi (iOS):** Apple Maps açılır
4. **Yol Tarifi (Android):** Google Maps açılır
5. **Yol Tarifi (fallback):** Google Maps web redirect
6. **Paylaş:** Sistem share sheet açılır → salon bilgisi metin olarak paylaşılır
7. **Yol Tarifi (no coords):** Koordinat yok → SnackBar göster
8. **iOS Maps unavailable:** Google Maps web fallback

---

## Dikkat Edilecekler

1. **Platform check:** `Platform.isIOS` ile iOS/Android farklı URI formatları.
2. **Tel URI:** `tel:+905551234567` formatında olmalı. Phone number'da `+` olmalı.
3. **Can launch check:** Her `launchUrl` öncesi `canLaunchUrl` kontrolü.
4. **External application mode:** `LaunchMode.externalApplication` — app'ten çıkış yap.
5. **Latitude/Longitude:** Salon detay response'ında `latitude` ve `longitude` var mı backend'te kontrol et. Eğer yoksa salon model'den gelmeli.
6. **Share text:** Salon bilgisi metin formatı güzel olmalı. URL de eklenebilir (opsiyonel).
