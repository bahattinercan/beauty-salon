# 04 — Veri modeli

Şema `sequelize.sync()` ile oluşur (`underscored: true`, `timestamps: true` global default). Aşağıdaki şema canlı `apps/api/src/database.sqlite` dosyasından alınmıştır.

## ER özeti

```mermaid
erDiagram
    USERS ||--o{ SALONS : "owner_id"
    SALONS ||--o{ STAFF : "salon_id"
    SALONS ||--o{ SERVICES : "salon_id"
    SALONS ||--o{ PRODUCTS : "salon_id"
    SALONS ||--o{ APPOINTMENTS : "salon_id"
    SALONS ||--o{ REVIEWS : "salon_id"
    SERVICE_CATEGORIES ||--o{ SERVICES : "category_id"
    STAFF }o--o{ SERVICES : "staff_services"
    USERS ||--o{ APPOINTMENTS : "customer_id"
    STAFF ||--o{ APPOINTMENTS : "staff_id"
    SERVICES ||--o{ APPOINTMENTS : "service_id"
    USERS ||--o{ REVIEWS : "customer_id"
    APPOINTMENTS ||--o| REVIEWS : "appointment_id (unique)"
    USERS }o--o{ SALONS : "favorites"
    USERS ||--o{ NOTIFICATIONS : "user_id"
    SETTINGS : "key/value"
```

## Model dosyaları (`src/models/`)

`User, Salon, Staff, ServiceCategory, Service, StaffService, Appointment, Review, Favorite, Product, Notification, Setting` — ilişkiler `models/index.js` içinde tanımlanır.

---

## `users`

| Kolon | Tip | Not |
|---|---|---|
| `id` | UUID PK | UUIDV4 |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE, `isEmail` validate |
| `phone` | VARCHAR(255) | UNIQUE, nullable |
| `full_name` | VARCHAR(255) | NOT NULL, len 2–100 |
| `avatar_url` | VARCHAR(255) | nullable |
| `password_hash` | VARCHAR(255) | NOT NULL — `beforeCreate`/`beforeUpdate` hook'unda bcrypt(12) |
| `role` | TEXT (ENUM) | `CUSTOMER` / `SALON_OWNER` / `ADMIN`, default `CUSTOMER` |
| `is_verified` | TINYINT | default 0 |
| `is_active` | TINYINT | default 1 |
| `refresh_token` | TEXT | bcrypt hash'li refresh token |
| `password_reset_token` | VARCHAR(255) | OTP hash **veya** `EMAILCHANGE:<hash>:<base64>` |
| `password_reset_token_expiry` | DATETIME | 10 dk |
| `created_at` / `updated_at` | DATETIME | |

Instance metotları: `comparePassword(p)`, `toSafeJSON()` (`passwordHash`, `refreshToken` çıkarır).

> `toSafeJSON()` `password_reset_token` ve `password_reset_token_expiry`'i **çıkarmaz** — login/register yanıtlarında görünür.

---

## `salons`

| Kolon | Tip | Not |
|---|---|---|
| `id` | UUID PK | |
| `owner_id` | UUID FK → users | NOT NULL |
| `name` | VARCHAR(255) | NOT NULL, len 2–100 |
| `description` | TEXT | max 1000 (validator) |
| `phone` | VARCHAR(255) | NOT NULL, E.164 (validator) |
| `email` | VARCHAR(255) | nullable, `isEmail` |
| `logo_url` / `cover_image_url` | VARCHAR(255) | kök-göreli `/uploads/...` |
| `gallery_images` | TEXT | JSON string; getter `JSON.parse`, setter `JSON.stringify` |
| `address` | VARCHAR(255) | NOT NULL, min 5 (validator) |
| `latitude` / `longitude` | FLOAT | NOT NULL |
| `city` / `district` | VARCHAR(255) | NOT NULL |
| `rating_avg` | FLOAT | default 0 — yalnız `isVisible` yorumlardan hesaplanır |
| `review_count` | INTEGER | default 0 |
| `is_active` | TINYINT | default 1 — **soft delete** alanı |
| `is_verified` | TINYINT | default 0 — admin onayı |
| `price_range` | INTEGER | 1–3, default 2 |
| `working_hours` | TEXT | JSON string; getter çift-parse toleranslı |
| `pending_email`, `pending_phone` | VARCHAR(255) | OTP akışında bekleyen değer |
| `email_change_token`, `phone_change_token` | VARCHAR(255) | bcrypt(10) hash |
| `email_change_token_expiry`, `phone_change_token_expiry` | DATETIME | 10 dk |

**Indexler:** `(latitude, longitude)`, `(city, district)`, `(is_active, is_verified)`.

> `working_hours` getter'ı string gelirse parse eder; nesne gelirse nesne döner. Setter string'i olduğu gibi, nesneyi `JSON.stringify` ile yazar. Controller'larda `salon.workingHours?.[dayOfWeek]` şeklinde kullanılır.

---

## `staff`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `salon_id` | UUID FK → salons |
| `full_name` | VARCHAR(255) NOT NULL |
| `avatar_url` | VARCHAR(255) |
| `title` | VARCHAR(255) NOT NULL |
| `bio` | TEXT |
| `is_active` | TINYINT default 1 (soft delete) |

---

## `service_categories`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `name` | VARCHAR(255) NOT NULL UNIQUE |
| `icon_name` | VARCHAR(255) NOT NULL |
| `sort_order` | INTEGER default 0 |
| `description` | VARCHAR(255) |
| `is_active` | TINYINT default 1 |
| `created_at` | DATETIME (`updatedAt: false`) |

