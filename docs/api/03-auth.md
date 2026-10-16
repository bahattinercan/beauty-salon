# 03 — Kimlik doğrulama ve yetkilendirme

## Token üretimi (`controllers/auth.controller.js`)

```js
const payload = { sub: user.id, email: user.email, role: user.role };
accessToken  = jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRATION || '15m' });
refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION || '7d' });
```

Refresh token veritabanına **bcrypt (cost 12) hash'li** yazılır (`users.refresh_token`). Böylece aynı refresh token'ın ikinci kez kullanılması engellenir: her `refresh` çağrısında yeni çift üretilir ve eski hash değiştirilir.

Canlı decode örneği:

```json
{ "sub": "a057faf1-...", "email": "admin@beautysalon.com", "role": "ADMIN",
  "iat": 1792102885, "exp": 1792103785 }
```

## `authenticate` (`middlewares/auth.js`)

1. `Authorization: Bearer <token>` yoksa → **401** `Erişim için giriş yapmanız gerekiyor`
2. `jwt.verify(token, JWT_SECRET)`
   - `TokenExpiredError` → 401 `Oturum süresi dolmuş, lütfen tekrar giriş yapın`
   - `JsonWebTokenError` → 401 `Geçersiz token`
3. `User.findByPk(decoded.sub)` — yalnız `id, email, fullName, role, isActive, isVerified` alanları çekilir
4. Kullanıcı yoksa veya `isActive === false` → 401 `Geçersiz veya devre dışı hesap`
5. `req.user = user`

> `req.user` içinde `passwordHash` **yoktur**. Şifre karşılaştırması gereken controller'lar (ör. `change-password`) güncel kullanıcıyı `User.findByPk(req.user.id)` ile yeniden çeker.

## `optionalAuth`

Token varsa doğrular, yoksa/bozuksa sessizce devam eder. `salon.routes.js`'te import ediliyor ama **hiçbir route'ta kullanılmıyor**.

## `authorize(...roles)`

- `req.user` yoksa → 401
- Rol listede yoksa → **403** `Bu işlem için yetkiniz bulunmuyor`

Rol bazlı erişim testleri (`tests/user.test.js`) admin endpoint'lerinin SALON_OWNER/CUSTOMER'a kapalı olduğunu doğrular.

## Roller

| Rol | Endpoint'ler |
|---|---|
| `CUSTOMER` | randevu, yorum, favori, bildirim, profil |
| `SALON_OWNER` | salon CRUD, staff/service/product CRUD, randevu durumu, yorum yanıtı, OTP akışları |
| `ADMIN` | admin.*, categories CRUD, settings, salon verify, yorum görünürlüğü, kullanıcı listesi/toggle |

`register` validator'ı `role` alanını yalnız `CUSTOMER` veya `SALON_OWNER` olarak kabul eder → API üzerinden ADMIN oluşturulamaz. Canlı doğrulama: `role: "ADMIN"` → 400 `Geçerli bir rol seçiniz`.

## Sahiplik kontrolü

Rol kontrolü yetmez; kayıt sahipliği controller'da ayrıca kontrol edilir:

- `Salon`: `salon.ownerId === req.user.id` (bazı route'larda `|| req.user.role === 'ADMIN'`)
- `Service` / `Product` / `Staff`: `service.salon.ownerId === req.user.id` (ADMIN burada **yetkili değildir**)
- `Appointment` status: `appointment.salon.ownerId === req.user.id` veya ADMIN
- `Appointment` cancel: `appointment.customerId === req.user.id`
- `Review`: `review.customerId === req.user.id` (oluşturma), `review.salon.ownerId === req.user.id` (yanıt)

> **Doğrulanmış açıklar:** `GET /appointments/salon/:salonId` ve `GET /reviews/salon/:salonId` sahiplik kontrolü yapmaz — herhangi bir SALON_OWNER herhangi bir salonun randevularını okuyabilir. Canlı test: `salon@` (Elegance'ın sahibi) → `GET /appointments/salon/<Zen SPA>` → 200, 2 kayıt.

## Auth endpoint'leri

| Method | Path | Auth | Rate limit |
|---|---|---|---|
| POST | `/auth/register` | public | 10/60sn |
| POST | `/auth/login` | public | 10/60sn |
| POST | `/auth/refresh` | public | 60/60sn |
| POST | `/auth/logout` | required | — |
| POST | `/auth/change-password` | required | — |
| POST | `/auth/forgot-password` | public | — |
| POST | `/auth/reset-password` | public | — |

### Register

Body: `email`, `password` (min 8, en az 1 büyük + 1 küçük + 1 rakam), `fullName` (2–100), `phone?` (E.164), `role?`.

- 409 `Bu email adresi zaten kayıtlı`
- 409 `Bu telefon numarası zaten kayıtlı`
- 201 → `{ user, accessToken, refreshToken }`

Canlı örnek:

```json
{ "success": true,
  "data": {
    "user": { "id":"...", "email":"docprobe2@example.com", "fullName":"Doc Probe",
              "role":"CUSTOMER", "isVerified":false, "isActive":true },
    "accessToken":"eyJ...","refreshToken":"eyJ..."
  },
  "timestamp":"..." }
```

> `toSafeJSON()` `passwordHash` ve `refreshToken`'ı çıkarır ama `passwordResetToken` / `passwordResetTokenExpiry` **çıkmaz** — hassas alan sızıntısı (bkz. 11-known-issues).

### Login

- 401 `Email veya şifre hatalı` (kullanıcı yok veya şifre yanlış — enumeration'a kapalı)
- 401 `Hesabınız devre dışı bırakılmış`
- 200 → `{ user, accessToken, refreshToken }`

### Refresh

Body: `refreshToken`.

1. `jwt.verify(refreshToken, JWT_REFRESH_SECRET)` → 401 `Geçersiz refresh token`
2. `user.refreshToken` boşsa → 401 `Erişim reddedildi`
3. `bcrypt.compare(refreshToken, user.refreshToken)` → 401 `Geçersiz refresh token`
4. Yeni çift üretilir, hash güncellenir → 200 `{ accessToken, refreshToken }`

### Logout

`user.refresh_token = null`. Yanıt: `{ message: "Başarıyla çıkış yapıldı" }`.

### Change password

Body: `currentPassword`, `newPassword` (min **6** — register minimumu 8 ile tutarsız).

- 400 eksik alan / yeni şifre kısa / mevcut şifre hatalı
- Başarılı → `onay e-postası` gönderilir (`sendPasswordChangedEmail`)
- Hash'leme `User.beforeUpdate` hook'unda yapılır (controller düz metin geçirir)

### Forgot / reset password

- `forgot-password`: 6 haneli OTP (`crypto.randomInt(100000, 999999)`), bcrypt(10) hash'li, **10 dk** geçerli. Kullanıcı olmasa da aynı mesaj döner: `Eğer bu e-posta kayıtlıysa, kod gönderildi`.
- `reset-password`: `email`, `token`, `newPassword` (min 6). Süresi dolmuşsa token alanları temizlenir ve 400 `Kodun süresi dolmuş`.

## E-posta değişikliği (iki ayrı akış)

### Salon için (`/salons/:id/request-email-change` + `confirm-email-change`)

Modelde `pending_email`, `email_change_token`, `email_change_token_expiry` alanları vardır. OTP 6 haneli, 10 dk. `verifyVia`: `email` (default) veya `sms`.

### Kullanıcı için (`/users/me/request-email-change` + `confirm-email-change`)

User modelinde bu alanlar **yoktur**; `password_reset_token` alanı şu formatla yeniden kullanılır:

```
EMAILCHANGE:<bcryptHash>:<base64(newEmail)>
```

Bu, şifre sıfırlama akışıyla **aynı sütunu paylaşır** — bir akış diğerini bozabilir. Canlı doğrulama: `confirm` yanıtı `{ message: "E-posta başarıyla güncellendi", email: "..." }`.

## Test ortamında auth

`tests/auth.test.js` (26 test) `createToken(user)` ile doğrudan `jwt.sign` üretir; `authenticate`'in DB lookup'ı `tests/setup.js` seed'indeki kullanıcılar üzerinden çalışır.
