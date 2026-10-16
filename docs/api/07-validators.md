# 07 — Validatorlar

`validate` middleware'i (`middlewares/validate.js`) `validationResult(req)` boş değilse 400 + `errors[]` döner:

```json
{ "success": false, "message": "Doğrulama hatası", "errors": ["Geçerli bir salon ID giriniz"] }
```

Canlı örnek (`GET /salons?limit=0`):

```json
{ "success": false, "message": "Doğrulama hatası", "errors": ["Invalid value"] }
```

## `auth.validator.js`

| Validator | Kurallar | Kullanım |
|---|---|---|
| `registerValidator` | `email` isEmail + normalizeEmail; `password` min 8 ve `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)`; `fullName` trim 2–100; `phone` opsiyonel `^\+?[1-9]\d{9,14}$`; `role` opsiyonel `CUSTOMER`\|`SALON_OWNER` | `POST /auth/register` |
| `loginValidator` | `email` isEmail + normalize; `password` notEmpty | `POST /auth/login` |

## `salon.validator.js`

| Validator | Kurallar | Kullanım |
|---|---|---|
| `createSalonValidator` | `name` 2–100; `phone` E.164; `email` opsiyonel isEmail; `address` min 5; `latitude` -90..90; `longitude` -180..180; `city`, `district` notEmpty; `description` max 1000; `workingHours` opsiyonel object | `POST /salons` |
| `querySalonValidator` | `page` ≥1; `limit` 1–100; `search` max 100; `city`, `district` trim; `minRating` 0–5 | `GET /salons` |
| `nearbyValidator` | `latitude`, `longitude` zorunlu; `radius` 0.1–100; `page`, `limit` | `GET /salons/nearby` |

> `sortBy`, `priceRange`, `categoryId`, `verified` doğrulanmaz.

## `appointment.validator.js`

| Validator | Kurallar | Kullanım |
|---|---|---|
| `createAppointmentValidator` | `salonId` UUID; `staffId` **opsiyonel** UUID; `serviceId` UUID; `date` `^\d{4}-\d{2}-\d{2}$`; `startTime` `^\d{2}:\d{2}$`; `note` max 500 | `POST /appointments` |
| `availableSlotsValidator` | `salonId` UUID, `staffId` opsiyonel UUID, `serviceId` UUID, `date` YYYY-MM-DD | `GET /appointments/available-slots` |

## `review.validator.js`

| Validator | Kurallar | Kullanım |
|---|---|---|
| `createReviewValidator` | `appointmentId` UUID; `rating` int 1–5; `comment` max 1000; `images` array max 4 | `POST /reviews` |
| `replyValidator` | `reply` trim 1–500 | `PATCH /reviews/:id/reply` |

## `product.validator.js`

| Validator | Kurallar | Kullanım |
|---|---|---|
| `createProductValidator` | `name` 1–200; `description` max 2000; `price` numeric ≥0; `stockQuantity` int ≥0; `category` max 100; `images` array | **kullanılmıyor** |
| `updateProductValidator` | aynı alanlar, hepsi opsiyonel | `PATCH /products/:id` |
| `queryProductValidator` | `search` max 100, `category` max 100, `sortBy` in `price,createdAt,name`, `page` ≥1, `limit` 1–100 | **kullanılmıyor** |

> `product.validator.js`'te iki bozuk mesaj var: `Fiyat 0 veya更大 olmalıdır`, `Stok miktarı 0 veya更大 olmalıdır` (Çince karakter karışmış).

## Model seviyesinde validation

Validator'lara ek olarak Sequelize model'lerinde de kurallar vardır ve `errorHandler` bunları 400'e çevirir:

- `User.fullName` len 2–100, `User.email` isEmail
- `Salon.name` len 2–100, `Salon.email` isEmail, `Salon.priceRange` 1–3
- `Review.rating` 1–5

## Route'ta doğrulanmayan yazımlar

- `POST /salons/:id/staff` — body doğrulanmaz (`fullName`, `title` zorunluluğu yalnız model seviyesinde)
- `POST /salons/:id/services` — body doğrulanmaz
- `POST /salons/:id/products` — body doğrulanmaz
- `PATCH /salons/:id` — body doğrulanmaz
- `PATCH /appointments/:id/status` — `status` ENUM dışı değer → Sequelize validation 400
- `PUT /settings` — değerler herhangi bir JSON olabilir
