# 08 — Entegrasyonlar: dosya yükleme, e-posta, SMS, Settings

## Dosya yükleme (`middlewares/upload.js`)

```js
UPLOAD_DEST   = process.env.UPLOAD_DEST || './uploads'
ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
MAX_SIZE      = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
MAX_FILE_COUNT = 10
```

- `fs.mkdirSync(UPLOAD_DEST, { recursive: true })` — başlangıçta klasör oluşturulur
- Disk storage, dosya adı `uuid + ext`
- `fileFilter` reddederse `error.statusCode = 400` → `errorHandler` 400 üretir
- `uploadSingle` → `.single('file')`, `uploadMultiple` → `.array('files', 10)`

Statik servis: `app.use('/uploads', express.static(...))` — **`/api/v1` öneki yoktur**.

### İstemci tarafı kuralı

API kök-göreli URL döner (`/uploads/<uuid>.jpg`). Flutter'da `Image.network` mutlak URL istediği için her gösterim noktası `resolveMediaUrl()` kullanmalıdır:

- `apps/salon_app/lib/core/network/media_url.dart`
- `apps/customer_app/lib/core/network/media_url.dart`

`MEDIA_BASE_URL` dart-define'ı ile override edilebilir. Helper kullanılmazsa kırık görsel ikonu çıkar.

## E-posta (`utils/mailer.js`)

Nodemailer, Mailtrap sandbox default. SMTP yapılandırılmamışsa veya `NODE_ENV=test` ise fiilen göndermez:

```js
if (isTest || !smtpConfigured) { console.log('[mailer:noop] ' + to + ' | ' + subject); return; }
```

Fonksiyonlar:

| Fonksiyon | Konu | Kullanım |
|---|---|---|
| `sendEmailChangeOtp(to, salonName, otp)` | E-posta Değişikliği Doğrulama Kodu | salon + user e-posta değişikliği |
| `sendPasswordResetOtp(to, fullName, otp)` | Şifre Sıfırlama Kodu | `forgot-password` |
| `sendPasswordChangedEmail(to, fullName)` | Şifreniz Değiştirildi | `change-password` |

Şablonlar HTML, 6 haneli kod 10 dakika geçerli notuyla.

## SMS (`utils/sms.js`)

`sendSmsOtp(toPhone, otp)`:

- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` tanımlıysa Twilio ile gönderir
- Yoksa konsola yazar: `📱 [SMS DEV] Alıcı: ... | OTP: ...`

> `twilio` `package.json`'de **yok**. Twilio env'i tanımlıysa `require('twilio')` throw eder → `try/catch` içinde yakalanıp `Error('SMS gönderilemedi')` → 500.

## Settings (`controllers/settings.controller.js`)

`Setting` tablosu key/value JSON. `GET` DB'deki satırları `DEFAULTS` üzerine yazar; `PUT` her anahtar için `upsert`.

Bu ayarlar API davranışını etkilemez — yalnız depolanır ve admin panelde gösterilir (`maxLoginAttempts`, `rateLimitingEnabled`, `maintenanceModeEnabled` hiçbir yerde okunmaz).

## Kullanılmayan entegrasyonlar

| Bağımlılık | Durum |
|---|---|
| `sharp` | tanımlı, hiçbir yerde kullanılmıyor (image resize planlanmış ama yok) |
| `swagger-jsdoc`, `swagger-ui-express` | tanımlı, swagger mount edilmemiş → OpenAPI çıktısı yok |
| `pg`, `pg-hstore` | runtime SQLite kullandığı için kullanılmıyor |
| `cookie-parser` | mount ediliyor ama hiçbir cookie okunmuyor |
| `optionalAuth` | tanımlı, route'larda kullanılmıyor |
