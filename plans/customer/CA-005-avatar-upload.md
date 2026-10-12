# CA-005 — Avatar Upload

**Öncelik:** 🟢 Düşük
**Tahmini Efor:** 1-2 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

`EditProfileScreen`'te avatar upload butonu var ama "yakında" SnackBar gösteriyor. `image_picker` paketi zaten `pubspec.yaml`'da. API `PATCH /users/me` endpoint'i `avatarUrl` field'ını destekliyor. `ApiClient.uploadFile()` mevcut.

---

## Backend Referans

```
POST /api/v1/upload/single
Body: FormData { file: File }
Response: { success: true, data: { url: "https://cdn.../avatar.jpg" } }

PATCH /api/v1/users/me
Body: { avatarUrl: "https://cdn.../avatar.jpg" }
Response: { success: true, data: { ... } }
```

---

## Yapılacak Değişiklikler

### 1. Edit Profile Screen — Güncelleme

#### `lib/features/profile/presentation/screens/edit_profile_screen.dart`

##### (a) Import ekle
```dart
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
```

##### (b) State field'ı ekle

```dart
// Mevcut state'e ekle:
File? _avatarFile;
bool _isUploadingAvatar = false;
```

##### (c) Avatar pick fonksiyonu ekle

```dart
Future<void> _pickAvatar() async {
  final picker = ImagePicker();
  
  final XFile? picked = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 512,      // avatar için küçük
    maxHeight: 512,
    imageQuality: 90,
  );

  if (picked != null && mounted) {
    setState(() => _avatarFile = File(picked.path));
    await _uploadAvatar();
  }
}

Future<void> _uploadAvatar() async {
  if (_avatarFile == null) return;
  
  final s = S.of(context);
  final colors = AppColors.of(context);
  setState(() => _isUploadingAvatar = true);

  try {
    // 1. Upload file
    final response = await getIt<ApiClient>().uploadFile(
      ApiConstants.uploadSingle,
      _avatarFile!.path,
    );

    final avatarUrl = (response.data['data'] as Map<String, dynamic>?)?['url'] as String?;
    if (avatarUrl == null) throw Exception('Avatar URL could not be extracted');

    // 2. Update profile with avatarUrl
    final result = await getIt<UpdateProfileUseCase>()(
      avatarUrl: avatarUrl,
    );

    if (!mounted) return;
    setState(() => _isUploadingAvatar = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${s.editProfileError}: ${failure.message}')),
      ),
      (_) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(s.editProfileSaved),
          backgroundColor: colors.success,
        ),
      ),
    );
  } catch (e) {
    if (mounted) {
      setState(() => _isUploadingAvatar = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${s.editProfileError}: $e')),
      );
    }
  }
}
```

##### (d) Avatar UI — güncelle

**ESKİ (yakında SnackBar):**
```dart
onTap: () {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(S.of(context).editProfilePhotoSoon)),
  );
},
```

**YENİ (gerçek upload):**
```dart
onTap: _isUploadingAvatar ? null : _pickAvatar,
```

##### (e) Avatar preview — güncelle

