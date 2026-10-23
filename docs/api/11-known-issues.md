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
| 19 | `querySalonValidator` `sortBy`, `priceRange`, `categoryId`, `verified` doğrulamaz | Yanlış parametre sessizce yok sayılır |
| 20 | `product.validator.js`'te bozuk mesajlar: `0 veya更大 olmalıdır` | Hatalı karakter |

## Altyapı

| # | Sorun | Etki |
|---|---|---|
| 21 | `twilio` bağımlılığı yok | Twilio env tanımlıysa `require('twilio')` throw → 500 |
| 22 | `sharp`, `swagger-jsdoc`, `swagger-ui-express`, `pg`, `pg-hstore`, `cookie-parser` kullanılmıyor | Ölü bağımlılık |
| 23 | `optionalAuth`, `createProductValidator`, `queryProductValidator` kullanılmıyor | Ölü kod |
| 24 | `errorHandler`'daki `err.type === 'validation'` dalı ölü | `validate` kendi yanıtlıyor |
| 25 | `ensureColumns()` eksik tabloda patlar (`PRAGMA` boş → `ALTER TABLE` "no such table") | `sync()` önce çalıştığı için pratikte sorun değil; `ensureColumns()` tek başına çağrılırsa kırılır |
| 26 | DB dosyası yolu `src/` içine düşüyor | `apps/api/database.sqlite` eski/yedek dosya; gerçek DB `apps/api/src/database.sqlite` |
| 27 | `UPLOAD_DEST` cwd'e göre çözülür | Farklı çalışma diziminde farklı `uploads/` klasörüne yazılır |
| 28 | Migration'lar ile model tanımları uyuşmaz (nullable, JSONB, DECIMAL(10,8)) | Postgres'e geçildiğinde şema farkı |
| 29 | `staff_services` composite PK yok → duplicate join kaydı engellenmez | `bulkCreate` ile aynı bağ iki kez eklenebilir |
| 30 | User e-posta değişikliği `password_reset_token` alanını paylaşıyor | İki akış birbirini bozabilir |
| 31 | `GET /` endpoint listesi eksik (`/staff`, `/upload`, `/admin`) | Keşif yanıltıcı |
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
