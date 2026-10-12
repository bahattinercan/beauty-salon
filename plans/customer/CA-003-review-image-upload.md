# CA-003 — Yorum Ekranında Gerçek Image Upload

## Durum: ✅ tamamlandı (2026-10-12)

Plan eskiden `getIt<ApiClient>()` + widget içinde `try/catch` öneriyordu; CA-014 bunu
Clean Architecture'a çevirdi. Eksik kalan kısım **yüklenen image'ın hiçbir yerde
gösterilmemesiydi** — backend'e `images` gönderiliyor ama model parse etmiyordu.

## Uygulanan akış

1. `ImagePickerService` → kullanıcı fotoğraf seçiyor (`photo_picker_row.dart`, preview'lı)
2. `UploadFilesUseCase` → `UploadRepository` → `UploadRemoteDataSource` → `POST /upload/multiple`
3. `CreateReviewUseCase` → `POST /reviews` gövdesinde `images: [url...]`
4. **Yeni:** `ReviewModel.fromJson` ve `SalonReviewModel.fromJson` artık `images` alanını
   parse ediyor (null/boş string'ler filtreleniyor)
5. **Yeni:** `MyReviewsScreen` kartında ve salon detail `ReviewCard`'ında yatay thumbnail şeridi
   (`Image.network` + `errorBuilder` fallback)

## Doğrulama

```bash
cd apps/customer_app
flutter analyze   # No issues found
flutter test      # 186 test, hepsi geçiyor
```

Yeni testler:
- `test/features/reviews/data/models/review_model_test.dart` (4 test)
- `test/features/salon_detail/data/models/salon_review_model_test.dart` (3 test)

## Kalan (opsiyonel)

- Yorum fotoğrafı için lightbox/büyütme ekranı yok
- Backend `POST /upload/multiple` test edilmiyor (bkz. plans/backend/plan-5)
