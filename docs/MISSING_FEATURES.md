# Beauty Salon — Eksik Özellikler & Aksiyon Listesi

> Oluşturulma: 2026-06-14
> Kapsam: `apps/api/` (Node.js/Express), `apps/customer_app/` (Flutter), `apps/salon_app/` (Flutter)
> API Base: `/api/v1`

---

## 1. BACKEND (API) — Eksik Endpoint'ler

### 1.1 Product Endpoint'leri [API-001]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `Product` modeli ve migration var (`apps/api/src/models/Product.js`, `.../migrations/.../create-products.js`) ama controller ve route dosyaları yok.

**Eksik endpoint'ler:**
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/salons/:salonId/products` | public | Salon ürünleri listesi |
| GET | `/products/:id` | public | Ürün detayı |
| POST | `/salons/:salonId/products` | SALON_OWNER | Ürün oluştur |
| PATCH | `/products/:id` | SALON_OWNER | Ürün güncelle |
| DELETE | `/products/:id` | SALON_OWNER | Ürün sil (soft delete) |

**Dosya oluşturulacak:**
- `src/controllers/product.controller.js`
- `src/routes/product.routes.js`
- `src/routes/index.js` → route registration ekle

**Model alanları:** `id`, `salon_id`, `name`, `description`, `price`, `stock_quantity`, `images` (JSONB), `category`, `isActive`

---

### 1.2 Notification Endpoint'leri [API-002]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `Notification` modeli ve migration var ama controller ve route dosyaları yok.

**Eksik endpoint'ler:**
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/notifications` | required | Kullanıcı bildirimleri (sayfalı, okunmamış filtresi) |
| GET | `/notifications/unread-count` | required | Okunmamış bildirim sayısı |
| PATCH | `/notifications/:id/read` | required | Tek bildirimi okundu işaretle |
| PATCH | `/notifications/read-all` | required | Tüm bildirimleri okundu işaretle |

**Dosya oluşturulacak:**
- `src/controllers/notification.controller.js`
- `src/routes/notification.routes.js`
- `src/routes/index.js` → route registration ekle

**Model alanları:** `id`, `user_id`, `title`, `body`, `type` (ENUM: APPOINTMENT/REVIEW/ORDER/SYSTEM), `data` (JSONB), `is_read`

---

### 1.3 Appointment Status Validation [API-003]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `updateStatus` controller'da `validTransitions` object var ama `COMPLETED` ve `CANCELLED` durumları için explicit guard yok.

**Eksik:**
```js
// COMPLETED ve CANCELLED için explicit guard eklenmeli
if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
  return res.status(400).json({ success: false, message: 'Bu randevu üzerinde işlem yapılamaz' });
}
```

**Dosya:** `src/controllers/appointment.controller.js` → `updateStatus` fonksiyonu güncellenecek.

---

### 1.4 Salon List Filter Enhancement [API-004]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `GET /salons` endpoint'inde `search`, `city`, `district`, `minRating`, `sortBy` parametreleri var ama `priceRange` ve `verified` filtreleri eksik.

**Eksik parametreler:**
- `priceRange` — fiyat aralığı filtresi (1-3)
- `verified` — onaylı salon filtresi

**Dosya:** `src/controllers/salon.controller.js` → `getAll` fonksiyonu güncellenecek.

---

### 1.5 OTP Token Security [API-005]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** Password reset ve email/phone change OTP'leri plain text olarak veritabanında saklanıyor.

