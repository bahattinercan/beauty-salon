# 11 — Bilinen sorunlar ve teknik borç (doğrulanmış)

## Güvenlik / yetki

| # | Sorun | Etki |
|---|---|---|
| 2 | `GET /reviews/salon/:salonId` public + sahiplik kontrolü yok | Yorumlar zaten public; ancak `is_visible=false` yorumlar da bu endpoint'te görünmez — tutarlı. Asıl risk: salon istatistiklerinin başka sahipler tarafından okunabilmesi |
| 3 | `GET /appointments/available-slots`'te `authenticate` yok | CLAUDE.md "required" der, fiilen public |
| 5 | `PATCH /users/:id/toggle-active` rol kontrolü yapar, sahiplik kontrolü yapmaz | Kullanıcı kendi `isActive`'ünü ADMIN endpoint'i üzerinden kapatabilir (test bunu doğruluyor) |
| 6 | Staff/service sahipliğinde ADMIN yetkili değil | Admin, salon içeriğini düzeltemez (tasarım kararı ama tutarsız) |
| 7 | `serviceId` salon uyumu doğrulanmaz | Başka salonun hizmeti bu salonun çalışanına bağlanmışsa randevu kabul edilir |
| 8 | `available-slots`'te `staffId` opsiyonel ama filtre olarak kullanılır | `staffId` yoksa tüm çalışanların randevuları dikkate alınır |

## Doğruluk / davranış

| # | Sorun | Etki |
|---|---|---|
| 9 | `workingHours` gün tanımı yoksa çalışma saati kontrolü atlanır | Kapalı güne randevu alınabilir |
| 10 | Review görünürlüğü değişince `ratingAvg` yeniden hesaplanmaz | Admin yorumu gizlerse puan eski değerinde kalır |
| 11 | `change-password` min 6, `register` min 8 | Tutarlılık |
| 12 | `DELETE /categories/:id` hard delete, diğerleri soft delete | Davranış tutarsızlığı |
| 13 | `Setting` ayarları hiçbir davranışı etkilemez | Panelde gösterilir, kod okumaz |
| 14 | `totalRevenue` string döner | İstemci sayıya çevirmeli |
| 15 | `monthlyAppointments` ay adı verir, yıl yoktur | Yıl sonu sınırında karışık grafik |
| 16 | `toJSON()` aynı alanı iki kez basar (`salonId` + `salon_id`) | İstemci kafa karışıklığı |
| 17 | Notification üreten kod yok | Bildirim sistemi salt okunur |
| 18 | `POST /salons/:id/staff`, `/services`, `/products` body doğrulanmaz | Model seviyesindeki zorunluluklar dışında hiçbir kontrol yok |

## Altyapı

| # | Sorun | Etki |
|---|---|---|
| 21 | `twilio` bağımlılığı yok | Twilio env tanımlıysa `require('twilio')` throw → 500 |
| 22 | `sharp`, `swagger-jsdoc`, `swagger-ui-express` kullanılmıyor; `pg`/`pg-hstore` **runtime sürücüsüdür** (Postgres, aktif); `sqlite3` yalnız `DB_DIALECT=sqlite` geri dönüşünde; `cookie-parser` **aktiftir** (`src/app.js:8`, `src/app.js:83`) | Kısmen ölü bağımlılık |
| 25 | **Kapatıldı (DB-001 P1):** `ensureColumns()`, `dropBackupTables()`, `sync()` çağrıları kaldırıldı | Şema yalnız migration'lardan; eksik migration `seed`/`test`'te açık hata verir (sessiz onarım yok) |
| 26 | **Kapatıldı (DB-001 P1–P3):** runtime Postgres; `DB_DIALECT=sqlite` geri dönüşünde dosya `DB_STORAGE` veya `src/*.sqlite` | `.sqlite` dosyaları yalnız geri dönüş penceresi; varsayılan runtime değil |
| 27 | `UPLOAD_DEST` cwd'e göre çözülür | Farklı çalışma diziminde farklı `uploads/` klasörüne yazılır |
| 28 | **Kapatıldı (DB-001 P2):** migration ↔ model uyuşmazlığı yeni migration'larla giderildi (`…14` settings tablosu, `…15` 11 kolon, `…16` salon JSON→TEXT, `…17` staff_services timestamps) | Postgres şeması modelle hizalı; drift `information_schema` ile doğrulandı |
| 29 | `staff_services` composite PK yok → duplicate join kaydı engellenmez | `bulkCreate` ile aynı bağ iki kez eklenebilir |
| 30 | User e-posta değişikliği `password_reset_token` alanını paylaşıyor | İki akış birbirini bozabilir |
| 32 | Rate limit testte kapalı, production'ta açık | Testler 429 davranışını kapsamıyor |
| 33 | `src/app.js` statik `/uploads` route'u ile upload middleware'i `UPLOAD_DEST`'u iki ayrı yerde okuyor | İkisi de cwd'ye göre çözülüyor ve davranış tutarlı, ama tek kaynak olmalı → küçük teknik borç |

