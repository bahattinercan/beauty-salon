# CA-015 — Use Case Unit Testleri (Eksikler)

**Öncelik:** 🟡 Orta
**Durum:** ✅ Uygulandı (2026-07-27) — 18 use case test dosyası, 97 test geçiyor
**Kapsam:** `apps/customer_app/test/`
**Kural:** CLAUDE.md §13.1 — her use case için happy path + her Failure alt tipi + edge case

---

## Özet

18 use case'in sadece **3'ü** testli (`forgot_password`, `reset_password`, `get_nearby_salons`). **15 use case test'siz.** Mevcut testler `mocktail` değil **elle yazılmış fake repository** kullanıyor; `mocktail` `pubspec.yaml`'da yok.

---

## 0. Karar: mocktail mi, fake mi?

**Karar uygulandı:** `mocktail: ^1.0.4` `dev_dependencies`'e eklendi (pub cache'te yalnız 1.0.4 var; `^1.2.1` çözümlenemedi) ve tüm use case testleri mocktail'e çevrildi — eski fake testleri de dahil, tek stil.

> **Tool quirk:** mocktail'de named parametreler `any(named: 'x')` ister; `any()` tek başına named argümanları yakalamaz.
> **Not:** `Review` ve `Salon` gibi `==` tanımlı olmayan entity'lerde `expect(result, Right([x]))` list kimliği üzerinden karşılaştırır; `same(x)` kullanmak daha güvenli.

CLAUDE.md §13.1 `mocktail` diyor ama `pubspec.yaml`'da yok ve mevcut 5 test fake kullanıyor. İki yol:

- **A (önerilen):** `dev_dependencies`'e `mocktail: ^1.2.1` ekle, yeni testleri mocktail ile yaz, CLAUDE.md'yi mevcut fake testlerle uyumlu hale getir.
- **B:** Fake pattern'i koru (dependency ekleme), CLAUDE.md'den mocktail cümlesini çıkar.

Test dosyaları `test/features/<feature>/domain/usecases/<usecase>_test.dart` adlandırılmalı.

---

## 1. Yazılacak Test Dosyaları (15)

| # | Use case | Test dosyası | Öncelik |
|---|----------|--------------|---------|
| 1 | `LoginUseCase` | `test/features/auth/domain/usecases/login_usecase_test.dart` | 🟡 |
| 2 | `RegisterUseCase` | `test/features/auth/domain/usecases/register_usecase_test.dart` | 🟡 |
| 3 | `LogoutUseCase` | `test/features/auth/domain/usecases/logout_usecase_test.dart` | 🟢 |
| 4 | `GetSalonsUseCase` | `test/features/salon_discovery/domain/usecases/get_salons_usecase_test.dart` | 🟡 |
| 5 | `GetSalonDetailUseCase` | `test/features/salon_detail/domain/usecases/get_salon_detail_usecase_test.dart` | 🟡 |
| 6 | `GetSalonReviewsUseCase` | `test/features/salon_detail/domain/usecases/get_salon_reviews_usecase_test.dart` | 🟢 |
| 7 | `GetAvailableSlotsUseCase` | `test/features/booking/domain/usecases/get_available_slots_usecase_test.dart` | 🟡 |
| 8 | `CreateBookingUseCase` | `test/features/booking/domain/usecases/create_booking_usecase_test.dart` | 🟡 |
| 9 | `GetAppointmentsUseCase` | `test/features/appointments/domain/usecases/get_appointments_usecase_test.dart` | 🟡 |
| 10 | `CancelAppointmentUseCase` | `test/features/appointments/domain/usecases/cancel_appointment_usecase_test.dart` | 🟡 |
| 11 | `GetMyReviewsUseCase` | `test/features/reviews/domain/usecases/get_my_reviews_usecase_test.dart` | 🟢 |
| 12 | `CreateReviewUseCase` | `test/features/reviews/domain/usecases/create_review_usecase_test.dart` | 🟡 |
| 13 | `GetFavoriteIdsUseCase` | `test/features/favorites/domain/usecases/get_favorite_ids_usecase_test.dart` | 🟢 |
| 14 | `ToggleFavoriteUseCase` | `test/features/favorites/domain/usecases/toggle_favorite_usecase_test.dart` | 🟢 |
| 15 | `GetProfileUseCase` | `test/features/profile/domain/usecases/get_profile_usecase_test.dart` | 🟢 |
| 16 | `UpdateProfileUseCase` | `test/features/profile/domain/usecases/update_profile_usecase_test.dart` | 🟢 |
| 17 | `UploadFilesUseCase` (CA-014'te eklendi) | `test/features/uploads/domain/usecases/upload_files_usecase_test.dart` | 🟢 |

---

## 2. Her Testte Zorunlu Senaryolar

```
1. Happy path        → Right(expectedEntity)
2. ServerFailure     → Left(ServerFailure)
3. NetworkFailure    → Left(NetworkFailure)
4. UnauthorizedFailure → Left(UnauthorizedFailure)   (auth kullanıyorsa)
5. Edge case         → boş liste / null parametre / default değer
6. Parametre iletimi → captured parametreler (mevcut reset_password testi örnek)
```

Örnek şablon (mevcut `get_nearby_salons_usecase_test.dart` formatı):

```dart
class _FakeXRepository implements XRepository {
  Either<Failure, T>? result;
  @override
  Future<Either<Failure, T>> getX(...) async => result ?? const Right(tData);
  // diğer metotlar: Future.value(const Left(ServerFailure('not implemented')))
}

void main() {
  late _FakeXRepository repository;
  late XUseCase useCase;

  setUp(() {
    repository = _FakeXRepository();
    useCase = XUseCase(repository);
  });

  test('başarılı çağrıda Right döner', () async {
    repository.result = const Right(tData);
    expect(await useCase(...), const Right(tData));
  });

  test('hata durumunda Left(NetworkFailure) döner', () async {
    repository.result = const Left(NetworkFailure());
    expect((await useCase(...)).isLeft(), isTrue);
  });
}
```

---

## 3. Widget Testleri (ikinci aşama)

CLAUDE.md §13.2 — key screen'ler için loading/error/success render testleri. Şu an sadece `forgot_password` + `reset_password` + `widget_test` var. Eksik olanlar (öncelik sırası):

1. `login_screen_test.dart` — boş form validasyonu, hata snackbar'ı
2. `register_screen_test.dart` — şifre eşleşmesi, e-posta validasyonu
3. `salon_detail_screen_test.dart` — AsyncLoading / AsyncError / AsyncData
4. `discover_screen_test.dart` — arama + filtre + boş sonuç
5. `booking_screen_test.dart` — slot yükleme, slot seçimi, submit hatası
6. `salon_card_test.dart` (core widget) — rating/mesafe etiketi render

---

## 4. Dikkat Edilecekler

1. **Domain testleri Flutter importu almamalı** — `flutter_test` sadece `test/` içinde; domain entity testleri pure Dart kalabilir.
2. **GetIt'e dokunma** — use case testlerinde DI kullanılmıyor, constructor injection.
3. `getIt.reset()` gerekiyorsa `setUp`'te yap, `tearDown`'de bırakma (izolasyon).
4. `*.g.dart` / `*.freezed.dart` test edilmez (CLAUDE.md §13.3).
5. `expect(result, const Right(x))` fpdart equality'si entity'nin `==`'sine bağlı — freezed entity'lerde otomatik, plain class'larda `==`/`hashCode` yazılmalı.

---

## Doğrulama

```bash
cd apps/customer_app
flutter test
# hedef: 17 use case test dosyası, hepsi geçiyor
```
