# Beauty Salon API — CLAUDE.md

## Dokümantasyon
- Modüler ayrıntılı set: **`docs/api/`** (README + 01…12 + `openapi.yaml`) — 2026-10-15 doğrulaması.
- Tek sayfalık özet: `docs/BACKEND-API.md` (aynı tarihe hizalandı).
- Bu dosyadaki endpoint listesi özet halindedir. `available-slots` auth gerektirmez; `Notifications`, `Products` ve `Settings` endpoint'leri aşağıda eklenmiştir.

## Proje Özeti
Güzellik salonları için REST API. Müşteriler salon arayabilir, hizmet seçebilir, çalışan bazlı randevu alabilir, yorum yapabilir ve favorilere ekleyebilir. Salon sahipleri çalışan/hizmet yönetir, randevuları onaylar/iptal eder. Admin platform genelini denetler.

## Teknoloji Yığını
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js 5
- **ORM**: Sequelize 6 (SQLite default, PostgreSQL config mevcut)
- **Auth**: JWT (access 15dk, refresh 7 gün) + bcrypt
- **Validation**: express-validator
- **Upload**: Multer (JPEG/PNG/WebP/GIF, max 5MB)
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS, Morgan (dev logging)
- **Email**: Nodemailer (Mailtrap)
- **SMS**: Twilio (fallback: console.log dev mode)
- **File Storage**: Local (`./uploads/`)

## Başlatma

```bash
npm start          # production
npm run dev        # nodemon ile development
npm run seed       # manuel seed çalıştırma
```

`src/server.js` başlangıçta:
1. `connectDB()` ile SQLite'a bağlanır
2. `sequelize.sync()` ile eksik tabloları oluşturur (`alter: true` kullanılmaz)
3. `dropBackupTables()` + `ensureColumns()` ile şemayı tamamlar
4. User/ Salon count sıfırsa `seed()` çalıştırır
5. `app.listen(PORT)` ile sunucuyu açar

> Runtime DB dosyası fiilen `apps/api/src/database.sqlite`'dir (`config/database.js` → `path.join(__dirname, '..', ...)`, `__dirname = src/config`).

## API Base Path
`/api/v1` (`.env` → `API_PREFIX` ile değiştirilebilir)

## Tüm Endpoint'ler

### Health
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/health` | public | API sağlık kontrolü |

### Auth
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| POST | `/auth/register` | public | Kayıt (email, password, fullName, phone?, role?) |
| POST | `/auth/login` | public | Giriş (email, password) → accessToken + refreshToken |
| POST | `/auth/refresh` | public | Token yenileme (refreshToken) |
| POST | `/auth/logout` | required | Logout (refreshToken silinir) |
| POST | `/auth/change-password` | required | Şifre değiştirme (currentPassword, newPassword) |
| POST | `/auth/forgot-password` | public | Şifre sıfırlama OTP gönder (email) |
| POST | `/auth/reset-password` | public | Şifre sıfırlama (email, token, newPassword) |

### Users
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/users/me` | required | Profil bilgisi |
| PATCH | `/users/me` | required | Profil güncelleme (fullName, phone, avatarUrl) |
| GET | `/users` | ADMIN | Tüm kullanıcılar (sayfalı) |
| PATCH | `/users/:id/toggle-active` | ADMIN | Kullanıcı aktif/pasif |

