# 05 — Endpoint referansı

Base: `http://localhost:3200/api/v1` (`.env` → `API_PREFIX`)

Auth sütunu: `public` = token gerekmez, `required` = herhangi bir giriş yapmış kullanıcı, aksi halde rol.

---

## 5.1 Genel

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/` | public | Endpoint dizisi |
| GET | `/health` | public | Sağlık kontrolü |

```json
{ "success": true, "message": "Beauty Salon API is running", "timestamp": "2026-10-15T22:18:14.784Z" }
```

---

## 5.2 Auth

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/auth/register` | public (10/60sn) | Kayıt → user + token çifti |
| POST | `/auth/login` | public (10/60sn) | Giriş → user + token çifti |
| POST | `/auth/refresh` | public (60/60sn) | Refresh ile yeni çift |
| POST | `/auth/logout` | required | `refresh_token = null` |
| POST | `/auth/change-password` | required | `currentPassword`, `newPassword` (min 6) |
| POST | `/auth/forgot-password` | public | 6 haneli OTP e-posta (10 dk) |
| POST | `/auth/reset-password` | public | `email`, `token`, `newPassword` (min 6) |

Detay: [03-auth.md](03-auth.md)

---

## 5.3 Users

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/users/me` | required | Profil (`id, email, fullName, phone, avatarUrl, role, isVerified, createdAt`) |
| PATCH | `/users/me` | required | `fullName`, `phone`, `avatarUrl` — **email değiştirilemez** |
| POST | `/users/me/request-email-change` | required | `newEmail` → OTP mevcut e-postaya gönderilir |
| POST | `/users/me/confirm-email-change` | required | `token` → e-posta güncellenir |
| GET | `/users` | ADMIN | Sayfalı liste, `createdAt DESC`, hassas alanlar yok |
| PATCH | `/users/:id/toggle-active` | ADMIN | `isActive` tersine çevirir |

> `toggle-active` ADMIN'dir; kullanıcı kendi aktifliğini bu endpoint üzerinden değiştirebilir mi? Test `should allow users to toggle their own active status` ADMIN token'ı ile kendi id'sini kapatıyor — yani kontrol rol bazlı, sahiplik bazlı değil.

---

## 5.4 Salons

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons` | public | Sayfalı liste — yalnız `isActive && isVerified` |
| GET | `/salons/nearby` | public | Haversine ile yakındaki salonlar |
| GET | `/salons/owner/my-salons` | SALON_OWNER | Kendi aktif salonları |
| GET | `/salons/:id` | public | Detay: `owner` + aktif staff (+hizmetleri) + aktif services (+kategori) |
| POST | `/salons` | SALON_OWNER | Oluşturma (validator) |
| PATCH | `/salons/:id` | SALON_OWNER (sahiplik) / ADMIN | Güncelleme |
| DELETE | `/salons/:id` | SALON_OWNER (sahiplik) / ADMIN | **Soft delete** (`isActive = false`) |
| PATCH | `/salons/:id/verify` | ADMIN | `isVerified = true` |
| POST | `/salons/:id/request-email-change` | SALON_OWNER (sahiplik) | OTP iste (`verifyVia`: `email`\|`sms`) |
| POST | `/salons/:id/confirm-email-change` | SALON_OWNER (sahiplik) | OTP doğrula |
| POST | `/salons/:id/request-phone-change` | SALON_OWNER (sahiplik) | OTP iste (`verifyVia`: `sms`\|`email`) |
| POST | `/salons/:id/confirm-phone-change` | SALON_OWNER (sahiplik) | OTP doğrula |

### `GET /salons` query parametreleri