## Kapatılanlar (2026-10-23)

### #1 · `GET /appointments/salon/:salonId` sahiplik kontrolü yok — kapatıldı

**Sorun:** Endpoint yalnızca `authenticate` ile korunuyordu; herhangi bir SALON_OWNER başka bir salonun randevularını okuyabiliyordu (canlıda `salon@` → Zen SPA & Masaj randevuları 200 dönüyordu).

**Çözüm:** `apps/api/src/controllers/appointment.controller.js` → `getSalonAppointments`: önce salon `findByPk` ile okunur; salon yoksa **404** döner. `req.user.role === 'SALON_OWNER'` ve `salon.ownerId !== req.user.id` ise **403** döner. ADMIN için ek kısıt yoktur, her salonu okuyabilir.

**Kanıt:** `apps/api/tests/appointment.test.js` →
- `should return own salon appointments for the owning salon owner`
- `should return 403 when salon owner requests another salon's appointments`
- `should allow admin to read any salon's appointments`
- `should return 404 for a non-existent salon id`

### #4 · `toSafeJSON()` şifre sıfırlama token alanlarını çıkarmıyordu — kapatıldı

**Sorun:** `toSafeJSON()` yalnızca `passwordHash` ve `refreshToken` alanlarını siliyordu; `passwordResetToken` / `passwordResetTokenExpiry` login ve register yanıtlarında istemciye sızıyordu.

**Çözüm:** `apps/api/src/models/User.js` → `toSafeJSON`: `passwordResetToken` ve `passwordResetTokenExpiry` alanları da yanıttan çıkarılır. Alanlar veritabanında kalmaya devam eder, yalnızca serileştirme çıktısından düşer.

**Kanıt:** `apps/api/tests/auth.test.js` → `should not expose sensitive user fields in login response`

## Kapatılanlar (2026-11-02)

### #19 · `querySalonValidator` `sortBy`/`priceRange`/`categoryId`/`verified` doğrulamıyordu — kapatıldı

**Sorun:** `GET /salons` sorgu parametreleri beyaz listeye tabi değildi: `sortBy=garbage` sessizce yok sayılıp varsayılan sıralamaya düşüyor, `priceRange=abc` `parseInt` → `NaN` ile 500 üretiyor, UUID olmayan `categoryId` Postgres uuid kolonunda 500'e düşüyordu. İstemci hatasını görmediği için filtre uygulanmadığını fark etmiyordu.

**Çözüm:** `apps/api/src/validators/salon.validator.js` → `querySalonValidator`: `sortBy` ∈ `rating,newest` (controller yalnız bu iki dalı uygular), `priceRange` 1–3 tam sayı (`Salon.priceRange` model aralığı), `categoryId` UUID, `verified` ∈ `true,false`. Her kural `withMessage` ile **alan adını** içeren Türkçe mesaj verir; geçersiz değer **400** döner, sessizce yok sayılmaz. Geçerli değerler ve filtre davranışı değişmedi.

**Kanıt:** `apps/api/tests/salon.test.js` `GET /salons query doğrulaması (#19)` →
- `geçersiz sortBy 400 + alan adı döner`
- `sayısal olmayan priceRange 400 + alan adı döner` (önce 500)
- `aralık dışı priceRange 400 + alan adı döner` (önce 200)
- `UUID olmayan categoryId 400 + alan adı döner` (önce 500)
- `geçersiz verified 400 + alan adı döner` (önce 200)
- `geçerli değerler regresyona uğramaz (sortBy/priceRange/verified/categoryId)`
- `priceRange filtresi yalnız eşleşen salonları döner`

### #20 · `product.validator.js`'te bozuk mesaj (`0 veya更大 olmalıdır`) — kapatıldı

**Sorun:** `price` ve `stockQuantity` kurallarının mesajında CJK karakteri karışmıştı (`更大`); kullanıcı Türkçe yerine bozuk metin görüyordu. Bozuk metin yalnız hiçbir route'a bağlı olmayan `createProductValidator` içindeydi; kullanılan `updateProductValidator` ise mesajsız olduğu için express-validator'ın İngilizce varsayılanı `Invalid value` dönüyordu.