### Salons
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/salons` | public | Salon listesi (search, city, district, minRating, sortBy, categoryId, page, limit) |
| GET | `/salons/nearby` | public | Yakındaki salonlar (latitude, longitude, radius) |
| GET | `/salons/:id` | public | Salon detayı (owner, staff, services) |
| POST | `/salons` | SALON_OWNER | Salon oluşturma |
| PATCH | `/salons/:id` | SALON_OWNER, ADMIN | Salon güncelleme |
| DELETE | `/salons/:id` | SALON_OWNER, ADMIN | Soft delete (isActive: false) |
| GET | `/salons/owner/my-salons` | SALON_OWNER | Kendi salonlarını listele |
| PATCH | `/salons/:id/verify` | ADMIN | Salon onaylama (isVerified: true) |
| POST | `/salons/:id/request-email-change` | SALON_OWNER | E-posta değişikliği iste (OTP gönder) |
| POST | `/salons/:id/confirm-email-change` | SALON_OWNER | E-posta değişikliği onayla (token) |
| POST | `/salons/:id/request-phone-change` | SALON_OWNER | Telefon değişikliği iste (OTP gönder) |
| POST | `/salons/:id/confirm-phone-change` | SALON_OWNER | Telefon değişikliği onayla (token) |

### Staff (sub-routes under `/salons/:salonId/staff`)
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/salons/:salonId/staff` | public | Salon çalışanları listesi |
| POST | `/salons/:salonId/staff` | SALON_OWNER | Çalışan ekle (fullName, title, bio, serviceIds) |
| PATCH | `/staff/:id` | SALON_OWNER | Çalışan güncelle |
| DELETE | `/staff/:id` | SALON_OWNER | Soft delete |

### Services
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/categories` | public | Hizmet kategorileri (sortOrder ASC) |
| POST | `/categories` | ADMIN | Kategori oluştur |
| PATCH | `/categories/:id` | ADMIN | Kategori güncelle |
| DELETE | `/categories/:id` | ADMIN | Kategori sil |
| GET | `/salons/:salonId/services` | public | Salon hizmetleri (kategori gruplu) |
| POST | `/salons/:salonId/services` | SALON_OWNER | Hizmet ekle |
| PATCH | `/services/:id` | SALON_OWNER | Hizmet güncelle |
| DELETE | `/services/:id` | SALON_OWNER | Soft delete |

### Appointments
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| POST | `/appointments` | required | Randevu oluştur (salonId, staffId, serviceId, date, startTime, note) |
| GET | `/appointments/available-slots` | **public** | Boş slotları getir (30dk aralıklı, salon workingHours + çakışma kontrolü) |
| GET | `/appointments/my` | required | Kendi randevularım |
| GET | `/appointments/salon/:salonId` | SALON_OWNER, ADMIN | Salon randevuları (date, status filter) |
| PATCH | `/appointments/:id/status` | SALON_OWNER, ADMIN | Randevu durumu güncelle |
| PATCH | `/appointments/:id/cancel` | required | Randevu iptal (müşteri) |

**Durum geçişleri**:
- `PENDING` → `CONFIRMED` | `CANCELLED`
- `CONFIRMED` → `COMPLETED` | `CANCELLED` | `NO_SHOW`

### Reviews
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| POST | `/reviews` | required | Yorum oluştur (appointmentId, rating, comment?, images?) |
| GET | `/reviews/salon/:salonId` | public | Salon yorumları (sayfalı) |
| GET | `/reviews/my` | required | Kendi yorumlarım |
| PATCH | `/reviews/:id/reply` | SALON_OWNER | Yorum yanıtla (salon sahibi) |
| PATCH | `/reviews/:id/toggle-visibility` | ADMIN | Görünürlük toggle |

### Favorites
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/favorites` | required | Favori salonlarım |
| POST | `/favorites/:salonId` | required | Toggle favori (varsa sil, yoksa ekle) |
| GET | `/favorites/:salonId/check` | required | Favori mi kontrolü |

### Notifications
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/notifications` | required | Sayfalı liste (`isRead`, `type` filtresi) |
| GET | `/notifications/unread-count` | required | Okunmamış sayı |
| PATCH | `/notifications/:id/read` | required | Okundu işaretle |
| PATCH | `/notifications/read-all` | required | Tümünü okundu |
| DELETE | `/notifications/:id` | required | Sil |

> Bu tabloya yazan kod yoktur — salt okunur sistem.

### Products
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/salons/:salonId/products` | public | Aktif ürünler (`search`, `category`, `sortBy`) |
| POST | `/salons/:salonId/products` | SALON_OWNER | Oluşturma |
| GET | `/products/:id` | public | Detay |
| PATCH | `/products/:id` | SALON_OWNER | Güncelle |
| DELETE | `/products/:id` | SALON_OWNER | Soft delete |

