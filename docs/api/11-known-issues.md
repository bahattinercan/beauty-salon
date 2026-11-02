# 11 — Bilinen sorunlar ve teknik borç (doğrulanmış)

## Güvenlik / yetki

| # | Sorun | Etki |
|---|---|---|
| 2 | `GET /reviews/salon/:salonId` public + sahiplik kontrolü yok | Yorumlar zaten public; ancak `is_visible=false` yorumlar da bu endpoint'te görünmez — tutarlı. Asıl risk: salon istatistiklerinin başka sahipler tarafından okunabilmesi |
| 6 | Staff/service sahipliğinde ADMIN yetkili değil | Admin, salon içeriğini düzeltemez (tasarım kararı ama tutarsız) |

## Doğruluk / davranış

| # | Sorun | Etki |
|---|---|---|
| 11 | `change-password` min 6, `register` min 8 | Tutarlılık |
| 12 | `DELETE /categories/:id` hard delete, diğerleri soft delete | Davranış tutarsızlığı |
| 13 | `Setting` ayarları hiçbir davranışı etkilemez | Panelde gösterilir, kod okumaz |
| 15 | `monthlyAppointments` ay adı verir, yıl yoktur | Yıl sonu sınırında karışık grafik |
| 16 | `toJSON()` aynı alanı iki kez basar (`salonId` + `salon_id`) | İstemci kafa karışıklığı |
| 17 | Notification üreten kod yok | Bildirim sistemi salt okunur |
| 18 | `POST /salons/:id/staff`, `/services`, `/products` body doğrulanmaz | Model seviyesindeki zorunluluklar dışında hiçbir kontrol yok |

## Altyapı

| # | Sorun | Etki |
|---|---|---|
| 22 | `sharp`, `swagger-jsdoc`, `swagger-ui-express` kullanılmıyor; `pg`/`pg-hstore` **runtime sürücüsüdür** (Postgres, aktif); `sqlite3` yalnız `DB_DIALECT=sqlite` geri dönüşünde; `cookie-parser` **aktiftir** (`src/app.js:8`, `src/app.js:83`) | Kısmen ölü bağımlılık |
| 25 | **Kapatıldı (DB-001 P1):** `ensureColumns()`, `dropBackupTables()`, `sync()` çağrıları kaldırıldı | Şema yalnız migration'lardan; eksik migration `seed`/`test`'te açık hata verir (sessiz onarım yok) |
| 27 | `UPLOAD_DEST` cwd'e göre çözülür | Farklı çalışma diziminde farklı `uploads/` klasörüne yazılır |
| 28 | **Kapatıldı (DB-001 P2):** migration ↔ model uyuşmazlığı yeni migration'larla giderildi (`…14` settings tablosu, `…15` 11 kolon, `…16` salon JSON→TEXT, `…17` staff_services timestamps) | Postgres şeması modelle hizalı; drift `information_schema` ile doğrulandı |
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

### #5 · `PATCH /users/:id/toggle-active` sahiplik kontrolü yoktu — kapatıldı

**Sorun:** Uç yalnızca `authorize('ADMIN')` ile korunuyordu; admin **kendi** hesabını da pasifleştirebiliyordu. Sonuç: admin kendini kilitliyor, hesabı geri açmak için başka bir admin gerekiyordu.

**Çözüm:** `apps/api/src/controllers/user.controller.js` → `toggleActive`: hedef kullanıcı `req.user.id` ile aynıysa **400** ve `Kendi hesabınızı pasifleştiremezsiniz`. Başka kullanıcılar için davranış (404 / toggle / 403 rol kontrolü) aynen korundu.

