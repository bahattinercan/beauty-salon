# 04 · Auth, Oturum ve Güvenlik

Kaynak: `lib/features/auth/data/auth_provider.dart`, `lib/core/network/api_client.dart`, `lib/features/auth/presentation/screens/*`

---

## Oturum Durumu Modeli

```dart
class AuthState {
  final bool isLoggedIn;
  final String? salonOwnerId;   // user id
  final String? fullName;
  const AuthState.initial() : isLoggedIn = false, salonOwnerId = null, fullName = null;
}
```

`AuthNotifier.build()` cold start'ta secure storage'ı okur:
`access_token` **ve** `user_id` varsa → `isLoggedIn = true`.

---

## Secure Storage Anahtarları

| Anahtar | Ne zaman yazılır | Ne zaman silinir |
|---|---|---|
| `access_token` | login / register / refresh | logout, refresh başarısızlığı (`deleteAll`) |
| `refresh_token` | login / register / refresh | aynı |
| `user_id` | login / register | logout |
| `user_name` | login / register | logout |
| `app_locale` | dil değişimi | — (logout'ta da silinir: `deleteAll()`) |
| `app_theme` | tema değişimi | — (logout'ta silinir) |

> ⚠️ `logout()` → `_storage.deleteAll()` olduğu için **dil ve tema tercihleri de kaybolur**. Kalıcı tercihler ayrı anahtar namespace'ine alınabilir.

---

## Endpoint Sözleşmesi (API tarafı doğrulanmış)

| App metodu | HTTP | Not |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | `data: { user, accessToken, refreshToken }` |
| `register(fullName, email, password, phone?)` | `POST /auth/register` | body'ye `role: 'SALON_OWNER'` eklenir |
| `changePassword(current, new)` | `POST /auth/change-password` | `authenticate` gerekli |
| `forgotPassword(email)` | `POST /auth/forgot-password` | — |
| `resetPassword(email, token, newPassword)` | `POST /auth/reset-password` | — |
| (interceptor) `refresh` | `POST /auth/refresh` | `data: { accessToken, refreshToken }` |
| `logout()` | — | **API çağrısı yok**, sadece storage temizliği |

**Token ömrü (API varsayılanı):** access `15m` (`JWT_EXPIRATION`), refresh `7d` (`JWT_REFRESH_EXPIRATION`). Refresh token sunucuda bcrypt ile hash'lenir; istemcide düz metin olarak secure storage'da durur.

---

## Rol Kapısı

```dart
if (user['role'] != 'SALON_OWNER') {
  throw Exception('Bu uygulama yalnızca salon sahiplerine özeldir.');
}
```
- Register'da `role: 'SALON_OWNER'` gönderilir.
- API tarafı da ilgili endpointlerde `authorize('SALON_OWNER')` uygular (ör. `/salons/owner/my-salons`, `/appointments/salon/:id`, `/salons/:id/staff` create).

---

## 401 → Refresh → Retry (interceptor)

```dart
onError(err, handler) {
  if (err.response?.statusCode == 401) {
    refreshToken = storage.read('refresh_token');
    if (refreshToken == null) { handler.next(err); return; }

    response = dio.post('/auth/refresh', data: {'refreshToken': refreshToken});
    newAccess = response.data['data']['accessToken'];
    newRefresh = response.data['data']['refreshToken'];
    storage.write(...)

    err.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
    handler.resolve(await dio.fetch(err.requestOptions));   // orijinal isteği tekrar dener
  } else {
    handler.next(err);
  }
}
```

**Edge case:** retry edilen istek de 401 dönerse interceptor tekrar tetiklenir → teorik döngü riski (pratikte refresh yeni token verdiği için sonlanır). Refresh başarısız olursa `deleteAll()` + hata ilerletilir → router `/login`'e yönlendirir.

Timeout: connect 10s, receive 10s.

---

## Login Ekranı Akışı

1. Form validasyonu: e-posta boş değil + `@` içeriyor; şifre ≥ 6 karakter.
2. `ref.listen(authProvider, ...)`: `hasValue && isLoggedIn` → `context.go('/dashboard')`; `hasError` → kırmızı SnackBar.
3. Gradient header (logo ikon, başlık, alt yazı) + form.
4. "Şifremi Unuttum" → iki aşamalı dialog:
   - **Dialog 1:** e-posta → `POST /auth/forgot-password`
   - **Dialog 2:** 6 haneli kod (büyük, letter-spacing'li) + yeni şifre → `POST /auth/reset-password`
5. "Hesabın yok mu? Kayıt Ol" → `/register`.

Register ekranı: ad soyad, e-posta, şifre, şifre tekrar (eşleşme kontrolü `passwordsDoNotMatch`). Telefon alanı **yok** (provider `phone` parametresini destekliyor ama UI göndermiyor).

---

## Profil Ekranındaki Auth ile İlgili İşlemler

| İşlem | Ekran | Endpoint |
|---|---|---|
| Şifre değiştirme | bottom sheet (mevcut/yeni/tekrar) | `POST /auth/change-password` |
| E-posta değiştirme | `_ContactChangeSheet(isEmail: true)` | `POST /salons/{id}/request-email-change` → OTP dialog → `confirm-email-change` |
| Telefon değiştirme | `_ContactChangeSheet(isEmail: false)` | `POST /salons/{id}/request-phone-change` → OTP → `confirm-phone-change` |
| Çıkış | onay dialog'u | storage `deleteAll()` |
| Salon silme | onay dialog'u | `DELETE /salons/{id}` (API soft delete: `isActive=false`) |

**Doğrulama yöntemi seçimi:** E-posta değişikliğinde varsayılan `verifyVia: 'email'`, telefon değişikliğinde `'sms'`. UI, salonun mevcut e-postası/telefonu varsa ilgili seçeneği gösterir (radio list). OTP kodu **mevcut** adrese mi yeni adrese mi gittiği API tarafında belirlenir; UI mesajı `otpSentToEmail(salon.email)` / `otpSentToPhone(salon.phone)` ile **mevcat** değeri gösterir — bu bir UX belirsizliğidir (bkz. [12-gaps-risks.md](12-gaps-risks.md)).

---

## Güvenlik Değerlendirmesi

**İyi:**
- Token'lar `flutter_secure_storage` (Android keystore / iOS keychain) içinde.
- Rol kontrolü hem istemcide hem API'de.
- Refresh token'ın başarısızlığında tüm oturumun düşürülmesi.
- Şifre değişikliğinde mevcut şifre isteniyor.

**İyileştirilebilir:**
- `logout()` sunucuya `/auth/logout` çağırmıyor → refresh token DB'de kalır (client-side only logout).
- Auth çağrıları `apiClientProvider` yerine `ApiClient()` ile yapılıyor → test edilebilirlik ve connection reuse kaybı.
- OTP dialog'unda kod denemesi sayısı/rate limit göstergesi yok.
- 401 döngü koruması (retry sayacı) yok.