Eğer avatar field varsa (profil sayfasında veya edit'te), `_avatarFile` varsa onu göster:

```dart
// Avatar gösterimi
Container(
  width: 86,
  height: 86,
  decoration: BoxDecoration(
    shape: BoxShape.circle,
    color: Colors.white.withValues(alpha: 0.2),
    border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 2.5),
    image: _avatarFile != null
        ? DecorationImage(image: FileImage(_avatarFile!), fit: BoxFit.cover)
        : user?.avatarUrl != null
            ? DecorationImage(image: NetworkImage(user!.avatarUrl!), fit: BoxFit.cover)
            : null,
  ),
  child: _avatarFile == null && user?.avatarUrl == null
      ? Center(
          child: Text(
            user?.initials ?? '?',
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
          ),
        )
      : null,
),
```

### 2. Update Profile UseCase — Güncelleme

#### `lib/features/profile/domain/usecases/update_profile_usecase.dart` → güncelle

```dart
Future<Either<Failure, Unit>> call({
  String? fullName,
  String? phone,
  String? avatarUrl,   // ← YENİ param
}) => _repository.updateProfile(
  fullName: fullName,
  phone: phone,
  avatarUrl: avatarUrl,
);
```

#### `lib/features/profile/domain/repositories/user_repository.dart` → güncelle

```dart
Future<Either<Failure, Unit>> updateProfile({
  String? fullName,
  String? phone,
  String? avatarUrl,
});
```

#### `lib/features/profile/data/datasources/user_remote_datasource.dart` → güncelle

```dart
Future<void> updateProfile({
  String? fullName,
  String? phone,
  String? avatarUrl,
}) async {
  final data = <String, dynamic>{};
  if (fullName != null) data['fullName'] = fullName;
  if (phone != null) data['phone'] = phone;
  if (avatarUrl != null) data['avatarUrl'] = avatarUrl;
  
  await _apiClient.patch(ApiConstants.updateProfile, data: data);
}
```

#### `lib/features/profile/data/repositories/user_repository_impl.dart` → güncelle

Implement güncelle.

### 3. API Constants

#### `lib/core/constants/api_constants.dart` → kontrol et

```dart
static const String uploadSingle = '/upload/single';
static const String updateProfile = '/users/me';  // zaten var olmalı
```

### 4. Strings

#### `lib/core/l10n/app_strings.dart` → yoksa ekle
```dart
String get changeAvatar   => isEn ? 'Change Avatar' : 'Avatar Değiştir';
String get avatarUploading => isEn ? 'Uploading avatar...' : 'Avatar yükleniyor...';
```

---

## Test Senaryoları

1. **Avatar seç:** Galeri açılır → fotoğraf seç → upload → profil güncellenir
2. **Upload success:** "Profil güncellendi" SnackBar (yeşil)
3. **Upload error:** "Bir hata oluştu" SnackBar (kırmızı)
4. **Loading state:** Upload sırasında avatar üzerinde loading spinner
5. **Preview:** Seçilen fotoğraf anında preview'da görünür
6. **No avatar:** Avatar yoksa initials göster
7. **Existing avatar:** Mevcut avatar varsa göster, değiştirilebilir

---

## Dikkat Edilecekler

1. **Two-step process:** Önce upload → sonra profile update. Hata handling iki adımda da olmalı.
2. **Image quality:** `imageQuality: 90`, `maxWidth: 512` — avatar için yeterli.
3. **Async state:** `_isUploadingAvatar` ile loading state göster.
4. **File path:** `XFile.path` → `File` oluştur.
5. **Profile refresh:** Upload sonrası `userProvider` invalidate et (veya `getIt` çağrısı sonrası auto-refresh).

---

## Uygulanan (2026-07-27)

Plan metnindeki widget içi `getIt<ApiClient>().uploadFile()` + `try/catch` kullanılmadı — CLAUDE.md §3: presentation'da `try/catch` yok ve network katmanı use case üzerinden çağrılır.

**Uygulanan akış (presentation'da yalnızca `fold`):**
1. `ImagePickerService.pickImage(ImageSource.gallery, maxSize: 512, quality: 90)` → `Either<Failure, File>`
   - `pickImage`'e `maxSize`/`quality` parametreleri eklendi (varsayılanlar 1920/85, review akışı aynı servisi kullanıyor).
2. `UploadFilesUseCase([file.path])` → `Either<Failure, List<String>>`
3. `ref.read(userProvider.notifier).updateProfile(avatarUrl: url)` → `Either<Failure, UserProfile>`

**Katman güncellemeleri:** `UserRepository` / `UserRepositoryImpl` / `UserRemoteDataSource` / `UpdateProfileUseCase` / `UserNotifier.updateProfile` — hepsine opsiyonel `avatarUrl` eklendi (datasource `?avatarUrl` conditional map entry kullanıyor).

**AvatarPicker:** artık `initials` dışında `avatarUrl`, `pickedFile`, `uploading`, `onTap` alıyor. Kamera rozeti gerçek `onTap`'e bağlı; yükleme sırasında spinner; kamera rozeti `Semantics(label: changeAvatar, button: true)` ile sarıldı.

**EditProfileScreen:** `_avatarFile` + `_isUploadingAvatar` state'i, `_pickAvatar()` iki adımlı akış, `_showSnackBar` helper'ı. `editProfilePhotoSoon` string'i artık kullanılmadığı için kaldırıldı; `changeAvatar` ve `avatarUploading` eklendi.

**Testler (127 test, analyze temiz):**
- `update_profile_usecase_test.dart` — `avatarUrl` yalnızca avatar günceller.
- `avatar_picker_test.dart` — initials gösterimi, yükleme sırasında spinner + buton devre dışı, tap çağrısı.
  - Image yükleme testleri yazılmadı: `flutter_test` HTTP'i 400 döndürüyor ve `FileImage`/`NetworkImage` codec çözümü testte hata fırlatıyor. Bu yol fake HTTP client olmadan widget testinde doğrulanamaz.
