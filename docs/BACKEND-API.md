# 🏨 Beauty Salon Backend — Detaylı Dokümantasyon

> Kapsam: `apps/api/` (Node.js 22.23.4 — `.tool-versions` ile pinli / Express 5 / Sequelize 6 / SQLite)
> Kaynak: `src/` kodundan, `tests/` suite'inden, `src/database.sqlite` şemasından ve canlı sunucu üzerinde yapılan gerçek isteklerden çıkarılmıştır.
> **Doğrulama tarihi: 2026-10-23** (`npm test` → 291 passing, canlı probe ile teyit edildi)
>
> 📁 Modüler asıl dokümantasyon: **`docs/api/`** (README + 01…12 + `openapi.yaml`). Bu dosya tek sayfalık özettir; ayrıntı ve güncel doğrulama `docs/api/` setindedir. Eski (bozuk) içerik `docs/BACKEND-API.md.bak` dosyasında yedeklendi.

---

## 1. Genel Bakış

Güzellik salonları için çok rollü (CUSTOMER / SALON_OWNER / ADMIN) REST API.

- Müşteri: salon arar, yakındaki salonları listeler, hizmet + çalışan seçip randevu alır, randevusunu iptal eder, tamamlanan randevuya yorum yapar, salonları favorilere ekler, bildirimlerini okur.
- Salon sahibi: salon/çalışan/hizmet/ürün yönetir, randevu durumunu değiştirir, yorumlara yanıt verir, e-posta/telefonunu OTP ile değiştirir.
- Admin: platform genelini denetler (dashboard, salonlar, randevular, yorumlar, kullanıcılar), salon onaylar, yorum görünürlüğünü değiştirir.

**Temel özellikler:** JWT (access + refresh, refresh hash'li saklanır), express-validator, Multer upload, rate limiting, Helmet, CORS, Nodemailer (Mailtrap), Twilio SMS (fallback: konsol), local dosya saklama.

---

## 2. Çalıştırma

```bash
cd apps/api
npm install

npm run dev        # nodemon (NODE_ENV=development → morgan logging + SQL logging açık)
npm start          # production
npm run seed       # manuel seed
npm test           # node --env-file=.env.test mocha "tests/**/*.test.js"
npm run migrate    # sequelize-cli (Postgres config'i — bkz. §14)
```

`.env` `PORT=3000` yazar; bu makinede 3000 başka bir projeye ait olduğu için API **3200** ile çalıştırılıyor:
`PORT=3200 NODE_ENV=development node src/server.js`.

`src/server.js` açılış sırası:

1. `dotenv` yüklenir
2. `connectDB()` → SQLite dosyasına bağlanır
3. `sequelize.sync()` → eksik tabloları oluşturur (**`alter: true` artık kullanılmıyor**)
4. `dropBackupTables()` → eski `*_backup` tablolarını siler
5. `ensureColumns()` → eksik kolonları `ALTER TABLE ... ADD COLUMN` ile ekler
6. `User.count() == 0 || Salon.count() == 0` ise `seed()` çalışır
7. `app.listen(PORT)`

> ⚠️ `ensureColumns()` bir modelin tablosu yoksa patlar (`PRAGMA table_info` boş döner → `ALTER TABLE` "no such table"). Bu yüzden `sync()` **önce** çalışmalıdır.

> ⚠️ **DB dosyası yolu:** `config/database.js` içinde `path.join(__dirname, '..', ...)` ve `__dirname = src/config` → fiilen kullanılan dosyalar `apps/api/src/database.sqlite` ve `apps/api/src/test-database.sqlite`. `apps/api/database.sqlite` eski/yedek dosyadır, kod kullanmaz.

---

## 3. Ortam Değişkenleri (`.env` / `.env.test`)

| Değişken | Default | Kullanım yeri |
|---|---|---|
| `PORT` | 3000 | `server.js` |
| `NODE_ENV` | development | `app.js` (morgan), `database.js` (logging, db dosyası) |
| `API_PREFIX` | `/api/v1` | `app.js` route mount |
| `JWT_SECRET` | — | access token + `authenticate` |
| `JWT_REFRESH_SECRET` | — | refresh token |
| `JWT_EXPIRATION` | `15m` | access token ömrü |
| `JWT_REFRESH_EXPIRATION` | `7d` | refresh token ömrü |
| `RATE_LIMIT_WINDOW` | 60000 ms | genel limiter |
| `RATE_LIMIT_MAX` | 100 | genel limiter |
| `MAX_FILE_SIZE` | 5242880 (5MB) | Multer `limits.fileSize` |
| `UPLOAD_DEST` | `./uploads` | Multer hedefi — **artık kullanılıyor** (cwd'e göre çözülür) |
| `ALLOWED_ORIGINS` | `http://localhost:3000,3001,8080` | `app.js` CORS; development'ta localhost/127.0.0.1 herhangi port da kabul edilir |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Mailtrap sandbox | `utils/mailer.js` |
| `DB_HOST/PORT/NAME/NAME_TEST/USER/PASSWORD` | postgres | **yalnızca `sequelize-cli`** (runtime SQLite kullanır) |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | yok | `utils/sms.js` (yoksa konsola OTP yazar) |

---

## 4. Klasör Yapısı

```
apps/api/
├── src/
│   ├── server.js                 # entry point (db + sync + seed + listen)
│   ├── app.js                    # Express app: güvenlik, parser, static, routes, error handler
│   ├── config/
│   │   ├── database.js           # Sequelize instance (SQLite, underscored, timestamps)
│   │   └── sequelize-config.js   # sequelize-cli config (Postgres — runtime'da kullanılmaz)
│   ├── models/                   # 12 model + index.js (ilişkiler)
│   ├── controllers/              # 14 controller
│   ├── routes/                   # 14 route dosyası + index.js
│   ├── middlewares/              # auth, errorHandler, upload, validate
│   ├── validators/               # auth, salon, appointment, review, product
│   ├── utils/                    # helpers, mailer, sms
│   ├── seeders/                  # seed.js, reset.js
│   └── database/migrations/      # 12 migration (Postgres/JSONB tabanlı)
├── tests/                        # 14 dosya, 291 test
├── uploads/                      # yüklenen dosyalar
├── src/database.sqlite           # ← gerçek runtime DB
├── database.sqlite               # eski/yedek dosya (kod kullanmıyor)
└── .sequelizerc
```

---

## 5. İstek Yaşam Döngüsü (middleware sırası)

```
1. helmet()                 → güvenlik headerları
2. cors()                   → ALLOWED_ORIGINS + development'ta localhost/127.0.0.1 herhangi port
                             Origin göndermeyen istekler (curl/Postman/supertest) kabul edilir
                             credentials:true · methods: GET, POST, PUT, PATCH, DELETE
                             headers: Content-Type, Authorization
3. limiter                  → genel: RATE_LIMIT_WINDOW / RATE_LIMIT_MAX (standardHeaders:true)
4. authLimiter              → /auth/login, /auth/register: 10 istek / 60 sn (hardcoded)
5. refreshLimiter           → /auth/refresh: 60 istek / 60 sn (hardcoded)
                             (3-5 test ortamında devre dışı)
6. express.json (10mb), express.urlencoded (10mb), cookieParser()
7. morgan('dev')            → yalnızca NODE_ENV=development
8. /uploads static          → apps/api/uploads
9. API_PREFIX (varsayılan /api/v1) → routes
10. 404 handler             → { success:false, message:"Route bulunamadı: METHOD url" }
11. errorHandler            → global (bkz. §7)
```

Route mount listesi (`src/routes/index.js`): `auth, users, salons, staff, services, categories, appointments, reviews, favorites, upload, admin, notifications, products, settings` + `GET /` (endpoint dizisi) + `GET /health`.

---

## 6. Yanıt Formatı

### Başarılı (`utils/helpers.js → successResponse`)

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-12T16:49:34.832Z"
}
```

### Sayfalılı (`paginatedResponse`)

```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
  },
  "timestamp": "..."
}
```

`paginate(page=1, limit=20)` → `limit` en fazla **100**, en az 1.

> Not: `successResponse(res, paginatedResponse(...))` nedeniyle sayfalı endpoint'lerde `data.data` şeklinde iç içe bir alan vardır. `GET /notifications` bunun istisnasıdır: `data` doğrudan `{ data, meta }` döner.

### Hatalı

```json
{ "success": false, "message": "...", "errors": ["..."] }
```

### Gerçek örnek (canlı)

```
GET /api/v1/health
{"success":true,"message":"Beauty Salon API is running","timestamp":"2026-10-12T16:49:34.832Z"}

