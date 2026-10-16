# 02 — Mimari: istek yaşam döngüsü, yanıt formatı, hata işleme

## Middleware sırası (`src/app.js`)

| # | Middleware | Açıklama |
|---|---|---|
| 1 | `helmet()` | HTTP güvenlik headerları |
| 2 | `cors()` | `ALLOWED_ORIGINS` (virgülle ayrılmış) + development'ta `localhost`/`127.0.0.1` herhangi port. Origin göndermeyen istekler (curl, Postman, supertest) kabul edilir. `credentials: true`, methods `GET,POST,PUT,PATCH,DELETE`, headers `Content-Type, Authorization` |
| 3 | `limiter` | genel: `RATE_LIMIT_WINDOW` (60000) / `RATE_LIMIT_MAX` (100). **Test ortamında devre dışı** |
| 4 | `authLimiter` | `/api/v1/auth/login` ve `/api/v1/auth/register`: 10/60sn. Test'te devre dışı |
| 5 | `refreshLimiter` | `/api/v1/auth/refresh`: 60/60sn. Test'te devre dışı |
| 6 | `express.json({limit:'10mb'})`, `express.urlencoded`, `cookieParser()` | `cookie-parser` mount ediliyor ama hiçbir yerde kullanılmıyor |
| 7 | `morgan('dev')` | yalnız `NODE_ENV === 'development'` |
| 8 | `express.static(uploads)` | `/uploads/<dosya>` — **`/api/v1` öneki olmadan** servis edilir |
| 9 | `app.use(API_PREFIX, routes)` | `API_PREFIX` default `/api/v1` |
| 10 | 404 handler | `{ success:false, message: "Route bulunamadı: METHOD url" }` |
| 11 | `errorHandler` | global |

> ⚠️ `/uploads` statik mount'u `API_PREFIX`'ten **önce** ve onsuz gelir. Yüklenen dosyaların URL'i kök-görelidir (`/uploads/<uuid>.png`). Flutter tarafında `Image.network` mutlak URL istediği için `resolveMediaUrl()` helper'ı kullanılmalıdır.

## Route haritası (`src/routes/index.js`)

```
GET  /                       → endpoint dizisi
GET  /health                 → sağlık kontrolü
/auth          → auth.routes
/users         → user.routes
/salons        → salon.routes      (staff, service, product sub-route'ları da burada)
/staff         → staff.routes
/services      → service.routes
/categories    → category.routes
/appointments  → appointment.routes
/reviews       → review.routes
/favorites     → favorite.routes
/upload        → upload.routes
/admin         → admin.routes
/notifications → notification.routes
/products      → product.routes
/settings      → settings.routes
```

`GET /` yanıtındaki `endpoints` listesi günceldir ama `/staff`, `/upload`, `/admin` içermez.

## Yanıt formatı

### Başarılı (`utils/helpers.js → successResponse`)

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-15T22:18:29.279Z"
}
```

`successResponse(res, data, statusCode = 200)` — create işlemleri `201` ile döner.

### Sayfalılı (`paginatedResponse`)

```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "meta": { "total": 12, "page": 1, "limit": 1, "totalPages": 12 }
  },
  "timestamp": "..."
}
```

`paginate(page, limit)`: `page ≥ 1`, `limit` 1–100 (default 20), `offset = (page-1)*limit`.

Canlı örnek (`GET /api/v1/salons?limit=1&city=İstanbul&sortBy=rating`):

```json
{
  "success": true,
  "data": {
    "data": [ { "id": "890cdc38-...", "name": "Elegance Beauty Studio", "ratingAvg": 4.6, "reviewCount": 5, ... } ],
    "meta": { "total": 12, "page": 1, "limit": 1, "totalPages": 12 }
  },
  "timestamp": "2026-10-15T22:18:29.285Z"
}
```

> `paginate` helper'ı kullanan route'lar `data.data` + `data.meta` döner; `notifications` controller'ı da aynı şekli elle kurar. Diğer listeler (staff, services, products, favorites) düz dizi döner.

### Hatalı

```json
{ "success": false, "message": "Salon bulunamadı" }
```

Validation hatalarında `errors[]` eklenir:

```json
{ "success": false, "message": "Doğrulama hatası", "errors": ["Geçerli bir salon ID giriniz"] }
```

Development'ta 500 yanıtlarında `stack` alanı da basılır.

## Hata işleme (`middlewares/errorHandler.js`)

| Hata | Status | Yanıt |
|---|---|---|
| `SequelizeValidationError` | 400 | `message: "Doğrulama hatası"`, `errors: [...]` |
| `SequelizeUniqueConstraintError` | 409 | `Bu <alan> zaten kullanılıyor` |
| `SequelizeForeignKeyConstraintError` | 400 | `İlişkili kayıt bulunamadı` |
| `MulterError` | 400 | `LIMIT_FILE_SIZE` → "Dosya boyutu çok büyük (max 5MB)", `LIMIT_FILE_COUNT` → "En fazla 10 dosya", `LIMIT_UNEXPECTED_FILE` → "Beklenmeyen dosya alanı" |
| `TokenExpiredError` | 401 | `Oturum süresi dolmuş, lütfen tekrar giriş yapın` (auth middleware'de) |
| `JsonWebTokenError` | 401 | `Geçersiz token` (auth middleware'de) |
| `err.statusCode` taşıyan hata | o status | `err.message` (ör. Multer `fileFilter` reddi → 400) |
| Genel | 500 | `Sunucu hatası` (+ development'ta `stack`) |

Canlı doğrulama (Metin dosyası yüklenince):

```
POST /api/v1/upload/single  → 400
{ "success": false, "message": "Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir", "stack": "..." }
```

`stack` yalnız development'ta görünür.

`errorHandler`'daki `err.type === 'validation'` dalı **ölüdür**: `validate` middleware'i validation hatasını kendi yanıtlıyor, `next(err)` çağırmıyor.

## Status kodları özeti

| Kod | Ne zaman |
|---|---|
| 200 | Başarılı okuma/güncelleme |
| 201 | `POST /auth/register`, `POST /salons`, `POST /salons/:id/staff`, `POST /salons/:id/services`, `POST /salons/:id/products`, `POST /categories`, `POST /appointments`, `POST /reviews` |
| 400 | express-validator, Sequelize validation, iş kuralı ihlali (geçmiş tarih, çalışma saati dışı, terminal durum, yorum koşulları), Multer dosya hatası |
| 401 | Token yok/geçersiz/süresi dolmuş, pasif hesap, yanlış login |
| 403 | Rol yetkisizliği veya sahiplik kontrolü başarısızlığı |
| 404 | Kayıt bulunamadı, route bulunamadı |
| 409 | Unique çakışması (email/phone/kategori adı), randevu saat çakışması |
| 429 | Rate limit |
| 500 | Beklenmeyen hata |

## Örnek: tam bir istek zinciri

```
POST /api/v1/auth/login            → 200 { user, accessToken, refreshToken }
GET  /api/v1/salons?limit=1        → 200 { data: { data:[...], meta:{...} } }
GET  /api/v1/salons/:id/staff      → 200 [ staff + services ]
GET  /api/v1/appointments/available-slots?...  → 200 [ {time, available} ]
POST /api/v1/appointments          → 201 appointment
PATCH /api/v1/appointments/:id/status (owner) → 200
PATCH /api/v1/appointments/:id/cancel (customer) → 200
POST /api/v1/reviews               → 201 review + salon rating güncellenir
```
