# Beauty Salon — Özellik Durum Raporu (doğrulanmış)

> Oluşturma: 2026-06-14 · **Yeniden doğrulama: 2026-10-12**
> Yöntem: her madde kod üzerinde grep/çalıştırma ile kontrol edildi.
> Kapsam: `apps/api/` (Node/Express), `apps/customer_app/` (Flutter), `apps/salon_app/` (Flutter), `apps/admin_panel/` (Next.js)

Önceki sürüm 47 maddelik bir "eksikler" listesi idi; büyük kısmı uygulanmış.
Aşağıdaki tablo **gerçek** durumu gösteriyor. Kanıt sütunu, doğrulamanın hangi dosyaya/dayandığını söylüyor.

---

## Özet

| Durum | Sayı |
|-------|------|
| ✅ Tamamlandı | 50 |
| ⚠️ Kısmen | 1 |
| ❌ Yapılmadı | 0 |

**Kapandı (2026-10-12):** ADMIN-001, UI-001, salon app provider testleri, 404 fallback testleri.

---

## 1. Backend (API)

| ID | Madde | Durum | Kanıt |
|----|-------|-------|-------|
| API-001 | Product endpoint'leri | ✅ | `src/controllers/product.controller.js` + `product.routes.js`, `tests/product.test.js` |
| API-002 | Notification endpoint'leri | ✅ | `notification.controller.js` (5 handler) + `tests/notification.test.js` |
| API-003 | Appointment status transition guard | ✅ | `validTransitions` + COMPLETED/CANCELLED için "Bu randevu üzerinde işlem yapılamaz" |
| API-004 | Salon list filtreleri | ✅ | `getAll`: search, city, district, categoryId, minRating, priceRange, verified |
| API-005 | OTP token güvenliği | ✅ | `forgotPassword`, `requestEmailChange`, `requestPhoneChange` bcrypt ile hash'liyor |
| API-006 | Salon response alanları | ✅ | `Salon.js`: logoUrl, coverImageUrl, galleryImages (JSON getter), priceRange |

**Not (yeni bulunan bug, düzeltildi):** `Favorite` modelinde `user_id` ve `salon_id` ayrı ayrı `primaryKey` idi → SQLite her kolonu tek başına unique yapıyor, bir kullanıcı yalnızca **1** salon favorileyebiliyordu. `id` PK + `(user_id, salon_id)` unique index'e geçildi; migration: `20240101000012-fix-favorites-primary-key.js`.

---

## 2. Customer App (Flutter)

| ID | Madde | Durum | Kanıt |
|----|-------|-------|-------|
| CA-001 | Şifre sıfırlama akışı | ✅ | forgot/reset ekranları + testler |
| CA-002 | Nearby search | ✅ | `locationProvider`, haversine; backend `/salons/nearby` |
| CA-003 | Review image upload | ✅ | `UploadFilesUseCase` + backend `images`; **2026-10-12**: `ReviewModel`/`SalonReviewModel` artık `images` parse ediyor ve kartlarda thumbnail gösteriliyor |
| CA-004 | Bildirim ekranı | ✅ | `features/notifications` (screen + provider + 6 test) |
| CA-005 | Avatar upload | ✅ | `ImagePickerService` + `avatar_upload_section.dart` |
| CA-006 | Salon entity eksik alanları | ✅ | `Salon` entity: distance, ratingAvg, priceRange vb. |
| CA-007 | Discovery filtreleri | ✅ | server-side `SalonFilter` + `/categories` |
| CA-008 | Salon detail ekstraları | ✅ | `working_hours_section.dart` (haftalık), koordinatlar |
| CA-009 | Action butonları | ✅ | `url_launcher` call/directions + share |
| CA-010 | Review pagination | ✅ | `ReviewPage` + `AsyncNotifier.family` + load-more |
| CA-011 | Staff member details | ✅ | `staff_list_widget.dart` |
| CA-012 | "New Salon" badge | ✅ | `Salon.createdAt` parse ediliyor; `Salon.isNew` (30 gün) → discover kartında "Yeni" rozeti |
| CA-013 | Email change | ✅ | `EmailChangeSection` + 2 use case |
| CA-014 | Booking "Any Staff" | ✅ | Backend `staffId` opsiyonel: hizmeti sunan boş çalışanı atar (yoksa 409). App tarafında "herhangi bir çalışan" için tüm uygun çalışanların saatleri birleştiriliyor (`mergeSlots`) |

