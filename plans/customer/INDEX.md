# Customer App — Plan İndeksi

> `apps/customer_app/` · Flutter · Clean Architecture kuralları: `apps/customer_app/CLAUDE.md`

## Çalışma sırası

| Sıra | Plan | Konu | Öncelik | Efor | Durum |
|------|------|------|---------|------|-------|
| 0 | [CA-014](CA-014-p0-fixes-applied.md) | Compile error + bug düzeltmeleri | 🔴 | — | ✅ Bitti |
| 1 | [CA-018](CA-018-presentation-error-handling.md) | Presentation'da try/catch + throw temizliği | 🟡 | 4-5 sa | ✅ Bitti |
| 2 | [CA-015](CA-015-unit-tests-usecases.md) | 15 use case unit test | 🟡 | 6-8 sa | ✅ Bitti (18 dosya, 97 test) |
| 3 | [CA-016](CA-016-named-routes.md) | Named route refactor (34 çağrı sitesi) | 🟡 | 3-4 sa | ✅ Bitti |
| 4 | [CA-017](CA-017-large-widget-split.md) | 200+ satır widget bölünmesi | 🟢 | 6-8 sa | ✅ Bitti |
| 5 | [CA-019](CA-019-visual-redesign.md) | Görsel yenileme (Booksy referansı, "Seçenek A") | 🟡 | 36-46 sa (5-6 gün) | 📋 Plan hazır |

**Neden bu sıra?** CA-018 önce yapılmalı çünkü `BookingNotifier`, `LocationService`, `ImagePickerService` gibi yeni sınıflar tanımlıyor; CA-015 testleri bu sınıflar üzerine yazılacak, CA-017 aynı dosyaları bölüyor. CA-016 bağımsız, her zaman yapılabilir.

**CA-019 sırası (kendi içinde):** WP0 (görsel boru hattı) ve WP1 (token + `onPrimary` düzeltmesi) her şeyin ön koşulu ve bağımsız. WP2 (onboarding) mevcut ekranlara dokunmadığı için en düşük riskli büyük parça → erken yapılır, WP0+WP1+WP2 sonunda ara onay noktası var. WP0 gereklidir çünkü `seed.js` salonlara `logoUrl`/`coverImageUrl` yazmıyor ve `assets/` boş → fotoğrafsız tasarım "yüklenmemiş" görünür.

---

## Önceki planlar (kod durumu kontrol edildi)

| Plan | Konu | Durum |
|------|------|-------|
| [CA-001](CA-001-forgot-password.md) | Şifre sıfırlama akışı | ✅ uygulandı (screen + test mevcut) |
| [CA-002](CA-002-nearby-search.md) | Nearby search | ✅ uygulandı; konum tek kaynak (`locationProvider`, Home + Discover), Discover mesafeyi `Salon.latitude/longitude` + haversine ile hesaplıyor |
| [CA-003](CA-003-review-image-upload.md) | Review image upload | ✅ uygulandı — `UploadFilesUseCase` + backend `images`; 2026-10-12'de `ReviewModel`/`SalonReviewModel` `images` parse ediyor ve kartlarda thumbnail gösteriliyor |
| [CA-004](CA-004-notifications.md) | Bildirim ekranı | ✅ uygulandı (2026-07-27 — backend zaten hazırdı, Flutter feature sıfırdan yazıldı) |
| [CA-005](CA-005-avatar-upload.md) | Avatar upload | ✅ uygulandı (2026-07-27, `ImagePickerService` + `UploadFilesUseCase` + `avatarUrl` parametresi) |
| [CA-007](CA-007-discovery-filters.md) | Discovery filtreleri | ✅ uygulandı (2026-07-27, server-side: `SalonFilter` + `GET /categories`) |
| [CA-008](CA-008-salon-detail-extras.md) | Salon detail ekstraları | ✅ uygulandı (2026-07-27 — haftalık çalışma saatleri widget'ı + latitude/longitude, Directions koordinat kullanıyor) |
| [CA-009](CA-009-salon-action-buttons.md) | Salon aksiyon butonları | ✅ uygulandı (`url_launcher` call/directions + share) |
| [CA-010](CA-010-review-pagination.md) | Review pagination | ✅ uygulandı (2026-07-27, `ReviewPage` + `AsyncNotifier.family` + load-more) |
| [CA-013](CA-013-email-change.md) | Email change | ✅ uygulandı (2026-07-27 — backend zaten hazırdı, `EmailChangeSection` widget'ı + 2 use case) |

---

## Genel doğrulama

```bash
cd apps/customer_app
dart run build_runner build
flutter analyze    # hedef: No issues found
flutter test       # hedef: tüm testler geçiyor
```

> Not: `--delete-conflicting-outputs` bu build_runner sürümünde yok sayılıyor.