### Settings
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/settings` | ADMIN | Ayarlar (DB + DEFAULTS) |
| PUT | `/settings` | ADMIN | key/value upsert |

### Upload
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| POST | `/upload/single` | required | Tek dosya yükle (form: file) |
| POST | `/upload/multiple` | required | Çoklu dosya yükle (form: files, max 10) |

### Admin
| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Dashboard (stats, recent appointments, reviews) |
| GET | `/admin/salons` | ADMIN | Tüm salonlar (verified filter, sayfalı) |
| GET | `/admin/appointments` | ADMIN | Tüm randevular (status filter, sayfalı) |
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı) |

## Models & İlişkiler

### User
- `id` (UUID), `email` (unique), `phone` (unique, nullable), `fullName`, `avatarUrl`, `passwordHash`, `role` (ENUM: CUSTOMER/SALON_OWNER/ADMIN), `isVerified`, `isActive`, `refreshToken`, `passwordResetToken`, `passwordResetTokenExpiry`
- Hooks: `beforeCreate` → bcrypt hash
- Methods: `comparePassword()`, `toSafeJSON()`

### Salon
- `id`, `owner_id`, `name`, `description`, `phone`, `email`, `logoUrl`, `coverImageUrl`, `galleryImages` (JSON), `address`, `latitude`, `longitude`, `city`, `district`, `ratingAvg`, `reviewCount`, `isActive`, `isVerified`, `priceRange` (1-3), `workingHours` (JSON), `pendingEmail`, `pendingPhone`, `emailChangeToken`, `emailChangeTokenExpiry`, `phoneChangeToken`, `phoneChangeTokenExpiry`
- Indexes: [lat, lng], [city, district], [isActive, isVerified]

### Staff
- `id`, `salon_id`, `full_name`, `avatar_url`, `title`, `bio`, `isActive`

### ServiceCategory
- `id`, `name` (unique), `icon_name`, `sort_order` (no updatedAt)

### Service
- `id`, `salon_id`, `category_id`, `name`, `description`, `price` (DECIMAL), `duration_minutes`, `image_url`, `isActive`

### StaffService (join table, no timestamps)
- `staff_id`, `service_id` — modelde `primaryKey: true` iddiası var ama Sequelize composite PK desteklemez; fiili şemada PK yoktur (duplicate join kaydı engellenmez)

### Appointment
- `id`, `customer_id`, `salon_id`, `staff_id`, `service_id`, `date` (DATEONLY), `start_time` (TIME), `end_time` (TIME), `status` (ENUM: PENDING/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW), `note`, `cancellation_reason`
- Indexes: [salon_id, date, status], [staff_id, date], [customer_id, status]

### Review
- `id`, `customer_id`, `salon_id`, `appointment_id` (unique), `rating` (1-5), `comment`, `images` (JSONB), `salon_reply`, `salon_reply_at`, `is_visible`

### Favorite (id PK, no updatedAt)
- `id` (UUID PK), `user_id`, `salon_id`, `created_at`
- **UNIQUE index:** `[user_id, salon_id]`

### Setting (no updatedAt)
- `key` (PK, unique), `value` (JSON)

### Product
- `id`, `salon_id`, `name`, `description`, `price`, `stock_quantity`, `images` (JSONB), `category`, `isActive`

### Notification (no updatedAt)
- `id`, `user_id`, `title`, `body`, `type` (ENUM: APPOINTMENT/REVIEW/ORDER/SYSTEM), `data` (JSONB), `is_read`

### İlişki Özeti
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
Appointment 1──1 Review
User N──M Salon (Favorite)
Salon 1──N Product
User 1──N Notification
Setting (key/value)
```

