# CA-001 — Şifre Sıfırlama (Forgot / Reset Password)

**Öncelik:** 🔴 Yüksek
**Tahmini Efor:** 3-4 saat
**Kapsam:** `apps/customer_app/` (Flutter)

---

## Özet

Backend'de `/auth/forgot-password` ve `/auth/reset-password` endpoint'leri **mevcut ve çalışıyor**. Customer app'te bu endpoint'leri kullanan **hiçbir ekran yok**. Login sayfasında "Şifremi unuttum" linki yok, OTP giriş/çıkış ekranları yok.

---

## Backend Referans (bilgi amaçlı)

```
POST /api/v1/auth/forgot-password
Body: { "email": "user@email.com" }
Response: { success: true, message: "Kod gönderildi" }

POST /api/v1/auth/reset-password
Body: { "email": "user@email.com", "token": "123456", "newPassword": "yeni123" }
Response: { success: true, message: "Şifre sıfırlandı" }
```

OTP 6 haneli, 10 dakika geçerli, plain text olarak `User.passwordResetToken`'da saklanıyor.

---

## Yapılacak Dosyalar

### 1. Domain Layer

#### `lib/features/auth/domain/usecases/forgot_password_usecase.dart`
```dart
@injectable
class ForgotPasswordUseCase {
  final AuthRepository _repository;
  ForgotPasswordUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String email) =>
      _repository.forgotPassword(email);
}
```

#### `lib/features/auth/domain/usecases/reset_password_usecase.dart`
```dart
@injectable
class ResetPasswordUseCase {
  final AuthRepository _repository;
  ResetPasswordUseCase(this._repository);

  Future<Either<Failure, Unit>> call({
    required String email,
    required String token,
    required String newPassword,
  }) => _repository.resetPassword(
        email: email, token: token, newPassword: newPassword,
      );
}
```

#### `lib/features/auth/domain/repositories/auth_repository.dart` → metod imzaları ekle
```dart
Future<Either<Failure, Unit>> forgotPassword(String email);
Future<Either<Failure, Unit>> resetPassword({
  required String email,
  required String token,
  required String newPassword,
});
```

### 2. Data Layer

#### `lib/features/auth/data/datasources/auth_remote_datasource.dart` → metodlar ekle
```dart
Future<void> forgotPassword(String email);
Future<void> resetPassword({
  required String email,
  required String token,
  required String newPassword,
});
```

**API çağrıları:**
```dart
// forgotPassword
await _apiClient.post(ApiConstants.forgotPassword, data: {'email': email});

// resetPassword
await _apiClient.post(ApiConstants.resetPassword, data: {
  'email': email,
  'token': token,
  'newPassword': newPassword,
});
```

#### `lib/features/auth/data/repositories/auth_repository_impl.dart` → implemente et

`AuthRepositoryImpl` implementasyonu ekle. Hataları `ApiFailure`'a map et.

### 3. Presentation — Ekranlar

#### `lib/features/auth/presentation/screens/forgot_password_screen.dart` (YENİ)

**Akış:**
1. Email input field
2. "Kod Gönder" butonu
3. Başarılı → `ResetPasswordScreen`'e git

**UI Yapısı:**
```
┌─────────────────────┐
│  [Logo]             │
│  Şifremi Unuttum    │
│                     │
│  ┌───────────────┐  │
│  │ E-Posta       │  │
│  └───────────────┘  │
│                     │
│  [Kod Gönder]       │
│                     │
│  ← Giriş yap        │
└─────────────────────┘
```

**Validation:**
- Email boş → `emailRequired`
- Email format → `emailInvalid`

#### `lib/features/auth/presentation/screens/reset_password_screen.dart` (YENİ)

