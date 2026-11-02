# 09 — Seed ve migration'lar

## Seed (`src/seeders/seed.js`)

İdempotent: her kayıt `findOrCreate` mantığıyla eklenir, eski/eksik verileri (ör. `category_id` NULL hizmetler) onarır.

`server.js` açılışta `User.count() == 0 || Salon.count() == 0` ise seed'i otomatik çalıştırır.

### Test kullanıcıları

| E-posta | Şifre | Rol |
|---|---|---|
| `admin@beautysalon.com` | `Admin123!` | ADMIN |
| `salon@beautysalon.com` | `Salon123!` | SALON_OWNER |
| `salon2@beautysalon.com` | `Salon123!` | SALON_OWNER |
| `musteri@beautysalon.com` | `Musteri123!` | CUSTOMER |

### İçerik (canlı DB karşılıkları)

| Varlık | Seed sayısı | Canlı DB |
|---|---|---|
| Kullanıcı | 4 | 4 |
| Kategori | 6 (Saç, Tırnak, Cilt Bakımı, Makyaj, Epilasyon, SPA & Masaj) | 6 |
| Salon | 12 (İstanbul ilçeleri, `isVerified: true`, `workingHours` dolu) | 12 |
| Staff | 7 (salon 0: 3, salon 1: 2, salon 6: 1, salon 7: 1) | 7 |
| Service | 16 | 16 |
| StaffService bağı | service → staff listelerinden üretilir | 16 |
| Randevu (COMPLETED) | 9 | 10 (1 test randevusu eklenmiş) |
| Review | 9 (5'i salon yanıtlı) | 9 |

Seed yalnızca `salonIndex` 0, 1, 6, 7 için staff/service üretir — diğer 8 salonun çalışanı ve hizmeti yoktur.

### Seed çalıştırma

```bash
npm run seed        # bağlantı + migration assert + idempotent seed (şema kurmaz, yalnız veri yazar)
npm run seed:reset  # FK sırasına göre truncate + seed
```

`seed:reset` sırası: Review, Appointment, StaffService, Favorite, Notification, Product, Setting, Service, Staff, Salon, ServiceCategory, User.

## Migration'lar (`src/database/migrations/`)

17 dosya: `20240101000001-create-users` … `20261102000017-drop-staff-services-timestamps`.
`20240101000013-add-media-to-service-categories` DB-001'den önce (2026-10-28, AP-009) eklenmişti; `20261102000014…20261102000017` DB-001 P2/P3 ürünüdür (`settings` tablosu, modelde olup migration'da eksik 11 kolon, `salons` JSON→TEXT, `staff_services` timestamp'leri).

`.sequelizerc` → `src/config/sequelize-config.js` (dialect **postgres**).

```bash
npm run migrate
npm run migrate:status
npm run migrate:undo:all
```

### Lokal veritabanı: Mint docker (tünel 5433)

Yerel geliştirme Postgres örneği Windows'ta Docker Desktop yerine Mint düğümünde (`mint`) koşar ve SSH tüneli ile `localhost:5433` portuna yönlendirilir:

- **Compose yolu (Mint):** `~/beauty-infra/docker-compose.yml` (`cd ~/beauty-infra && docker compose up -d`)
- **Container / Volume:** `beauty_postgres` (`postgres:16-alpine`) · `beauty_postgres_data`
- **Port ve DB:** `127.0.0.1:5433:5432` · `beauty_salon` (dev) ve `beauty_salon_test` (test) · kullanıcı `beauty_user`
- **Tünel komutu (Windows):**
  ```powershell
  powershell -ExecutionPolicy Bypass -NoProfile -File ~/.pi/agent/bin/mint-tunnel.ps1 status
  powershell -ExecutionPolicy Bypass -NoProfile -File ~/.pi/agent/bin/mint-tunnel.ps1 restart
  ```
- **Migrate ve seed komutları:**
  ```bash
  cd apps/api
  npm run migrate
  npm run migrate:status
  npm run seed
  ```

Runtime de **PostgreSQL** kullanır: dialect `src/config/database.js` içindeki `DB_DIALECT` env'inden gelir (varsayılan `postgres`), bağlantı seçenekleri aynı dosyadaki `buildSequelizeOptions()` factory'sinden üretilir ve `sequelize-cli` (`src/config/sequelize-config.js`) de aynı factory'yi kullanır. Sonuç: `npm run migrate` ile runtime aynı şemaya bakar.
SQLite yalnızca `DB_DIALECT=sqlite` verildiğinde devreye giren **geri dönüş yolu**dur (`src/database.sqlite` dev, `src/test-database.sqlite` test).

Bugünkü gerçek (canlı `beauty_salon` üzerinde 2026-11-02 ölçüldü):

- `SequelizeMeta`'da **17 kayıt** var; şema yalnız migration'lardan gelir. `sync()`, `ensureColumns()` ve `dropBackupTables()` kod tabanından kaldırıldı (DB-001 P1/P3, bkz. `src/seeders/reset.js:10`).
- Seed şema kurmaz: `assertMigrationsApplied()` uygulanmamış migration varsa net mesajla durur (`npm run migrate`), böylece eksik şema `42703 column does not exist`e dönüşmez.
- **HÂLÂ GEÇERLİ (açık borç):** `salons.phone` canlı Postgres şemasında nullable, modelde ise `allowNull: false` (`src/models/Salon.js:26-28`). Ölçüm: `information_schema.columns`, 2026-11-02. Bu çelişki DB-001 kapsamında çözülmedi; ayrı bir iş olarak açık.

**DB-001 öncesi durum (2026-10-23 doğrulaması):** runtime SQLite'tı; SQLite dosyasında `SequelizeMeta` yoktu, migration'lar hiç uygulanmamıştı ve şema `sync()` + `ensureColumns()` ile oluşuyordu. Migration'lardaki `JSONB`, `DECIMAL(10,8)`, `ON DELETE CASCADE` gibi tanımlar SQLite'ta farklı davranıp model tanımlarıyla birebir uyuşmuyordu. 14–17 numaralı migration'lar bu sürüklenmenin bilinen kısmını kapattı (kolon kolon döküm: `docs/api/04-data-model.md`).

### SQLite arşiv dosyası (DB-001 P5)

`apps/api/src/database.sqlite` (180 224 bayt, 27 satır) **aktarılmadı, arşiv olarak bırakıldı**: içeriğin tamamı 2026-11-01 23:34'teki tek bir `seed` koşumunda üretilmişti ve Postgres dev verisi `npm run seed` ile aynı içeriğin güncel hâlini (79 satır) taşıyor — elle eklenmiş kayıt yok. Dosya silinmez, salt-okuma referans olarak durur; git'te izlenmez (`.gitignore` → `*.sqlite`).
Karar gerekçesi ve tablo tablo ölçüm: `plans/backend/DB-001-postgres-gecis.md` §3 P5.

## `ensureColumns()` ve `dropBackupTables()` (DB-001 öncesi — kaldırıldı)

Tarihsel ders: `sync({ alter: true })` SQLite'ta tabloyu backup tablosu üzerinden yeniden yaratır ve FK varsa patlar. O dönemde bu yüzden:

- `ensureColumns()` eksik kolonları `ALTER TABLE ... ADD COLUMN` ile eklerdi (tabloyu yeniden yaratmazdı)
- `dropBackupTables()` `*_backup` tablolarını silerdi

DB-001 P1/P3'te `sync()` / `ensureColumns()` / `dropBackupTables()` kaldırıldı; şema yalnız migration'lardan gelir.
DB-001 öncesi doğrulamada `products_backup` artığı görülmüştü (`apps/api/database.sqlite` — eski yol, kullanılmayan dosya). Bugün o yol yok; arşiv dosyası `src/database.sqlite` içinde `*_backup` tablosu yok (`sqlite_master`, 2026-11-02) ve canlı Postgres şemasında da yok (`information_schema.tables`, 2026-11-02).

## Şema tutarsızlıkları — DB-001 öncesi doğrulama (2026-10-23)

Sol kolon o gün ölçülen bulgudur; "Durum" kolonu 2026-11-02 canlı Postgres şemasında (`information_schema` / `pg_indexes`) yeniden doğrulanmıştır.

| Konu | O zamanki bulgu | Durum (canlı Postgres, 2026-11-02) |
|---|---|---|
| `favorites` | Modelde `id` UUID PK + unique `(user_id, salon_id)` index; arşiv dosyasında composite PK şeması var | Çözüldü (`20240101000012`): canlıda `favorites_pkey (id)` + `favorites_user_id_salon_id_unique` var |
| `staff_services` | Modelde composite PK iddiası ama fiili (SQLite) şemada PK yok → duplicate join kaydı engellenmez | Çözüldü: canlıda `staff_services_pkey (staff_id, service_id)` var; `created_at/updated_at` `20261102000017` ile düşürüldü |
| `settings` | Şema `sync()` ile oluşur; migration'da yoktur | Çözüldü: `20261102000014-create-settings` var, tablo canlıda mevcut |
| `notifications` | `updatedAt: false` — migration ve model uyuşuyor | Değişmedi: canlı kolonlar `id,user_id,title,body,type,data,is_read,created_at` |
| `service_categories` | `description`, `is_active` modelde var, migration'da yok | Çözüldü: `20261102000015` (+ `20240101000013` `image_url`/`video_url`) |
| `salons` | `pending_phone`, `phone_change_token*` modelde var, migration'da yok | Çözüldü: `20261102000015` (7 kolon); JSON→TEXT tipi `20261102000016`. **Açık borç:** `phone` canlıda nullable, modelde `allowNull: false` |
