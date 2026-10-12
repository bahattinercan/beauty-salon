# CA-013 — Email Güncelleme (OTP ile)

**Öncelik:** 🟡 Orta
**Tahmini Efor:** 2-3 saat
**Kapsam:** `apps/customer_app/` (Flutter) + `apps/api/` (Backend)

---

## Özet

`EditProfileScreen`'te email field var ama read-only (API'ye gönderilmiyor). Mevcut `PATCH /users/me` endpoint'i sadece `fullName`, `phone`, `avatarUrl` destekliyor. Email güncelleme için OTP tabanlı iki adımlı akış gerekli:
1. `POST /users/me/request-email-change` → OTP gönder
2. `POST /users/me/confirm-email-change` → OTP doğrula + email güncelle

---

## Backend Tarafı (API-013)

### 1. Controller: `apps/api/src/controllers/user.controller.js` → metodlar ekle

```javascript
// POST /users/me/request-email-change
const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'Yeni e-posta gerekli' });
    }

    // Email format kontrol
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi girin' });
    }

    // Email zaten kullanımda mı?
    const existing = await User.findOne({ where: { email: newEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta adresi zaten kullanımda' });
    }

    // OTP oluştur
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    await req.user.update({
      pendingEmail: newEmail,
      emailChangeToken: otp,
      emailChangeTokenExpiry: expiry,
    });

    // OTP mail gönder (sendEmailChangeOtp fonksiyonu gerekli)
    await sendEmailChangeOtp(req.user.email, req.user.fullName, otp);

    successResponse(res, { message: 'Doğrulama kodu gönderildi' });
  } catch (error) {
    next(error);
  }
};

// POST /users/me/confirm-email-change
const confirmEmailChange = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Doğrulama kodu gerekli' });
    }

    const user = req.user;

    // OTP kontrolü
    if (!user.emailChangeToken) {
      return res.status(400).json({ success: false, message: 'Önce yeni e-posta girin' });
    }

    if (new Date() > user.emailChangeTokenExpiry) {
      await user.update({
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiry: null,
      });
      return res.status(400).json({ success: false, message: 'Kodun süresi dolmuş' });
    }

    if (user.emailChangeToken !== token) {
      return res.status(400).json({ success: false, message: 'Hatalı kod' });
    }

    // Email güncelle
    await user.update({
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpiry: null,
    });

    successResponse(res, { message: 'E-posta başarıyla değiştirildi' });
  } catch (error) {
    next(error);
  }
};

// user.controller exports'a ekle:
module.exports = {
  // ... existing
  requestEmailChange,
  confirmEmailChange,
};
```

### 2. Mailer: `apps/api/src/utils/mailer.js` → fonksiyon ekle

```javascript
const sendEmailChangeOtp = async (toEmail, userName, otp) => {
  const html = `
    <h1>E-posta Değişikliği</h1>
    <p>Merhaba ${userName},</p>
    <p>E-posta adresinizi değiştirmek için doğrulama kodunuz:</p>
    <h2 style="font-size: 32px; letter-spacing: 8px; text-align: center;">${otp}</h2>
    <p>Bu kod 10 dakika geçerlidir.</p>
  `;
  
  await sendMail({
    to: toEmail,
    subject: 'E-posta Değişikliği Doğrulama Kodu',
    html,
  });
};

module.exports = {
  // ... existing
  sendEmailChangeOtp,
};
```

### 3. Route: `apps/api/src/routes/user.routes.js` → ekle

```javascript
router.post('/request-email-change', authenticate, userController.requestEmailChange);
router.post('/confirm-email-change', authenticate, userController.confirmEmailChange);
```

---

## Flutter Tarafı

### 1. Domain Layer

#### `lib/features/profile/domain/usecases/request_email_change_usecase.dart` (YENİ)

```dart
@injectable
class RequestEmailChangeUseCase {
  final UserRepository _repository;
  RequestEmailChangeUseCase(this._repository);

  Future<Either<Failure, Unit>> call(String newEmail) =>
      _repository.requestEmailChange(newEmail);
}
```

#### `lib/features/profile/domain/usecases/confirm_email_change_usecase.dart` (YENİ)

```dart
@injectable
class ConfirmEmailChangeUseCase {
  final UserRepository _repository;
  ConfirmEmailChangeUseCase(this._repository);

  Future<Either<Failure, Unit>> call({
    required String token,
  }) => _repository.confirmEmailChange(token: token);
}
```

#### `lib/features/profile/domain/repositories/user_repository.dart` → metodlar ekle

```dart
Future<Either<Failure, Unit>> requestEmailChange(String newEmail);
Future<Either<Failure, Unit>> confirmEmailChange({required String token});
```

### 2. Data Layer