## Middleware Sırası
1. `helmet()` → güvenlik headerları
2. `cors()` → `ALLOWED_ORIGINS` env (+ development'ta localhost herhangi port)
3. `rateLimit()` → genel: 100/60sn
4. `authLimiter()` → /auth/login, /auth/register: 10/60sn
5. `refreshLimiter()` → /auth/refresh: 60/60sn
6. `express.json(10mb)`, `express.urlencoded`, `cookieParser()`
7. `morgan('dev')` → sadece development
8. `/uploads` → static files
9. `API_PREFIX` altı → routes
10. 404 handler
11. `errorHandler` → global

## Error Handler Mapping
| Hata Tipi | Status | Yanıt |
|-----------|--------|-------|
| SequelizeValidationError | 400 | errors array |
| SequelizeUniqueConstraintError | 409 | field message |
| SequelizeForeignKeyConstraintError | 400 | ilişkili kayıt yok |
| express-validator | 400 | errors array |
| Multer LIMIT_FILE_SIZE | 400 | dosya boyutu büyük |
| TokenExpiredError | 401 | token süresi dolmuş |
| JsonWebTokenError | 401 | geçersiz token |
| Genel | 500 | sunucu hatası (dev: stack) |

## Response Format
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

## Validation Kuralları
- **Register**: email (valid), password (min 8, uppercase+lowercase+digit), fullName (2-100), phone (E.164), role (CUSTOMER/SALON_OWNER)
- **Create Salon**: name (2-100), phone (E.164), email (optional), address (min 5), lat (-90~90), lng (-180~180), city, district, workingHours (object)
- **Nearby**: lat, lng, radius (0.1-100km)
- **Appointment**: UUID format, date (YYYY-MM-DD), time (HH:MM), note (max 500)
- **Review**: appointmentId (UUID), rating (1-5), comment (max 1000), images (max 4)

## Seed Verileri
### Test Kullanıcıları
E-postalar `src/seeders/seed.js` -> `USERS` içinde. Şifreler repoda
tutulmaz: yerelde seed varsayılanını kullanır, üretimde `SEED_*_PASSWORD`
env değişkenleri zorunludur (NODE_ENV=production'da varsayılan reddedilir).

### Seed İçerikleri
- 6 kategori: Saç, Tırnak, Cilt Bakımı, Makyaj, Epilasyon, SPA & Masaj
- 12 salon (İstanbul'un farklı ilçeleri)
- İlk salon için 3 çalışan, 7 hizmet
- 5 geçmiş randevu + yorum (ilkinin salon yanıtı var)

## Önemli İş Kuralları
1. **Randevu oluşturma**: Çalışanın hizmeti sunması gerekir, çakışma kontrolü yapılır, salon workingHours kontrol edilir, endTime otomatik hesaplanır
2. **Yorum**: Sadece COMPLETED randevuya, bir kez, kendi randevusuna
3. **Review oluşturulunca**: Transaction içinde salon ratingAvg ve reviewCount güncellenir
4. **Salon soft delete**: `isActive: false`
5. **Hizmet soft delete**: `isActive: false`
6. **Email/Telefon değişikliği**: OTP doğrulama ile (email veya SMS), 10dk geçerli
7. **Nearby**: Haversine formülü ile km hesaplama, lat/lng bounding box + filter
8. **Available slots**: 30dk aralıklı, mevcut randevulara göre çakışma kontrolü

## .env Değişkenleri
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION
PORT, NODE_ENV, API_PREFIX
UPLOAD_DEST, MAX_FILE_SIZE
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
RATE_LIMIT_WINDOW, RATE_LIMIT_MAX
ALLOWED_ORIGINS (virgülle ayrılmış CORS origin listesi)
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (opsiyonel)
```

## Test Kullanıcıları (API)
Backend testleri için seed verilerindeki kullanıcıları kullan.

Testler 2026-10-23 itibarıyla tamamen geçiyor (14 dosya, 291 test). Ayrıntı: `docs/api/10-tests.md`.