GET /api/v1/nope
{"success":false,"message":"Route bulunamadı: GET /api/v1/nope"}
```

> ⚠️ `underscored: true` + `field:` eşlemesi nedeniyle `toJSON()` bazı alanları **iki kez** basar: `ownerId` ve `owner_id`. İstemci tarafında buna dikkat edilmeli.

---

## 7. Hata İşleme (`middlewares/errorHandler.js`)

| Hata | HTTP | Mesaj |
|---|---|---|
| `SequelizeValidationError` | 400 | `Doğrulama hatası` + `errors[]` |
| `SequelizeUniqueConstraintError` | 409 | `Bu <alan> zaten kullanılıyor` |
| `SequelizeForeignKeyConstraintError` | 400 | `İlişkili kayıt bulunamadı` |
| `err.type === 'validation'` | 400 | `Doğrulama hatası` + `errors[]` |
| Multer `LIMIT_FILE_SIZE` | 400 | `Dosya boyutu çok büyük (max 5MB)` |
| `TokenExpiredError` | 401 | `Oturum süresi dolmuş...` (auth middleware'inde) |
| `JsonWebTokenError` | 401 | `Geçersiz token` (auth middleware'inde) |
| `err.statusCode` | o kod | `err.message` |
| Genel | 500 | `Sunucu hatası` (development'ta `stack` eklenir) |

> `err.type === 'validation'` dalı pratikte çalışmaz: `validate` middleware'i doğrulama hatalarını kendi yanıtlar ve `next(error)` çağırmaz.
> Multer `fileFilter` reddi `error.statusCode = 400` ile düşer → **400** (canlı doğrulandı).

---

## 8. Kimlik Doğrulama ve Yetkilendirme

### Token üretimi (`controllers/auth.controller.js`)

```js
payload = { sub: user.id, email: user.email, role: user.role }
accessToken  → JWT_SECRET,  expiresIn JWT_EXPIRATION (15m)
refreshToken → JWT_REFRESH_SECRET, expiresIn JWT_REFRESH_EXPIRATION (7d)
```

Refresh token DB'de **bcrypt (12 tur) hash'li** saklanır (`users.refresh_token`). Her `refresh`'te rotate edilir; `logout`'a temizlenir.

### Middleware'ler (`middlewares/auth.js`)

- `authenticate` — `Authorization: Bearer <token>` zorunlu. User `findByPk(decoded.sub)` ile çekilir, `isActive` kontrolü yapılır, `req.user` set edilir. 401 / 500.
- `optionalAuth` — token varsa doğrular, yoksa/bozuksa sessizce devam eder. **`salon.routes.js`'te import edilip kullanılmıyor.**
- `authorize(...roles)` — `req.user.role` rol listesinde değilse 403.

### Roller

`CUSTOMER` (default), `SALON_OWNER`, `ADMIN`. Kayıtta yalnızca `CUSTOMER` veya `SALON_OWNER` verilebilir; `ADMIN` seed ile oluşur.

### Sahiplik kontrolü

Rol kontrolü dışında controller'larda nesne bazlı kontrol vardır:
- Salon: `salon.ownerId === req.user.id`
- Staff / Service / Product / Review reply: salonun `ownerId` üzerinden
- Appointment status: `appointment.salon.ownerId`
- Appointment cancel / Review create: `customerId === req.user.id`

> `GET /appointments/salon/:salonId` ve `GET /admin/*` endpoint'lerinde **salon bazlı sahiplik kontrolü yoktur** — herhangi bir `SALON_OWNER` herhangi bir salonun randevularını görebilir.

---

## 9. Veri Modeli

### ER özeti

```
User 1──N Salon (owner_id)
Salon 1──N Staff
Salon 1──N Service
ServiceCategory 1──N Service
Staff N──M Service (StaffService)
User 1──N Appointment (customer_id)
Salon 1──N Appointment
Staff 1──N Appointment
Service 1──N Appointment
User 1──N Review (customer_id)
Salon 1──N Review
Appointment 1──1 Review (appointment_id unique)
User N──M Salon (Favorite)
Salon 1──N Product
User 1──N Notification
```

### users

| Kolon | Tip | Not |
|---|---|---|
| id | UUID (UUIDV4) | PK |
| email | STRING | **unique**, `isEmail` validate |
| phone | STRING | unique, nullable, E.164 (validator) |
| full_name | STRING | 2–100 validate |
| avatar_url | STRING | nullable |
| password_hash | STRING | `beforeCreate` hook → bcrypt(12) |
| role | ENUM | CUSTOMER / SALON_OWNER / ADMIN |
| is_verified | BOOLEAN | default false |
| is_active | BOOLEAN | default true |
| refresh_token | TEXT | bcrypt hash'li refresh |
| password_reset_token | STRING | OTP hash **veya** `EMAILCHANGE:<hash>:<base64 email>` |
| password_reset_token_expiry | DATE | 10 dk |
| created_at / updated_at | DATE | |

Instance metotları: `comparePassword(p)`, `toSafeJSON()` (passwordHash + refreshToken çıkarır).

### salons

| Kolon | Tip | Not |
|---|---|---|
| id | UUID | PK |
| owner_id | UUID | FK users |
| name | STRING | 2–100 |
| description | TEXT | |
| phone | STRING | |
| email | STRING | `isEmail` |
| logo_url / cover_image_url | STRING | |
| gallery_images | TEXT | JSON get/set (SQLite) |
| address | STRING | min 5 (validator) |
| latitude / longitude | FLOAT | -90..90 / -180..180 |
| city / district | STRING | |
| rating_avg | FLOAT | default 0, 1 ondalık yuvarlanır |
| review_count | INTEGER | default 0 |
| is_active | BOOLEAN | soft delete alanı |
| is_verified | BOOLEAN | admin onayı |
| price_range | INTEGER | 1–3, default 2 |
| working_hours | TEXT | JSON get/set — `{ monday: { open:"09:00", close:"21:00" }, ... }` |
| pending_email / pending_phone | STRING | OTP akışı |
| email_change_token / _expiry | STRING / DATE | bcrypt hash + 10 dk |
| phone_change_token / _expiry | STRING / DATE | |

**Indexler:** `(latitude, longitude)`, `(city, district)`, `(is_active, is_verified)`.

> `working_hours` getter'ı çift-parse toleranslıdır: değer string gelirse `JSON.parse` eder, sonuç hâlâ string ise bir kez daha parse eder. Bu yüzden `JSON.stringify(...)` ile set edilen değerler de çalışır (eski sürümde string set edilirse getter string döner, slot/çalışma saati kontrolleri kırılırdı).

### staff

`id`, `salon_id`, `full_name`, `avatar_url`, `title`, `bio`, `is_active`, timestamps.

### service_categories

`id`, `name` (unique), `icon_name`, `sort_order` (default 0), `description` VARCHAR(255), `is_active` default true, `created_at` (**updated_at yok**).

### services

`id`, `salon_id`, `category_id`, `name`, `description`, `price` DECIMAL(10,2), `duration_minutes` INT, `image_url`, `is_active`, timestamps.

### staff_services (join)

`staff_id` (modelde `primaryKey: true`) + `service_id` (`ON DELETE CASCADE ON UPDATE CASCADE`), **timestamps yok**.

> Sequelize `primaryKey: ['staff_id','service_id']` composite PK desteklemez; fiili şemada PK yoktur → duplicate join kaydı engellenmez.

### appointments

| Kolon | Tip | Not |
|---|---|---|
| id | UUID | PK |
| customer_id / salon_id / staff_id / service_id | UUID | NOT NULL |
| date | DATEONLY | |
| start_time / end_time | TIME | `HH:MM` |
| status | ENUM | PENDING / CONFIRMED / CANCELLED / COMPLETED / NO_SHOW (default PENDING) |
| note | TEXT | max 500 (validator) |
| cancellation_reason | TEXT | |

**Indexler:** `(salon_id, date, status)`, `(staff_id, date)`, `(customer_id, status)`.

### reviews

`id`, `customer_id`, `salon_id`, `appointment_id` (**unique** → randevu başına 1 yorum), `rating` INT 1–5, `comment` TEXT, `images` JSONB default `[]`, `salon_reply` TEXT, `salon_reply_at` DATE, `is_visible` BOOLEAN default true, timestamps.

### favorites

`id` (PK) + `user_id` + `salon_id`, `created_at` (**updated_at yok**).

**Index:** `UNIQUE (user_id, salon_id)` — bir kullanıcı bir salonu yalnız bir kez favoriler.

### products

`id`, `salon_id`, `name`, `description`, `price` DECIMAL(10,2), `stock_quantity` INT default 0, `images` JSONB default `[]`, `category` STRING, `is_active`, timestamps.

### notifications

`id`, `user_id`, `title`, `body`, `type` ENUM(APPOINTMENT/REVIEW/ORDER/SYSTEM), `data` JSONB, `is_read` default false, `created_at` (**updated_at yok**).

> **Bildirim üreten hiçbir kod yoktur.** Sadece okuma/silme endpoint'leri vardır; bildirimler testte elle oluşturuluyor. Randevu/yorum/sipariş akışlarında `Notification.create` çağrısı yok.

### settings

`key` VARCHAR(255) PK (unique), `value` JSON NOT NULL, `created_at` (**updated_at yok**). Admin panel ayarları key/value olarak saklanır; DB'de olmayan anahtarlar `settings.controller.js` → `DEFAULTS` ile doldurulur.

---

## 10. Endpoint Referansı

Base: `http://localhost:3000/api/v1`

### 10.1 Genel

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/` | public | Endpoint dizisi |
| GET | `/health` | public | Sağlık kontrolü |

### 10.2 Auth

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/auth/register` | public (10/60sn) | Kayıt → user + accessToken + refreshToken |
| POST | `/auth/login` | public (10/60sn) | Giriş → user + tokenlar |
| POST | `/auth/refresh` | public (60/60sn) | Refresh token ile yeni çift |
| POST | `/auth/logout` | required | `refresh_token = null` |
| POST | `/auth/change-password` | required | currentPassword + newPassword (min 6) → e-posta bildirimi |
| POST | `/auth/forgot-password` | public | 6 haneli OTP e-posta (10 dk) |
| POST | `/auth/reset-password` | public | email + token + newPassword (min 6) |

**Register body:** `email`, `password` (min 8, en az 1 büyük + 1 küçük + 1 rakam), `fullName` (2–100), `phone?` (E.164), `role?` (CUSTOMER/SALON_OWNER).
**Status:** 201, 400 (validator), 409 (email/phone mevcut), 429.

```json
{ "success": true,
  "data": { "user": { "id":"...","email":"doc@example.com","fullName":"Doc User","role":"CUSTOMER","isVerified":false,"isActive":true },
            "accessToken":"eyJ...","refreshToken":"eyJ..." },
  "timestamp":"..." }
```

**Login hataları:** 401 `Email veya şifre hatalı` (kullanıcı yok / şifre yanlış), 401 `Hesabınız devre dışı bırakılmış`.
**Forgot-password:** kullanıcı olmasa da aynı mesaj döner (enumeration koruması).

### 10.3 Users

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/users/me` | required | Profil (sınırlı alanlar) |
| PATCH | `/users/me` | required | `fullName`, `phone`, `avatarUrl` |
| GET | `/users` | ADMIN | Sayfalı liste, `createdAt DESC` |
| PATCH | `/users/:id/toggle-active` | ADMIN | `isActive` tersine çevir |
| POST | `/users/me/request-email-change` | required | `newEmail` → OTP (mevcut e-postaya gönderilir) |
| POST | `/users/me/confirm-email-change` | required | `token` → e-posta güncellenir |

> User modelinde `pending_email` / `email_change_token` alanı **yoktur**. `passwordResetToken` alanı `EMAILCHANGE:<hashedOtp>:<base64(newEmail)>` formatıyla yeniden kullanılır. Bu, şifre sıfırlama akışıyla **aynı alanı paylaşır** — bir akış diğerini bozabilir.

### 10.4 Salons

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons` | public | Sayfalı liste (yalnız `isActive && isVerified`) |
| GET | `/salons/nearby` | public | Haversine ile yakındaki salonlar |
| GET | `/salons/owner/my-salons` | SALON_OWNER | Kendi aktif salonları |
| GET | `/salons/:id` | public | Detay (owner + aktif staff + aktif services) |
| POST | `/salons` | SALON_OWNER | Oluşturma (validator) |
| PATCH | `/salons/:id` | SALON_OWNER (sahiplik) / ADMIN | Güncelleme |
| DELETE | `/salons/:id` | SALON_OWNER (sahiplik) / ADMIN | **Soft delete** (`isActive=false`) |
| PATCH | `/salons/:id/verify` | ADMIN | `isVerified=true` |
| POST | `/salons/:id/request-email-change` | SALON_OWNER (sahiplik) | OTP iste (`verifyVia`: `email`\|`sms`) |
| POST | `/salons/:id/confirm-email-change` | SALON_OWNER | OTP doğrula |
| POST | `/salons/:id/request-phone-change` | SALON_OWNER | OTP iste (`verifyVia`: `sms`\|`email`) |
| POST | `/salons/:id/confirm-phone-change` | SALON_OWNER | OTP doğrula |
| GET | `/salons/:salonId/staff` | public | Aktif çalışanlar (+hizmetleri) |
| POST | `/salons/:salonId/staff` | SALON_OWNER | Çalışan ekle (+`serviceIds`) |
| GET | `/salons/:salonId/services` | public | Aktif hizmetler (kategori `sortOrder` sırası) |
| POST | `/salons/:salonId/services` | SALON_OWNER | Hizmet ekle |
| GET | `/salons/:salonId/products` | public | Aktif ürünler |
| POST | `/salons/:salonId/products` | SALON_OWNER | Ürün ekle |

**`GET /salons` query:** `page`, `limit` (max 100), `search` (name/address/city LIKE), `city`, `district`, `minRating` (≥), `priceRange`, `verified=true`, `categoryId` (INNER JOIN → o kategori hizmeti olan salonlar), `sortBy` = `rating` \| `newest` (default `createdAt DESC`).

**`GET /salons/nearby`:** `latitude`, `longitude`, `radius` (0.1–100 km), `page`, `limit`. Önce derece bazlı bounding box (`radius/111.32`), sonra Haversine ile kesin mesafe, filtreleme ve mesafeye göre sıralama. Sonuç öğelerinde `distance` (km, 2 ondalık) alanı vardır.

**PATCH /salons/:id:** `email`, `pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry` body'den **silinir** (e-posta yalnızca OTP akışıyla değişir).

**OTP akışı:** 6 haneli OTP (`crypto.randomInt(100000,999999)`), bcrypt(10) hash'li, 10 dk geçerli. Doğrulamada süresi dolmuşsa token alanları temizlenir. Sahiplik kontrolü `ownerId === req.user.id` (ADMIN bu route'larda yetkili **değildir**).

### 10.5 Staff

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| PATCH | `/staff/:id` | SALON_OWNER | Güncelle; `serviceIds` verilirse join tablosu **önce silinip** yeniden yazılır |
| DELETE | `/staff/:id` | SALON_OWNER | Soft delete |

### 10.6 Services

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/services/:id` | public | Hizmet detayı (+kategori) |
| PATCH | `/services/:id` | SALON_OWNER | Güncelle |
| DELETE | `/services/:id` | SALON_OWNER | Soft delete |
| GET/POST | `/services/salons/:salonId/services` | public / SALON_OWNER | `service.routes`'taki ikinci mount (aynı controller) |

### 10.7 Categories

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/categories` | public | `sortOrder ASC` |
| POST | `/categories` | ADMIN | `name`, `iconName` zorunlu, `sortOrder` default 0 → 409 duplicate |
| PATCH | `/categories/:id` | ADMIN | Kısmi güncelleme, çakışan ad → 409 |
| DELETE | `/categories/:id` | ADMIN | **Hard delete** (`destroy()`) |

### 10.8 Appointments

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/appointments` | required | Randevu oluştur |
| GET | `/appointments/available-slots` | **public** (kodda `authenticate` yok) | 30 dk aralıklı slot listesi |
| GET | `/appointments/my` | required | Kendi randevuları (`status` filtresi) |
| GET | `/appointments/salon/:salonId` | SALON_OWNER / ADMIN | Salon randevuları (`date`, `status` filtresi) |
| PATCH | `/appointments/:id/status` | SALON_OWNER (sahiplik) / ADMIN | Durum geçişi |
| PATCH | `/appointments/:id/cancel` | required (sahiplik) | İptal (`reason` opsiyonel) |

**POST /appointments kuralları (sırayla):**
1. `serviceId` var ve `isActive` olmalı → 404
2. Tarih geçmiş olamaz → 400
3. `endTime` = `startTime + service.durationMinutes` (HH:MM)
4. Salon `isActive && isVerified` olmalı → 404
5. Salonun o günkü `workingHours` içinde olmalı → 400 *(gün tanımı yoksa kontrol **atlanır**)*
6. `StaffService` üzerinden bu hizmeti sunan, **bu salona ait** aktif çalışanlar aday listesi olur (`fullName ASC`):
   - `staffId` verilirse adaylar arasında olmalı → yoksa 400
   - `staffId` verilmezse ilk boş aday otomatik atanır; hiç boş yoksa 409
7. Aynı çalışan için `PENDING/CONFIRMED` çakışma → 409
8. Oluşturulur → 201, `status = PENDING`

> Staff salon uyumu artık kontrol ediliyor (adaylar `salon_id` ile filtrelenir). **`serviceId`'nin `salonId` ile uyumu hâlâ doğrulanmaz.**

**Durum geçişleri:**
```
PENDING   → CONFIRMED | CANCELLED
CONFIRMED → COMPLETED | CANCELLED | NO_SHOW
COMPLETED / CANCELLED / NO_SHOW → terminal (işlem yapılamaz, 400)
```
`COMPLETED` yalnızca randevu saati geçmişse yapılabilir (`date + endTime`), aksi hâlde 400.

**`available-slots`:** salonun o günkü açık saatlerinde 30 dk aralıklarla slot üretir; `min + duration <= close` koşulunu sağlayan slotlar listelenir; `PENDING/CONFIRMED` randevularla çakışanlar `available:false` işaretlenir. Gün kapalıysa `[]` döner. Yanıt: `[{ "time": "09:00", "available": true }, ...]`.

> `staffId` opsiyoneldir ama doğrulanır; verilmezse `where: { staffId: undefined }` → Sequelize bu filtreyi yok sayar ve **tüm çalışanların** randevuları dikkate alınır.

### 10.9 Reviews

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/reviews` | required | Yorum oluştur |
| GET | `/reviews/salon/:salonId` | public | Sayfalı, yalnız `isVisible` |
| GET | `/reviews/my` | required | Kendi yorumları |
| PATCH | `/reviews/:id/reply` | SALON_OWNER (sahiplik) | `reply` (1–500) + `salonReplyAt` |
| PATCH | `/reviews/:id/toggle-visibility` | ADMIN | `isVisible` tersine çevir |

**POST kuralları:** randevu var olmalı (404), randevu **COMPLETED** olmalı (400), randevu yorumcuya ait olmalı (403), randevuya yorum yapılmamış olmalı (400). Yorum ve salon puanı **aynı transaction** içinde yazılır:

```
ratingAvg = round(AVG(visible ratings) * 10) / 10
reviewCount = COUNT(visible ratings)
```

### 10.10 Favorites

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/favorites` | required | Favori salonlar (`createdAt DESC`) |
| POST | `/favorites/:salonId` | required | **Toggle**: varsa sil → `{isFavorite:false}`, yoksa ekle → `{isFavorite:true}` (salon yoksa 404) |
| GET | `/favorites/:salonId/check` | required | `{ isFavorite: true|false }` |

### 10.11 Notifications

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/notifications` | required | Sayfalı; `isRead=true/false`, `type` filtresi, `createdAt DESC` |
| GET | `/notifications/unread-count` | required | `{ count }` |
| PATCH | `/notifications/:id/read` | required | Okundu işaretle |
| PATCH | `/notifications/read-all` | required | Tümünü okundu |
| DELETE | `/notifications/:id` | required | Sil |

Tüm route'lar `router.use(authenticate)` ile korunur; sorgular `user_id` ile sınırlıdır.

### 10.12 Products

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons/:salonId/products` | public | `search` (LIKE), `category`, `sortBy=price` (yoksa `createdAt DESC`) |
| GET | `/products/:id` | public | Detay |
| PATCH | `/products/:id` | SALON_OWNER (salon sahipliği) | Güncelle |
| DELETE | `/products/:id` | SALON_OWNER | Soft delete |

> `createProductValidator` ve `queryProductValidator` tanımlı ama route'larda **kullanılmıyor**.

### 10.13 Upload

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/upload/single` | required | form field `file` |
| POST | `/upload/multiple` | required | form field `files`, max 10 dosya |

- İzin verilen MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max boyut: `MAX_FILE_SIZE` (5 MB)
- Dosya adı: `uuid + ext`, hedef `UPLOAD_DEST` (default `./uploads`, cwd'e göre)
- Yanıt: `{ url: "/uploads/<uuid>.png", originalName, size }`
- Statik erişim: `GET /uploads/<filename>`

### 10.14 Admin

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/admin/dashboard` | ADMIN | `stats`, `appointmentsByStatus`, `monthlyAppointments`, `recentReviews` |
| GET | `/admin/salons` | ADMIN | Sayfalı, `verified=true/false` filtresi, owner bilgisi |
| GET | `/admin/appointments` | ADMIN | Sayfalı, `status` filtresi, customer/salon/staff/service |
| GET | `/admin/reviews` | ADMIN | Sayfalı, customer/salon |

`dashboard` stats: `totalUsers`, `totalSalons` (aktif), `totalAppointments`, `pendingSalons` (aktif+onaysız), `recentAppointments` (son 7 gün), `newUsersThisWeek`, `totalRevenue` (COMPLETED randevuların hizmet fiyat toplamı, string), `completedAppointments`.

> ✅ SQLite uyumu düzeltildi: `DATE_TRUNC` yerine `strftime('%Y-%m', Appointment.date)` kullanılıyor → canlı testte 200.
> `totalRevenue` **string** döner (`toFixed(2)`); `monthlyAppointments` yalnız son 6 ayı ve **ay adını** verir (yıl bilgisi yoktur).

### 10.15 Settings

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/settings` | ADMIN | DB değerleri + `DEFAULTS` ile tamamlanır |
| PUT | `/settings` | ADMIN | `{ key: value, ... }` → her anahtar için `Setting.upsert` |

Bu ayarlar API davranışını **etkilemez** — yalnız depolanır ve admin panelde gösterilir.

---

## 11. Validatorlar

| Dosya | Kullanım |
|---|---|
| `auth.validator.js` | `registerValidator` (email, password min8 + büyük/küçük/rakam, fullName 2–100, phone E.164, role CUSTOMER/SALON_OWNER), `loginValidator` |
| `salon.validator.js` | `createSalonValidator` (name 2–100, phone E.164, email?, address min5, lat -90..90, lng -180..180, city, district, description max1000, workingHours object), `querySalonValidator`, `nearbyValidator` (radius 0.1–100) |
| `appointment.validator.js` | `createAppointmentValidator` (3 UUID, date `YYYY-MM-DD`, startTime `HH:MM`, note max500), `availableSlotsValidator` |
| `review.validator.js` | `createReviewValidator` (appointmentId UUID, rating 1–5, comment max1000, images array max4), `replyValidator` (1–500) |
| `product.validator.js` | `createProductValidator`, `updateProductValidator` (kullanılan), `queryProductValidator` (kullanılmayan) |

`validate` middleware'i `validationResult` boş değilse 400 + `errors[]` döner.

> `change-password` / `reset-password` minimumu **6**, register minimumu **8**'dir — tutarsız.
> `product.validator.js`'te iki mesajda bozuk karakter var: `0 veya更大 olmalıdır`.

---

## 12. E-posta ve SMS

**`utils/mailer.js`** (Nodemailer, SMTP):
- `sendEmailChangeOtp(to, salonName, otp)`
- `sendPasswordChangedEmail(to, fullName)`
- `sendPasswordResetOtp(to, fullName, otp)`

**`utils/sms.js`** — `sendSmsOtp(toPhone, otp)`: `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` tanımlıysa Twilio ile gönderir, yoksa konsola `📱 [SMS DEV] Alıcı ... OTP ...` yazar.

> `mailer.js` test modunda veya SMTP yapılandırılmamışsa `[mailer:noop]` yazıp çıkar (gerçek SMTP'ye bağlanmaz).

> `twilio` `package.json`'de **yok**. Twilio env'i tanımlıysa `require('twilio')` throw eder → SMS akışı 500 ile patlar.

---

## 13. Seed (`src/seeders/seed.js`)

Test kullanıcıları (`src/seeders/seed.js` → `USERS`):

| E-posta | Şifre (dev default) | Rol |
|---|---|---|
| admin@beautysalon.com | `Admin123!` | ADMIN |
| salon@beautysalon.com | `Salon123!` | SALON_OWNER |
| salon2@beautysalon.com | `Salon123!` | SALON_OWNER |
| musteri@beautysalon.com | `Musteri123!` | CUSTOMER |

Şifreler repoda tutulmaz. Yerelde yukarıdaki dev default'ları kullanılır; üretimde
`SEED_ADMIN_PASSWORD`, `SEED_SALON_PASSWORD`, `SEED_CUSTOMER_PASSWORD`
zorunludur ve eksikse seed çalışmayı reddeder.

İçerik: 6 kategori (Saç, Tırnak, Cilt Bakımı, Makyaj, Epilasyon, SPA & Masaj), 12 salon (İstanbul ilçeleri, `isVerified:true`, `workingHours` dolu), 7 çalışan (salon 0: 3, salon 1: 2, salon 6: 1, salon 7: 1), 16 hizmet + StaffService bağları, 9 yorum (5'i salon yanıtlı) → her yorum için bir COMPLETED randevu, tüm salonların rating ortalamaları gerçek yorumlardan hesaplanır. Diğer 8 salonun çalışanı/hizmeti yoktur.

Seed **idempotenttir**: her kayıt `findOrCreate` ile eklenir, `category_id` NULL kalmış hizmetleri onarır. `npm run seed:reset` tüm tabloları FK sırasıyla temizler.

---

## 14. Migration'lar

`src/database/migrations/` içinde 12 migration var (`20240101000001…12`). `.sequelizerc` → `src/config/sequelize-config.js` (dialect **postgres**).

Runtime ise `src/config/database.js` ile **SQLite** kullanır. Sonuçlar:
- `npm run migrate` Postgres'e gider, runtime DB'yi etkilemez.
- SQLite DB'de `SequelizeMeta` tablosu yoktur → migration'lar hiç uygulanmamıştır; şema `sync()` ile oluşur.
- Migration'larda `JSONB`, `DECIMAL(10,8)`, `ON DELETE CASCADE` gibi SQLite ile farklı davranan tanımlar vardır; model tanımlarıyla birebir uyuşmaz (ör. `salons.phone` migration'da nullable, modelde `allowNull:false`).

---

## 15. Testler

14 dosya, **291 test** — 2026-10-23'te bu ortamda tamamı geçiyor:

| Dosya | Test |
|---|---|
| `salon.test.js` | 37 ✅ |
| `appointment.test.js` | 38 ✅ |
| `auth.test.js` | 27 ✅ |
| `service-staff.test.js` | 26 ✅ |
| `category.test.js` | 23 ✅ |
| `product.test.js` | 23 ✅ |
| `notification.test.js` | 22 ✅ |
| `review.test.js` | 22 ✅ |
| `user.test.js` | 23 ✅ |
| `favorite.test.js` | 13 ✅ |
| `upload.test.js` | 12 ✅ |
| `app.test.js` | 11 ✅ |
| `admin.test.js` | 8 ✅ |
| `settings.test.js` | 6 ✅ |

Altyapı notları:

1. **Paylaşılan connection:** `tests/setup.js` tek `sequelize` instance'ı kullanır; `teardownDB()` bilinçli olarak **no-op**'dur (dosya sonunda `close()` çağırmak sonraki dosyanın `before all` hook'unu kırardı). Bağlantı süreç çıkışında kapatılır.
2. **Test DB:** `apps/api/src/test-database.sqlite`, `drop()` + `sync({ force: true })` ile kurulur.
3. **Rate limit:** `NODE_ENV=test` ise limiter'lar devre dışı (aksi halde supertest 429 alırdı).
4. **E-posta:** `NODE_ENV=test` veya SMTP yoksa `[mailer:noop]` — gerçek SMTP'ye bağlanmaz.
5. **Chai:** `expect(res).to.have.status(N)` kullanılmıyor, `to.have.property('status', N)` tercih ediliyor.
6. `npm test` Windows cmd'de `NODE_ENV=test mocha` biçimiyle kırılıyordu; script `node --env-file=.env.test ./node_modules/mocha/bin/mocha` olarak düzeltildi.

---

## 16. Bilinen Sorunlar / Teknik Borç (doğrulanmış)

| # | Sorun | Etki |
|---|---|---|
| 1 | `GET /appointments/available-slots`'te `authenticate` yok | CLAUDE.md "required" diyor; fiilen public |
| 2 | `GET /appointments/salon/:salonId` sahiplik kontrolü yok | Her SALON_OWNER her salonu görür |
| 3 | Randevuda `serviceId` salon uyumu kontrol edilmiyor (staff uyumu kontrol ediliyor) | Yanlış salon kombinasyonu kabul edilebilir |
| 4 | `workingHours` gün tanımı yoksa çalışma saati kontrolü atlanıyor | Kapalı güne randevu alınabilir |
| 5 | `workingHours` getter'ı çift-parse toleranslı | Çözüldü — string set edilen değerler de çalışıyor |
| 6 | `DATE_TRUNC` yerine `strftime` kullanılıyor | Çözüldü — `/admin/dashboard` SQLite'ta 200 |
| 7 | `twilio` bağımlılığı eksik | SMS akışı Twilio env'i ile 500 |
| 8 | `sharp` bağımlılığı tanımlı ama hiçbir yerde kullanılmıyor | Ölü bağımlılık |
| 9 | `swagger-jsdoc` + `swagger-ui-express` tanımlı ama swagger mount edilmemiş | OpenAPI çıktısı yok |
| 10 | `pg`/`pg-hstore` runtime'da kullanılmıyor (SQLite) | Ölü bağımlılık |
| 11 | `cookie-parser` kullanılmıyor, `optionalAuth` kullanılmıyor, `createProductValidator`/`queryProductValidator` kullanılmıyor | Ölü kod |
| 12 | `UPLOAD_DEST` kullanılıyor ama cwd'e göre çözülür | Farklı çalışma diziminde farklı `uploads/` |
| 13 | Multer `fileFilter` reddi `statusCode = 400` ile düşer | Çözüldü — 400 dönüyor |
| 14 | `errorHandler`'daki `err.type === 'validation'` dalı ölü | `validate` kendi yanıtlıyor |
| 15 | User e-posta değişikliği `passwordResetToken` alanını paylaşıyor | İki akış birbirini bozabilir |
| 16 | `sync()` + `ensureColumns()` kullanılıyor (`alter: true` yok) | Çözüldü; ancak `ensureColumns()` eksik tabloda patlar |
| 17 | Runtime DB fiilen `apps/api/src/database.sqlite`; `apps/api/database.sqlite` eski/yedek | Şema karışıklığı, yanlış dosyaya bakma |
| 18 | `toSafeJSON()` `passwordResetToken` / expiry alanlarını çıkarmaz | Login/register yanıtlarında hassas alan sızıntısı |
| 19 | `PATCH /users/:id/toggle-active` rol kontrolü yapar, sahiplik kontrolü yapmaz | Kullanıcı kendi aktifliğini kapatabilir |
| 20 | Settings ayarları hiçbir davranışı etkilemez (`maxLoginAttempts`, `rateLimitingEnabled`, `maintenanceModeEnabled` okunmaz) | Yalnız depolanır/panelde gösterilir |
| 21 | Review görünürlüğü değişince `ratingAvg` yeniden hesaplanmaz | Puan eski değerinde kalır |
| 22 | `staff_services` fiili şemada PK yok | Duplicate join kaydı engellenmez |
| 23 | `POST /salons/:id/staff`, `/services`, `/products` body doğrulanmaz | Yalnız model seviyesi zorunluluklar |
| 24 | `querySalonValidator` `sortBy`, `priceRange`, `categoryId`, `verified` doğrulamaz | Yanlış parametre sessizce yok sayılır |
| 25 | `GET /` endpoint listesi eksik (`/staff`, `/upload`, `/admin`) | Keşif yanıltıcı |
| 26 | Rate limit testte kapalı, production'ta açık | 429 davranışı test edilmiyor |
| 17 | Migration'lar ile model tanımları uyuşmuyor (nullable, JSONB, DECIMAL) | Şema tutarsızlığı |
| 18 | `toJSON()` bazı alanları iki kez basar (`ownerId` + `owner_id`) | İstemci kafa karışıklığı |
| 19 | Notification üreten kod yok | Bildirim sistemi salt okunur |
| 20 | `change-password` min 6 vs register min 8 | Tutarlılık |
| 21 | `DELETE /categories/:id` hard delete, diğerleri soft delete | Davranış tutarsızlığı |
| 22 | `service.routes` aynı controller'ı iki farklı yola mount ediyor | `/services/salons/:id/services` diye garip yol |

---

## 17. Hızlı Başlangıç (curl)

```bash
BASE=http://localhost:3200/api/v1   # .env default 3000; bu makinede 3200 kullanılıyor

# Health
curl $BASE/health

# Kayıt + token
TOKEN=$(curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"doc@example.com","password":"Test1234a","fullName":"Doc User"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")

# Kategoriler
curl -s $BASE/categories

# Salon listesi
curl -s "$BASE/salons?city=%C4%B0stanbul&sortBy=rating&limit=5"

# Yakındaki salonlar
curl -s "$BASE/salons/nearby?latitude=41.04&longitude=29.00&radius=5"

# Uygun slotlar
curl -s "$BASE/appointments/available-slots?salonId=<id>&staffId=<id>&serviceId=<id>&date=2026-10-20"

# Randevu
curl -s -X POST $BASE/appointments -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"salonId":"<id>","staffId":"<id>","serviceId":"<id>","date":"2026-10-20","startTime":"10:00","note":"İlk randevu"}'

# Dosya yükleme
curl -s -X POST $BASE/upload/single -H "Authorization: Bearer $TOKEN" -F "file=@logo.png"
```

---

## 18. Dokümantasyon Notu

Bu dosya `apps/api/` kodunun gerçek davranışını esas alır ve **2026-10-23** doğrulamasıyla hizalandı (canlı probe + `npm test` → 291 passing + `src/database.sqlite` şeması). Modüler ayrıntılı set: `docs/api/`.

2026-10-12 öncesindeki sürümde şema tablolarındaki `nullable` bilgileri hatalıydı, `Notifications` ve `Products` endpoint'leri eksikti ve son ~120 satır kopyalanmış "JWT doğrulama" metinlerinden oluşuyordu. Eski hali `docs/BACKEND-API.md.bak` içinde duruyor (gereksizse silinebilir).

`apps/api/CLAUDE.md` ile hâlâ çelişen noktalar: `available-slots` auth gerektirmez, `Notifications`/`Products`/`Settings` endpoint'leri CLAUDE.md'de listelenmemiştir, CLAUDE.md `sync({ alter: true })` der ama kod `sync()` + `ensureColumns()` kullanır, CLAUDE.md `cors()` originlerini sabit listeler ama kod `ALLOWED_ORIGINS` env'ini kullanır. CLAUDE.md'deki test durum tablosu (17 passing / 16 failing) artık geçersiz — suite tamamen geçiyor.