---

## 3. Salon App (Flutter)

| ID | Madde | Durum | Kanıt |
|----|-------|-------|-------|
| SA-001 | Dashboard gelir hesabı | ✅ | `dashboard_provider.dart` — aylık gelir, `Future.wait` ile paralel |
| SA-002 | Sequential API çağrıları | ✅ | `Future.wait` (satır 93, 119) |
| SA-003 | Salon soft delete | ✅ | backend `isActive` filtresi |
| SA-004 | Salon profile image upload | ✅ | `core/network/upload_service.dart` + profile ekranında "Fotoğraf ekle" (image_picker → `/upload/multiple`) |
| SA-005 | Staff active/inactive toggle | ✅ | `staff_management_screen.dart` PopupMenu 'toggle' |
| SA-006 | Service active/inactive toggle | ✅ | `service_management_screen.dart` |
| SA-007 | Staff member details | ✅ | phone/email gösterimi + edit formu |
| SA-008 | Reviews pagination | ✅ | `ReviewFeed` (page/limit/total/hasMore) + "Daha fazla göster" butonu |
| SA-009 | Dashboard chart | ✅ | zaten çalışıyordu |
| SA-010 | Verified badge | ✅ | `salon_profile_screen.dart` `isVerified` conditional |
| SA-011 | Working hours `isClosed` toggle | ✅ | satır 815-821 toggle |
| SA-012 | Appointment status filtreleri | ✅ | `_statusFilter` + `refresh(date, status)` |

---

## 4. Admin

| ID | Madde | Durum | Not |
|----|-------|-------|-----|
| ADMIN-001 | Admin uygulaması | ✅ | Kapsam Next.js'e çevrildi: `apps/admin_panel/` (dashboard, users, salons, reviews, categories, settings, appointments). `Sidebar.tsx`'teki eksik `return (` düzeltildi. **API'ye bağlanan ekranlar:** categories (CRUD + serviceCount), settings (yeni `Setting` modeli, GET/PUT `/settings`), appointments (Tamamla/İptal → `PATCH /appointments/:id/status`), salons (verify + soft-delete), users (toggle-active), reviews (visibility). `npm run lint` temiz, `npm run build` 9 route. |

---

## 5. Cross-cutting

| ID | Madde | Durum | Not |
|----|-------|-------|-----|
| CROSS-001 | Test coverage | ✅ | API 272, customer_app 197, salon_app 43 test. salon_app'de artık provider (fake Dio) + state-view widget testleri var. |
| CROSS-002 | Error handling tutarlılığı | ✅ | `errorHandler.js` Sequelize/validator/multer hatalarını tek formatta döndürüyor |
| CROSS-003 | Loading state tutarlılığı | ✅ | `core/widgets/state_view.dart` (iki app): `Skeleton`/`SkeletonList`, `EmptyState`, `ErrorState` (retry), `AsyncStateView<T>` |

---

## 6. Alan/bug listesi

| ID | Madde | Durum | Kanıt |
|----|-------|-------|-------|
| FIELD-001 | Review field name | ✅ | backend `salonReply`, Flutter `salonReply` |
| FIELD-002 | Nearby response alanları | ✅ | `getNearby` distance + salon alanları dönüyor |
| FIELD-003 | Working hours parse | ✅ | `Salon.workingHours` getter JSON parse ediyor (2026-10-12'de çift-stringify bug'ı düzeltildi) |
| UI-001 | Service list description | ✅ | `_ServiceCard` artık description'ı (2 satır, ellipsis) listelemede gösteriyor |
| BUG-001 | salonReply field | ✅ | |
| BUG-002 | Discovery `phone` | ✅ | salon card phone gösteriyor |
| BUG-003 | Nearby `distance` | ✅ | `Salon.distance` |
| BUG-004 | galleryImages parse | ✅ | `SalonDetailModel` parse + `gallery_strip.dart` |
| BUG-005 | priceRange parse | ✅ | `salon_card.dart` |
| BUG-006 | description parse | ✅ | entity'de var |
| BUG-007 | Haftalık çalışma saatleri | ✅ | `WorkingHoursSection` |
| BUG-008 | `isVerified` parse | ✅ | `SalonInfo.isVerified` + conditional badge |
| BUG-009 | Staff phone/email gösterimi | ✅ | staff card satır 181-187 |
| BUG-010 | Salon app gallery/cover/logo | ✅ | `SalonInfo` artık logo/cover/gallery parse ediyor; header logosu + galeri şeridi gösteriliyor |