**Çözüm:** Kullanılan `apps/api/src/validators/product.validator.js` → `updateProductValidator`: `price` → `Fiyat 0 veya daha büyük olmalıdır`, `stockQuantity` → `Stok miktarı 0 veya daha büyük olmalıdır`. Bozuk mesajı taşıyan ölü `createProductValidator` #23 kapsamında kaldırıldı; `grep -rn "更大" apps/api/src` → **0**.

**Kanıt:** `apps/api/tests/product.test.js` `PATCH /products/:id` →
- `negatif fiyat 400 + "Fiyat 0 veya daha büyük olmalıdır" mesajı döner (#20)`
- `negatif stok 400 + "Stok miktarı 0 veya daha büyük olmalıdır" mesajı döner (#20)`

> Kalan iz (bu dispatch'in kapsamı dışı): `docs/api/07-validators.md` ve `docs/BACKEND-API.md` bozuk mesajdan tarihsel olarak söz ediyor.

### #23 · `optionalAuth`, `createProductValidator`, `queryProductValidator` ölü kod — kapatıldı

**Sorun:** Üç sembol de hiçbir route'a bağlı değildi: `optionalAuth` yalnız `salon.routes.js`'te import edilip kullanılmıyordu, `createProductValidator`/`queryProductValidator` ise `product.routes.js`'te import edilmiyordu (`POST /salons/:salonId/products` doğrulamasız çalışıyor).

**Çözüm:** Kaldırma öncesi tüm repoda kullanım 0 doğrulandı (`grep -rn`). `apps/api/src/validators/product.validator.js` → `createProductValidator`, `queryProductValidator`, `query` importu silindi, `module.exports = { updateProductValidator }`. `apps/api/src/routes/salon.routes.js` → kullanılmayan `optionalAuth` importu silindi. `apps/api/src/middlewares/auth.js` → `optionalAuth` tanımı ve exportu silindi (`module.exports = { authenticate, authorize }`); `authenticate`/`authorize` davranışı değişmedi. Silme sonrası `grep -rn "optionalAuth\|createProductValidator\|queryProductValidator" apps/api --include=*.js` → **0** (yalnız bu dosyada tarihçe).

**Kanıt:** `apps/api/tests/app.test.js` `ölü kod temizliği (#23, #24)` →
- `product.validator yalnız kullanılan validator'ı dışa aktarır (#23)`
- `auth middleware yalnız kullanılan middleware'leri dışa aktarır (#23)`

### #24 · `errorHandler`'daki `err.type === 'validation'` dalı ölü — kapatıldı

**Sorun:** Express-validator hataları hiçbir zaman `next(err)` ile fırlatılmıyor; `src/middlewares/validate.js` kendi 400 yanıtını üretiyor. Bu yüzden `errorHandler` içindeki `err.type === 'validation'` dalı hiç çalışmıyordu (ölü kod, yanıltıcı iki doğrulama yolu).

**Çözüm:** `apps/api/src/middlewares/errorHandler.js` → dal kaldırıldı; doğrulama yanıtının tek sahibi `validate` middleware'i. `grep -rn "err.type" apps/api/src` → **0**.

**Kanıt:** `apps/api/tests/app.test.js` `ölü kod temizliği (#23, #24)` →
- `errorHandler içinde ölü express-validator dalı kalmadı (#24)`
- `express-validator hataları validate middleware tarafından yanıtlanır (#24)` (yanıttaki `errors` düz string dizisidir)

### #31 · `GET /` endpoint listesi eksikti (`/staff`, `/upload`, `/admin`) — kapatıldı

**Sorun:** Kök keşif yanıtı elle yazılmış 11 satırlık bir listeydi; `router.use` ile mount edilen `/users`, `/staff`, `/upload`, `/admin` prefixleri listede yoktu. Liste mount kodundan bağımsız olduğu için her yeni router'da sessizce sapıyordu.

**Çözüm:** Yeni `apps/api/src/routes/route-table.js` mount edilen router'ların **tek kaynağı** oldu (`prefix` + `router` çiftleri). `apps/api/src/routes/index.js` router'ları bu tablodan mount eder ve `GET /` yanıtındaki `endpoints` dizisini aynı tablodan üretir (`API_PREFIX` env'i ile uyumlu, `/health` ayrıca eklenir). Yeni router eklemek tek satır: tabloya kayıt.

**Kanıt:** `apps/api/tests/app.test.js` `health & root` →
- `GET /api/v1 endpoint listesi mount edilen tüm router prefixlerini içerir (#31)` (tablodaki her prefix listede + `/health` + yinelenen kayıt yok)
- `route tablosundaki her kayıt gerçek bir express router (#31)` (prefix biçimi, mount edilebilirlik, tekrar yok)

**Kapı:** `cd apps/api && bash scripts/db-ready.sh && npm test` → **372 passing, 0 failing** (baseline 357, +15 yeni test).
