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
| `querySalonValidator` | `page` ≥1; `limit` 1–100; `search` max 100; `city`, `district` trim; `minRating` 0–5; `sortBy` ∈ `rating`\|`newest`; `priceRange` int 1–3; `categoryId` UUID; `verified` ∈ `true`\|`false` | `GET /salons` |
| `updateSalonValidator` | `name`, `phone`, `address`, `city`, `district`, `description`, `latitude`, `longitude`, `workingHours` (özel `validateWorkingHours`), `logoUrl`, `coverImageUrl`, `galleryImages`, `isActive` — hepsi opsiyonel | `PATCH /salons/:id` |
| `nearbyValidator` | `latitude`, `longitude` zorunlu; `radius` 0.1–100; `page`, `limit` | `GET /salons/nearby` |

> **`sortBy`, `priceRange`, `categoryId`, `verified` artık doğrulanır** (2026-11-02, commit `51076e9`; kaynak `apps/api/src/validators/salon.validator.js:26-37`). Beyaz liste yaklaşımı: geçersiz değer sessizce yok sayılmaz, `validate` middleware'i **400 + alan adı** döner (ör. `sortBy yalnız "rating" veya "newest" olabilir`).
>
> Doğrulama: `grep -n "sortBy\|priceRange\|categoryId\|verified" apps/api/src/validators/salon.validator.js` → `query('sortBy').isIn([...])`, `query('priceRange').isInt({ min: 1, max: 3 })`, `query('categoryId').isUUID()`, `query('verified').isIn(['true','false'])`.

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

Tek validator export edilir (`apps/api/src/validators/product.validator.js` → `module.exports = { updateProductValidator }`):

| Validator | Kurallar | Kullanım |
|---|---|---|
| `updateProductValidator` | `name` 1–200; `description` max 2000; `price` numeric ≥0 (`Fiyat 0 veya daha büyük olmalıdır`); `stockQuantity` int ≥0 (`Stok miktarı 0 veya daha büyük olmalıdır`); `category` max 100; `images` array — hepsi opsiyonel | `PATCH /products/:id` (`apps/api/src/routes/product.routes.js:8`) |

> **Kaldırıldı (2026-11-02, commit `51076e9`):** `createProductValidator` ve `queryProductValidator` hiçbir route'a bağlı değildi (route dosyalarında import edilmiyordu) → silindi; `query` importu da kaldırıldı.
> Doğrulama: `grep -rn "createProductValidator\|queryProductValidator" apps/api/src` → **0 eşleşme**; `grep -rn "updateProductValidator" apps/api/src` → tanım (`validators/product.validator.js`) + tek kullanım (`routes/product.routes.js:4,8`).
>
> **Yan etki:** `POST /salons/:salonId/products` hâlâ doğrulamasız (bkz. aşağıdaki "Route'ta doğrulanmayan yazımlar") — bu kayıt `11-known-issues.md`'de açık.
>
> Bozuk mesajlar **düzeltildi** (2026-11-02, commit `51076e9`): `updateProductValidator`'daki `price`/`stockQuantity` mesajları artık `Fiyat 0 veya daha büyük olmalıdır` / `Stok miktarı 0 veya daha büyük olmalıdır`. Doğrulama: `grep -rn "更大" apps/api/src` → **0 eşleşme**.

## Model seviyesinde validation

Validator'lara ek olarak Sequelize model'lerinde de kurallar vardır ve `errorHandler` bunları 400'e çevirir:

- `User.fullName` len 2–100, `User.email` isEmail
- `Salon.name` len 2–100, `Salon.email` isEmail, `Salon.priceRange` 1–3
- `Review.rating` 1–5

## Route'ta doğrulanmayan yazımlar

- `POST /salons/:id/staff` — body doğrulanmaz (`fullName`, `title` zorunluluğu yalnız model seviyesinde)
- `POST /salons/:id/services` — body doğrulanmaz
- `POST /salons/:id/products` — body doğrulanmaz
- `PATCH /salons/:id` — `updateSalonValidator` çalışır ama **beyaz liste değildir**: yalnız tip/uzunluk doğrulanır, gövde olduğu gibi geçer (`apps/api/src/validators/salon.validator.js:60`)
- `PATCH /appointments/:id/status` — `status` ENUM dışı değer → Sequelize validation 400
- `PUT /settings` — değerler herhangi bir JSON olabilir
