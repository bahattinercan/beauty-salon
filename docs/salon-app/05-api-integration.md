# 05 · API Entegrasyonu

Kaynak: `lib/app/environment.dart`, `lib/core/network/{api_client,api_provider,media_url,upload_service}.dart`

---

## 1. Ortam / Base URL Çözümlemesi

```dart
class ApiEnvironment {
  static String get baseUrl {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;

    if (kIsWeb) return 'http://localhost:3000/api/v1';
    if (kDebugMode) return 'http://10.0.2.2:3000/api/v1';   // Android emulator host
    return 'https://api.salonyonetimi.com/api/v1';          // production placeholder
  }

  static String get mediaUrl {
    const override = String.fromEnvironment('MEDIA_BASE_URL');
    if (override.isNotEmpty) return override;
    final base = Uri.parse(baseUrl);
    return '${base.scheme}://${base.authority}';            // origin only, no /api/v1
  }

  static const bool isDebug = kDebugMode;
  static const String appName = 'Salon Yönetimi';
  static const String appVersion = '1.0.0';
}
```

| Koşul | Base URL |
|---|---|
| `--dart-define=API_BASE_URL=...` verilmişse | o değer (en yüksek öncelik) |
| Web (`kIsWeb`) | `http://localhost:3000/api/v1` |
| Debug (Android emulator) | `http://10.0.2.2:3000/api/v1` |
| Release | `https://api.salonyonetimi.com/api/v1` |

**Neden `10.0.2.2`?** Android emulator'da host makinesinin `localhost`'ına erişmek için kullanılan özel adres. Web'te `localhost:3000` gerekir.

---

## 2. Medya URL'leri (`resolveMediaUrl`)

API yüklenen dosyalar için **kök-göreli** yol döner: `/uploads/<uuid>.jpg`. Statik servis `app.use('/uploads', express.static(...))` ile **API origin'inde**, `/api/v1` öneki **olmadan** sunulur. `Image.network` mutlak URL istediği için:

```dart
String resolveMediaUrl(String? url) {
  final value = url?.trim() ?? '';
  if (value.isEmpty) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value; // idempotent
  final origin = ApiEnvironment.mediaUrl;
  return value.startsWith('/') ? '$origin$value' : '$origin/$value';
}
```

**Kural:** görsel gösteren **her** yeni widget `resolveMediaUrl()` kullanmalı; yoksa kırık görsel ikonu çıkar. Kullanıldığı yerler: profil header logosu, galeri/kapak thumbnails.

