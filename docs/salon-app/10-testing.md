# 10 · Test Stratejisi

> Doğrulama: `flutter test` → **84 test, hepsi geçiyor** (2026-10-26 koşum ölçümü; Flutter 3.47.7, ~5 sn). Network erişimi gerekmez.

---

## 10.1 Test Mimarı

Testlerin bel kemiği `test/core/fake_api.dart`:

```dart
class FakeApi {
  final Map<String, Object?> responses;   // path → JSON gövdesi
  final Map<String, int> statusCodes;     // path → status (>=400 ise hata simülasyonu)
  final List<String> requests = [];       // "METHOD path" olarak kaydedilir

  ApiClient client() { ... }              // Dio'ya _FakeInterceptor ekler
  bool called(String method, String path) => requests.contains('$method $path');
}

ProviderContainer makeContainer(FakeApi api) => ProviderContainer(
  overrides: [
    apiClientProvider.overrideWithValue(api.client()),
    authProvider.overrideWith(() => FakeAuthNotifier()),
  ],
);
```

**Neden `apiClientProvider` override çalışıyor?** Veri provider'ları `ref.read(apiClientProvider).dio` kullanıyor. `FakeAuthNotifier` ise `AuthNotifier.build()`'ı override ederek secure storage okumayı atlıyor (auth çağrıları `ApiClient()` ile doğrudan yapıldığı için fake transport'a gitmiyor).

**`settle()` yardımcısı:** `AsyncNotifier` build() futures'ı resolve olana kadar 20ms aralıklarla (max 50 tur) bekler.

**Widget testlerinde `pump()` kullanılır, `pumpAndSettle()` değil** — async provider'lar sonsuz bekleme yarattığı için timeout alır (dosyada yorum olarak not düşülmüş).

---

## 10.2 Test Envanteri (15 dosya / 84 test)

| Dosya | Adet | Ne doğruluyor |
|---|---|---|
| `test/app/theme/app_colors_test.dart` | 16 | Kontrast/token sözleşmesi: AA eşikleri, `AppColors.of(context)` çözümü, ham hex kalmaması |
| `test/core/media_url_test.dart` | 4 | `resolveMediaUrl`: origin tamamlama, slash'siz, idempotent, null/boş |
| `test/core/state_view_test.dart` | 5 | `AsyncStateView` skeleton/error+retry/empty; `EmptyState` aksiyon koşulu |
| `test/features/data/salon_data_providers_test.dart` | 15 | SalonNotifier (parse, PATCH, email-change endpoint, 500 hatası), ServicesNotifier (parse/create/edit-delete), StaffNotifier (parse/create), AppointmentsNotifier (parse/refresh/status/salon yok), DashboardNotifier (chart+gelir, **tek istek**, salon yok) |
| `test/features/salon/salon_info_model_test.dart` | 6 | SalonInfo null toleransı, WorkingDay default/roundtrip, "Kapalı" |
| `test/features/appointments/salon_appointment_model_test.dart` | 3 | Alan tipleri, nested null, price string toleransı |
| `test/features/staff/staff_member_model_test.dart` | 3 | services name/id, isActive false |
| `test/features/services/salon_service_model_test.dart` | 3 | category nested, default 30/0 |
| `test/features/reviews/salon_review_model_test.dart` | 2 | nested customer/service |
| `test/features/reviews/review_feed_test.dart` | 2 | `hasMore` mantığı |
| `test/features/dashboard/dashboard_appointment_model_test.dart` | 2 | nested null, price |
| `test/features/auth/auth_logout_test.dart` | 2 | Çıkış akışı: token temizliği, state sıfırlama |
| `test/features/auth/auth_state_test.dart` | 2 | AuthState initial/alanlar |
| `test/features/dashboard/dashboard_week_boundary_test.dart` | 6 | Hafta sınırı: pazartesi/pazar hesabı, ay geçişi, gelir toplamı |
| `test/widget_test.dart` | 2 | App render, Scaffold var |

> Tablo 15 test dosyasını listeler; satır toplamı 73 statik test bloğudur (`grep "test("` sayımı).
> `flutter test` 2026-10-26 koşumunda **84** test raporluyor — fark, döngü içinde üretilen
> (parametrik) testlerin statik sayımda görünmemesinden gelir.

---

## 10.3 Çalıştırma

```bash
cd apps/salon_app
flutter analyze          # lint (flutter_lints)
flutter test             # tüm testler
flutter test test/features/data/salon_data_providers_test.dart
```

---

## 10.4 Test Boşlukları (bilinen)

- **Auth akışı** gerçek login/register/refresh test edilmiyor (yalnızca `AuthState` saf modeli). Nedeni: auth çağrılarının `apiClientProvider` yerine `ApiClient()` kullanması.
- **`_AuthInterceptor` 401 → refresh → retry** döngüsünün testi yok.
- **Ekran-level widget testleri** yok (form validasyonu, sheet'ler, dialog'lar, takvim etkileşimi).
- **UploadService** testi yok.
- **Router redirect** mantığı (deep link, `isResolving`) test edilmiyor.
- Snapshot/golden test yok.

**Öneri:** auth çağrılarını `apiClientProvider`'a taşıyınca `FakeApi` ile login/refresh testleri yazılabilir hale gelir.