#### `lib/features/profile/data/datasources/user_remote_datasource.dart` → metodlar ekle

```dart
Future<void> requestEmailChange(String newEmail);
Future<void> confirmEmailChange({required String token});
```

**API çağrıları:**
```dart
@override
Future<void> requestEmailChange(String newEmail) async {
  await _apiClient.post(ApiConstants.requestEmailChange, data: {'newEmail': newEmail});
}

@override
Future<void> confirmEmailChange({required String token}) async {
  await _apiClient.post(ApiConstants.confirmEmailChange, data: {'token': token});
}
```

#### `lib/features/profile/data/repositories/user_repository_impl.dart` → implement et

### 3. Presentation — Ekranlar

#### `lib/features/profile/presentation/screens/edit_profile_screen.dart` → güncelle

**Değişiklikler:**

##### (a) Email field — read-only kaldır

```dart
// ESKİ:
TextFormField(
  initialValue: user?.email ?? '',
  enabled: false,   // ← READ ONLY
  validator: (v) => v?.isEmpty != true ? null : s.emailRequiredField,
)

// YENİ:
TextFormField(
  controller: _emailController,
  initialValue: user?.email ?? '',
  enabled: true,    // ← EDITABLE
  validator: _validateEmail,
)
```

##### (b) Email state alanları ekle

```dart
bool _isRequestingEmailChange = false;
bool _isConfirmingEmailChange = false;
final _emailChangeTokenController = TextEditingController();
bool _emailChangeRequested = false;  // OTP gönderildi mi?
```

##### (c) Email change fonksiyonları ekle

```dart
Future<void> _requestEmailChange() async {
  final s = S.of(context);
  final colors = AppColors.of(context);
  
  // Validate email
  final email = _emailController.text.trim();
  if (email == user?.email) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Mevcut e-posta ile aynı')),
    );
    return;
  }

  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  if (!emailRegex.hasMatch(email)) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(s.emailInvalidField)),
    );
    return;
  }

  setState(() => _isRequestingEmailChange = true);

  final result = await getIt<RequestEmailChangeUseCase>()(email);

  if (!mounted) return;
  setState(() => _isRequestingEmailChange = false);

  result.fold(
    (failure) => ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(failure.message)),
    ),
    (_) {
      setState(() => _emailChangeRequested = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Doğrulama kodu e-posta adresinize gönderildi'),
          backgroundColor: colors.success,
        ),
      );
    },
  );
}

Future<void> _confirmEmailChange() async {
  final s = S.of(context);
  final colors = AppColors.of(context);
  final token = _emailChangeTokenController.text.trim();

  if (token.length != 6) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('6 haneli kod girin')),
    );
    return;
  }

  setState(() => _isConfirmingEmailChange = true);

  final result = await getIt<ConfirmEmailChangeUseCase>()(token: token);

  if (!mounted) return;
  setState(() => _isConfirmingEmailChange = false);

  result.fold(
    (failure) => ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(failure.message)),
    ),
    (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('E-posta başarıyla değiştirildi'),
          backgroundColor: colors.success,
        ),
      );
      // Profile'ı yeniden yükle
      ref.invalidate(userProvider);
    },
  );
}
```

##### (d) Email section UI — güncelle

```dart
// Email field'ın altına ekle:

if (_emailChangeRequested) ...[
  const SizedBox(height: 12),
  Text(
    'Doğrulama kodu gönderildi',
    style: TextStyle(fontSize: 12, color: colors.primary),
  ),
  const SizedBox(height: 8),
  TextFormField(
    controller: _emailChangeTokenController,
    keyboardType: TextInputType.number,
    maxLength: 6,
    decoration: InputDecoration(
      labelText: s.verificationCode,
      hintText: '6 haneli kod',
      counterText: '',
    ),
  ),
  const SizedBox(height: 8),
  SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      onPressed: _isConfirmingEmailChange ? null : _confirmEmailChange,
      child: _isConfirmingEmailChange
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          : Text(s.confirm),
    ),
  ),
] else ...[
  const SizedBox(height: 8),
  SizedBox(
    width: double.infinity,
    child: OutlinedButton(
      onPressed: _isRequestingEmailChange ? null : _requestEmailChange,
      child: _isRequestingEmailChange
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.red),
            )
          : Text('Doğrulama Kodu Gönder'),
    ),
  ),
],
```