---

## `services`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `salon_id` | UUID FK → salons |
| `category_id` | UUID FK → service_categories |
| `name` | VARCHAR(255) NOT NULL |
| `description` | TEXT |
| `price` | DECIMAL(10,2) NOT NULL |
| `duration_minutes` | INTEGER NOT NULL |
| `image_url` | VARCHAR(255) |
| `is_active` | TINYINT default 1 (soft delete) |

---

## `staff_services` (join)

| Kolon | Tip |
|---|---|
| `staff_id` | UUID FK → staff (modelde `primaryKey: true`) |
| `service_id` | UUID FK → services (`ON DELETE CASCADE ON UPDATE CASCADE`) |

`timestamps: false`.

> Sequelize modelinde `primaryKey: ['staff_id','service_id']` composite PK desteklemez; fiili şemada PK yoktur. Bu, `StaffService.bulkCreate` için sorun yaratmaz ama duplicate kayıt engellenmez.

---

## `appointments`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `customer_id` | UUID FK → users |
| `salon_id` | UUID FK → salons |
| `staff_id` | UUID FK → staff |
| `service_id` | UUID FK → services |
| `date` | DATE (DATEONLY) NOT NULL |
| `start_time` / `end_time` | TIME NOT NULL |
| `status` | TEXT (ENUM) `PENDING` default, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW` |
| `note` | TEXT (max 500 validator) |
| `cancellation_reason` | TEXT |

**Indexler:** `(salon_id, date, status)`, `(staff_id, date)`, `(customer_id, status)`.

---

## `reviews`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `customer_id` | UUID FK → users |
| `salon_id` | UUID FK → salons |
| `appointment_id` | UUID FK → appointments, **UNIQUE** (randevu başına tek yorum) |
| `rating` | INTEGER NOT NULL, 1–5 |
| `comment` | TEXT (max 1000 validator) |
| `images` | JSONB default `[]` (max 4 validator) |
| `salon_reply` | TEXT |
| `salon_reply_at` | DATETIME |
| `is_visible` | TINYINT default 1 |

---

## `favorites`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `user_id` | UUID FK → users |
| `salon_id` | UUID FK → salons |
| `created_at` | DATETIME (`updatedAt: false`) |

**Index:** `UNIQUE (user_id, salon_id)` — bir kullanıcı bir salonu yalnız bir kez favoriler.

---

## `products`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `salon_id` | UUID FK → salons |
| `name` | VARCHAR(255) NOT NULL |
| `description` | TEXT |
| `price` | DECIMAL(10,2) NOT NULL |
| `stock_quantity` | INTEGER default 0 |
| `images` | JSONB default `[]` |
| `category` | VARCHAR(255) |
| `is_active` | TINYINT default 1 (soft delete) |

---

## `notifications`

| Kolon | Tip |
|---|---|
| `id` | UUID PK |
| `user_id` | UUID FK → users |
| `title` | VARCHAR(255) NOT NULL |
| `body` | TEXT NOT NULL |
| `type` | TEXT (ENUM) `APPOINTMENT` / `REVIEW` / `ORDER` / `SYSTEM` |
| `data` | JSONB |
| `is_read` | TINYINT default 0 |
| `created_at` | DATETIME (`updatedAt: false`) |

> Bu tabloya yazan **hiçbir kod yoktur** — bildirim sistemi salt okunur bir API'dir.

---

## `settings`

| Kolon | Tip |
|---|---|
| `key` | VARCHAR(255) PK (UNIQUE) |
| `value` | JSON NOT NULL |
| `created_at` | DATETIME (`updatedAt: false`) |

Admin panel ayarları key/value olarak saklanır; DB'de olmayan anahtarlar `settings.controller.js`'teki `DEFAULTS` ile doldurulur.

---

## İlişki alias'ları (`models/index.js`)

| İlişki | Alias |
|---|---|
| `Salon.belongsTo(User)` | `owner` |
| `User.hasMany(Salon)` | `ownedSalons` |
| `Salon.hasMany(Staff)` | `staff` |
| `Staff.belongsTo(Salon)` | `salon` |
| `Salon.hasMany(Service)` | `services` |
| `Service.belongsTo(Salon)` | `salon` |
| `ServiceCategory.hasMany(Service)` | `services` |
| `Service.belongsTo(ServiceCategory)` | `category` |
| `Staff.belongsToMany(Service)` | `services` (through `StaffService`) |
| `Service.belongsToMany(Staff)` | `staffMembers` |
| `Appointment.belongsTo(User/Staff/Service/Salon)` | `customer`, `staff`, `service`, `salon` |
| `Review.belongsTo(User/Salon/Appointment)` | `customer`, `salon`, `appointment` |
| `Appointment.hasOne(Review)` | `review` |
| `Favorite.belongsTo(User/Salon)` | `user`, `salon` |
| `Product.belongsTo(Salon)` | `salon` |
| `Notification.belongsTo(User)` | `user` |

## JSON çıktı tuzağı

`underscored: true` nedeniyle `toJSON()` aynı alanı iki kez basar:

```json
{ "id": "...", "salonId": "...", "salon_id": "..." }
```

İstemci tarafında hangisinin kullanılacağı tutarsızdır (Flutter/Next tarafı camelCase kullanır).
