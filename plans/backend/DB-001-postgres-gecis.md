# DB-001 — `apps/api` çalışma zamanını SQLite'tan PostgreSQL'e taşıma planı

> **Durum:** PLAN · **Tarih:** 2026-11-01 (ölçüm: 2026-11-02 02:36 TSS / 2026-11-01 23:36 UTC)
> **Kapsam:** yalnız `apps/api`. Flutter uygulamaları ve `apps/admin_panel` kapsam dışı (API sözleşmesi
> değişmediği sürece dokunulmaz — bkz. §4 R5 sözleşme riski).
> **Kısıt:** bu doküman üretilirken **hiçbir yazma işlemi** yapılmadı: `npm test`, `npm run seed`,
> `db:migrate` **çalıştırılmadı**. Tüm sayılar salt-okuma (`psql` yerine `pg` client SELECT,
> `sqlite3` SELECT/PRAGMA, dosya okuma, `grep`) ile ölçüldü.
> **Doğrulama:** `~/.pi/agent/bin/verify.sh apps/api` (bu plan aşamasında çalıştırılmaz — kod değişmiyor).

---

## 1. Mevcut durum (ölçüm)

### 1.1 Dialect hardcoded — `apps/api/src/config/database.js`

| Kanıt | Satır | İçerik |
|---|---|---|
| `apps/api/src/config/database.js:10` | 10 | `dialect: 'sqlite'` — sabit, `process.env` okunmuyor |
| `apps/api/src/config/database.js:5-7` | 5-7 | storage = `NODE_ENV === 'test' ? 'test-database.sqlite' : 'database.sqlite'` (`path.join(__dirname,'..')` → `src/`) |
| `apps/api/src/config/database.js:77` | 77 | `console.log('SQLite bağlantısı başarılı')` |
| `apps/api/src/config/database.js:27-53` | 27-53 | `ensureColumns()` — `PRAGMA table_info` + `ALTER TABLE ... ADD COLUMN` (SQLite'a özgü) |
| `apps/api/src/config/database.js:58-72` | 58-72 | `dropBackupTables()` — `SELECT ... FROM sqlite_master` (SQLite'a özgü) |
| `apps/api/src/config/sequelize-config.js:10,22,34` | 10/22/34 | `dialect: 'postgres'` — **yalnızca sequelize-cli** için; runtime bu dosyayı kullanmıyor (`apps/api/.sequelizerc:4`) |
| `apps/api/.env:6-10` | 6-10 | `DB_HOST=localhost`, `DB_PORT=5433`, `DB_NAME=beauty_salon`, `DB_USER=beauty_user` — runtime tarafından **okunmuyor** (database.js env okumuyor) |
| `apps/api/.env:3` | 3 | Yorum: "(Not: aktif sürücü SQLite; DB_* yalnızca başka bir dialect'e geçilirse kullanılır.)" |

Sonuç: uygulama dosya tabanlı SQLite'a yazıyor; `pg`/`pg-hstore` (`package.json:36-37`) kurulu ama
runtime'da **ölü bağımlılık**.

### 1.2 SQLite dosyaları ve satır sayıları (gerçek dev verisi burada)

| Dosya | Boyut | Not |
|---|---|---|
| `apps/api/src/database.sqlite` | **180 224 bayt** (~176 KiB) | gerçek runtime DB (dev) |
| `apps/api/src/test-database.sqlite` | **163 840 bayt** (~160 KiB) | test DB; her koşumda `drop()+sync({force:true})` ile yeniden kurulur (`apps/api/tests/setup.js:7-8`) |

Her iki dosya da **git'te izlenmiyor** (`/c/Orca/beauty-salon/.gitignore:10` → `*.sqlite`);
yani dev verisinin tek kopyası bu makinedeki dosyalardır (§6 geri dönüş için kritik).

Satır sayıları — `sqlite3 apps/api/src/database.sqlite "select count(*) from <tablo>"`:

| tablo | SQLite | PostgreSQL (`beauty_salon`) |
|---|---:|---:|
| users | 5 | 0 |
| salons | 2 | 0 |
| staff | 2 | 0 |
| service_categories | 6 | 0 |
| services | 4 | 0 |
| staff_services | 4 | 0 |
| appointments | 3 | 0 |
| reviews | 1 | 0 |
| favorites | 0 | 0 |
| products | 0 | 0 |
| notifications | 0 | 0 |
| settings | 0 | **tablo yok** |
| SequelizeMeta | **tablo yok** | 13 |
| **toplam** | **27** | **0** |

`SequelizeMeta`'nın SQLite'ta bulunmaması, migration'ların orada **hiç uygulanmadığını** kanıtlar:
SQLite şeması `sync()` + `ensureColumns()` ile oluşmuş.

### 1.3 PostgreSQL tarafı (Mint docker, tunel 5433)

`node -e` + `pg` client ile salt-okuma (psql CLI bu makinede yok, `which psql` → bulunamadı;
127.0.0.1:5433 TCP açık):

```
SERVER: PostgreSQL 16.15 on x86_64-pc-linux-musl
DB: beauty_salon   USER: beauty_user
TABLES(12): SequelizeMeta, appointments, favorites, notifications, products, reviews,
            salons, service_categories, services, staff, staff_services, users
MIGRATIONS_APPLIED 13 / 13
```

13 migration'un tamamı uygulanmış, **tüm tablolar 0 satır** (`users/salons/service_categories/services`
dahil). Yani Postgres şu an yalnızca "şema provası" durumunda; gerçek veri SQLite'ta.
Ayrıca `settings` tablosu Postgres'te **hiç yok** — bunun migration'ı da yok (§1.5).

### 1.4 Migration taraması — 13 dosya, tek tek

Taranan dizin: `apps/api/src/database/migrations/` (**13 dosya**, hepsi okundu).

| # | Dosya | SQLite'a özgü API / işlev | Postgres uyumu | Düzeltme gerekiyor mu | Not |
|---|---|---|---|:--:|---|
| 1 | `20240101000001-create-users.js` | yok (yalnız `Sequelize.ENUM` → SQLite'ta TEXT'e düşer) | **EVET** | **EVET** | Model `password_reset_token`, `password_reset_token_expiry` kolonlarını istiyor (`src/models/User.js:61-70`), migration'da yok → yeni migration gerekli. `down()` (satır 68-70) yalnız `dropTable` yapıyor, `enum_users_role` tipi PG'de kalıyor → tekrar `up` "type already exists" hatası |
| 2 | `20240101000002-create-service-categories.js` | yok | **EVET** | **EVET** | Modelde `description` (STRING) ve `is_active` (BOOLEAN) var (`src/models/ServiceCategory.js:25-43`), migration'da yok. Ayrıca `icon_name`: migration `allowNull:true`, model `allowNull:false` |
| 3 | `20240101000003-create-salons.js` | yok (`JSONB`, `DECIMAL(10,8)` SQLite'ta TEXT/numeric'e düşer) | **EVET** | **EVET** | Modelde olup migration'da olmayan **7 kolon**: `price_range`, `pending_email`, `pending_phone`, `phone_change_token`, `phone_change_token_expiry`, `email_change_token`, `email_change_token_expiry` (`src/models/Salon.js:92-148`). Ayrıca `gallery_images`/`working_hours` migration'da **JSONB**, modelde **TEXT** (§1.5) |
| 4 | `20240101000004-create-staff.js` | yok | **EVET** | HAYIR | Model ile birebir |
| 5 | `20240101000005-create-services.js` | yok | **EVET** | HAYIR | Model ile birebir |
| 6 | `20240101000006-create-staff-services.js` | iki `primaryKey: true` (SQLite'ta her kolonu ayrı unique yapar) | **EVET** — PG'de gerçek composite PK: `staff_services_pkey PRIMARY KEY (staff_id, service_id)` (ölçüldü) | HAYIR | Model `timestamps: false` (`src/models/StaffService.js:19`); PG'de fazladan `created_at/updated_at` kolonu zararsız |
| 7 | `20240101000007-create-appointments.js` | yok (`DATEONLY`, `TIME`, `ENUM`) | **EVET** — `date:date`, `start_time:time without time zone`, `status:enum_appointments_status` (ölçüldü) | **EVET** | `down()` enum tipini bırakıyor (satır 80-82) |
| 8 | `20240101000008-create-reviews.js` | yok (`JSONB`) | **EVET** | HAYIR | `reviews_appointment_id_key UNIQUE` beklendiği gibi oluştu |
| 9 | `20240101000009-create-favorites.js` | iki `primaryKey: true` → SQLite'ta yanlış şema (bir kullanıcı tek salon favorileyebiliyordu) | **EVET** (PG'de doğru composite PK) | HAYIR | `012` tarafından yeniden inşa ediliyor |
| 10 | `20240101000010-create-products.js` | yok (`JSONB`) | **EVET** | HAYIR | Model ile birebir |
| 11 | `20240101000011-create-notifications.js` | yok (`JSONB`, `ENUM`) | **EVET** | **EVET** | `down()` enum tipini bırakıyor (satır 50-52) — `enum_notifications_type` |
| 12 | `20240101000012-fix-favorites-primary-key.js` | **yok** — `368e61e` ile `getTable`/`hex(randomblob(16))` kaldırıldı; artık yalnız `describeTable`, `createTable`, `addIndex`, `bulkInsert`, `dropTable`, `renameTable`, `sequelize.query('SELECT ...')` (satır 14-73) | **EVET** — mevcut PG'de sonuç doğru: `favorites_pkey PRIMARY KEY (id)` (ölçüldü) | HAYIR | Lehçe-bağımsız. Tek kozmetik: `renameTable` sonrası FK constraint adları `favorites_new_*` olarak kalır |
| 13 | `20240101000013-add-media-to-service-categories.js` | **yok** — `describeTable` + `addColumn`/`removeColumn` (satır 13-40) | **EVET** — `image_url:text`, `video_url:text` (ölçüldü) | HAYIR | SQLite'ta `VARCHAR(255)`, PG'de `text` — zararsız tip farkı |

**Tarama özeti:** 13 dosya tarandı · Postgres'te **kırılan: 0** (012 düzeltmesinden sonra) ·
**düzeltme gereken: 5** → `001`, `002`, `003`, `007`, `011` (ilk üçü şema sürüklenmesi, son ikisi
`down()` enum hijyeni) · **eksik migration: 1 tablo** (`settings`).

> Not: `0012` fix'i "SQLite'a özgü API kaldırıldı" örneğinin tek kanıtı değil; **kalan kaçak
> migration'larda değil, runtime SQL'inde**: `src/controllers/admin.controller.js:101,110`
> `strftime('%Y-%m', Appointment.date)` (SQLite'ta `DATE_TRUNC` yok diye yazılmış) — PG'de
> `date_trunc('month', ...)` gerekir; ayrıntı §1.6.

### 1.5 Şema sürüklenmesi: SQLite (sync+ensureColumns) ↔ PostgreSQL (13 migration)

`pragma table_info` vs `information_schema.columns` — kolon adı karşılaştırması:

| tablo | PG'de **eksik** kolonlar | PG'de **fazla** kolonlar | tip farkı |
|---|---|---|---|
| users | `password_reset_token`, `password_reset_token_expiry` | — | `role` TEXT→enum, `is_verified/is_active` TINYINT(1)→boolean, `avatar_url` VARCHAR(255)→text, `created_at` DATETIME→timestamptz |
| salons | `price_range`, `pending_email`, `pending_phone`, `phone_change_token`, `phone_change_token_expiry`, `email_change_token`, `email_change_token_expiry` | — | `gallery_images` **TEXT→jsonb**, `working_hours` **TEXT→jsonb**, `latitude/longitude` FLOAT→numeric, `rating_avg` FLOAT→numeric, `address/city/district` nullable (model `allowNull:false`) |
| service_categories | `description`, `is_active` | — | `icon_name` migration'da nullable, modelde zorunlu |
| staff_services | — | `created_at`, `updated_at` (model `timestamps:false`) | — |
| settings | **tablo hiç yok** | — | SQLite: `key VARCHAR(255) PK, value JSON, created_at DATETIME` |
| staff, services, appointments, reviews, favorites, products, notifications | — | — | `status`/`type` TEXT→enum, TINYINT(1)→boolean, `images`/`data` JSONB→jsonb, `price` DECIMAL→numeric |

Toplam: **12 eksik kolon + 1 eksik tablo**. Bu sürüklenme PG'de `npm run seed`'i ilk satırda kırar:
Sequelize `INSERT` tüm model kolonlarını listeler → `salons.price_range` yok → `42703 column does not exist`.

### 1.6 Ek kaçaklar (kapsam genişletmesi — plana dahil)

| Kaçak | Kanıt | Etki |
|---|---|---|
| `strftime` | `src/controllers/admin.controller.js:100-101,110` | `/admin/dashboard` PG'de 500 (`function strftime(unknown, timestamp with time zone) does not exist`) |
| `PRAGMA table_info` | `src/config/database.js:35` | `ensureColumns()` PG'de no-op'a düşüyor (satır 28 `dialect.name !== 'sqlite'` guard'ı) — yani şema sürüklenmesi PG'de **sessizce** kalır |
| `sqlite_master` | `src/config/database.js:62` | aynı şekilde no-op |
| `sync()` runtime'da | `src/server.js:15-17`, `src/seeders/reset.js:22`, `package.json:9` (seed) | PG'de `sync()` migration'ların ürettiği şemayı model tanımıyla ezme/çakışma riski (özellikle enum tipleri) |
| `Op.like` (11 yer) | `admin.controller.js:180,181,191,268,384`, `product.controller.js:14`, `salon.controller.js:21-27` | SQLite `LIKE` ASCII'de büyük/küçük harf duyarsız, PG'de **duyarlı** → arama davranışı değişir (Türkçe `İ/ı` ile `iLike` de tam çözmez) |

---

## 2. Hedef mimari

**Tek yol (tek dialect, tek doğruluk kaynağı):**

1. **Dialect env'den gelir.** `src/config/database.js` tek `Sequelize` örneği üretir; `DB_DIALECT`
   (`postgres` | `sqlite`) + `DB_HOST/PORT/NAME/USER/PASSWORD` veya `DB_STORAGE` okunur.
   Varsayılan `postgres`. Tek bir *connection factory* (`buildSequelizeOptions(env)`) hem runtime
   hem `sequelize-cli` (`sequelize-config.js`) tarafından kullanılır → iki config dosyası arasındaki
   bugünkü ayrışma ortadan kalkar.
2. **`sync()` ve `ensureColumns()`/`dropBackupTables()` kaldırılır.** Şema yalnız migration'lardan
   oluşur: `server.js` açılışta `sync()` çağırmaz, yalnız `authenticate()` + (opsiyonel, açıkça
   istenirse) `db:migrate` çalıştırır. Seed/reset de `sync()` yerine migration varsayar.
3. **Migration'lar tek doğruluk kaynağı.** Test, dev, prod **aynı** dialect (Postgres) ve **aynı**
   migration seti. Şema değişikliği = yeni migration dosyası; model tanımı migration'ı takip eder.
4. **`SequelizeMeta` tek şema kaydı.** `docs/api/04-data-model.md:3`'teki "şema `sync()` ile oluşur"
   ifadesi geçersizleşir (P6).
5. **Ortam ayrımı connection string ile:** dev `beauty_salon`, test `beauty_salon_test`,
   prod `DB_NAME`. Test DB izole ve `drop/migrate` yetkisi yalnız onda.
6. **SQLite geri dönüş yolu KORUNUYOR (tek env ile dönüş):** `DB_DIALECT=sqlite` + `DB_STORAGE`
   ile eski yol **çalışır durumda tutulur** — dönüş tek env değişkenine iner. Ölçüm (2026-11-02):
   `apps/api/src/config/database.js:27` ("SQLite yalnızca geri dönüş yolu"), `:28-32`
   `SQLITE_FALLBACK_FILES`, `:34-42` `resolveDialect` (varsayılan `postgres`), `:68-73`
   `dialect === 'sqlite'` dalı storage'ı çözer; dialect'e bağlı tek sorgu farkı
   `apps/api/src/controllers/admin.controller.js:49-52` (`sqlite` → `strftime`, aksi hâlde `date_trunc`);
   doküman karşılığı `docs/ARCHITECTURE.md:46` ("SQLite yalnızca `DB_DIALECT=sqlite` geri dönüş yolu").
   `sync()`/`ensureColumns()`/`dropBackupTables()` P1'de kaldırıldı (madde 2) — yani bu dal artık
   `sync()` fallback'i değil, storage seçimi + migration'lı şemadır. **Kod yolunun silinmesi ayrı bir
   karardır ve şu an onaylanmadı.** Bu maddedeki önceki "P5 sonunda kod yolu silinir" ifadesi
   yukarıdaki ölçümle **geçersizdir**; §6 de aynı gerçeğe göre düzeltildi.

---

## 3. Fazlar

> Her faz: kapsam · dokunulacak dosyalar · kabul ölçütü · bağımlılık. "Yazma" içeren kabul
> ölçütleri uygulama fazında çalıştırılır (bu doküman aşamasında değil).

### P1 — Config + connection factory (dialect env'den)

- **Kapsam:** `database.js` tek factory'e çevrilir; `DB_DIALECT` env'i (`postgres` varsayılan),
  `pg` pool ayarları, `logging` davranışı, saat dilimi (`timezone: 'UTC'`), `dialectOptions`.
  `sequelize-config.js` aynı factory'yi kullanacak şekilde inceltilir. `sync()`/`ensureColumns()`/
  `dropBackupTables()` çağrıları `server.js`, `seeders/reset.js`, `package.json` seed script'inden
  çıkarılır (SQLite fallback'i `DB_DIALECT=sqlite` iken korunur).
- **Dosyalar:** `src/config/database.js`, `src/config/sequelize-config.js`, `src/server.js:4,15-20`,
  `src/seeders/reset.js:1,22-23`, `package.json:9`, `.env.example`, `.env`/`.env.test` (commit edilmez).
- **Kabul ölçütü:** `DB_DIALECT=postgres node -e "require('./src/config/database').sequelize.authenticate()"`
  → `SELECT 1` başarılı; `DB_DIALECT=sqlite` ile eski dosya hâlâ açılıyor; `database.js` içinde
  `dialect: 'sqlite'` sabiti **0 eşleşme**; `.sqlite` yolu kodda yalnız `DB_DIALECT=sqlite` dalında.
- **UYGULANDI (2026-11-02):** `database.js` tek `buildSequelizeOptions(env)` factory (dialect `DB_DIALECT`, varsayılan `postgres`; host/port/db/user/pass + `timezone:'UTC'` + pool yalnız postgres dalında, `.sqlite` yolu yalnız `DB_DIALECT=sqlite`), `sequelize-config.js` aynı factory'ye inceltildi, `sync()/ensureColumns()/dropBackupTables()` çağrıları `server.js`/`seeders/reset.js`/`package.json` seed'den kaldırıldı; `.env`/`.env.test` bu fazda `DB_DIALECT=sqlite`; kanıt: pg+sqlite `authenticate` OK, `npm test` 357 passing (TZ=UTC + TZ=Europe/Istanbul), boot log "sqlite bağlantısı başarılı".
- **Bağımsızlık:** **Bağımsız** — tek başına devreye alınabilir, tek env değişkeniyle geri alınır.
  Diğer tüm fazların **önkoşulu**.

### P2 — Migration taraması/düzeltmeleri + sıfırdan `db:migrate` provası

- **Kapsam:** §1.4 tablosundaki 5 dosyanın düzeltmesi + eksik şema.
  1. `settings` tablosu için **yeni migration** (`key` PK STRING, `value` JSON→JSONB, `created_at`).
  2. `salons`: `price_range INTEGER NOT NULL DEFAULT 2`, `pending_email/pending_phone VARCHAR(255)`,
     `phone_change_token/email_change_token VARCHAR(255)`, `*_token_expiry TIMESTAMPTZ`.
  3. `users`: `password_reset_token VARCHAR(255)`, `password_reset_token_expiry TIMESTAMPTZ`.
  4. `service_categories`: `description VARCHAR(255)`, `is_active BOOLEAN NOT NULL DEFAULT true`.
  5. `gallery_images`/`working_hours` **metin mi jsonb mi** kararı: ya model `JSONB`'ye çekilir
     (`src/models/Salon.js:45-52,98-118` getter/setter'ları kaldırılır) ya da migration `TEXT`'e
     indirilir — **tek yön seçilir**, iki taraflı bırakılmaz.
  6. `001/007/011` `down()`: enum tiplerini `DROP TYPE IF EXISTS` ile temizle (up/down idempotent).
  7. Var olan 13 migration dosyası **geçmişi bozmamak için** yalnız gerektiği kadar düzenlenir;
     tercih edilen yol **yeni** migration dosyaları (14, 15, …) eklemektir. Mevcut PG DB'si zaten
     13/13 olduğu için yeni dosyalar üstüne biner.
- **Dosyalar:** `src/database/migrations/2024*.js` (5 dosya, yalnız `down()`/idempotentlik),
  yeni `src/database/migrations/2026*-add-missing-schema.js` (settings + 11 kolon).
- **Kabul ölçütü:** boş `beauty_salon_test` üzerinde `NODE_ENV=test npx sequelize-cli db:migrate`
  → **13 eski + yeni dosyalar = 13+N, hepsi OK**; `db:migrate:undo:all` → tüm tablolar ve enum
  tipleri gider, ardından tekrar `db:migrate` **hatasız** (idempotent up/down);
  `psql \d` şemasında §1.5'teki 12 eksik kolon + `settings` **mevcut**.
- **UYGULANDI (2026-11-02):** 3 yeni migration (`20261102000014-create-settings`, `…15-add-missing-columns` = 11 kolon, `…16-align-salon-json-columns-to-text`) + `001/007/011` `down()`'larına `DROP TYPE IF EXISTS`; `gallery_images`/`working_hours` kararı **TEXT** (model tek doğru taraf, seeder/testler değişmedi); prova `beauty_mig_scratch` DB'sinde: 16/16 migrate OK → `undo:all` (0 tablo, 0 enum tipi) → tekrar 16/16 OK, `settings` + 11 kolon şemada doğrulandı, `npm test` 357 passing, scratch DB DROP edildi. Açık kalan (P3): `staff_services`'ta migration'ın yarattığı `created_at/updated_at` NOT NULL kolonları modelde `timestamps:false` olduğu için `npm run seed`'i `23502 not-null` ile kırıyor.
- **Bağımlılık:** P1'e bağımlı (factory yoksa cli de runtime ile aynı yolu kullanmaz).

### P3 — Seeder'ın Postgres'e taşınması (idempotentlik korunur)

- **Kapsam:** `src/seeders/seed.js` idempotent kalır ("var mı, yoksa oluştur" — `seed.js:14-18`),
  `sync()` varsayımı kaldırılır (P1'de), `settings` varsayılanları (`settings.controller.js:4-18`
  `DEFAULTS`) DB'ye yazılır veya bilinçli olarak yazılmaz — karar dokümante edilir.
  `reset.js` `TRUNCATE ... RESTART IDENTITY CASCADE` (veya `DELETE` + FK sırası) ile dialect'e
  uyarlanır; enum/sequence yeniden kurulumu gerekmez (UUID PK).
- **Dosyalar:** `src/seeders/seed.js`, `src/seeders/reset.js`, `package.json:9-10`.
- **Kabul ölçütü:** `npm run seed` **iki kez** art arda → ikinci koşum 0 yeni kayıt (idempotent) ve
  her tabloda `count(*) > 0` (favorites/products/notifications/settings seed kapsamına göre
  belgelenmiş istisnalar hariç); `npm run seed:reset` → temiz + yeniden dolu DB.
- **Bağımlılık:** P2'ye bağımlı (şema tam olmadan seed `42703` alır).
- **UYGULANDI (2026-11-02):**
  1. **`staff_services` çözümü — kolonlar DROP edildi** (yeni migration
     `20261102000017-drop-staff-services-timestamps.js`; DEFAULT eklemek değil). Gerekçe: model
     `timestamps: false` tek doğru kaynak; iki kolon bugüne kadar hiçbir INSERT'te dolmadı (PG'de 0
     satır) ve `updated_at` DEFAULT'la da hep INSERT anında donacağı için yanıltıcı "ölü" kolon
     olurdu; SQLite tarafında (sync + `timestamps:false`) bu kolonlar hiç oluşmadığından DROP iki
     dialecti modelde birleştirir; `staff_services`'i okuyan tek bir sorgu timestamp istemiyor.
     `down()` kolonları `DEFAULT now()` + `NOT NULL` olarak geri ekler (orijinal DEFAULT'suz tanım
     dolu tabloya eklenemez); `undo` + `migrate` provası veri kaybı olmadan döndü.
  2. **`settings` varsayılanları seed'e YAZILMAZ** (karar, `seed.js` başlığında da yazılı):
     `GET /settings` `DEFAULTS`'ı her okumada DB'nin üzerine merge ediyor; tabloda yalnız admin'in
     açıkça kaydettiği override'lar (`PUT /settings` upsert) durmalı. Yazılsaydı "ayarlanmamış" ile
     "açıkça varsayılana ayarlanmış" ayırt edilemez ve `DEFAULTS` ileride değişse eski kurulumda
     donmuş değer kalırdı → `settings` seed sonrası **0 satır** (belgelenmiş istisna).
  3. `seed.js` `sync()` çağırmıyor; Postgres'te `assertMigrationsApplied()` uygulanmış migration
     sayısı < dosya sayısı ise `Şema eksik: 17/18 … Önce npm run migrate` mesajıyla **exit 1** verir
     (eksik şema anlaşılmaz `42703`'e dönüşmez). İdempotentlik korundu ("var mı, yoksa oluştur").
  4. `reset.js`: Postgres'te tek `TRUNCATE TABLE … RESTART IDENTITY CASCADE` (FK sırası/tek tek
     silme derdi yok, boş tabloda da hata vermez), `DB_DIALECT=sqlite` geri dönüşünde child-first
     `DELETE`; yalnız var olan tablolara dokunur. `seed:reset` = `node src/seeders/reset.js`
     (dotenv en üstte, hata → exit 1, pool `finally`'de kapanır).
  5. `.env` → `DB_DIALECT=postgres` (dev akışı Postgres; geri dönüş tek satır: `DB_DIALECT=sqlite`).
  6. **Kanıt (ölçüldü):** `db:migrate` → 17/17 up, pending 0; `npm run seed` **iki kez** → ikinci
     koşumda 0 INSERT, tablo sayıları birebir aynı: users 4, salons 12, staff 7, service_categories 6,
     services 16, staff_services 16, appointments 9, reviews 9; `favorites`/`products`/`notifications`/
     `settings` **0** (seed kapsamı dışı — sırasıyla kullanıcı etkileşimi, admin ürün kataloğu, olay
     tetiklemeli bildirim ve admin override tablosu); `seed:reset` iki kez yeşil (temiz + yeniden dolu);
     `npm test` 357 passing (izole HEAD anlık görüntüsü + bu diff; P4 testleri aynı anda Postgres'e
     taşıdığı için ortak çalışma ağacında test sayısı P4'ün anlık durumuna bağlı).
- **Bağımlılık:** P2'ye bağımlı (şema tam olmadan seed `42703` alır).

### P4 — Test altyapısı (izole test DB, paralel koşum, `.env.test`)

- **Kapsam:** `tests/setup.js:6-9` `drop()+sync({force:true})` yerine
  **`db:migrate` + tablo truncate** stratejisi (migration'lar tek doğruluk kaynağı — hedef mimari §2.2).
  Enum tipleri `drop()` ile silinmediği için "type already exists" hatası doğar; truncate yaklaşımı
  bunu da çözer. `.env.test` → `DB_DIALECT=postgres`, `DB_NAME=beauty_salon_test`.
  Paralel koşum: mocha tek süreç + tek DB olduğu sürece dosya bazlı paralellik **yok**; paralel
  isteniyorsa `DB_NAME` şablonu (`beauty_salon_test_<worker>`) + her worker'a kendi migration koşumu.
  `--exit` ve tek `sequelize` bağlantısı paylaşımı (`setup.js:261-271`) korunur.
- **Dosyalar:** `tests/setup.js`, `.env.test` (commit edilmez), `.env.example`, `package.json:11-13`
  (yeni `test:db:create` benzeri yardımcı script), gerekirse `tests/helpers/`.
- **Kabul ölçütü:** 15 test dosyası / **357 `it()`** (statik sayım: `grep -rhoE "\b(it|test)\(" tests/ | wc -l`)
  Postgres'te **0 failing** — hem `TZ=UTC` hem `TZ=Europe/Istanbul` ile; ikinci koşum (DB dolu) da
  yeşil (temizlik kanıtı).
- **Bağımlılık:** P2'ye bağımlı; P3 ile **paralel** yürüyebilir (ayrı test DB'si kullanır).
- **UYGULANDI (2026-11-02):** `tests/setup.js` `drop()+sync({force:true})` yerine **migration + truncate**: yeni
  `tests/helpers/migrator.js` (`src/database/migrations/**` dosyalarını in-process koşar, uygulananları
  `SequelizeMeta`'ya yazar — sequelize-cli ile aynı sözleşme; yeni npm bağımlılığı yok) + her test dosyası
  öncesi tek `TRUNCATE TABLE … RESTART IDENTITY CASCADE` (SequelizeMeta hariç; enum tipleri silinmediği için
  "type already exists" doğmaz). Yeni `tests/helpers/ensure-test-db.js`: `node tests/helpers/ensure-test-db.js`
  → `.env.test` yüklenir, `beauty_salon_test` yoksa `CREATE DATABASE` (varsa atlar), tüm migration'ları koşar,
  `DROP DATABASE` yapmaz, dev `beauty_salon`'a dokunmaz. `.env.test` artık `DB_DIALECT=postgres` +
  `DB_NAME=DB_NAME_TEST=beauty_salon_test` (gitignored); `.env.example`'a `DB_NAME_TEST` + yardımcı komut notu
  eklendi. `package.json`'a **dokunulmadı** (P3'te). Kanıt: `ensure-test-db` → 17/17 migration; `TZ=UTC` ve
  `TZ=Europe/Istanbul` **339 passing / 18 failing** (iki koşum aynı), arka arkaya ikinci koşum da 339/18;
  koşum sırasında canlı sorgu → `current_database()=beauty_salon_test`, `inet_server_addr()=172.19.0.2`
  (docker), `users=7`, `salons=2` = testler gerçekten Postgres'e vuruyor; tam koşum ~60 sn (5 dk sınırının
  çok altında); `grep -n "sync(\|drop()" apps/api/tests/setup.js` → 0 eşleşme.
- **P4b (ayrı görev) — Postgres davranış farklarından kalan 18 kırılma.** P4 altyapısı yeşil olduğu hâlde
  testler **339/357**: kırılmaların tamamı P4 sahipliği dışındaki dosyalarda ve gerçek üretim hataları
  (test tarafında normalizasyonla **maskelenmedi**). Kategoriler (her satır: kırılan test → kök neden → sahip):
  1. **admin dashboard 500 (3 test)** — `tests/admin.test.js:59`, `:74`, `tests/service-staff.test.js:280` →
     `src/controllers/admin.controller.js:101,110` `strftime('%Y-%m', Appointment.date)` (PG'de fonksiyon yok) +
     tırnaksız `Appointment` alias'ı (`missing FROM-clause entry for table "appointment"`); `date_trunc('month', …)`
     + alias düzeltmesi. Risk **R2**, kapsam **P6** (§3 P6 `strftime` notu).
  2. **NUMERIC/DECIMAL string (9 test)** — `admin.test.js:248,273,1009,1029`, `product.test.js:110`,
     `review.test.js:165`, `salon.test.js:84,105`, `service-staff.test.js:142` → PG `NUMERIC` `'5.00'` (string)
     döndürüyor, SQLite sayı dönüyordu: `salons.rating_avg`, `services.price`, `products.price`. Model getter
     (`parseFloat`) veya `pg` type parser (OID 1700) kararı. Risk **R5** — API sözleşmesi (Flutter/admin_panel
     `num` parse'ı) bu yüzden açık.
  3. **TIME formatı (2 test)** — `appointment.test.js:82,342` → PG `time` `'10:00:00'`, SQLite `'10:00'`;
     `Appointment.startTime/endTime` için `HH:mm` getter/normalizasyon gerekir. Risk **R3**.
  4. **Geçersiz UUID → 500 (2 test)** — `app.test.js:61`, `appointment.test.js:619` → PG `invalid input syntax
     for type uuid` 500 üretiyor, beklenen 404; param doğrulaması (`src/validators/**` veya route middleware)
     gerekir. Risk **R2** (dialect'e özgü kaçak).
  5. **`reviews.appointment_id` UNIQUE (2 test)** — `review.test.js:256,303` → test, `Appointment.findOne({status:
     'COMPLETED'})` ile **zaten yorumlanmış** randevuyu seçip ikinci yorum yazıyor; PG'de `UNIQUE` (migration
     `008`) doğru şekilde reddediyor, SQLite'ta kısıt yoktu. Düzeltme **test verisi** tarafında
     (`tests/review.test.js` yorumsuz randevu seçmeli), üretim kodu doğru. Risk **R1**.
  Önerilen dosya sahipliği (P4b): `src/controllers/admin.controller.js`, `src/models/{Salon,Service,Product,
  Appointment}.js` (veya `src/config/database.js`'te pg type parser), `src/validators/**`+`src/routes/**`,
  `tests/review.test.js`.
- **KAPATILDI (2026-11-02) — P4b uygulandı.** `TZ=UTC` ve `TZ=Europe/Istanbul` **357 passing / 0 failing**;
  arka arkaya ikinci koşum (dolu DB) da 357. Kategori kategori yapılanlar:
  1. `src/controllers/admin.controller.js:46-54` (kullanım `:108` ve `:117`) — dialect'e göre tek aylık ifade (`sqlite` →
     `strftime('%Y-%m', col)`, `postgres` → `date_trunc('month', col)`), kolon `sequelize.col` ile verildi
     (ham literal'de tırnaksız `Appointment.date` PG'de `missing FROM-clause entry` üretiyordu); `attributes`
     ve `order` aynı ifadeyi kullanıyor.
  2. `src/config/database.js:7-26,95` — NUMERIC/DECIMAL tek noktadan `parseFloat`: `pg` OID 1700 parser'ı **+**
     `DataTypes.postgres.DECIMAL.parse` (Sequelize bağlantıda kendi DECIMAL parser'ını kaydedip `pg`'ninkini
     gölgeliyor; `numeric[]` de aynı static'i kullanır). Böylece `raw: true` sorguları da sayı döner; API
     sözleşmesi (`double.parse`/`Number()`) korunur, istemci değişikliği gerekmedi. Yuvarlama yapılmaz.
  3. `src/models/Appointment.js:4-11,43-55` — `startTime`/`endTime` getter'ı `HH:mm`'e indirger (DB'de
     saklanan değer bozulmaz, yalnız okunan değer normalize edilir; validator zaten `HH:MM` bekliyor).
  4. `src/validators/uuid.validator.js` (yeni) + `src/routes/salon.routes.js:12-13`,
     `src/routes/appointment.routes.js:9-10` — `router.param` ile UUID biçim kontrolü; biçimsiz id
     controller'a gitmeden mevcut 404 sözleşmesiyle yanıtlanır (400 değil).
  5. `tests/review.test.js:34-47,269,316` — yorumsuz COMPLETED randevu seçimi (`Op.notIn` ile yorumlanmışlar
     elenir; seed'de yorumsuz kalmadığı için taze randevu üretilir). Üretim kodu (`UNIQUE`) doğruydu,
     test zayıflatılmadı.
  SQLite geri dönüş yolu: `DB_DIALECT=sqlite` + geçici dosya ile duman testi → `strftime` dalı,
  `TIME` getter'ı `10:00`, dashboard 200 ve aylık seri doğru. **Not:** `DB_DIALECT=sqlite npm test` yeşil
  değil — P4'te `tests/setup.js:11-17` testler için Postgres zorunluluğu koyuyor (kasıtlı, P4b sahipliği
  dışında); geri dönüş kanıtı bu yüzden duman testiyle alındı. `DB_DIALECT=postgres npm run seed` iki kez →
  satır sayıları değişmedi (idempotent). Commit: `apps/api` tek commit, push yok.

### P5 — Veri taşıma (SQLite dev verisi gerekli mi?)

- **Kapsam:** Karar + komut. Ölçüm: SQLite'ta toplam **27 satır** (5 user, 2 salon, 6 kategori,
  4 hizmet, 2 personel, 4 eşleme, 3 randevu, 1 yorum) — hepsi **seed ile yeniden üretilebilir**
  veri (`seed.js` aynı 4 kullanıcı/2 salon/kategorileri yaratıyor). Bu yüzden **önerilen: aktarma
  yok, `seed` yeterli**. Yine de aktarma istenirse:
  1. `sqlite3 src/database.sqlite -json "select * from <tablo>"` ile tablo tablo JSON dump (salt okuma),
  2. `node scripts/import-sqlite-to-pg.js` — FK sırası: users → service_categories → salons →
     staff → services → staff_services → appointments → reviews → favorites → products →
     notifications → settings; UUID'ler korunur, `DATEONLY`/`TIME` string olarak geçer,
     `gallery_images`/`working_hours` TEXT→jsonb cast (`::jsonb`) veya model kararına göre string,
     `is_active` 0/1 → boolean cast,
  3. doğrulama: tablo tablo `count(*)` eşitliği + `md5` benzeri özet.
  Script `apps/api/scripts/` altında, **tek seferlik** ve idempotent (`ON CONFLICT DO NOTHING`).
- **Dosyalar:** `apps/api/scripts/import-sqlite-to-pg.js` (yeni), `apps/api/scripts/README.md` (yeni).
- **Kabul ölçütü:** aktarma seçilirse her tabloda SQLite satır sayısı == PG satır sayısı (§1.2 tablosu);
  aktarma seçilmezse `npm run seed` sonrası `users ≥ 4`, `salons ≥ 2`, `service_categories ≥ 6`.
- **Bağımlılık:** P2 + P3'e bağımlı (şema + seed yeşil olmadan aktarma yapılmaz).
- **KAPATILDI (2026-11-02 03:42 TSS): aktarma YAPILMADI.** Yukarıdaki aktarma yolu **uygulanmayacak**:
  `apps/api/scripts/import-sqlite-to-pg.js` yazılmaz, Postgres dev verisi yalnız `npm run seed` ile üretilir.
  Gerekçe (üç madde, hepsi ölçümle doğrulandı):
  1. SQLite'taki 27 satırın **tamamı tek bir seed koşumunda** oluşmuş — `created_at` aralığı
     `2026-11-01 23:34:53.212` – `23:34:54.749` (1,5 s); kullanıcı tarafından elle eklenmiş/uğraşılmış
     tek kayıt yok (randevu durumları bile seed'in ürettiği COMPLETED/CONFIRMED/PENDING üçlüsü).
  2. Satırlar **eski seed sürümünün** kimliğini taşıyor (`admin@test.com`, `owner1@test.com` … 5 kullanıcı;
     salonlar `Elegance Beauty Studio` + `Bella Güzellik`), yani hedef şemaya taşınacak "gerçek" veri değil,
     güncel seed'in (`@beautysalon.com` × 4) tarihsel bir kopyası. Kullanıcı görseli de yok:
     `salons.cover_image_url` boş, `gallery_images` = `[]`.
  3. Seed idempotent ve Postgres zaten dolu (P4b: iki ardışık `npm run seed` sonrası satır sayıları sabit).
- **Ölçüm (2026-11-02 03:42, salt-okuma; SQLite `sqlite3` SELECT, Postgres `docker exec beauty_postgres psql`):**

| tablo | SQLite (`src/database.sqlite`) | PostgreSQL (`beauty_salon`) | fark |
|---|---:|---:|---:|
| users | 5 (`*@test.com`) | 4 (`*@beautysalon.com`) | −1 |
| salons | 2 | 12 | +10 |
| staff | 2 | 7 | +5 |
| service_categories | 6 | 6 | 0 |
| services | 4 | 16 | +12 |
| staff_services | 4 | 16 | +12 |
| appointments | 3 | 9 | +6 |
| reviews | 1 | 9 | +8 |
| favorites / products / notifications / settings | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 |
| **toplam (uygulama tabloları)** | **27** | **79** | **+52** |
| SequelizeMeta | tablo yok | 17 | — |

  Fark yorumu: Postgres her tabloda **eşit veya daha fazla** satır taşıyor; SQLite'ta Postgres'te
  bulunmayan tek küme 5 eski `@test.com` kullanıcısıdır ve bunlar da seed ürünüdür (elle açılmış hesap yok).
  Yani aktarma yapılmaması hâlinde **hiçbir kullanıcı-üretimi veri kaybolmuyor**; SQLite kümesi arşivde
  olduğu gibi duruyor.
- **SQLite dosyasının geleceği:** `apps/api/src/database.sqlite` **silinmez**, salt-okuma **arşiv** olarak
  kalır. Git'te izlenmiyor (`.gitignore:10` → `*.sqlite`; `git ls-files | grep sqlite` boş), bu yüzden
  `git rm --cached` gerekmez. Not `docs/api/09-seed-and-migrations.md` içine eklendi.

### P6 — Doküman / CI

- **Kapsam:** "SQLite" iddialarının düzeltilmesi ve kapının Postgres'e bağlanması:
  - `docs/ARCHITECTURE.md:46` → `| ORM | Sequelize 6 | PostgreSQL (tek dialect; SQLite kaldırıldı) |`
  - `plans/backend/INDEX.md:3` → `> apps/api/ · Node.js + Express 5 + Sequelize (PostgreSQL)`
  - `docs/api/01-overview.md:17,18,47,62,67,68,70`, `docs/api/04-data-model.md:3`,
    `docs/api/05-endpoints.md:347` (`strftime` notu), `docs/api/08-integrations.md:67`
    ("pg kullanılmıyor"), `docs/api/09-seed-and-migrations.md:74-87`,
    `docs/api/10-tests.md:35,45`, `docs/api/11-known-issues.md:40`,
    `docs/BACKEND-API.md:51,72,85,97-98,644-647,675,696`, `apps/api/CLAUDE.md:14,33,39`
  - `~/.pi/agent/bin/verify.sh` proje kapısı: `apps/api` için `npm test` artık Postgres test DB'si
    gerektiriyor → kapı öncesi `migrate` + tunnel kontrolü (`scripts/db-ready.sh` veya
    `verify.sh` içine `DB_DIALECT`/tunnel ön kontrolü). Tunnel yoksa kapı **atlanmaz**, açık hata verir.
- **Dosyalar:** yukarıdaki `.md` dosyaları, `scripts/` (kapı ön kontrolü).
- **Kabul ölçütü:** `grep -rn "SQLite" docs/ apps/api/CLAUDE.md` → yalnız *tarihsel/geçiş notu*
  bağlamındaki ifadeler kalır (0 "runtime SQLite" iddiası); `verify.sh` Postgres yokken **net hata**
  verip 0 dönmez.
- **Bağımlılık:** P4 + P5'e bağımlı (doküman yeşil sonucu yansıtmalı).
- **UYGULANDI (2026-11-02):**
  1. **10 doküman hizalandı:** `docs/ARCHITECTURE.md`, `docs/api/{01-overview,04-data-model,05-endpoints,08-integrations,10-tests,11-known-issues}.md`,
     `docs/BACKEND-API.md`, `apps/api/CLAUDE.md`, `plans/backend/INDEX.md`. Her düzeltmede yeni gerçek yazıldı:
     PostgreSQL 16 (docker + `localhost:5433` tüneli), `DB_DIALECT` env (varsayılan `postgres`), **17 migration**
     (`SequelizeMeta` 17/17), test DB `beauty_salon_test` (migration + truncate; 357 passing), `sync()`/
     `ensureColumns()`/`dropBackupTables()` kaldırıldı, `pg`/`pg-hstore` runtime sürücüsü, `strftime` →
     `date_trunc('month', …)` (sqlite dalı yalnız geri dönüş). "SQLite" yalnız geri dönüş/tarihçe bağlamında kaldı.
  2. **Kapı:** yeni `apps/api/scripts/db-ready.sh` — `.env` + `DB_DIALECT` kontrolü, `DB_HOST:DB_PORT` TCP
     (varsayılan 5433), `npm run migrate:status` ile bekleyen migration; her hata açık mesaj + `exit 1`.
     Doğrulandı: normal koşum `exit 0` (17/17 up), `DB_PORT=5999` → `exit 1` (`ECONNREFUSED` + tünel yönlendirmesi).
  3. **`~/.pi/agent/bin/verify.sh`:** `apps/*/scripts/db-ready.sh` **varsa** o uygulamanın kapısından önce
     çağrılan genel kanca (proje-özel kod yok; script yoksa davranış aynı). `verify.sh --fast` → `verify: TAMAM ✔`.
  4. Kalan "SQLite" eşleşmeleri sahiplik dışı dosyalarda (`docs/api/09-seed-and-migrations.md` → P5,
     `docs/api/README.md:3`, `docs/salon-app/01-overview.md:9`); bu turda dokunulmadı.

---

## 4. Riskler

| # | Risk | Kanıt / neden | Etki | Azaltma |
|---|---|---|---|---|
| R1 | **357 testin DB davranışına bağlılığı** | 15 test dosyası, 357 `it()`; `tests/setup.js:6-9` her koşumda `drop()+sync({force:true})`; testler model/DB davranışını (boolean 1/0, DECIMAL sayı, LIKE duyarsızlığı) dolaylı doğruluyor | Yüksek — tek tek kırılabilir | P4 ayrı faz; `sync` yerine migrate+truncate; kırılanları "DB davranışı" / "gerçek regresyon" diye ayır |
| R2 | **`randomblob`/`getTable` benzeri kaçaklar** | Migration taraması: 13 dosyada **0** kaldı (012 düzeltildi). Ama runtime'da `strftime` (`admin.controller.js:101,110`), `PRAGMA` (`database.js:35`), `sqlite_master` (`database.js:62`), `Op.like` (11 yer) | Orta | P1/P2'de `grep -rn "strftime\|PRAGMA\|sqlite_master\|randomblob\|getTable"` kapısı; dashboard sorgusu `date_trunc('month', ...)` |
| R3 | **Tarih/TZ** | `DATEONLY`/`TIME` SQLite'ta TEXT, PG'de `date`/`time`; `timestamptz` PG'de `Date` nesnesi döner. Testler `new Date().toISOString().split('T')[0]` kullanıyor (`tests/appointment.test.js:20-27,60-62`, `tests/setup.js:186-220`) — ölçüm anı **2026-11-02 02:36 yerel / 2026-11-01 23:36 UTC**: 00:00–02:59 arası koşumda "bugün/yarın" **bir gün kayar**. Koordinatör bilgisi: bu satırlardan **1 test TZ'ye bağlı kırmızı** (bu görevde `npm test` yasak olduğu için doğrulanmadı) | Yüksek | `TZ=UTC` ve `TZ=Europe/Istanbul` iki koşum kabul ölçütü; helper'ları yerel gün hesabına çevir; Sequelize `timezone:'UTC'` |
| R4 | **Seed'in `sync()` varsayımları** | `package.json:9` seed zinciri `sequelize.sync()` + `ensureColumns()`; `server.js:15-17` açılışta `sync()`; `reset.js:22` | Yüksek | P1'de `sync()` tamamen çıkar; P3'te seed migration şemasına karşı koşar |
| R5 | **Tip eşlemesi TEXT/BOOLEAN/UUID, DECIMAL** | `gallery_images`/`working_hours`: migration **jsonb**, model **TEXT** + elle `JSON.stringify` (`Salon.js:45-52,98-118`) → pg jsonb'yi **parse edilmiş nesne** döndürür, getter `JSON.parse(obj)` → throw → `[]` (galeri sessizce boşalır). `DECIMAL(10,2)` PG'de **string** ("250.00"), SQLite'ta sayı → API JSON şekli değişir (Flutter `num` parse'ı kırılabilir). BOOLEAN TINYINT(1)→true/false. UUID TEXT→`uuid` (JS'te string kalır, sorun yok) | Yüksek | P2'de tek yön seçimi; DECIMAL için model getter/parse (`Sequelize.DECIMAL` → `parseFloat`) veya API sözleşmesinde string kabulü; boolean tüketicileri (`admin_panel`, Flutter) `=== 1` karşılaştırması yapıyor mu taranacak |
| R6 | **ENUM tipleri** | PG'de `enum_users_role`, `enum_appointments_status`, `enum_notifications_type` ölçüldü. `sequelize.drop()`/`down()` tipleri bırakır → ikinci `up` "type already exists"; yeni enum değeri (`ADD VALUE`) transaction içinde çalışmaz | Orta-yüksek | P2'de `down()` `DROP TYPE IF EXISTS`; P4'te `sync` yerine truncate; enum değeri ekleme ayrı migration |
| R7 | **Transaction/DDL farkları** | PG DDL transactional (fayda), fakat `renameTable`/FK constraint adları `favorites_new_*` kalır; `TRUNCATE ... CASCADE` gerekir; `reset.js:26-34` `Model.destroy` FK sırasına güveniyor | Orta | P3'te truncate stratejisi; P5'te FK sırası sabit |
| R8 | **Şema sürüklenmesi (en somut kırılma)** | §1.5: 12 eksik kolon + eksik `settings` tablosu → `npm run seed` PG'de `42703` | Yüksek | P2 zorunlu önkoşul; kabul ölçütü `information_schema` karşılaştırması |
| R9 | **Arama davranışı (`LIKE`)** | `admin.controller.js:180-191,268,384`, `salon.controller.js:21-27`, `product.controller.js:14` — SQLite ASCII'de case-insensitive, PG duyarlı | Orta | `Op.iLike` (postgres) / `LOWER()` normalizasyonu; testlerde büyük harf araması eklenir |
| R10 | **Tek DB / tunnel bağımlılığı** | Mint docker + SSH tunnel 5433 (`.env:7`); tunnel düşerse test/dev/prod hepsi durur | Orta | `scripts/db-ready.sh` ön kontrolü; hata mesajı "tunnel yok" dese; CI'da service container alternatifi |

---

## 5. Kabul ölçütleri (ölçülebilir)

1. **Migration 13/13 (ve yeni dosyalar) sıfırdan geçer:** boş `beauty_salon_test` → `db:migrate`
   → `SequelizeMeta` satır sayısı = migration dosyası sayısı, hata 0; `db:migrate:undo:all` →
   `db:migrate` tekrar hata 0 (idempotent).
2. **`npm run seed` idempotent:** iki kez art arda → ikinci koşumda yeni kayıt 0; `seed:reset` temiz kurulum.
3. **`npm test` Postgres'te yeşil:** 15 dosya / 357 test, 0 failing — **`TZ=UTC` ve
   `TZ=Europe/Istanbul`** koşumlarında ayrı ayrı.
4. **Veri var:** `psql -c "select count(*) from <tablo>"` her tabloda `> 0`
   (`favorites/products/notifications` seed kapsamı dışındaysa bu istisna dokümanda yazılı).
5. **`.sqlite` yolu kodda 0 eşleşme:** `grep -rn "\.sqlite" apps/api/src apps/api/tests apps/api/package.json`
   → 0 (`.sqlite` yalnız doküman/`plans` geçmişinde kalır).
6. **`sync`/`ensureColumns` kodda 0 eşleşme:** `grep -rn "sequelize.sync\|ensureColumns\|dropBackupTables" apps/api/src apps/api/package.json` → 0.
7. **SQLite'a özgü SQL 0 eşleşme:** `grep -rn "strftime\|PRAGMA\|sqlite_master\|randomblob" apps/api/src` → 0.
8. **Doküman güncel:** `docs/ARCHITECTURE.md:46` ve `plans/backend/INDEX.md:3` "SQLite" demiyor;
   `grep -rn "SQLite" docs/ apps/api/CLAUDE.md` yalnız geçiş notu/tarihçe bağlamında.

---

## 6. Geri dönüş planı

**P1 geri alınabilir (son nefes):**
- `DB_DIALECT=sqlite` + `DB_STORAGE=./src/database.sqlite` ile eski yol **çalışır durumda** bırakılır
  (P4 boyunca ve P5–P6 sonrasında da — bkz. §2.6: kod yolu korunuyor, kaldırma onaylanmadı).
  Geri dönüş = tek env değişkeni + P1 commit'inin `git revert`'i.
- **SQLite dosyaları git'te değil** (`/c/Orca/beauty-salon/.gitignore:10` → `*.sqlite`). Bu yüzden
  P5'e girmeden önce **dosya yedeği** alınır:
  `cp apps/api/src/database.sqlite apps/api/src/database.sqlite.bak-2026-11-01` (yine git dışı).
  Yedek alınmadan hiçbir faz "bitti" sayılmaz.
- P2/P3/P4 tek tek `git revert` ile geri alınabilir; migration dosyaları geri alınınca PG'de
  `db:migrate:undo` ile şema eski hâline döner (yeni migration'lar `down()` yazılmak zorunda).

**P5 (veri aktarma) sonrası dönüş:**
- Aktarma **tek yönlü** kopyadır; SQLite dosyası silinmediği sürece dönüş mümkün.
  Dönüş adımları: (1) `.bak` dosyasını `src/database.sqlite` üzerine kopyala,
  (2) `DB_DIALECT=sqlite` + P1 revert, (3) sunucuyu yeniden başlat.
- Aktarma sonrası **PG'ye yazılmış yeni veri** SQLite'a geri taşınmaz (ters script kapsam dışı, §8).
  Bu yüzden P5 ancak "artık PG tek yazma hedefi" kararı kesinleştiğinde yapılır.
- **P6 sonrası dönüş (kod yolu KORUNUYOR, §2.6):** SQLite dalı silinmedi — ölçüm
  `apps/api/src/config/database.js:27-32,68-73` + `apps/api/src/controllers/admin.controller.js:49-52`.
  Bu yüzden P6 sonrası dönüş: (1) `.bak` dosyasını `src/database.sqlite` üzerine kopyala,
  (2) `DB_DIALECT=sqlite` + `DB_STORAGE` ver, (3) sunucuyu yeniden başlat; PG migration'ları
  `db:migrate:undo:all` ile temizlenir. Kod yolunun kaldırılması **ayrı bir karardır ve şu an
  onaylanmadı** (onaylanırsa bu madde ve §2.6 birlikte güncellenir).

---

## 7. Efor tahmini ve dalga sırası

| Faz | Konu | Efor (saat) | Bağımlılık |
|---|---|---:|---|
| P1 | Config + connection factory (`sync` kaldırma) | 3 | — |
| P2 | Migration düzeltmeleri + sıfırdan migrate provası | 6 | P1 |
| P3 | Seeder/reset'in Postgres'e taşınması | 3 | P2 |
| P4 | Test altyapısı (izole DB, TZ matrisi) | 6 | P2 |
| P5 | Veri taşıma (dump/aktarma script + doğrulama) | 4 | P2, P3 |
| P6 | Doküman + CI/`verify.sh` | 2 | P4, P5 |
| **Toplam** | | **24 saat** (~3 iş günü) | |

**Önerilen dalga sırası (paralellik):**

```
Dalga 1 (seri)    : P1                              ← her şeyin önkoşulu, tek başına devreye alınabilir
Dalga 2 (seri)    : P2                              ← şema tek doğruluk kaynağı olmadan ilerisi anlamsız
Dalga 3 (paralel) : P3  ∥  P4                       ← ayrı DB'ler: dev/test; çakışma yok
Dalga 4 (seri)    : P5                              ← P2+P3 yeşil olmadan veri taşınmaz
Dalga 5 (seri)    : P6                              ← yeşil sonucu yansıtır
```

- **Paralel:** P3 ∥ P4 (farklı veritabanları, farklı dosyalar — `seeders/*` vs `tests/*`).
- **Zorunlu seri:** P1 → P2, P2 → (P3, P4), (P3) → P5, (P4, P5) → P6.
- P2 içindeki 5 düzeltme kendi arasında paraleldir (ayrı migration dosyaları), ancak
  `db:migrate` provası hepsi bitince tek seferde koşar.

---

## 8. Yapılmayacaklar / kapsam dışı

- **Prod veri göçü yok.** Bu plan yalnız dev/test ortamını Postgres'e taşır; canlı veri aktarımı,
  kesinti planı ve rollback penceresi ayrı bir iş (DB-002).
- **ORM değişikliği yok.** Sequelize 6 kalır (Prisma/TypeORM/Drizzle değerlendirilmez).
- **Kolon şema tasarımı değişikliği yok.** Eksik kolonlar modeldeki tanımla **eklenir**; tip
  normalizasyonu (ör. `DECIMAL` yerine `integer kuruş`) bu kapsamda yapılmaz. Tek istisna
  `gallery_images`/`working_hours` (model↔migration çelişkisi — biri seçilmek zorunda).
- **API sözleşmesi değişikliği hedeflenmez** (DECIMAL string / boolean farkı R5'te risk olarak
  yönetilir; sözleşmeyi bilinçli değiştirmek ayrı iş).
- **Flutter uygulamaları ve `apps/admin_panel` kod değişikliği yok** (yalnız gerekirse tip uyumu testi).
- **Kimlik doğrulama / JWT / yetki değişikliği yok.**
- **`pg`/`pg-hstore` dışında yeni bağımlılık yok**; `sqlite3` bağımlılığı P5 sonunda **kaldırılmaz**
  (geri dönüş penceresi kapanana kadar durur — kaldırma işi DB-002).
- **CI altyapısı kurulumu yok** (yeni pipeline/GitHub Actions yazılmaz; yalnız `verify.sh` ön kontrolü).
- **Migration geçmişinin yeniden yazılması yok** (squash/baseline yok; üstüne ekleme yapılır).
- **Performans/indeks iyileştirmesi yok** (mevcut indeksler korunur, yenisi tartışılmaz).

---

## Ek: ölçüm komutları (tekrar üretilebilirlik)

```sh
# 1) dialect hardcoded
sed -n '1,17p' apps/api/src/config/database.js

# 2) SQLite dosya + satır sayıları
ls -l apps/api/src/database.sqlite apps/api/src/test-database.sqlite
for t in users salons staff service_categories services staff_services \
         appointments reviews favorites products notifications settings; do
  echo "$t|$(sqlite3 apps/api/src/database.sqlite "select count(*) from $t")"
done
sqlite3 apps/api/src/database.sqlite "select count(*) from SequelizeMeta"   # no such table

# 3) PostgreSQL (psql CLI yok → pg client; SALT OKUMA)
node /tmp/pg_measure.js    # information_schema.tables + tablo tablo count(*) + SequelizeMeta
node /tmp/pg_cols.js       # information_schema.columns (tip/nullable)
node /tmp/pg_pk.js         # pg_constraint (PK/UNIQUE) + enum tipleri

# 4) migration taraması
ls apps/api/src/database/migrations/ | wc -l     # 13
grep -rn "getTable\|randomblob\|PRAGMA\|sqlite_master\|strftime" apps/api/src/database/migrations/

# 5) runtime kaçakları
grep -rn "strftime\|PRAGMA\|sqlite_master\|randomblob" apps/api/src --include="*.js" | grep -v migrations/
grep -rn "sequelize.sync\|ensureColumns\|dropBackupTables" apps/api/src apps/api/package.json
grep -rn "Op.like\|Op.iLike" apps/api/src --include="*.js"
```