**Kanıt:** `apps/api/tests/user.test.js` → `PATCH /users/:id/toggle-active (Admin)` →
- `should return 400 when admin tries to deactivate own account (#5)` (admin `isActive` true kalır)
- `should not allow a customer to toggle its own active status (admin-only)` — adı yanıltıcı olan eski `should allow users to toggle their own active status` testi, gerçek davranışı (403, uç yalnız ADMIN'e açık) kanıtlayacak şekilde yeniden adlandırıldı; beklenti aynı

### #7 · `serviceId` salon uyumu doğrulanmıyordu — kapatıldı

**Sorun:** `POST /appointments` yalnız `Service.findByPk(serviceId)` + `Salon.findByPk(salonId)` yapıyordu; ikisi arasında `service.salonId === salonId` karşılaştırması yoktu. Başka salonun hizmeti (ve o hizmeti sunmayan yabancı personel) bu salon adına randevuya bağlanabiliyor ya da yanlış mesajla ("bu çalışan seçilen hizmeti sunmuyor") reddediliyordu.

**Çözüm:** `apps/api/src/controllers/appointment.controller.js` → `create`: salon yüklendikten sonra `service.salonId !== salon.id` ise **400** `Seçilen hizmet bu salona ait değil`; `staffId` verilmişse personel `salonId` ile karşılaştırılır, uyuşmazsa **400** `Seçilen çalışan bu salona ait değil`. Personel tarafı ayrıca mevcut `candidates` (`where: { salonId }`) filtresiyle de korunur.

**Kanıt:** `apps/api/tests/appointment.test.js` → `POST /appointments` →
- `should return 400 when service or staff belongs to another salon (#7)` (yabancı hizmet + yabancı personel; düzeltme öncesi mesaj `Bu çalışan seçilen hizmeti sunmuyor` idi)
- `should accept an appointment when service and staff belong to the salon (#7)` (aynı salonda **201**)

### #8 · `available-slots`'te `staffId` yokken tüm personelin randevuları slotu blokluyordu — kapatıldı

**Sorun:** `GET /appointments/available-slots` mevcut randevuları `where: { staffId, date, … }` ile çekiyordu; `staffId` verilmezse anahtar düşüyor ve **tarihteki her personelin** randevusu slotu kapatıyordu. Oysa `staffId` opsiyoneldir (`query('staffId').optional()`): atama "herhangi bir çalışan" mantığıyla yapılır.

**Çözüm:** `apps/api/src/controllers/appointment.controller.js` → `getAvailableSlots`: personel havuzu hesaplanır — `staffId` varsa yalnız o personel, yoksa hizmeti sunan (`StaffService`) ve salona ait **aktif** personelin tamamı. Randevular havuz için bir kez çekilir; slot `available` değeri "havuzdaki **herhangi biri** müsaitse true" (union) olarak hesaplanır. Yanıt sözleşmesi değişmedi: `[{ time, available }]`, alan adları ve 30 dk ızgara aynı; hizmeti sunan personel yoksa `[]` döner.

**Kanıt:** `apps/api/tests/appointment.test.js` → `GET /appointments/available-slots` →
- `should mark a slot available when another staff is free and staffId is omitted (#8)` (staff1 dolu, staff2 boş → `14:00` available **true**; düzeltme öncesi yanıt `success: false` idi)
- `should mark a slot unavailable when the requested staff is busy (#8)` (`staffId=staff1` → `14:00` available **false**)
- Mevcut testler korundu: `should return available slots for a staff member`, `should return empty array when salon is closed on that day`, `should mark slots as unavailable when they conflict with existing appointments`

### #9 · `workingHours` gün tanımı yoksa çalışma saati kontrolü atlanıyordu — kapatıldı

**Sorun:** `create` içindeki kontrol `if (daySchedule && daySchedule.open && daySchedule.close)` biçimindeydi: gün `workingHours`'ta tanımlı değilse blok tamamen atlanıyor ve **kapalı güne randevu kabul ediliyordu**. Aynı durumda `available-slots` `[]` dönüyordu — iki uç çelişiyordu.

**Çözüm:** `apps/api/src/controllers/appointment.controller.js` → `create`: gün tanımsız ya da `open`/`close` eksikse **400** `Salon seçilen gün kapalı, randevu alınamaz` (sessiz geçiş yok). Saat aralığı kontrolü aynen korundu; mevcut kapalı-gün/çalışma-saati davranışı bozulmadı.

**Kanıt:** `apps/api/tests/appointment.test.js` → `POST /appointments` →
- `should return 400 when the salon has no working hours for that day (#9)` (salon2'de `sunday` tanımsız; düzeltme öncesi **409** dönüyordu)
- Mevcut test korundu: `should return 400 when time is outside salon working hours` (`çalışma saatleri` mesajı)

**Kapı (Dalga 1: #19/#20/#23/#24/#31):** `cd apps/api && bash scripts/db-ready.sh && npm test` → **372 passing, 0 failing** (baseline 357, +15 yeni test).

**Kapı (Dalga 2: #5/#7/#8/#9):** `cd apps/api && bash scripts/db-ready.sh && npm test` → **378 passing, 0 failing** (baseline 372, +6 yeni test; hiçbir test silinmedi/zayıflatılmadı).

### #10 · Review görünürlüğü değişince `ratingAvg` yeniden hesaplanmıyordu — kapatıldı

**Sorun:** `PATCH /reviews/:id/toggle-visibility` yalnız `review.update({ isVisible })` yapıyordu; salonun `ratingAvg` / `reviewCount` alanları eski değerinde kalıyordu. Admin bir yorumu gizlediğinde puan düşmüyor, geri açtığında yükselmiyordu — `create` ve `admin.controller.deleteReview` recompute ederken yalnız toggle eksikti.

**Çözüm:** `apps/api/src/controllers/review.controller.js` → `toggleVisibility`: görünürlük değişimi + salon puanının yeniden hesabı tek `sequelize.transaction` içinde, `create`/`deleteReview` ile **aynı** desen (visible yorumlar için `AVG(rating)` / `COUNT(id)`, `Math.round(avg * 10) / 10`). Yeni algoritma yazılmadı; yanıt gövdesi `{ id, isVisible }` korunur, ek olarak hesaplanan `ratingAvg`/`reviewCount` döner.

**Kanıt:** `apps/api/tests/review.test.js` → `PATCH /reviews/:id/toggle-visibility` →
- `should recompute salon ratingAvg when a review is hidden and shown again (#10)` (gizle → ortalama düşer, geri aç → eski değere döner, `reviewCount` tutarlı)
- Mevcut test korundu: `should toggle review visibility (admin only)`

### #14 · `totalRevenue` string dönüyordu (admin dashboard) — kapatıldı

**Sorun:** `admin.controller.getDashboard` içinde `parseFloat(...).toFixed(2)` kullanılıyordu; `toFixed` **string** döndüğü için `stats.totalRevenue` istemciye `"250.00"` olarak gidiyor ve her istemci kendi sayıya çevirmek zorunda kalıyordu.

**Çözüm:** `apps/api/src/controllers/admin.controller.js` → `totalRevenue = Math.round((parseFloat(revenueData.totalRevenue || 0) || 0) * 100) / 100` → **number** (kuruş hassasiyeti korunur). Alan adı ve yanıt yapısı değişmedi.

**Kanıt:** `apps/api/tests/admin.test.js` → `GET /admin/dashboard` →
- `gelir istatistiği ve aylık randevu listesi alanları mevcut (totalRevenue number — #14)` (`typeof === 'number'`, `NaN` değil, `>= 0`)
- Eski testin `to.be.a('string')` beklentisi bu kaydın ta kendisiydi; string → number yönünde **sıkılaştırıldı** (test silinmedi/zayıflatılmadı)

> **İstemci etkisi (bu dispatch'in kapsamı dışı):** `apps/admin_panel` hâlâ string bekliyor — `src/providers/DashboardProvider.tsx:35` (`totalRevenue: string`) ve `src/app/page.tsx:37` (`money(value: string, …)`, `Number.parseFloat`). Runtime'da JS coercion sayesinde çalışır (`parseFloat(250)`), ama `npm run typecheck` için bu iki satırın `number`'a güncellenmesi gerekir.

### #21 · `twilio` bağımlılığı yokken SMS yolu 500 üretiyordu — kapatıldı

**Sorun:** `src/utils/sms.js` içinde `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` tanımlıysa `require('twilio')` çağrılıyordu; paket `package.json`'da yok, bu yüzden `MODULE_NOT_FOUND` fırlıyor ve SMS tetikleyen akış (`POST /salons/:id/request-phone-change`, `request-email-change?verifyVia=sms`) **500** dönüyordu.

**Çözüm:** `apps/api/src/utils/sms.js` → `sendSmsOtp`: env yoksa geliştirme modu (OTP loglanır, `null` döner); `require('twilio')` `try/catch` içinde, paket yoksa **uyarı loglanıp `null` dönülür**; gönderim hatası da fırlatılmaz, loglanıp `null` dönülür. Çağıran akışlar (salon.controller.js — dokunulmadı) artık 500 üretmez. Yeni bağımlılık eklenmedi, SMS sağlayıcısı değişmedi.

**Kanıt:** `apps/api/tests/salon.test.js` → `Email/Phone Change OTP Flow` →
- `should not return 500 when twilio package is missing (#21)` (`require.resolve('twilio')` throw ediyor → ortam gerçekten twilio'suz; istek 200 + `success: true`)

### #32 · Rate limit testte kapalı olduğu için 429 davranışı kapsanmıyordu — kapatıldı

**Sorun:** Limitler `app.js` içinde yalnız `if (!isTest)` ile mount ediliyordu; test ortamında hiç mount edilmediği için 429 davranışı (gövdesi, eşiği, hangi uçlarda sıkı limit olduğu) test edilemiyordu.

**Çözüm:** Limit tanımları `apps/api/src/middlewares/rateLimiters.js` içine taşındı (tek kaynak). Ortamdan bağımsız olarak **her zaman mount** edilir; ama modül durumu (`state.enabled`, varsayılan `!isTest`) `skip` içinde **istek anında** okunur — test ortamında varsayılan olarak kapalı kalır, bir test `setRateLimitEnabled(true)` ile yalnız kendi kapsamında açar. Eşikler istek anında env'den okunur (`RATE_LIMIT_MAX`, `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_REFRESH_MAX`), böylece o test eşiği düşürüp diğer testleri yavaşlatmaz.

**Kanıt:** `apps/api/tests/app.test.js` → `rate limit (#32)` →
- `eşik aşılınca 429 + Türkçe gövde döner (yalnız bu testte açık)` — kapalıyken 3 istek 429 **değil**; `RATE_LIMIT_AUTH_MAX=2` + `setRateLimitEnabled(true)` iken 3. istek **429** ve gövde `{ success: false, message: 'Çok fazla giriş denemesi, lütfen 1 dakika bekleyiniz' }`; `finally` bloğunda limit kapatılır, env geri alınır ve store anahtarı sıfırlanır.

**Kapı (Dalga 3: #10/#14/#21/#32):** `cd apps/api && bash scripts/db-ready.sh && npm test` → **381 passing, 0 failing** (baseline 378, +3 yeni test; hiçbir test silinmedi/zayıflatılmadı).

### #30 · Kullanıcı e-posta değişikliği `password_reset_token` kolonunu eziyordu — kapatıldı

**Sorun:** `User` modelinde `pendingEmail` / `emailChangeToken` alanları yoktu; `src/controllers/user.controller.js` → `requestEmailChange`, `passwordResetToken` kolonunu repurpose ediyordu (token'ın içine OTP hash'i + base64 hedef adres gömülüyordu) ve `confirmEmailChange` "aktif istek var mı" kontrolünü `startsWith('EMAILCHANGE:')` ile yapıyordu. Aynı kolonu `auth.controller.js` → `forgotPassword` / `resetPassword` da kullandığı için iki akış birbirini bozuyordu: e-posta değişikliği isteyen kullanıcı sonra "şifremi unuttum" derse önceki akış sessizce geçersizleşiyor (veya tersi), yani kullanıcı hiçbir hata görmüyordu.

**Karar:** **ayrı kolonlar.** Şifre sıfırlama akışının kolonlarına dokunulmadı; davranışı değişmedi.

**Çözüm:**
- Yeni migration `apps/api/src/database/migrations/20261102000018-add-user-email-change-columns.js` → `users` tablosuna `pending_email` (STRING, nullable), `email_change_token` (STRING, nullable — yalnız bcrypt hash), `email_change_token_expiry` (DATE, nullable). `up()` `describeTable` ile idempotent; `down()` üç kolonu `removeColumn` ile geri alır (`npm run migrate:undo` ile temiz çalıştığı ve tekrar `migrate` edilebildiği doğrulandı).
- `apps/api/src/models/User.js` → üç alan eklendi (`pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry`); `toSafeJSON` bu üç alanı da yanıttan çıkarır (mevcut `passwordResetToken` deseni).
- `apps/api/src/controllers/user.controller.js` → `requestEmailChange` artık `passwordResetToken`'a **yazmaz**: OTP hash → `emailChangeToken`, expiry → `emailChangeTokenExpiry`, hedef adres → `pendingEmail`. `confirmEmailChange` yalnız `emailChangeToken` + `emailChangeTokenExpiry` + `pendingEmail` ile doğrular, e-postayı `pendingEmail`'den alır ve üç alanı temizler; süresi geçmiş token **400** `Doğrulama kodunun süresi dolmuş`. Kolon deseni `salons` tablosundakiyle aynı (`salon.controller.js:205-269`).
- `grep -rn "EMAILCHANGE" apps/api/src` → **0**.

**Kanıt:** `apps/api/tests/user.test.js` → `E-posta değişikliği ↔ şifre sıfırlama ayrımı (#30)`:
- `#30 e-posta değişiklik isteği passwordResetToken/passwordResetTokenExpiry alanlarını değiştirmez` — request öncesi yazılan reset hash'i **aynen** kalır; `pendingEmail` dolar, `emailChangeToken` repurpose edilmiş değer taşımaz (önce kırmızı: alan yoktu)
- `#30 şifre sıfırlama isteği email_change_token/pending_email alanlarını bozmaz` — `POST /auth/forgot-password` sonrası e-posta değişiklik akışı aynen durur (önce kırmızı)
- `#30 doğru token ile confirm e-postayı değiştirir ve üç alanı temizler` (önce kırmızı: 400 `Doğrulama kodu hatalı`)
- `#30 süresi geçmiş e-posta değişiklik token'ı 400 döner` (önce kırmızı: 400 ama yanlış mesaj — `Doğrulama kodu hatalı`)
- `#30 login ve profil yanıtı pending_email/email_change_token/email_change_token_expiry sızdırmaz` — alanlar DB'de **dolu** doğrulanır, sonra `login` + `GET /users/me` yanıtlarında hem camelCase hem snake_case anahtarlar yok (önce kırmızı)

**Kapı (Dalga 4: #30/#3):** `cd apps/api && bash scripts/db-ready.sh && npm run migrate && npm test` → `SequelizeMeta` **18/18**, **388 passing, 0 failing** (baseline 381, +7 yeni test; hiçbir test silinmedi/zayıflatılmadı).

### #3 · `GET /appointments/available-slots`'te `authenticate` yok — tasarım kararı: **public**, sözleşme testiyle kilitlendi

**Sorun (kayıt):** Uçta `authenticate` middleware'i yoktu; `apps/api/CLAUDE.md` "required" derken fiilen public davranıyordu — dokümantasyon ↔ kod çelişkisi.

**Karar: PUBLIC kalır, kod değişikliği yok.** Gerekçe: (1) anonim slot görüntüleme gerçek bir ürün ihtiyacı — müşteri uygulaması randevu oluşturmadan **önce** bu ucu girişsiz çağırıyor (`apps/customer_app/lib/features/booking/data/datasources/booking_remote_datasource.dart:38`); (2) yanıt kişisel veri taşımıyor: dizi elemanları yalnız `{ time, available }` (`src/controllers/appointment.controller.js:204-220`), müşteri/personel kimliği veya randevu sahibi bilgisi dönmez; (3) parametreler zaten doğrulanıyor (`availableSlotsValidator`: `salonId`/`serviceId` UUID, `date` `YYYY-MM-DD`), geçersiz girdi **400**.

**Çözüm:** Route'a dokunulmadı (`src/routes/appointment.routes.js:14`); çelişen dokümantasyon gerçeğe hizalandı (`apps/api/CLAUDE.md:114`, [05-endpoints.md](05-endpoints.md) §5.8) ve davranış **sözleşme testiyle kilitlendi** — ileride birinin `authenticate` eklemesi testi kırar.

**Kanıt:** `apps/api/tests/appointment.test.js` → `available-slots public sözleşmesi (#3)`:
- `#3 kimlik doğrulama başlığı OLMADAN GET /appointments/available-slots 200 + dizi döner` — `Authorization` başlığı gönderilmez, `200` + `data` dizi, her elemanın anahtarları tam olarak `['available','time']` (kişisel veri yok)
- `#3 available-slots geçersiz parametrede 400 döner` — UUID olmayan `salonId` + bozuk `date` → **400**

## Kapatılanlar — kayıt temizliği (2026-11-02)

### #26 · runtime Postgres / SQLite geri dönüşü — kapatıldı (DB-001 P1–P3)

**Sorun:** Kayıt açık tabloda duruyordu ve "SQLite mı Postgres mi" belirsizliğini canlı bir borç gibi taşıyordu.

**Çözüm:** DB-001 P1–P3 ile runtime **Postgres**'e sabitlendi; `sqlite` yalnız `DB_DIALECT=sqlite` **açıkça** verilirse devreye giren, bakımı durdurulmuş geri dönüş yoludur. Dosya adı `DB_STORAGE` ile veya varsayılan `src/*.sqlite` olarak çözülür. `sync()` / `ensureColumns()` / `dropBackupTables()` kod tabanından kaldırıldı; şema yalnız migration'lardan gelir.

**Kanıt:** `apps/api/src/config/database.js:4-5` (`SUPPORTED_DIALECTS`), `:27` ("SQLite yalnızca geri dönüş yolu"), `:35` (`process.env.DB_DIALECT || 'postgres'`), `:45` (`DB_STORAGE`), `:68` (sqlite dalı yalnız storage çözer) · `docs/api/01-overview.md:54` (`sync()`/`ensureColumns()`/`dropBackupTables()` yok — DB-001 P1) · `docs/api/09-seed-and-migrations.md:80` (P1/P3).

**Neden tablodan çıkarıldı:** Kayıt zaten **"Kapatıldı (DB-001 P1–P3)"** olarak işaretliydi ama açık kayıt tablosunda duruyordu; açık kayıt sayısını şişiriyordu. Hüküm: kapalı (tarih: DB-001 P1–P3 kapanışı, kayıt temizliği 2026-11-02).

## Bayat kayıtlar (2026-11-02)

### #29 · `staff_services` composite PK yok → duplicate join kaydı engellenmez — bayat (SQLite dönemi hata sınıfı)

**Kayıt:** `staff_services` tablosunda composite primary key olmadığı, `bulkCreate` ile aynı (staff, service) bağının iki kez eklenebileceği iddia ediliyordu.

**Ölçüm (2026-11-02, Postgres):** İddia geçersiz — bileşik PK **tanımlı**:
- `apps/api/src/database/migrations/20240101000006-create-staff-services.js:6-21` → `staff_id` **ve** `service_id` ikisi de `primaryKey: true` (Postgres'te composite `PRIMARY KEY`).
- `apps/api/src/models/StaffService.js:4-21` → aynı tanım (`staffId` / `serviceId` `primaryKey: true`, `timestamps: false`).
- Bu hata sınıfı **SQLite**'a özgüydü: SQLite'ta "her kolon ayrı PK" yorumu tek tek unique üretiyordu; aynı desen `20240101000012-fix-favorites-primary-key.js:5-11` yorumunda birebir tarif edilmiş. Runtime Postgres olduğu için sınıf ortadan kalktı.

**Kalan risk notu (kapatılmadı, ayrı iş):** `apps/api/src/controllers/staff.controller.js:36` ve `:66` `StaffService.bulkCreate(records)` çağrılarında `ignoreDuplicates` (ya da `upsert`) kullanmıyor. Aynı bağ iki kez gönderilirse çift kayıt **sessizce** oluşmaz; Postgres unique ihlali fırlar ve istek 500 döner. Yani veri bozulması yok, ama uç **idempotent değil** — istenirse `ignoreDuplicates: true` ile düzeltilir.
