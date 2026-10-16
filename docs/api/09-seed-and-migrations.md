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
npm run seed        # sync + dropBackupTables + ensureColumns + seed
npm run seed:reset  # FK sırasına göre truncate + seed
```

`seed:reset` sırası: Review, Appointment, StaffService, Favorite, Notification, Product, Setting, Service, Staff, Salon, ServiceCategory, User.

## Migration'lar (`src/database/migrations/`)

12 dosya: `20240101000001-create-users` … `20240101000012-fix-favorites-primary-key`.

`.sequelizerc` → `src/config/sequelize-config.js` (dialect **postgres**).

```bash
npm run migrate
npm run migrate:status
npm run migrate:undo:all
```

Runtime `src/config/database.js` ile **SQLite** kullanır. Sonuçlar:

- `npm run migrate` Postgres'e gider, runtime DB'yi etkilemez.
- SQLite DB'de `SequelizeMeta` tablosu yoktur → migration'lar hiç uygulanmamıştır; şema `sync()` + `ensureColumns()` ile oluşur.
- Migration'larda `JSONB`, `DECIMAL(10,8)`, `ON DELETE CASCADE` gibi SQLite'ta farklı davranan tanımlar vardır ve model tanımlarıyla birebir uyuşmaz (ör. `salons.phone` migration'da nullable, modelde `allowNull: false`).

## `ensureColumns()` ve `dropBackupTables()`

`sync({ alter: true })` SQLite'ta tabloyu backup tablosu üzerinden yeniden yaratır ve FK varsa patlar. Bu yüzden:

- `ensureColumns()` eksik kolonları `ALTER TABLE ... ADD COLUMN` ile ekler (tabloyu yeniden yaratmaz)
- `dropBackupTables()` `*_backup` tablolarını siler

Canlı DB'de hâlâ `products_backup` artığı vardır (`apps/api/database.sqlite` — eski yol, kullanılmayan dosya).

## Şema tutarsızlıkları (doğrulanmış)

| Konu | Açıklama |
|---|---|
| `favorites` | Modelde `id` UUID PK + unique `(user_id, salon_id)` index; eski dosyada composite PK şeması var |
| `staff_services` | Modelde composite PK iddiası ama fiili şemada PK yok → duplicate join kaydı engellenmez |
| `settings` | `sync()` ile oluşur; migration'da yoktur |
| `notifications` | `updatedAt: false` — migration ve model uyuşuyor |
| `service_categories` | `description`, `is_active` modelde var, migration'da yok |
| `salons` | `pending_phone`, `phone_change_token*` modelde var, migration'da yok |
