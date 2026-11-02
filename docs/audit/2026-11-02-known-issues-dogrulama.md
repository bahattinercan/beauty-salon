# `docs/api/11-known-issues.md` — açık kayıtların ölçümlü doğrulaması

> Ölçüm tarihi: **2026-11-02** · Ölçülen commit: **`25a05f1`** (`git log -1 --oneline`), çalışma ağacı **ölçüm başında temizdi** (`git status --short` → boş).
> **Ölçüm sırasında çalışma ağacı değişti:** paralel bir worker `apps/api` içinde 5 kaydı düzeltmeye başladı (aşağıdaki uyarı bloğu). Bu yüzden 5 kayıt "başka worker kapsamında, atlandı" olarak işaretlendi.
> Yöntem: yalnız `read`/`grep`/`git log`/`git diff`. Kod çalıştırılmadı, test koşulmadı, `npm`/`migration`/`psql` kullanılmadı.
> Kaynak dosya **değiştirilmedi** (`docs/api/11-known-issues.md` başka worker'ın kapsamında).
> Kapsam: görevde listelenen 29 açık kayıt (#2, 3, 5–15, 16–24, 26, 27, 29–33).

## ⚠️ Paralel worker — ölçüm anında değişen dosyalar

Görev başında `git status --short` **boştu**. Ölçüm sürerken aynı worktree'de şu değişiklikler göründü (`git status --short`):

```
 M apps/api/src/middlewares/errorHandler.js      -> #24 ölü dal SİLİNDİ (git diff: `err.type === 'validation'` bloğu kaldırıldı)
 M apps/api/src/routes/index.js                  -> #31 keşif listesi artık `routes/route-table.js` ROUTES tablosundan üretiliyor
 M apps/api/src/routes/salon.routes.js           -> #23 `optionalAuth` import'u kaldırıldı
 M apps/api/src/validators/product.validator.js  -> #20 mesajlar düzeltildi ("daha büyük"), #23 create/query validator silindi
 M apps/api/src/validators/salon.validator.js    -> #19 sortBy/priceRange/categoryId/verified doğrulaması EKLENDİ
 M apps/api/tests/{app,product,salon}.test.js    -> yeni testler
?? apps/api/src/routes/route-table.js            -> #31'in yeni tek kaynağı
```

Sonuç: **#19, #20, #23, #24, #31 = "başka worker kapsamında, atlandı".** Bu 5 kayıt `HEAD` (`25a05f1`) üzerinde hâlâ geçerliydi, ama çalışma ağacında düzeltiliyor — bir sonraki dalga bunlara dokunmamalı, önce `git log -1 -- <dosya>` ile merge durumunu kontrol etmeli. Kalan 24 kaydın dosyaları değişmedi.

## Hüküm dağılımı

| Hüküm | Sayı |
|---|---:|
| hâlâ geçerli | 21 |
| bayat (artık doğru değil) | 2 |
| kısmen | 0 |
| doğrulanmadı | 1 |
| **başka worker kapsamında, atlandı** | **5** |
| **toplam** | **29** |

Bayat çıkan 2 kayıt: **#26**, **#29**. Doğrulanamayan 1 kayıt: **#16**. Başka worker'a düşen 5 kayıt: **#19, #20, #23, #24, #31**.

## Not: "başka worker düzeltiyor olabilir" ihtimali — gerçekleşti

Görev bu ihtimali #19/#20/#23/#24 için öngörmüştü; ölçüm sırasında **doğrulandı** ve #31 de aynı pakete düştü. Ayrıntı yukarıdaki uyarı bloğunda; kanıt `git status --short` + `git diff -- apps/api/src/...`.

---

## Hüküm tablosu (29 kayıt)

| # | Kayıt (kısa) | Hüküm | Ölçüm kanıtı (dosya:satır) |
|---|---|---|---|
| 2 | `GET /reviews/salon/:salonId` public, sahiplik kontrolü yok | hâlâ geçerli | `src/routes/review.routes.js:9` (route'ta `authenticate` yok) · `src/controllers/review.controller.js:78` `where: { salonId, isVisible: true }` → gizli yorum sızmıyor, kayıttaki "etki" cümlesi de doğru |
| 3 | `GET /appointments/available-slots`'te `authenticate` yok | hâlâ geçerli | `src/routes/appointment.routes.js:14` (`availableSlotsValidator` + `validate`, `authenticate` yok) |
| 5 | `PATCH /users/:id/toggle-active` rol var, sahiplik/self kontrolü yok | hâlâ geçerli | `src/routes/user.routes.js:10` (`authorize('ADMIN')`) · `src/controllers/user.controller.js:59-71` (yalnız `findByPk` + `update`, `req.user.id` ile karşılaştırma yok) |
| 6 | Staff/service sahipliğinde ADMIN yetkili değil | hâlâ geçerli | `src/routes/staff.routes.js:5-6`, `src/routes/service.routes.js:7,11,12`, `src/routes/salon.routes.js:39,43` → hepsi yalnız `authorize('SALON_OWNER')`; `ADMIN` yalnız salon `PATCH/DELETE/verify`'de (`salon.routes.js:23,24,27`) |
| 7 | `serviceId` salon uyumu doğrulanmaz | hâlâ geçerli | `src/controllers/appointment.controller.js:11` (`Service.findByPk(serviceId)`), `:31` (`Salon.findByPk(salonId)`) — ikisi arasında `service.salonId === salonId` karşılaştırması **yok**; `grep -rn "service.salonId" src/` → yalnız `src/seeders/seed.js:418` (seed), controller'da 0 |
| 8 | `staffId` opsiyonel ama `available-slots`'te filtre olarak kullanılıyor | hâlâ geçerli | `src/validators/appointment.validator.js:15` (`query('staffId').optional()`) · `src/controllers/appointment.controller.js:153-160` → `where: { staffId, date, … }`; `staffId` yoksa anahtar düşer, tarihteki **tüm** çalışanların randevusu slotu bloklar |
| 9 | `workingHours` gün tanımı yoksa çalışma saati kontrolü atlanır | hâlâ geçerli | `src/controllers/appointment.controller.js:40` `if (daySchedule && daySchedule.open && daySchedule.close)` → gün yoksa blok atlanır (randevu kabul) · karşıtlık: `available-slots` `:143-145` aynı durumda `[]` döner · `src/validators/salon.validator.js:16` `body('workingHours').optional().isObject()` → gün zorunluluğu yok |
| 10 | Review görünürlüğü değişince `ratingAvg` yeniden hesaplanmaz | hâlâ geçerli | `src/controllers/review.controller.js:140-152` (`toggleVisibility`: tek `review.update`), recompute **yok** · karşılaştırma: aynı dosyada `create` `:39-55` recompute ediyor, `src/controllers/admin.controller.js:507-527` (`deleteReview`) recompute ediyor → yalnız toggle eksik |
| 11 | `change-password` min 6, `register` min 8 | hâlâ geçerli | `src/controllers/auth.controller.js:154-155` (`newPassword.length < 6`) · `src/validators/auth.validator.js:8` (`isLength({ min: 8 })`) |
| 12 | `DELETE /categories/:id` hard delete | hâlâ geçerli | `src/controllers/category.controller.js:133` `await category.destroy()` · karşılaştırma: `service.controller.js:81`, `product.controller.js:84`, `staff.controller.js:90` → `isActive: false` (soft) |
| 13 | `Setting` ayarları hiçbir davranışı etkilemez | hâlâ geçerli | `grep -rn "Setting" src/ --include=*.js` → yalnız `src/controllers/settings.controller.js:1,25,51,54`, `src/models/index.js:12,86`, `src/routes/settings.routes.js:7-8`; başka hiçbir controller okumuyor |
| 14 | `totalRevenue` string döner | hâlâ geçerli | `src/controllers/admin.controller.js:142` `parseFloat(...).toFixed(2)` → `toFixed` **string** döner; `:162` aynı değer `stats.totalRevenue` olarak yanıta giriyor |
| 15 | `monthlyAppointments` ay adı verir, yıl yoktur | hâlâ geçerli | `src/controllers/admin.controller.js:145-151` yalnız `name: monthNames[d.getMonth()]` + `appointments`; yıl alanı yok (`date_trunc('month')` `:49-52` çıktısı `new Date(item.month)` ile aya indiriliyor) |
| 16 | `toJSON()` aynı alanı iki kez basar (`salonId` + `salon_id`) | **doğrulanmadı** (statik kanıt yetersiz) | Mekanizma adayı: modeller camelCase attribute + `field: 'salon_id'` tanımlıyor (`src/models/Appointment.js:24-28,71`), ilişkiler ise snake_case foreignKey veriyor (`src/models/index.js:22,30,41,54,68` → `foreignKey: 'salon_id'`). Çift anahtar **iddiasını** kanıtlayan statik iz yok: `grep -rn "salon_id" src/ --include=*.js \| grep -v database/migrations` → yalnız model `field:`/index tanımları ve `src/models/index.js` ilişkileri; `grep -rn "salon_id" tests/` → 0. Doğrulamak canlı bir yanıt gövdesi okumayı gerektirir → kapsam dışı (runtime istek) |
| 17 | Notification üreten kod yok | hâlâ geçerli | `grep -rn "Notification.create\|Notification.bulkCreate" src/` → **0 eşleşme**; `src/controllers/notification.controller.js:21,46,60,79,94` yalnız `findAndCountAll`/`count`/`findOne`/`update` |
| 18 | `POST /salons/:id/staff`, `/services`, `/products` body doğrulanmaz | hâlâ geçerli | `src/routes/salon.routes.js:39,43,47` → üç route'ta validator middleware yok (`grep -rn "Validator" src/routes/salon.routes.js` yalnız salon CRUD satırları `:16,17,22,23`) · controller'lar gövdeyi olduğu gibi geçiriyor: `staff.controller.js:31-32` (`...staffData`), `service.controller.js:39` (`...req.body`), `product.controller.js:48` (`...req.body`) |
| 19 | `querySalonValidator` `sortBy`/`priceRange`/`categoryId`/`verified` doğrulamaz | **başka worker kapsamında, atlandı** | `HEAD` (`25a05f1`) üzerinde ölçüldü → hâlâ geçerliydi (`src/validators/salon.validator.js:19-26` yalnız `page`/`limit`/`search`/`city`/`district`/`minRating`). Ölçüm sırasında çalışma ağacında düzeltildi: `git diff -- apps/api/src/validators/salon.validator.js` → `query('sortBy').isIn(['rating','newest'])`, `priceRange` `isInt(1..3)`, `categoryId` `isUUID()`, `verified` `isIn(['true','false'])` eklendi |
| 20 | `product.validator.js`'te bozuk mesajlar (`0 veya更大 olmalıdır`) | **başka worker kapsamında, atlandı** | `HEAD` üzerinde `src/validators/product.validator.js:7,8` metni aynen duruyordu. Ölçüm sırasında düzeltildi: `git diff -- apps/api/src/validators/product.validator.js` → `'Fiyat 0 veya daha büyük olmalıdır'` / `'Stok miktarı 0 veya daha büyük olmalıdır'` |
| 21 | `twilio` bağımlılığı yok | hâlâ geçerli | `apps/api/package.json` `dependencies` listesinde `twilio` **yok** (26 bağımlılık sayıldı) · `src/utils/sms.js:9` `require('twilio')` try/catch içinde, `:18` `throw new Error('SMS gönderilemedi')` → env tanımlıysa genel hata yoluna düşer |
| 22 | `sharp`/`swagger-jsdoc`/`swagger-ui-express` kullanılmıyor · `pg`/`pg-hstore` runtime · `sqlite3` yalnız fallback · `cookie-parser` aktif | hâlâ geçerli | `grep -rn "swagger" --include=*.js --include=*.json . --exclude-dir=node_modules` → yalnız `package-lock.json`; kaynak referansı 0 · `grep -rn "sharp" --include=*.js . --exclude-dir=node_modules` → 0 · `pg`/`pg-hstore`/`sqlite3`/`sharp`/`swagger-*` hepsi `package.json` `dependencies`'ta · `src/app.js:8,83` (`cookie-parser` require + `app.use`) · `src/config/database.js:34-42` varsayılan `postgres` |
| 23 | `optionalAuth`, `createProductValidator`, `queryProductValidator` kullanılmıyor | **başka worker kapsamında, atlandı** | `HEAD` üzerinde: `src/middlewares/auth.js:52,92` tanımlı/export, `src/routes/salon.routes.js:6` import var ama hiçbir route'ta middleware değil; `createProductValidator`/`queryProductValidator` `src/validators/product.validator.js:3,23` tanımlı, yalnız `updateProductValidator` import ediliyordu. Ölçüm sırasında düzeltildi: `git diff -- apps/api/src/routes/salon.routes.js` → `optionalAuth` import'u kaldırıldı; `git diff -- apps/api/src/validators/product.validator.js` → iki validator silindi, `module.exports = { updateProductValidator }`. **Kalan iz:** `optionalAuth` tanımı `src/middlewares/auth.js:52` hâlâ duruyor (dosya değişmedi) |
| 24 | `errorHandler`'daki `err.type === 'validation'` dalı ölü | **başka worker kapsamında, atlandı** | `HEAD` üzerinde `src/middlewares/errorHandler.js:33` mevcuttu ve `grep -rn "err.type" src/` → yalnız o satır (üretici yok, `src/middlewares/validate.js:4-13` kendisi `400` dönüyor). Ölçüm sırasında düzeltildi: `git diff -- apps/api/src/middlewares/errorHandler.js` → blok tamamen kaldırıldı |
| 26 | Runtime Postgres; `sqlite` yalnız `DB_DIALECT=sqlite` geri dönüşü | **bayat** (kayıt zaten "Kapatıldı" işaretli) | `docs/api/11-known-issues.md:40` kaydı **"Kapatıldı (DB-001 P1–P3)"** olarak duruyor → açık kayıt değil · içeriği doğru: `src/config/database.js:35` varsayılan `postgres`, `:68-73` sqlite dalı yalnız storage çözer, `:27` yorum "SQLite yalnızca geri dönüş yolu". Açık-kayıt listesinde sayılması bayat |
| 27 | `UPLOAD_DEST` cwd'ye göre çözülür | hâlâ geçerli | `src/app.js:100-103` `path.resolve(process.cwd(), process.env.UPLOAD_DEST \|\| './uploads')` · `src/middlewares/upload.js:6` `process.env.UPLOAD_DEST \|\| './uploads'`, `:13,17` `mkdirSync`/`destination` (cwd'ye göre) → farklı cwd = farklı `uploads/` |
| 29 | `staff_services` composite PK yok → duplicate join engellenmez | **bayat** | `src/database/migrations/20240101000006-create-staff-services.js:6-21` → `staff_id` **ve** `service_id` ikisi de `primaryKey: true` (Postgres'te composite `PRIMARY KEY`) · `src/models/StaffService.js:4-21` aynı tanım (`timestamps: false`) · `staff.controller.js:36,66` `bulkCreate` `ignoreDuplicates` kullanmıyor → çift kayıt unique ihlaline düşer. Bu hata sınıfı yalnız **SQLite**'a özgüydü (`20240101000012-fix-favorites-primary-key.js:5-11` aynı deseni tarif ediyor); runtime Postgres olduğu için kayıt artık geçerli değil |
| 30 | User e-posta değişikliği `password_reset_token` alanını paylaşıyor | hâlâ geçerli | `src/controllers/user.controller.js:73-77` yorum + `:103-106` `passwordResetToken`/`passwordResetTokenExpiry` yazımı (`EMAILCHANGE:<hash>:<base64>` formatı) → şifre sıfırlama akışıyla aynı iki kolon |
| 31 | `GET /` endpoint listesi eksik (`/staff`, `/upload`, `/admin`) | **başka worker kapsamında, atlandı** | `HEAD` üzerinde `src/routes/index.js:11-23` → 11 sabit endpoint, mount edilen 15 router (`:27-40`) → `/users`, `/staff`, `/upload`, `/admin` listede yoktu (kayıt `/staff`, `/upload`, `/admin` diyor; `/users` de eksikti). Ölçüm sırasında düzeltildi: `git diff -- apps/api/src/routes/index.js` → liste artık `routes/route-table.js` `ROUTES` tablosundan üretiliyor (yeni dosya `?? apps/api/src/routes/route-table.js`) |
| 32 | Rate limit testte kapalı, production'ta açık | hâlâ geçerli | `src/app.js:49` `isTest`, `:58` `if (!isTest) app.use(limiter)`, `:66-69`, `:77` aynı desen · `grep -rn "429" tests/` → **0 eşleşme**, `grep -rln "rateLimit" tests/` → 0 dosya |
| 33 | `app.js` statik `/uploads` route'u ile upload middleware'i `UPLOAD_DEST`'u iki ayrı yerde okuyor | hâlâ geçerli | İki okuma noktası: `src/app.js:101` ve `src/middlewares/upload.js:6`; üçüncü bir tüketici `src/seeders/seed.js:162`. İkisi de cwd'ye göre çözüldüğü için davranış tutarlı (kayıttaki ifade doğru), tek kaynak değil |
| — | (#25, #28) | kapsam dışı | Görev listesinde yok; dosyada zaten "Kapatıldı" olarak işaretli (`docs/api/11-known-issues.md:39,42`) |

---

## Öncelik sırası

| Öncelik | Kayıtlar | Gerekçe |
|---|---|---|
| **P0 — güvenlik / veri doğruluğu** | **#7, #30, #5, #3** | #7 yanlış salona ait hizmetle randevu üretir (veri bozulması, geri alması zor). #30 iki akış aynı token kolonunu eziyor → e-posta değişimi ile şifre sıfırlama birbirini bozar (hesap güvenliği). #5 hiçbir sahiplik kontrolü olmadan `isActive` değiştirilebiliyor. #3 fiilen public olan uç nokta `CLAUDE.md` ile çelişiyor (auth kararı netleşmeli) |
| **P1 — davranış** | **#9, #10, #17, #18, #21, #12, #14, #8, #2, #6, #32** | Kullanıcıya yanlış sonuç/boş özellik: #9 kapalı güne randevu, #10 puan güncellenmiyor, #17 bildirim hiç üretilmiyor (istemci akışı boş), #18 doğrulanmayan gövde, #21 SMS 500, #12 kategoride hard delete, #14 para string, #8 slot yanlış bloklanır, #2/#6/#32 yetki-kapsam-tutarlılık. (#19 başka worker'a düştü) |
| **P2 — kozmetik / ölü kod** | **#11, #13, #15, #16, #22, #27, #33** | Davranış bozmuyor: #11 şifre politikası metni, #13 kullanılmayan ayar, #15 grafik etiketi, #16 doğrulanmadı (önce ölçülmeli), #22 ölü bağımlılık, #27/#33 tekrar eden `UPLOAD_DEST` okuması. (#20/#23/#24/#31 başka worker'a düştü) |
| **Kapsam dışı** | #26, #29 (bayat), #25, #28 (kapalı) | Dokunulmamalı; yalnız `docs/api/11-known-issues.md`'den **çıkarılmalı/işaretlenmeli** (o dosya bu görevin kapsamı dışında) |

## Önerilen 3 dalga

### Dalga 1 — P0 (güvenlik + veri doğruluğu)
Dokunulacak dosyalar:
- `apps/api/src/controllers/appointment.controller.js` (#7 `service.salonId === salonId` kontrolü, #9 gün yoksa ret)
- `apps/api/src/controllers/user.controller.js` (#30 ayrı `emailChangeToken` alanı veya akış ayrımı, #5 self/`req.user.id` kontrolü)
- `apps/api/src/models/User.js` + `apps/api/src/database/migrations/` (yeni migration: #30)
- `apps/api/src/routes/appointment.routes.js` (#3 auth kararı)
- testler: `apps/api/tests/appointment.test.js`, `apps/api/tests/user.test.js`, `apps/api/tests/auth.test.js`

### Dalga 2 — P1 (davranış)
Dokunulacak dosyalar:
- `apps/api/src/controllers/review.controller.js` (#10 toggle'da rating recompute — `create`/`deleteReview` desenini kopyala)
- `apps/api/src/controllers/notification.controller.js` + `apps/api/src/controllers/appointment.controller.js` (#17 üretim noktaları)
- `apps/api/src/routes/salon.routes.js` + `apps/api/src/validators/` (yeni `staff.validator.js`/`service.validator.js`/`product.validator.js` create şemaları — #18; **#19 aynı dosyalarda paralel worker'da, dokunma**)
- `apps/api/src/controllers/category.controller.js` (#12 soft delete)
- `apps/api/src/controllers/admin.controller.js` (#14 `Number(...)` / #15 yıl alanı)
- `apps/api/src/utils/sms.js` + `apps/api/package.json` (#21)
- `apps/api/src/app.js` + `apps/api/tests/` (#32 rate-limit testi)
- `apps/api/src/controllers/appointment.controller.js` (#8 slot filtresi)
- `apps/api/src/routes/staff.routes.js`, `apps/api/src/routes/service.routes.js` (#6 ADMIN yetkisi — tasarım onayı gerekiyor)

### Dalga 3 — P2 (kozmetik / ölü kod)
Dokunulacak dosyalar:
- `apps/api/src/controllers/auth.controller.js` (#11 tek şifre politikası)
- `apps/api/src/controllers/settings.controller.js` (#13 ayarları davranışa bağla veya kaydı kapat)
- `apps/api/package.json` (#22 `sharp`/`swagger-*` çıkarma)
- `apps/api/src/middlewares/auth.js` (#23 `optionalAuth` **tanımı** hâlâ duruyor — import paralel worker'da kaldırıldı, kalan iş yalnız tanım)
- `apps/api/src/app.js` + `apps/api/src/middlewares/upload.js` (#27/#33 `UPLOAD_DEST` tek kaynak)
- #16 için ilk iş **ölçüm**: canlı bir `GET /appointments/my` yanıtında `salonId` + `salon_id` anahtarlarının ikisi de var mı? (bu audit kapsamı dışı)

> **Dalga 3'ten çıkarıldı (paralel worker):** #20 (`validators/product.validator.js`), #24 (`middlewares/errorHandler.js`), #31 (`routes/index.js` + `routes/route-table.js`), #19 (`validators/salon.validator.js`), #23'ün import kısmı (`routes/salon.routes.js`).

## Bu ölçümde çalıştırılan komutlar

```sh
cd apps/api
grep -rn "optionalAuth" src/
grep -rn "createProductValidator\|queryProductValidator\|updateProductValidator" src/
grep -rn "err.type" src/
grep -rn "Notification.create\|Notification.bulkCreate" src/
grep -rn "twilio" src/ package.json
grep -rn "swagger" --include=*.js --include=*.json . --exclude-dir=node_modules
grep -rn "sharp" --include=*.js . --exclude-dir=node_modules
grep -rn "salon_id" src/ --include=*.js | grep -v "database/migrations"
grep -rn "salon_id" tests/
grep -rn "service.salonId" src/
grep -rn "429" tests/
grep -rln "rateLimit" tests/
grep -rn "UPLOAD_DEST" src/
grep -rn "ratingAvg" src/
grep -rn "Validator" src/routes/salon.routes.js src/routes/staff.routes.js src/routes/service.routes.js src/routes/product.routes.js
grep -rln "rate.limit\|rateLimit" tests/
cd /c/Orca/beauty-salon && git status --short && git worktree list && git branch -a
```

Okunan dosyalar (hüküm dayanağı): `src/routes/{review,appointment,user,staff,service,salon,product,auth}.routes.js`, `src/routes/index.js`, `src/controllers/{review,appointment,user,staff,service,category,admin,auth,product,notification,settings}.controller.js`, `src/validators/{auth,salon,product,appointment}.validator.js`, `src/middlewares/{auth,validate,errorHandler,upload}.js`, `src/models/{Appointment,StaffService}.js`, `src/models/index.js`, `src/config/database.js`, `src/app.js`, `src/utils/{helpers,sms}.js`, `src/database/migrations/20240101000006-create-staff-services.js`, `src/database/migrations/20240101000012-fix-favorites-primary-key.js`, `apps/api/package.json`.

## Sınırlar (bu audit'in yapmadıkları)

- Hiçbir test koşulmadı → test sayısı/kapsam iddiası yok. Yalnız `tests/` altında geçen metin arandı (`429`, `rateLimit`).
- Runtime davranış ölçülmedi (istek atılmadı, DB'ye bakılmadı) → #16 bu yüzden "doğrulanmadı".
- `docs/api/11-known-issues.md` **değiştirilmedi**; #26/#29'un işaretlenmesi o dosyanın sahibinde.