| Param | Açıklama |
|---|---|
| `page`, `limit` | limit max 100, default 20 |
| `search` | `name` / `address` / `city` üzerinde `LIKE %..%` (OR) |
| `city`, `district` | `LIKE` (wildcard'sız — tam eşleşmeye yakın) |
| `minRating` | `ratingAvg >= değer` |
| `priceRange` | `1`, `2`, `3` |
| `verified=true` | `isVerified = true` (zaten default'ta var) |
| `categoryId` | INNER JOIN → o kategoride aktif hizmeti olan salonlar |
| `sortBy` | `rating` → `ratingAvg DESC`; `newest` → `createdAt DESC` (default) |

> `querySalonValidator` `sortBy`, `priceRange`, `categoryId`, `verified` parametrelerini **doğrulamaz** — yanlış değer sessizce yok sayılır.

Canlı örnek:

```json
{ "success": true,
  "data": {
    "data": [
      { "id":"890cdc38-8761-414b-a377-3ba3b8ff18ff", "name":"Elegance Beauty Studio",
        "city":"İstanbul","district":"Kadıköy","ratingAvg":4.6,"reviewCount":5,
        "priceRange":3,"isVerified":true,"isActive":true,
        "galleryImages":["/uploads/22ffd656-....jpg"],
        "workingHours":{"monday":{"open":"09:00","close":"21:00"}, ...},
        "owner_id":"b53e9d24-..." }
    ],
    "meta": { "total":12, "page":1, "limit":1, "totalPages":12 }
  },
  "timestamp":"..." }
```

### `GET /salons/nearby`

`latitude`, `longitude` (zorunlu), `radius` (0.1–100 km, default 10), `page`, `limit`.

1. Derece bazlı bounding box: `radius / 111.32`
2. Haversine ile kesin mesafe, `distance <= radius` filtresi
3. Mesafeye göre artan sıralama, sonra sayfalama

Sonuç öğelerinde ek alan: `distance` (km, 2 ondalık).

### `PATCH /salons/:id`

Body'den **silinen** alanlar: `email`, `pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry`. E-posta yalnız OTP akışıyla değişir.

### OTP akışı (salon)

- OTP: `crypto.randomInt(100000, 999999)` → 6 hane, bcrypt(10) hash'li, 10 dk geçerli
- Süresi dolmuşsa token + pending alanları temizlenir → 400 `Doğrulama kodunun süresi dolmuş`
- Sahiplik: `ownerId === req.user.id` (ADMIN bu route'larda **yetkili değildir**)
- Aynı e-posta/numara istenirse → 400 `Yeni ... mevcut ile aynı`

---

## 5.5 Staff

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons/:salonId/staff` | public | Aktif çalışanlar + hizmetleri (+kategori), `fullName ASC` |
| POST | `/salons/:salonId/staff` | SALON_OWNER | Oluşturma + `serviceIds` ile join kayıtları |
| PATCH | `/staff/:id` | SALON_OWNER (sahiplik) | Güncelle; `serviceIds` verilirse join **önce silinir**, yeniden yazılır |
| DELETE | `/staff/:id` | SALON_OWNER (sahiplik) | Soft delete |

Canlı örnek (`GET /salons/:id/staff`):

```json
{ "success": true,
  "data": [
    { "id":"5a4ae24c-...","fullName":"Merve Demir","title":"Kıdemli Kuaför",
      "bio":"10 yıllık tecrübe ile saç tasarımı uzmanı","isActive":true,
      "services":[ { "id":"088826fd-...","name":"Saç Boyama","price":500,"durationMinutes":120,
                    "category":{"id":"609550fc-...","name":"Saç","sortOrder":1} } ] }
  ],
  "timestamp":"..." }
```

---

## 5.6 Services

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons/:salonId/services` | public | Aktif hizmetler, `category.sortOrder ASC` sonra `name ASC` |
| POST | `/salons/:salonId/services` | SALON_OWNER | Oluşturma (+kategori) |
| GET | `/services/:id` | public | Detay (+kategori) |
| PATCH | `/services/:id` | SALON_OWNER (sahiplik) | Güncelle |
| DELETE | `/services/:id` | SALON_OWNER (sahiplik) | Soft delete |

> `service.routes.js` aynı controller'ı ikinci bir yola daha mount eder: `GET/POST /services/salons/:salonId/services`. Bu, `salon.routes` ile çift mount'tur (garip ama çalışır).

---

## 5.7 Categories

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/categories` | public | `sortOrder ASC` + `serviceCount` (COUNT GROUP BY) |
| POST | `/categories` | ADMIN | `name`, `iconName` zorunlu; `sortOrder` default 0 → 201 |
| PATCH | `/categories/:id` | ADMIN | Kısmi güncelleme; çakışan ad → 409 |
| DELETE | `/categories/:id` | ADMIN | **Hard delete** (`destroy()`) |

Canlı örnek:

```json
{ "id":"609550fc-...","name":"Saç","iconName":"content_cut","sortOrder":1,
  "description":null,"isActive":true,"createdAt":"2026-10-13T17:28:28.653Z","serviceCount":5 }
```

---

## 5.8 Appointments

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/appointments` | required | Randevu oluştur → 201 |
| GET | `/appointments/available-slots` | **public** (route'ta `authenticate` yok) | 30 dk aralıklı slot listesi |
| GET | `/appointments/my` | required | Kendi randevuları (`status` filtresi), `date DESC, startTime DESC` |
| GET | `/appointments/salon/:salonId` | SALON_OWNER / ADMIN | Salon randevuları (`date` veya `from`+`to`, `status`), `date ASC, startTime ASC` |
| PATCH | `/appointments/:id/status` | SALON_OWNER (sahiplik) / ADMIN | Durum geçişi |
| PATCH | `/appointments/:id/cancel` | required (sahiplik) | İptal, `reason` opsiyonel |

Kurallar ayrıntısı: [06-business-rules.md](06-business-rules.md)

Canlı `POST /appointments` (201):

```json
{ "success": true,
  "data": {
    "id":"f25bd548-...","customerId":"04e2079e-...","salonId":"890cdc38-...",
    "staffId":"5a4ae24c-...","serviceId":"a30bc9c4-...",
    "date":"2026-11-06","startTime":"10:00","endTime":"13:00","status":"PENDING",
    "note":"doc probe","cancellationReason":null,
    "salon":{"id":"890cdc38-...","name":"Elegance Beauty Studio","phone":"+902161234567"},
    "staff":{"id":"5a4ae24c-...","fullName":"Merve Demir"},
    "service":{"id":"a30bc9c4-...","name":"Ombre / Balyaj","price":1200,"durationMinutes":180}
  },
  "timestamp":"..." }
```

Canlı hata örnekleri:

| Durum | Yanıt |
|---|---|
| Aynı saat, aynı çalışan | 409 `Seçilen saatte çalışanın başka bir randevusu var (saat çakışması)` |
| Geçmiş tarih | 400 `Geçmiş bir tarihe randevu alınamaz` |
| Çalışma saati dışı | 400 `Seçilen saat, salonun çalışma saatleri dışında` |
| Müşteri durum değiştirir | 403 `Bu işlem için yetkiniz bulunmuyor` |
| Terminal durumdan geçiş | 400 `Bu randevu üzerinde işlem yapılamaz` |
| Saat geçmeden COMPLETED | 400 `Randevu saati henüz geçmedi, tamamlanamaz` |

Canlı `available-slots` yanıtı:

```json
{ "success": true, "data": [
  { "time": "09:00", "available": true },
  { "time": "09:30", "available": true },
  ...
], "timestamp": "..." }
```

---

## 5.9 Reviews

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/reviews` | required | Yorum → 201; transaction içinde salon puanı güncellenir |
| GET | `/reviews/salon/:salonId` | public | Sayfalı, yalnız `isVisible`; customer + service adı |
| GET | `/reviews/my` | required | Kendi yorumları (+salon) |
| PATCH | `/reviews/:id/reply` | SALON_OWNER (sahiplik) | `reply` (1–500) + `salonReplyAt` |
| PATCH | `/reviews/:id/toggle-visibility` | ADMIN | `isVisible` tersine çevir |

Koşullar: randevu var (404), randevu **COMPLETED** (400), randevu yorumcuya ait (403), randevuya yorum yapılmamış (400).

---

## 5.10 Favorites

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/favorites` | required | Favori salonlar (`createdAt DESC`) — yanıt salon nesneleri |
| POST | `/favorites/:salonId` | required | **Toggle**: varsa sil → `{isFavorite:false}`, yoksa ekle → `{isFavorite:true}` (salon yoksa 404) |
| GET | `/favorites/:salonId/check` | required | `{ isFavorite: true|false }` |

Canlı: `POST /favorites/<id>` → `{"success":true,"data":{"isFavorite":true}}`, tekrar → `{"isFavorite":false}`.

---

## 5.11 Notifications

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/notifications` | required | Sayfalı; `isRead=true/false`, `type` filtresi, `createdAt DESC` |
| GET | `/notifications/unread-count` | required | `{ count }` |
| PATCH | `/notifications/:id/read` | required | Okundu işaretle |
| PATCH | `/notifications/read-all` | required | Tümünü okundu |
| DELETE | `/notifications/:id` | required | Sil |

Tüm route'lar `router.use(authenticate)` ile korunur ve sorgular `user_id` ile sınırlıdır.

> Bu tabloya yazan kod yoktur; bildirimler yalnızca test seed'i veya elle eklenir.

---

## 5.12 Products

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/salons/:salonId/products` | public | Aktif ürünler; `search` (LIKE), `category`, `sortBy=price` (yoksa `createdAt DESC`) |
| POST | `/salons/:salonId/products` | SALON_OWNER (sahiplik) | Oluşturma → 201 |
| GET | `/products/:id` | public | Detay |
| PATCH | `/products/:id` | SALON_OWNER (salon sahipliği) | Güncelle (`updateProductValidator` kullanılır) |
| DELETE | `/products/:id` | SALON_OWNER (salon sahipliği) | Soft delete |

> `createProductValidator` ve `queryProductValidator` tanımlı ama route'larda **kullanılmıyor** — POST body'si doğrulanmadan kabul edilir.

---

## 5.13 Upload

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| POST | `/upload/single` | required | form field `file` |
| POST | `/upload/multiple` | required | form field `files`, max 10 dosya |

- MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Boyut: `MAX_FILE_SIZE` (5 MB)
- Dosya adı: `uuid + ext`, hedef `UPLOAD_DEST` (default `./uploads`, cwd'e göre)
- Yanıt: `{ url: "/uploads/<uuid>.png", originalName, size }`
- Statik erişim: `GET /uploads/<filename>` (API öneki **olmadan**)

Canlı:

```json
{ "success": true,
  "data": { "url": "/uploads/18932b2a-7c6c-430d-b8bb-d90e59e8e74d.png",
            "originalName": "p.png", "size": 70 },
  "timestamp": "..." }
```

Hatalar: `400 Dosya yüklenmedi`, `400 Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir`, `400 Dosya boyutu çok büyük (max 5MB)`.

---

## 5.14 Admin

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/admin/dashboard` | ADMIN | `stats`, `appointmentsByStatus`, `monthlyAppointments`, `recentReviews` |
| GET | `/admin/salons` | ADMIN | Sayfalı, `verified=true/false`, owner bilgisi |
| GET | `/admin/appointments` | ADMIN | Sayfalı, `status` filtresi, customer/salon/staff/service |
| GET | `/admin/reviews` | ADMIN | Sayfalı, customer/salon |

Canlı dashboard:

```json
{ "success": true,
  "data": {
    "stats": { "totalUsers":4, "totalSalons":12, "totalAppointments":10,
               "pendingSalons":0, "recentAppointments":10, "newUsersThisWeek":4,
               "totalRevenue":"4600.00", "completedAppointments":9 },
    "appointmentsByStatus": [
      { "name":"TAMAMLANDI","value":9,"color":"#64B5F6" },
      { "name":"BEKLEMEDE","value":1,"color":"#FFB74D" }
    ],
    "monthlyAppointments": [
      { "name":"Ağu","appointments":1 }, { "name":"Eyl","appointments":5 }, { "name":"Eki","appointments":4 }
    ],
    "recentReviews": [ ...10 kayıt... ]
  },
  "timestamp": "..." }
```

- `totalRevenue` **string** döner (`toFixed(2)`) — istemci tarafında sayıya çevrilmelidir.
- `monthlyAppointments` yalnız son 6 ayı içerir ve **ay adı** verir (yıl bilgisi yoktur).
- SQLite'ta `DATE_TRUNC` olmadığı için `strftime('%Y-%m', Appointment.date)` kullanılır.

---

## 5.15 Settings

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/settings` | ADMIN | DB'deki değerler + `DEFAULTS` ile tamamlanır |
| PUT | `/settings` | ADMIN | `{ key: value, ... }` → `Setting.upsert` her anahtar için |

Varsayılanlar:

```json
{ "platformName":"Beauty Salon","contactEmail":"info@beautysalon.com","supportPhone":"",
  "maxLoginAttempts":5,"tokenDuration":"30","rateLimitingEnabled":true,
  "emailNotificationsEnabled":true,"newSalonNotificationsEnabled":true,
  "newReviewNotificationsEnabled":true,"maintenanceModeEnabled":false }
```

> Bu ayarlar API davranışını **etkilemez** (`maxLoginAttempts`, `rateLimitingEnabled`, `maintenanceModeEnabled` hiçbir yerde okunmaz) — yalnız depolanır ve panelde gösterilir.