Test: `test/core/media_url_test.dart` (4 test: kök-göreli, slash'siz, mutlak URL, null/boş).

---

## 3. ApiClient

```dart
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ApiClient {
  late final Dio dio;
  ApiClient({FlutterSecureStorage? storage, Dio? dio}) { ... }
}
```

- `dio` parametresi **testlerde sahte transport enjekte etmek** için; verilmezse gerçek Dio kurulur ve `_AuthInterceptor` eklenir.
- Base options: `baseUrl: ApiEnvironment.baseUrl`, connect/receive timeout 10s, `Content-Type: application/json`.

**Önemli tutarsızlık:** `auth_provider.dart` ve `upload_service.dart` `ApiClient()` ile **yeni instance** üretiyor; `apiClientProvider`'ı kullanmıyor. Sonuç:
- Her çağrıda yeni Dio (connection reuse yok),
- Test override'leri auth/upload'a işlemiyor.

---

## 4. Upload Servisi

```dart
UploadService().uploadImages(List<XFile>) → POST /upload/multiple (multipart, field adı: 'files')
→ response.data['data'] : List<{ url, originalName, size }>
→ List<String> url'ler (boşlar filtrelenir)
```

- Dosyalar `File(file.path).readAsBytes()` ile okunur (web'te `image_picker` XFile path'i destekler).
- Galeri akışı: `ImagePicker().pickMultiImage(limit: 5)` → upload → `updateInfo({ galleryImages: [...existing, ...urls], coverImageUrl: urls.first (if empty) })`.
- Upload endpoint'i `authenticate` gerektirir; `UploadService` `ApiClient()` kullandığı için interceptor Bearer ekler.

---

## 5. Response Sözleşmesi

Başarı:
```json
{ "success": true, "data": <payload>, "timestamp": "ISO" }
```
Sayfalı:
```json
{ "success": true, "data": { "data": [...], "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 } } }
```
Hata:
```json
{ "success": false, "message": "..." }
```

Rate limit: genel **100 istek/dk** (`RATE_LIMIT_MAX`), `/auth/login` & `/auth/register` **10/dk**. 429 cevabı app tarafında `ErrorState`/SnackBar olarak görünür.

---

## 6. Salon App'in Kullandığı Tüm Endpointler

### Auth
| Method | Path | Body | Açıklama |
|---|---|---|---|
| POST | `/auth/login` | `{email, password}` | `data: {user, accessToken, refreshToken}` |
| POST | `/auth/register` | `{fullName, email, password, phone?, role}` | 201 |
| POST | `/auth/refresh` | `{refreshToken}` | interceptor tarafından |
| POST | `/auth/change-password` | `{currentPassword, newPassword}` | auth gerekli |
| POST | `/auth/forgot-password` | `{email}` | — |
| POST | `/auth/reset-password` | `{email, token, newPassword}` | — |

### Salon
| Method | Path | Açıklama |
|---|---|---|
| GET | `/salons/owner/my-salons` | `SALON_OWNER`'a özel; app **ilk** kaydı alır |
| PATCH | `/salons/{id}` | name/address/description/workingHours/galleryImages/coverImageUrl/logoUrl |
| POST | `/salons/{id}/request-email-change` | `{newEmail, verifyVia}` |
| POST | `/salons/{id}/confirm-email-change` | `{token}` |
| POST | `/salons/{id}/request-phone-change` | `{newPhone, verifyVia}` |
| POST | `/salons/{id}/confirm-phone-change` | `{token}` |
| DELETE | `/salons/{id}` | soft delete (`isActive=false`) |

> `PATCH /salons/{id}` **e-posta alanını kabul etmez** — API `email`, `pendingEmail`, `emailChangeToken*` alanlarını body'den çıkarır; e-posta yalnızca OTP akışıyla değişir.

### Randevular
| Method | Path | Query/Body |
|---|---|---|
| GET | `/appointments/salon/{salonId}` | `date` **veya** `from`+`to`, `status` |
| PATCH | `/appointments/{id}/status` | `{status}` |
| PATCH | `/appointments/{id}/cancel` | — |

Response include: `customer {id, fullName, phone, avatarUrl}`, `staff {id, fullName}`, `service {id, name, price, durationMinutes}`. Sıralama: `date ASC, startTime ASC`.

### Ekip (Staff)
| Method | Path | Body |
|---|---|---|
| GET | `/salons/{id}/staff` | — |
| POST | `/salons/{id}/staff` | `{fullName, title?, phone?, email?, serviceIds: []}` |
| PATCH | `/staff/{id}` | partial (ör. `{isActive: false}`) |
| DELETE | `/staff/{id}` | — |

### Hizmetler
| Method | Path | Body |
|---|---|---|
| GET | `/salons/{id}/services` | — |
| POST | `/salons/{id}/services` | `{name, categoryId?, durationMinutes, price, description?}` |
| PATCH | `/services/{id}` | partial |
| DELETE | `/services/{id}` | — |
| GET | `/categories` | kategori listesi (app'de dropdown için) |

### Yorumlar
| Method | Path | Body |
|---|---|---|
| GET | `/reviews/salon/{salonId}?page=&limit=` | sayfalı, `isVisible: true` filtreli, `createdAt DESC` |
| PATCH | `/reviews/{id}/reply` | `{reply}` → modelde `salonReply` + `salonReplyAt` |

### Upload
| Method | Path | Açıklama |
|---|---|---|
| POST | `/upload/multiple` | multipart `files[]` → `[{url, originalName, size}]` |
| POST | `/upload/single` | app şu an kullanmıyor |

---

## 7. Randevu Durum Enum'u

`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` (varsayılan `PENDING`).

UI'daki karşılıklar (`S.statusLabel`): Bekliyor / Onaylı / Tamamlandı / İptal / Gelmedi.