**Öneri:** OTP'ler de bcrypt ile hash'lenmeli (refresh token'lar gibi).

**Etkilenen dosyalar:**
- `src/controllers/auth.controller.js` → `forgotPassword`, `resetPassword`
- `src/controllers/salon.controller.js` → `requestEmailChange`, `confirmEmailChange`, `requestPhoneChange`, `confirmPhoneChange`

---

### 1.6 Salon Response — Missing Fields [API-006]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `GET /salons/nearby` response'ında `priceRange`, `galleryImages`, `isVerified` alanları eksik olabilir. `GET /salons/:id` response'ında `galleryImages` eksik.

**Öneri:** Tüm salon list/detail endpoint'lerinde `galleryImages` ve `priceRange` döndürülmeli.

**Dosya:** `src/controllers/salon.controller.js` → `getAll`, `getById`, `getNearby` fonksiyonlarında `attributes` listesi güncellenecek.

---

## 2. CUSTOMER APP — Eksik Ekranlar & Özellikler

### 2.1 Şifre Sıfırlama (Forgot/Reset Password) [CA-001]
**Öncelik:** 🔴 Yüksek

**Mevcut durum:** API endpoint'leri mevcut (`/auth/forgot-password`, `/auth/reset-password`). Salon app'te `auth_provider.dart`'da `forgotPassword()` ve `resetPassword()` metodları var. Customer app'te **hiçbir ekran yok**.

**Eksik ekranlar:**
1. `ForgotPasswordScreen` — email input + OTP gönder butonu
2. `ResetPasswordScreen` — email + OTP (6 haneli) + yeni şifre + tekrar şifre

**Login screen'e eklenecek:** "Şifremi unuttum" linki → `ForgotPasswordScreen`

**Dosyalar oluşturulacak:**
- `lib/features/auth/presentation/screens/forgot_password_screen.dart`
- `lib/features/auth/presentation/screens/reset_password_screen.dart`
- `lib/features/auth/data/datasources/auth_remote_datasource.dart` → `forgotPassword()`, `resetPassword()` metodları ekle
- `lib/features/auth/domain/usecases/forgot_password_usecase.dart`
- `lib/features/auth/domain/usecases/reset_password_usecase.dart`
- `lib/features/auth/domain/repositories/auth_repository.dart` → metod imzaları ekle
- `lib/features/auth/data/repositories/auth_repository_impl.dart` → implemente et
- `lib/app/router.dart` → route'lar ekle
- `lib/core/l10n/app_strings.dart` → TR/EN string'ler ekle

**API akışı:**
```
POST /auth/forgot-password → { email } → 6 haneli OTP → Mail gönder
POST /auth/reset-password → { email, token (OTP), newPassword } → Şifre değiştir
```

---

### 2.2 Yakındaki Salonlar (Nearby Search) [CA-002]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API endpoint mevcut (`GET /salons/nearby?latitude=&longitude=&radius=`). `ApiConstants.nearbySalons` var. Ama Flutter tarafında hiç kullanılmıyor. `HomeScreen`'te "Yakınımda" bölümü tüm salonları gösteriyor (rating'e göre sıralı).

**Eksik özellikler:**
1. Konum izni isteme (`geolocator` paketi)
2. Kullanıcının konumunu alıp nearby salonları listeleme
3. Salon kartlarında mesafe gösterimi

**Dosyalar:**
- `lib/features/salon_discovery/data/datasources/nearby_salons_remote_datasource.dart`
- `lib/features/salon_discovery/domain/usecases/get_nearby_salons_usecase.dart`
- `lib/features/salon_discovery/domain/repositories/nearby_salons_repository.dart`
- `lib/features/salon_discovery/data/repositories/nearby_salons_repository_impl.dart`
- `lib/features/salon_discovery/presentation/providers/nearby_salons_provider.dart`
- `HomeScreen` → nearby section güncelle

**Gereken paket:** `geolocator ^10.1.0`, `permission_handler ^11.2.0`

---

### 2.3 Yorum Ekranında Gerçek Image Upload [CA-003]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `WriteReviewScreen`'te `_pickImage()` sadece sahte `'image_X'` string'ler ekliyor. Gerçek `image_picker` paketi yok. `ApiClient.uploadFile()` mevcut ama kullanılmıyor. API'de `POST /reviews` body'sinde `images` array field'ı var.

**Eksik:**
1. `image_picker` paketi ekle
2. Fotoğraf çekme / galeriden seçme
3. `ApiClient.uploadFile()` ile yükleme
4. Yüklenen URL'leri review body'sine ekleme

**Dosyalar:**
- `pubspec.yaml` → `image_picker ^1.0.4` ekle
- `lib/features/reviews/presentation/screens/write_review_screen.dart` → `_pickImage()` ve `_submitReview()` güncelle
- `lib/core/network/api_client.dart` → `uploadFiles()` (multiple) metodu ekle

**API akışı:**
```
POST /upload/multiple → { files: [File1, File2, ...] } → { data: [url1, url2, ...] }
POST /reviews → { appointmentId, rating, comment, images: [url1, url2] }
```

---

### 2.4 Bildirim Ekranı [CA-004]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `ProfileScreen`'te "Bildirimler (3)" menü öğesi var ama `onTap: () => {}` — boş. API endpoint'leri henüz yok ([API-002] bak). Local notification service mevcut (`NotificationService`).

**Eksik:**
1. API endpoint'leri ([API-002])
2. `NotificationEntity` domain entity
3. `NotificationRepository` abstract + impl
4. `GetNotificationsUseCase`, `MarkReadUseCase`
5. `NotificationsScreen` — bildirim listesi
6. `NotificationCard` widget
7. Real-time push notification (FCM) — backend webhook gerekli

**Dosyalar oluşturulacak:**
- `lib/features/notifications/domain/entities/notification.dart`
- `lib/features/notifications/domain/repositories/notification_repository.dart`
- `lib/features/notifications/data/models/notification_model.dart`
- `lib/features/notifications/data/datasources/notification_remote_datasource.dart`
- `lib/features/notifications/data/repositories/notification_repository_impl.dart`
- `lib/features/notifications/domain/usecases/get_notifications_usecase.dart`
- `lib/features/notifications/domain/usecases/mark_read_usecase.dart`
- `lib/features/notifications/presentation/providers/notifications_provider.dart`
- `lib/features/notifications/presentation/screens/notifications_screen.dart`
- `lib/features/notifications/presentation/widgets/notification_card.dart`

---

### 2.5 Avatar Upload [CA-005]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** API `PATCH /users/me` endpoint'i `avatarUrl` field'ını destekliyor. `EditProfileScreen`'te avatar upload butonu var ama "yakında" SnackBar gösteriyor. `ApiClient.uploadFile()` mevcut.

**Eksik:**
1. `image_picker` ile fotoğraf seçme
2. `POST /upload/single` ile yükleme
3. `PATCH /users/me` → `{ avatarUrl: uploadedUrl }`

**Dosyalar:**
- `lib/features/profile/presentation/screens/edit_profile_screen.dart` → avatar upload akışı ekle
- `pubspec.yaml` → `image_picker` ekle (eğer henüz yoksa)

---

### 2.6 Salon Entity — Eksik Alanlar [CA-006]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `Salon` domain entity'de eksik alanlar:
- `phone` — API salon listesinde döndürüyor
- `city` — var ama UI'da kullanımı sınırlı
- `district` — var ama UI'da kullanımı sınırlı
- `coverImageUrl` — var ama UI'da kullanımı sınırlı

**SalonCard widget'ta gösterilecek:**
- `phone` → telefon numarası göster
- `priceRange` → ₺/₺₺/₺₺₺ (zaten `priceRangeLabel` getter var)

---

### 2.7 Salon Discovery — Gelişmiş Filtreler [CA-007]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `DiscoverScreen`'de sadece `search` var. API'de mevcut ama kullanılmayan filtreler:
- `sortBy: 'rating' | 'newest'`
- `minRating`
- `priceRange`
- `verified`

**Eksik UI:**
1. "Sırala" bottom sheet — Rating, En yeni, En eski
2. "Min Rating" slider — 1-5 arası
3. "Fiyat" chip'leri — ₺ / ₺₺ / ₺₺₺

---

### 2.8 Salon Detail — Eksik Bölümler [CA-008]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonDetailScreen`'te eksik alanlar:
1. `galleryImages` — fotoğraf galerisi section (API'de var, Flutter'da yok)
2. `description` — salon açıklaması (API'de var, Flutter'da yok)
3. `priceRange` — fiyat aralığı gösterimi
4. `workingHours` — tüm haftalık çalışma saatleri (şu an sadece bugünün saatleri gösteriliyor)

**Eksik widget'lar:**
- `GalleryGrid` — fotoğraf grid'i
- `WorkingHoursTable` — tüm hafta çalışma saatleri tablosu
- `SalonDescription` — açıklama text'i

---

### 2.9 Salon Detail — Action Button'lar Çalışmıyor [CA-009]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `SalonDetailScreen`'te 3 action chip var:
1. "Call" — `onTap: () => {}` — telefon numarasını aramıyor
2. "Directions" — `onTap: () => {}` — harita açmıyor
3. "Share" — `onTap: () => {}` — paylaşmıyor

**Eksik paketler:**
- `url_launcher ^6.2.0` — telefon arama + harita
- `share_plus ^9.0.0` — salon bilgisi paylaşma

**Dosyalar:**
- `lib/features/salon_detail/presentation/screens/salon_detail_screen.dart` → `_buildActionChip` güncelle

---

### 2.10 Salon Detail — Review Pagination [CA-010]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `GET /reviews/salon/:salonId` endpoint'i pagination destekliyor (`page`, `limit`). `salon_reviews_provider.dart` tüm review'ları tek seferde çekiyor. `ReviewListWidget` tüm review'ları gösteriyor.

**Eksik:**
1. `page` + `limit` parametreleri
2. "Daha fazla yükle" butonu veya infinite scroll
3. Ortalama rating gösterimi (zaten var ama review list'te de gösterilebilir)

---

### 2.11 Salon Detail — Staff Member Details [CA-011]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `StaffListWidget` staff member'ların initials, fullName ve title gösteriyor ama `bio` bilgisi gösterilmiyor.

**Eksik:**
1. Staff member'a tıklandığında bio gösteren bottom sheet veya detail view

---

### 2.12 Salon Detail — "New Salon" Badge Logic [CA-012]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `salon.ratingAvg > 0` ise rating gösteriliyor, yoksa "Yeni" badge gösteriliyor. Bu doğru ama `reviewCount == 0` kontrolü de yapılmalı.

**Öneri:** `salon.ratingAvg == 0 && salon.reviewCount == 0` ise "Yeni" badge göster.

---

### 2.13 Edit Profile — Email Güncelleme [CA-013]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `EditProfileScreen`'te email field var ama read-only (validator var ama API'ye gönderilmiyor). `PATCH /users/me` endpoint'i `email` field'ını desteklemiyor — sadece `fullName`, `phone`, `avatarUrl`.

**Eksik:**
1. API tarafında `PATCH /users/me` → `email` field'ı desteklenmeli (OTP ile)
2. Veya ayrı endpoint: `POST /users/me/request-email-change` + `POST /users/me/confirm-email-change`

---

### 2.14 Booking — "Any Staff" API Call [CA-014]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** "Herhangi bir çalışan" seçildiğinde `_resolveStaffId()` → `null` döndürüyor. `createBooking` body'sinde `staffId` gönderilmiyor. API'de `staffId` optional ama çakışma kontrolü yapılmıyor.

**Öneri:** `staffId` null ise, API'de salon bazlı çakışma kontrolü yapılmalı (mevcut salon çalışanlarının tümünün çakışması kontrol edilmeli).

---

## 3. SALON APP — Eksik Özellikler

### 3.1 Dashboard Gelir Hesabı [SA-001]
**Öncelik:** 🔴 Yüksek

**Mevcut durum:** `DashboardNotifier._fetch()` içinde `monthRevenue = 0` hardcoded. Yorum: `"service price'ı almak için ayrı endpoint gerekiyor, basit tutuyoruz"`.

**Eksik:**
1. COMPLETED randevulardan `service.price` toplanmalı
2. Aylık gelir hesaplama (bu ayın COMPLETED randevuları)

**Dosya:** `lib/features/dashboard/data/dashboard_provider.dart` → `_fetch()` güncelle

**API kullanımı:**
```dart
// GET /appointments/salon/{id}?date={date} → her gün için
// response'da service.price var → COMPLETED olanları topla
```

---

### 3.2 Dashboard — Sequential API Çağrıları [SA-002]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `DashboardNotifier._fetch()` içinde 7 gün için sequential `api.dio.get()` çağrıları.

**Eksik:** `await Future.wait()` ile parallel çağrı yapılmalı.

**Dosya:** `lib/features/dashboard/data/dashboard_provider.dart` → `_fetch()` güncelle

---

### 3.3 Salon Silme (Soft Delete) [SA-003]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API `DELETE /salons/:id` endpoint'i var (`isActive: false`). Salon app'te salon silme özelliği yok.

**Eksik:**
1. `SalonProfileScreen`'te "Salonu Sil" menü öğesi
2. Onay dialog'u
3. `DELETE /salons/{id}` API çağrısı

**Dosyalar:**
- `lib/features/salon/data/salon_provider.dart` → `deleteSalon()` metodu ekle
- `lib/features/profile/presentation/screens/salon_profile_screen.dart` → "Salonu Sil" menü öğesi + dialog

---

### 3.4 Salon Profile — Image Upload [SA-004]
**Öncelik:** 🟡 Orta

**Mevcut durum:** `SalonProfileScreen`'te salon bilgileri düzenlenebiliyor (name, address, description). Ama logo, cover image, gallery upload yok.

**Eksik:**
1. Logo upload — `POST /upload/single` → `PATCH /salons/{id}` → `{ logoUrl }`
2. Cover image upload
3. Gallery image upload — `POST /upload/multiple` → `PATCH /salons/{id}` → `{ galleryImages: [...] }`

**Dosyalar:**
- `pubspec.yaml` → `image_picker` ekle
- `lib/features/salon/data/salon_provider.dart` → image upload metodları
- `lib/features/profile/presentation/screens/salon_profile_screen.dart` → image upload UI

---

### 3.5 Staff Management — Active/Inactive Toggle [SA-005]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `StaffMember` model'de `isActive` field var. API `PATCH /staff/:id` ile güncellenebilir. Ama `StaffManagementScreen`'te toggle yok.

**Eksik:**
1. Her staff member yanında "Aktif/Pasif" toggle
2. `PATCH /staff/{id}` → `{ isActive: false }`

**Dosyalar:**
- `lib/features/staff/data/staff_provider.dart` → `toggleActive(String id)` metodu ekle
- `lib/features/staff/presentation/screens/staff_management_screen.dart` → toggle UI ekle

---

### 3.6 Services Management — Active/Inactive Toggle [SA-006]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonService` model'de `isActive` field var. API `PATCH /services/:id` ile güncellenebilir. Ama `ServiceManagementScreen`'te toggle yok.

**Eksik:**
1. Her hizmet yanında "Aktif/Pasif" toggle

**Dosyalar:**
- `lib/features/services/data/services_provider.dart` → `toggleActive(String id)` metodu ekle
- `lib/features/services/presentation/screens/service_management_screen.dart` → toggle UI ekle

---

### 3.7 Staff Member Details [SA-007]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `StaffMember` model'de `phone`, `email`, `ratingAvg`, `bio`, `title` alanlar var ama `StaffManagementScreen`'de sadece `fullName` ve `serviceName` gösteriliyor.

**Eksik:**
1. Staff member kartlarında phone/email göster
2. Rating göster (varsa)
3. Bio göster

---

### 3.8 Reviews — Pagination [SA-008]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `GET /reviews/salon/:salonId` endpoint'i pagination destekliyor. `ReviewsNotifier` tüm review'ları tek seferde çekiyor.

**Eksik:**
1. `page` + `limit` parametreleri
2. "Daha fazla yükle" butonu veya infinite scroll

**Dosyalar:**
- `lib/features/reviews/data/reviews_provider.dart` → pagination ekle
- `lib/features/reviews/presentation/screens/salon_reviews_screen.dart` → infinite scroll ekle

---

### 3.9 Dashboard — Chart Data [SA-009]
**Öncelik:** ✅ TAMAMLANMIŞ

**Not:** `DashboardScreen`'te `fl_chart` BarChart widget **çalışıyor**. Haftalık randevu grafiği render ediliyor. Bu eksik değildi — düzeltme yapılmış olabilir.

**Ancak:** `DashboardNotifier._fetch()` içinde `monthRevenue = 0` hala hardcoded. SA-001 ile aynı konu.

---

### 3.10 Salon Profile — Verified Badge Logic [SA-010]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonProfileScreen`'te "Verified" badge her zaman gösteriliyor (`isVerified` kontrolü yok).

**Eksik:**
1. `salon.isVerified` kontrolü ekle

**Dosyalar:**
- `SalonInfo` model'e `isVerified` field ekle
- `SalonProfileScreen` → badge conditional göster

---

### 3.11 Salon Profile — Working Hours `isClosed` Toggle [SA-011]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `_WorkingHoursSheet`'te her gün için Switch var ama `isClosed` doğru çalışmıyor. Switch `value: !day.isClosed` — yani switch ON = açık. Bu doğru ama toggle metni "Açık/Kapalı" olarak gösterilmeli.

**Öneri:** Switch altındaki metin "Açık" / "Kapalı" olarak değiştir.

---

### 3.12 Appointments — NO_SHOW / CANCELLED / COMPLETED Filtre Eksik [SA-012]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonAppointmentsScreen`'te sadece "Tümü", "PENDING", "CONFIRMED" filtre chip'leri var.

**Eksik filtreler:**
- `COMPLETED` — tamamlanan randevular
- `CANCELLED` — iptal edilen randevular
- `NO_SHOW` — gelmeyen müşteri

**Dosya:** `lib/features/appointments/presentation/screens/salon_appointments_screen.dart` → filtre chip'leri ekle

---

## 4. ADMIN PANEL — Tamamen Eksik

### 4.1 Admin Flutter Uygulaması [ADMIN-001]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API'de 4 admin endpoint var:
- `GET /admin/dashboard` — stats, recent appointments, reviews
- `GET /admin/salons` — salon listesi (verified filter, pagination)
- `GET /admin/appointments` — tüm randevular (status filter, pagination)
- `GET /admin/reviews` — tüm yorumlar (pagination)

Ama **hiç admin Flutter uygulaması yok**. Seed'de admin kullanıcı var ama kullanamıyor.

**Eksik:** Tam admin Flutter uygulaması. Salon app ile benzer yapıda ama farklı screens.

**Tahmini dosya yapısı:**
```
apps/admin_app/
  lib/
    main.dart
    app/
      router.dart
      theme/
    core/
      network/
      l10n/
    features/
      auth/
        data/
          auth_provider.dart
        presentation/
          screens/
            login_screen.dart
      dashboard/
        data/
          dashboard_provider.dart
        presentation/
          screens/
            admin_dashboard_screen.dart
      salons/
        data/
          salons_provider.dart
        presentation/
          screens/
            admin_salons_screen.dart
      appointments/
        data/
          appointments_provider.dart
        presentation/
          screens/
            admin_appointments_screen.dart
      reviews/
        data/
          reviews_provider.dart
        presentation/
          screens/
            admin_reviews_screen.dart
```

**Not:** Bu büyük bir özellik. Salon app'in kopyasından başlanabilir.

---

## 5. CROSS-CUTTING — Her İki App'te de Eksik

### 5.1 Test Coverage [CROSS-001]
**Öncelik:** 🟡 Orta

**Mevcut durum:** Hiçbir use case, widget, veya repository için test yok.

**Eksik:**
1. Unit tests — use case'ler için (mock repository ile)
2. Widget tests — key screens için
3. Integration tests — critical flows için (login, booking, review)

**Öneri:** `flutter_riverpod_test`, `mocktail`, `flutter_test` paketleri.

---

### 5.2 Error Handling — Consistency [CROSS-002]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** Bazı provider'larda `AsyncValue.guard()` kullanılıyor, bazılarında direkt `throw`. `ApiClient`'de error handling tutarsız.

**Öneri:** Tüm data layer'da `Either<Failure, T>` pattern kullanılmalı (customer app'te var, salon app'te yok).

---

### 5.3 Loading States — Consistency [CROSS-003]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** Bazı ekranlarda shimmer loading var, bazılarında CircularProgressIndicator.

**Öneri:** `shimmer ^2.0.0` paketi ile tüm ekranlerde shimmer loading.

---

## 6. FIELD MISMATCH — API ↔ Flutter Alan Farklılıkları

### 6.1 Review Response — Field Name [FIELD-001]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API `salonReply` field'ı döndürüyor. `SalonReviewModel` (customer app) `ownerReply` olarak parse ediyor:
```dart
reply: json['ownerReply'] as String?,
```

**Ama API'de:**
```js
salonReply: req.body.reply,
```

**Sonuç:** Salon detail'da review owner reply'leri null gösteriliyor.

**Düzeltme:** `SalonReviewModel.fromJson()` → `json['salonReply']` kullan.

---

### 6.2 Salon Nearby Response — Missing Fields [FIELD-002]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `GET /salons/nearby` response'ında `distance` field'ı var ama `SalonModel`'de yok.

**Eksik:** `Salon` entity'ye `distance` field ekle (booking akışında kullanılabilir).

---

### 6.3 Salon Detail — Working Hours Parse [FIELD-003]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonDetailModel`'de `workingHours` parse'ı var ama `Salon` entity'de (discovery) yok.

**Eksik:** `Salon` entity'ye `workingHours` field ekle.

---

## 7. BUG — Field Name Mismatch & Parsing Hataları

### 7.0 Service List — `description` Gösterim Eksik [UI-001]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** API `GET /salons/:salonId/services` response'ında her hizmet için `description` field'ı var. `SalonDetailService` entity ve `ServiceListWidget` description göstermiyor.

**Eksik:** `SalonDetailService` entity'ye `String? description` field ekle + `ServiceListWidget`'da göster.

---

### 7.1 Review Owner Reply Field Name [BUG-001]

### 7.1 Review Owner Reply Field Name [BUG-001]
**Öncelik:** 🔴 Yüksek — **Review owner reply'leri hiç gösterilmiyor**

**Mevcut durum:** API `salonReply` field'ını döndürüyor. `SalonReviewModel` (customer app) `ownerReply` olarak parse ediyor:
```dart
reply: json['ownerReply'] as String?,
```

**Ama API'de (`review.controller.js`):**
```js
salonReply: req.body.reply,
```

**Etkilenen dosya:** `lib/features/salon_detail/data/models/salon_detail_model.dart:116` → `json['ownerReply']` → `json['salonReply']` yap
**Not:** Salon app'te `SalonReview.fromJson()` → `j['salonReply']` kullanıyor — bu doğru ✅

---

### 7.2 Salon Discovery — `phone` Field Eksik [BUG-002]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API `GET /salons` response'ında her salon için `phone` field'ı var. Ama `SalonModel` ve `Salon` entity parse etmiyor.

**Eksik:**
1. `SalonModel` → `phone` parse et
2. `Salon` entity → `String? phone` field ekle
3. `SalonCard` → telefon numarası göster

---

### 7.3 Salon Nearby — `distance` Field Eksik [BUG-003]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** API `GET /salons/nearby` response'ında her salon için `distance` (km) field'ı var. `SalonModel` parse etmiyor.

**Eksik:** `Salon` entity'ye `double? distance` field ekle.

---

### 7.4 Salon Detail — `galleryImages` Parse Eksik [BUG-004]
**Öncelik:** 🟡 Orta

**Mevcut durum:** API `GET /salons/:id` response'ında `galleryImages` (JSON array) var. `SalonDetailModel` parse etmiyor. `SalonDetail` entity'de field yok.

**Eksik:**
1. `SalonDetailModel` → `galleryImages` parse et
2. `SalonDetail` entity → `List<String> galleryImages` field ekle
3. `SalonDetailScreen` → gallery grid widget ekle

---

### 7.5 Salon Detail — `priceRange` Parse Eksik [BUG-005]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** API `GET /salons/:id` response'ında `priceRange` (1-3) var. `SalonDetailModel` parse etmiyor.

**Eksik:**
1. `SalonDetailModel` → `priceRange` parse et
2. `SalonDetail` entity → `int priceRange` field ekle
3. `SalonDetailScreen` → fiyat aralığı göster (₺ / ₺₺ / ₺₺₺)

---

### 7.6 Salon Detail — `description` Parse Eksik [BUG-006]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** API `GET /salons/:id` response'ında `description` (TEXT) var. `SalonDetailModel` parse etmiyor.

**Eksik:**
1. `SalonDetailModel` → `description` parse et
2. `SalonDetail` entity → `String? description` field ekle
3. `SalonDetailScreen` → açıklama widget ekle

---

### 7.7 Salon Detail — `workingHours` Tüm Hafta Gösterim Eksik [BUG-007]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonDetailScreen`'te `salon.todayHours` gösteriliyor (sadece bugünün saatleri). `SalonDetail` entity'de `workingHours` Map var ama sadece bugünün saatleri gösteriliyor.

**Eksik:** Tüm haftalık çalışma saatleri tablosu widget.

---

### 7.8 Salon Info — `isVerified` Parse Eksik [BUG-008]
**Öncelik:** 🟡 Orta

**Mevcut durum:** Salon app `SalonInfo` model'de `isVerified` field yok. API `GET /salons/owner/my-salons` response'ında `isVerified` var. `SalonProfileScreen`'te "Verified" badge her zaman gösteriliyor.

**Eksik:**
1. `SalonInfo` model → `bool isVerified` field ekle
2. `SalonProfileScreen` → badge'i conditional göster

---

### 7.9 Salon App Staff — `phone`/`email` Gösterim Eksik [BUG-009]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `StaffMember` model'de `phone`, `email`, `ratingAvg` alanlar var ama `StaffManagementScreen`'te gösterilmiyor.

---

### 7.10 Salon App — `galleryImages`/`coverImageUrl`/`logoUrl` Gösterim Eksik [BUG-010]
**Öncelik:** 🟢 Düşük

**Mevcut durum:** `SalonInfo` model'de `galleryImages`, `coverImageUrl`, `logoUrl` field'lar yok. API response'ında var. `SalonProfileScreen`'te logo/cover/galeri yok.

---

## Özet Tablo (Güncellenmiş)

| Kategori | Sayı | Öncelik |
|----------|------|---------|
| 🔴 Yüksek | 3 | BUG-001 (salonReply field), CA-001 (Şifre sıfırlama), SA-001 (Dashboard gelir) |
| 🟡 Orta | 14 | API-001/002, BUG-002/004/008, CA-002/003/004/009/013, SA-002/003/004/008, ADMIN-001 |
| 🟢 Düşük | 29 | API-003/004/005/006, BUG-003/005/006/007/009/010, UI-001, CA-005/006/007/008/010/011/012/014, SA-005/006/007/009/010/011/012, CROSS-002/003, FIELD-002/003 |
| ✅ Tamamlanmış | 1 | SA-009 (Dashboard chart — zaten çalışıyor) |
| **Toplam** | **47** | |

---

## Önerilen Uygulama Sırası (Güncellenmiş)

1. **BUG-001** — Review `salonReply` field name fix (1 satır, kritik bug)
2. **CA-001** — Şifre sıfırlama ekranları (kullanıcı deneyimi kritik)
3. **SA-001** — Dashboard gelir hesabı (salon sahibi için temel metrik)
4. **BUG-002** — Salon `phone` field ekle (discovery + card)
5. **BUG-008** — Salon `isVerified` field ekle (salon app)
6. **BUG-004** — Salon `galleryImages` parse + gallery widget
7. **CA-003** — Review image upload (güven artırıcı)
8. **CA-009** — Action button'ları çalıştır (url_launcher + share_plus)
9. **CA-002** — Nearby search (konum özelliği)
10. **CA-004** — Bildirim ekranı + API-002 (backend öncelikli)
11. **API-001** — Product endpoint'leri (salon app'te kullanılacak)
12. **API-002** — Notification endpoint'leri (customer app'te kullanılacak)
13. **CA-005** — Avatar upload
14. **CA-007** — Salon discovery filtreleri
15. **CA-008** — Salon detail eksik bölümler
16. **SA-003** — Salon silme
17. **SA-004** — Salon image upload
18. **SA-012** — Appointments NO_SHOW/CANCELLED/COMPLETED filtreleri
19. **CROSS-001** — Test coverage
