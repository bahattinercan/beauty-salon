# CA-003 — Yorum Ekranında Gerçek Image Upload

**Öncelik:** 🟡 Orta
**Tahmini Efor:** 2-3 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

`WriteReviewScreen`'te `_pickImage()` sadece sahte `'image_X'` string'ler ekliyor. `image_picker` paketi zaten `pubspec.yaml`'da ama kullanılmıyor. `ApiClient.uploadFile()` mevcut ama `multiple` dosya yükleme desteği yok. API `POST /reviews` body'sinde `images` array field'ı destekliyor.

---

## Backend Referans

```
POST /api/v1/upload/multiple
Body: FormData { files: [File1, File2, ...] }
Response:
{
  success: true,
  data: [
    { url: "https://cdn.../image1.jpg" },
    { url: "https://cdn.../image2.jpg" }
  ]
}

POST /api/v1/reviews
Body: {
  appointmentId: "...",
  rating: 5,
  comment: "Harika!",
  images: ["https://cdn.../image1.jpg", "https://cdn.../image2.jpg"]
}
```

---

## Yapılacak Değişiklikler

### 1. ApiClient — Multiple Upload

#### `lib/core/network/api_client.dart` → güncelle

Mevcut `uploadFile()` metodunun yanına `uploadFiles()` ekle:

```dart
// Single file upload (mevcut)
Future<Response> uploadFile(String path, String filePath, {String fieldName = 'file'}) {
  final formData = FormData.fromMap({
    fieldName: MultipartFile.fromFileSync(filePath),
  });
  return _dio.post(path, data: formData);
}

// Multiple files upload (YENİ)
Future<List<String>> uploadFiles(String path, List<String> filePaths, {String fieldName = 'files'}) async {
  final formData = FormData();
  for (final path in filePaths) {
    formData.addFieldList(fieldName, [
      {'name': fieldName, 'value': await MultipartFile.fromFile(path)},
    ]);
  }
  final response = await _dio.post(path, data: formData);
  final data = (response.data['data'] as List?) ?? [];
  return data
      .map((item) => (item as Map<String, dynamic>)['url']?.toString() ?? '')
      .where((url) => url.isNotEmpty)
      .toList();
}
```

**Not:** Dio `FormData` üzerinde `files` field'ı için array syntax'ı farklı. Alternatif:
```dart
Future<List<String>> uploadFiles(String path, List<String> filePaths) async {
  final formData = FormData();
  formData.files.addAll(filePaths.map((fp) => MapEntry(
    'files',
    MultipartFile.fromFileSync(fp),
  )));
  final response = await _dio.post(path, data: formData);
  final data = (response.data['data'] as List?) ?? [];
  return data
      .map((item) => (item as Map<String, dynamic>)['url']?.toString() ?? '')
      .where((url) => url.isNotEmpty)
      .toList();
}
```

### 2. Write Review Screen — Güncelleme

#### `lib/features/reviews/presentation/screens/write_review_screen.dart` → güncelle

**Değişiklikler:**

##### (a) Import ekle
```dart
import 'package:image_picker/image_picker.dart';
import 'dart:io';
```

##### (b) State field'ı değiştir
```dart
// ESKİ:
final List<String> _selectedImages = [];

// YENİ:
final List<File> _selectedImages = [];
```

##### (c) `_pickImage()` — TAMAMEN DEĞİŞTİR

```dart
Future<void> _pickImage(S s) async {
  if (_selectedImages.length >= 4) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(s.reviewMaxPhotos)),
    );
    return;
  }

  final picker = ImagePicker();
  
  // Bottom sheet: Camera or Gallery
  final imageSource = await showDialog<ImageSource>(
    context: context,
    builder: (ctx) => SimpleDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      children: [
        SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, ImageSource.camera),
          child: Row(
            children: [
              Icon(Icons.camera_alt, color: colors.primary),
              const SizedBox(width: 12),
              Text('📷 ${s.reviewCamera}', style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
        SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, ImageSource.gallery),
          child: Row(
            children: [
              Icon(Icons.photo_library, color: colors.primary),
              const SizedBox(width: 12),
              Text('🖼️ ${s.reviewGallery}', style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
      ],
    ),
  );

  if (imageSource == null) return;

  try {
    final XFile? picked = await picker.pickImage(
      source: imageSource,
      maxWidth: 1920,       // max 2MP (kalite için)
      maxHeight: 1920,
      imageQuality: 85,     // %85 kalite (küçük dosya)
    );

    if (picked != null && mounted) {
      setState(() => _selectedImages.add(File(picked.path)));
    }
  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fotoğraf seçilemedi: $e')),
      );
    }
  }
}
```

##### (d) `_submitReview()` — güncelle