### 4. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
// Email change
String get emailChangeRequested => isEn ? 'Verification code sent' : 'Doğrulama kodu gönderildi';
String get emailSameAsCurrent   => isEn ? 'Same as current email' : 'Mevcut e-posta ile aynı';
String get emailChangeConfirm   => isEn ? 'Confirm Email Change'  : 'E-posta Değişikliğini Onayla';
String let verificationCode     => isEn ? 'Verification Code'     : 'Doğrulama Kodu';
```

### 5. API Constants

#### `lib/core/constants/api_constants.dart` → ekle
```dart
static const String requestEmailChange = '/users/me/request-email-change';
static const String confirmEmailChange = '/users/me/confirm-email-change';
```

### 6. DI Registration

#### `lib/core/di/app_module.dart` → ekle
```dart
@lazySingleton
RequestEmailChangeUseCase get requestEmailChangeUseCase => RequestEmailChangeUseCase();

@lazySingleton
ConfirmEmailChangeUseCase get confirmEmailChangeUseCase => ConfirmEmailChangeUseCase();
```

---

## Test Senaryoları

1. **Email değiştirme:** Yeni email gir → "Kod gönder" → OTP gir → email değişir
2. **Aynı email:** Mevcut email ile aynı → "Mevcut e-posta ile aynı"
3. **Invalid email:** Format hatalı → "Geçerli e-posta girin"
4. **Email used:** Email zaten kullanımda → "Bu e-posta zaten kullanımda"
5. **OTP expired:** 10 dk sonra → "Kodun süresi dolmuş"
6. **Wrong OTP:** Hatalı kod → "Hatalı kod"
7. **Success:** Email değişti → profil güncellenir

---

## Dikkat Edilecekler

1. **OTP 6 haneli:** `randomInt(100000, 999999)` — 6 haneli string.
2. **Token expiry:** 10 dakika — backend'te kontrol ediliyor.
3. **pendingEmail:** OTP doğrulanana kadar `pendingEmail`'da saklanır, `email` değişmez.
4. **Profile refresh:** Success sonrası `ref.invalidate(userProvider)` — mevcut user bilgisi güncellenir.
5. **Login session:** Email değiştiğinde JWT token'daki email de değişmeli (backend'te `generateTokens` user.email kullanıyor — sorun yok).

---

## Uygulanan (2026-07-27)

**Backend zaten hazırdı** — `src/controllers/user.controller.js` + `src/routes/user.routes.js` + `sendEmailChangeOtp` mevcut. Plan metnindeki `pendingEmail`/`emailChangeToken` alanları `User` modelinde yok; controller `passwordResetToken` alanını repurpose ediyor ve token formatı `EMAILCHANGE:<hashedOtp>:<base64(newEmail)>`. Bu yüzden Flutter tarafı sadece iki POST'u çağırıyor, backend değişikliği gerekmedi.

**Flutter katmanları:**
- `UserRemoteDataSource`: `requestEmailChange(String)` / `confirmEmailChange({token})`
- `UserRepository` + impl: `Either<Failure, Unit>` (DioException → `ServerFailure`, diğerleri → `NetworkFailure`)
- `RequestEmailChangeUseCase`, `ConfirmEmailChangeUseCase` (`@injectable` — `app_module`'da manuel kayıt gerekmez, build_runner üretiyor)
- `ApiConstants.requestEmailChange` / `confirmEmailChange`

**Presentation:** Plan ekran içi `try/catch` + inline UI öneriyordu; CLAUDE.md §3 (presentation'da try/catch yok) ve CA-017 (screen ≤200 satır) nedeniyle `presentation/widgets/email_change_section.dart` ayrıldı:
- `ConsumerStatefulWidget`; e-posta kontrolü (regex + "mevcut ile aynı"), kod uzunluğu (6 hane), `fold` ile hata gösterimi
- Başarıda `ref.invalidate(userProvider)` + kod alanı sıfırlanır
- `EditProfileScreen` 240 → 173 satır; avatar akışı da `widgets/avatar_upload_section.dart`'a taşındı
- `core/utils/snackbar.dart` helper'ı eklendi (tekrarlanan `ScaffoldMessenger` blokları için)

**Strings:** `emailSameAsCurrent`, `emailChangeHint`, `sendVerificationCode`, `confirmEmailChangeBtn`, `emailChangeSuccess`. Zaten olan `otpLabel`, `otpInvalid`, `codeSent` yeniden kullanıldı.

**Testler (136 test, analyze temiz):**
- `request_email_change_usecase_test.dart`, `confirm_email_change_usecase_test.dart` — Right/Left yolları
- `email_change_section_test.dart` — doğrulama yolları (aynı e-posta, geçersiz format, başlangıçta kod alanı yok)
  - Başarılı akış test edilmedi: widget `getIt<...UseCase>()` çağırıyor, testte DI kaydı yok. Success yolu için DI mock registration gerekir.

**Doğrulanmayan:** `generateTokens` user.email kullanıyor → email değişince eski JWT'de email stale kalır (refresh token ile yenilenir). Sorun değil ama oturum boyunca `/users/me` yanıtı yeni email'i döner.