**Akış:**
1. Email göster (read-only, forgot'tan gelir)
2. 6 haneli OTP input (PIN input tarzı)
3. Yeni şifre field
4. Yeni şifre tekrar field
5. "Şifreyi Sıfırla" butonu

**UI Yapısı:**
```
┌─────────────────────┐
│  Şifreyi Sıfırla    │
│                     │
│  user@email.com     │
│                     │
│  ┌─┬─┬─┬─┬─┬─┐     │
│  │ │ │ │ │ │ │  ← OTP │
│  └─┘─┘─┘─┘─┘─┘       │
│                     │
│  ┌───────────────┐  │
│  │ Yeni Şifre    │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ Yeni Şifre (T)│  │
│  └───────────────┘  │
│                     │
│  [Şifreyi Sıfırla]  │
│                     │
│  ← Geri             │
└─────────────────────┘
```

**Validation:**
- OTP: 6 haneli olmalı
- Yeni şifre: min 6 karakter
- Şifre tekrar eşleşmiyor → `passwordMismatch`

**OTP Input:** `pin_code_fields` veya 6 adet `TextFormField` (her biri 1 karakter, otomatik next).

### 4. Router

#### `lib/app/router.dart` → route'lar ekle
```dart
GoRoute(
  path: '/forgot-password',
  builder: (context, state) => const ForgotPasswordScreen(),
),
GoRoute(
  path: '/reset-password',
  builder: (context, state) => const ResetPasswordScreen(),
),
```

**Redirect:** Auth gerektirmeyen route'lar (`/login`, `/register`, `/forgot-password`, `/reset-password`) — `isLoggedIn` ise `/home`'a yönlendir.

### 5. Login Screen Güncelleme

#### `lib/features/auth/presentation/screens/login_screen.dart`
- `_buildRegisterLink()`'in üstüne "Şifremi unuttum" linki ekle
- `onTap: () => context.push('/forgot-password')`

### 6. Strings

#### `lib/core/l10n/app_strings.dart` → string'ler ekle

```dart
// Auth — Password Reset
String get forgotPasswordTitle  => isEn ? 'Forgot Password' : 'Şifremi Unuttum';
String get resetPasswordTitle   => isEn ? 'Reset Password'  : 'Şifreyi Sıfırla';
String get sendCode             => isEn ? 'Send Code'       : 'Kod Gönder';
String get enterCode            => isEn ? 'Enter Code'      : 'Kodu Girin';
String get codeSent             => isEn ? 'Code sent to your email' : 'Kod e-posta adresinize gönderildi';
String get codeSentBody         => isEn ? 'We sent a 6-digit code to' : '6 haneli kodu gönderdik';
String get verificationCode     => isEn ? 'Verification Code' : 'Doğrulama Kodu';
String get codeExpired          => isEn ? 'Code expired'    : 'Kodun süresi doldu';
String get resendCode           => isEn ? 'Resend Code'     : 'Kodu Tekrar Gönder';
String get forgotPasswordLink   => isEn ? 'Forgot Password?' : 'Şifremi Unuttum?';
```

### 7. DI Registration

#### `lib/core/di/app_module.dart`
```dart
@module
abstract class AppModule {
  @lazySingleton
  ForgotPasswordUseCase get forgotPasswordUseCase => ForgotPasswordUseCase();
  
  @lazySingleton
  ResetPasswordUseCase get resetPasswordUseCase => ResetPasswordUseCase();
}
```

Sonra `flutter pub run build_runner build` çalıştır.

### 8. Auth Provider Güncelleme

#### `lib/features/auth/presentation/providers/auth_provider.dart`

`AuthNotifier`'a metodlar ekle:
```dart
Future<void> forgotPassword(String email) async {
  state = const AuthLoading();
  final result = await getIt<ForgotPasswordUseCase>()(email);
  state = result.fold(
    (failure) => AuthError(failure.message),
    (_) => const AuthInitial(),
  );
}

Future<void> resetPassword({
  required String email,
  required String token,
  required String newPassword,
}) async {
  state = const AuthLoading();
  final result = await getIt<ResetPasswordUseCase>()(
    email: email, token: token, newPassword: newPassword,
  );
  state = result.fold(
    (failure) => AuthError(failure.message),
    (_) => const AuthInitial(),
  );
}
```

---

## API Constants

#### `lib/core/constants/api_constants.dart` → ekle
```dart
static const String forgotPassword = '/auth/forgot-password';
static const String resetPassword = '/auth/reset-password';
```

---

## Test Senaryoları

1. **Forgot Password — Başarılı:** Email gir → "Kod gönderildi" mesajı → ResetPasswordScreen'e git
2. **Forgot Password — Email yok:** Email yok ama hata dönmemeli (backend güvenlik)
3. **Reset Password — Başarılı:** OTP + yeni şifre → "Şifre sıfırlandı" → Login'e git
4. **Reset Password — Hatalı OTP:** 400 hatası → hata mesajı göster
5. **Reset Password — Süre dolmuş:** 400 hatası → "Kodun süresi doldu"
6. **Reset Password — Şifre eşleşmiyor:** "Şifreler eşleşmiyor"
7. **Reset Password — Min length:** "Şifre en az 6 karakter"
8. **Auth bypass:** Login olmuş kullanıcı `/forgot-password` → `/home`'a yönlendir

---

## Akış Diyagramı

```
LoginScreen ────"Şifremi unuttum"───→ ForgotPasswordScreen
                                                    │
                                            Email gir, "Kod Gönder"
                                                    │
                                   ┌── Başarılı ────┴───→ ResetPasswordScreen
                                   │                              │
                                   │                      OTP + Yeni Şifre
                                   │                              │
                                   │                    ┌── Başarılı ──┴──→ LoginScreen
                                   │                    │
                                   └── Hata ─────────→ SnackBar (hata mesajı)
```

---

## Dikkat Edilecekler

1. **OTP Input UX:** 6 haneli OTP için `pin_code_fields` paketi kullanılabilir veya 6 `TextFormField` manuel. Manuel daha az bağımlılık.
2. **Redirect:** `resetPassword` başarılı olunca `LoginScreen`'e yönlendir.
3. **Error handling:** API hatalarını `ApiFailure` olarak map et. `400` → `ApiFailure.badRequest(message)`.
4. **Backend güvenlik:** Email bulunamazsa bile 200 + "kod gönderildi" mesajı dön (backend zaten böyle).
5. **Token expiry:** OTP 10 dakika geçerli. Hata mesajı TR/EN net olmalı.