```dart
Future<void> _submitReview() async {
  final s = S.of(context);
  final colors = AppColors.of(context);
  setState(() => _isSubmitting = true);

  // Upload images first
  List<String> imageUrls = [];
  if (_selectedImages.isNotEmpty) {
    try {
      final filePaths = _selectedImages.map((f) => f.path).toList();
      imageUrls = await getIt<ApiClient>().uploadFiles(
        ApiConstants.uploadMultiple,
        filePaths,
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fotoğraflar yüklenemedi: $e')),
        );
      }
      return;
    }
  }

  // Submit review with images
  final result = await getIt<CreateReviewUseCase>()(
    appointmentId: widget.appointmentId,
    rating: _rating,
    comment: _commentController.text.trim().isEmpty
        ? null
        : _commentController.text.trim(),
    images: imageUrls.isNotEmpty ? imageUrls : null,  // ← YENİ PARAM
  );

  // ... existing success/error handling
}
```

##### (e) Image Preview — güncelle

```dart
// ESKİ: Icon placeholder
Container(
  width: 80,
  height: 80,
  decoration: BoxDecoration(
    color: colors.secondary,
    borderRadius: BorderRadius.circular(12),
  ),
  child: Icon(Icons.image, color: colors.primary),
),

// YENİ: Gerçek fotoğraf
Stack(
  children: [
    ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.file(
        _selectedImages[index],
        width: 80,
        height: 80,
        fit: BoxFit.cover,
      ),
    ),
    // Remove button (existing)
    Positioned(
      top: -4,
      right: -4,
      child: GestureDetector(
        onTap: () => setState(() => _selectedImages.removeAt(index)),
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: colors.error,
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.close, size: 12, color: Colors.white),
        ),
      ),
    ),
  ],
),
```

### 3. Domain — UseCase Güncelleme

#### `lib/features/reviews/domain/usecases/create_review_usecase.dart` → güncelle

```dart
@injectable
class CreateReviewUseCase {
  final ReviewsRepository _repository;
  CreateReviewUseCase(this._repository);

  Future<Either<Failure, Unit>> call({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,    // ← YENİ
  }) => _repository.createReview(
        appointmentId: appointmentId,
        rating: rating,
        comment: comment,
        images: images,
      );
}
```

#### `lib/features/reviews/domain/repositories/reviews_repository.dart` → güncelle

```dart
Future<Either<Failure, Unit>> createReview({
  required String appointmentId,
  required int rating,
  String? comment,
  List<String>? images,
});
```

#### `lib/features/reviews/data/datasources/reviews_remote_datasource.dart` → güncelle

```dart
Future<void> createReview({
  required String appointmentId,
  required int rating,
  String? comment,
  List<String>? images,
}) async {
  await _apiClient.post(ApiConstants.createReview, data: {
    'appointmentId': appointmentId,
    'rating': rating,
    if (comment != null) 'comment': comment,
    if (images != null && images.isNotEmpty) 'images': images,
  });
}
```

#### `lib/features/reviews/data/repositories/reviews_repository_impl.dart` → güncelle

Implement güncelle.

### 4. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
String get reviewCamera     => isEn ? 'Camera'          : 'Kamera';
String get reviewGallery    => isEn ? 'Gallery'         : 'Galeri';
String get imageUploadError => isEn ? 'Could not upload image' : 'Fotoğraf yüklenemedi';
```

---

## Test Senaryoları

1. **Kamera:** "Kamera" seç → kamera açılır → fotoğraf çek → preview göster
2. **Galeri:** "Galeri" seç → galeri açılır → fotoğraf seç → preview göster
3. **Upload:** 2 fotoğraf seç → submit → upload → review creation
4. **Max 4:** 4 fotoğraf seçiliyken 5. eklemeye çalış → SnackBar
5. **Upload error:** Fotoğraf yüklenemezse → hata mesajı, review gönderilmez
6. **No images:** Fotoğraf olmadan review gönder → başarılı
7. **Remove image:** Fotoğraf kartındaki X → fotoğraf silinir

---

## Dikkat Edilecekler

1. **Image quality:** `imageQuality: 85` ve `maxWidth: 1920` — büyük dosya sorunlarını önler.
2. **Upload error handling:** Upload başarısız olursa review gönderilmez. Kullanıcıya göster.
3. **File path:** `XFile.path` → `File` oluştur. Platformlar arası uyumluluk.
4. **iOS permission:** `Info.plist`'de `NSPhotoLibraryUsageDescription` ve `NSCameraUsageDescription` var olmalı.
5. **Android permission:** `AndroidManifest.xml`'de `CAMERA` ve `READ_EXTERNAL_STORAGE` var olmalı.
6. **Memory:** 4 fotoğraf × ~500KB = ~2MB — sorun yok.