---

## Sıradaki işler

1. ~~CROSS-003~~ tamamlandı (2026-10-12)
2. ~~UI-001~~ tamamlandı (2026-10-12)
3. ~~Salon app provider testleri~~ tamamlandı (15 test)
4. ~~404 fallback~~ — zaten `app.js`'te JSON 404 dönüyordu; 6 testle doğrulandı

Kalan: yok — seed ve DB sync sorunları kapatıldı (aşağıdaki "Seed & DB sync" bölümü).

### Seed & DB sync (2026-10-13)

- **Seed idempotent hale getirildi** (`src/seeders/seed.js`): her kayıt
  `findOrCreate` ile ekleniyor, aynı seed birden fazla kez çalıştırılabiliyor.
  Önceki versiyon salon varsa erken `return` yapıyordu ve `phone` unique
  constraint'ine çarpıp çöküyordu.
- **Veri onarımı:** `category_id` NULL olan hizmetler yeniden kategorilere
  bağlanıyor, `salon_id` NULL olan yetim hizmetler siliniyor, salon
  `ratingAvg`/`reviewCount` değerleri gerçek yorumlardan hesaplanıyor.
- **`npm run seed:reset`** (`src/seeders/reset.js`): FK sırasına göre tüm
  tabloları temizleyip baştan seed eder.
- **`sync({ alter: true })` kaldırıldı** — SQLite'ta alter, tabloyu
  yeniden oluşturduğu için FK'lerde `SQLITE_CONSTRAINT` hatası veriyor ve
  `*_backup` yetim tabloları bırakıyordu. Artık `sync()` + `ensureColumns()`
  (eksik kolonları `ALTER TABLE ... ADD COLUMN` ile ekliyor) +
  `dropBackupTables()` kullanılıyor.
- Doğrulama: `GET /categories` → serviceCount 5/2/2/2/0/0 (toplam 11 =
  seeded hizmet sayısı).

### Admin panel → API E2E doğrulaması (2026-10-13)

Headless Chrome (CDP, puppeteer yok) ile admin panel gerçekten çalıştırıldı:
login formu, kategori create/toggle/delete, settings PUT, randevu
"Tamamla" aksiyonu — hepsi API'de doğrulandı.

Bu sırada bulunan gerçek bug: **CORS**. `app.js`'teki origin listesi
sabit `3000/3001/8080` idi ve `methods` içinde `PUT` yoktu. Admin panel
başka bir portta çalıştığında tüm istekler `Failed to fetch` ile
 düşüyordu. Artık `ALLOWED_ORIGINS` env'i + development'ta
 `localhost/127.0.0.1:*` kabul ediliyor ve PUT izinli (4 yeni test).

Not: bu makinede 3000 portu başka bir uygulama tarafından kullanılıyor;
API `PORT=3200` ile test edildi. Admin panel için `apps/admin_panel/.env.example`
da `NEXT_PUBLIC_API_URL` değeri yazılı.

"> 2026-10-12: SA-004, SA-008, BUG-010, CA-012, CA-014 kapatıldı; upload endpoint'leri
> (12 test) ve upload middleware hataları düzeltildi. CROSS-003 (loading/empty/error
> durum bileşenleri), UI-001, ADMIN-001 ve salon app provider testleri kapatıldı.
> (API 285 test, customer_app 197 test, salon_app 43 test — hepsi geçiyor).
