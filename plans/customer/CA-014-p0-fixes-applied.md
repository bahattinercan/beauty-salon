# CA-014 — Customer App P0 Düzeltmeleri (Uygulandı)

**Öncelik:** 🔴 Kritik
**Durum:** ✅ Tamamlandı (2026-07-27)
**Kapsam:** `apps/customer_app/` (Flutter)
**Sonuç:** `flutter analyze` → **No issues found** · `flutter test` → **16/16 passed**

---

## Özet

`customer_app` derlenmiyordu (3 compile error) ve 1 test yanıyordu. Aşağıdaki düzeltmeler uygulandı; kalan işler CA-015 ~ CA-018 planlarında.

---

## Yapılan Değişiklikler

### 1. Parse hatası — `write_review_screen.dart:339`
`SimpleDialog` içindeki `children: [` listesi `)` ile kapanmıştı → `]` yapıldı. Bu hata tüm uygulamayı derlemiyordu.

### 2. Yeni feature: `features/uploads/` (Clean Architecture)
Widget doğrudan `getIt<ApiClient>()` çağırıyor ve Presentation'da `try/catch` vardı (CLAUDE.md k.3 + k.4 ihlali). Katman eklendi:

```
lib/features/uploads/
├── data/
│   ├── datasources/upload_remote_datasource.dart   # @Injectable(as: UploadRemoteDataSource)
│   └── repositories/upload_repository_impl.dart     # @Injectable(as: UploadRepository) → Either<Failure, List<String>>
└── domain/
    ├── repositories/upload_repository.dart          # abstract
    └── usecases/upload_files_usecase.dart           # @injectable, tek call()
```

`write_review_screen._submitReview()` artık `getIt<UploadFilesUseCase>()(...)` + `fold()` kullanıyor.

> **Not:** CA-005 (Avatar Upload) bu `UploadFilesUseCase`'i kullanmalı, `ApiClient.uploadFile()`'ı widget'tan çağırmamalı.

### 3. Kaçırılmış interpolasyon hatası
`Text('Fotoğraf seçilemedi: \$e')` → literal `$e` basıyordu. `failure.message` / `S.of(context).imageUploadError` ile değiştirildi.

### 4. Stale codegen
`salon_model.dart`'e `phone` alanı eklenmiş ama `*.freezed.dart` / `*.g.dart` eskiydi → `dart run build_runner build` ile 51 output yeniden üretildi, `injection.config.dart` güncellendi.

> **Tool quirk:** Bu projedeki build_runner `--delete-conflicting-outputs` flag'ini yok sayıyor ("options have been removed"). CLAUDE.md'de hâlâ yazıyor, zararsız.

### 5. `mounted` + State tipi
- `booking_screen.dart`: `await` sonrası `setState` → `if (!mounted) return;` eklendi, gereksiz `try/finally` kaldırıldı.
- `List<Map<String, dynamic>> _availableSlots` → `List<BookingSlot>` (entity zaten vardı, kullanılmıyordu).

### 6. DI ihlalleri
- `profile_screen.dart:330`: `getIt<AuthRepository>().logout()` → `ref.read(authNotifierProvider.notifier).logout()`
- `core/l10n/locale_provider.dart` + `app/theme/theme_provider.dart`: `const FlutterSecureStorage()` → `getIt<FlutterSecureStorage>()`

### 7. `test/widget_test.dart`
GetIt test'te boş olduğu için `Bad state: AuthRepository not registered`. Fake `AuthRepository` + `getIt.reset()` eklendi; test artık login redirect'ini assert ediyor.

---

## Kalan İşler

| Plan | Konu |
|------|------|
| [CA-015](CA-015-unit-tests-usecases.md) | 15 use case testi eksik |
| [CA-016](CA-016-named-routes.md) | Named route yok, 34 raw path çağrısı |
| [CA-017](CA-017-large-widget-split.md) | 16 dosya 200 satır limiti üzerinde |
| [CA-018](CA-018-presentation-error-handling.md) | Presentation'da try/catch + throw |

---

## Doğrulama

```bash
cd apps/customer_app
dart run build_runner build
flutter analyze          # No issues found
flutter test             # 16/16 passed
```
