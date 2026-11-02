# 01 — Genel Bakış

## Proje

Güzellik salonları platformu için çok rollü REST API. Müşteriler salon arar, yakındaki salonları listeler, hizmet + çalışan seçip randevu alır; salon sahipleri çalışan/hizmet/ürün yönetir ve randevuları onaylar; admin platform genelini denetler.

- **Müşteri:** arama, yakındaki salonlar, randevu oluşturma/iptal, yorum, favori, bildirim, profil.
- **Salon sahibi:** salon CRUD (soft delete), çalışan/hizmet/ürün CRUD, randevu durumu, yorum yanıtı, e-posta/telefon değişikliği (OTP).
- **Admin:** dashboard, salon/randevu/yorum/kullanıcı listeleri, salon onaylama, yorum görünürlüğü, Settings.

## Teknoloji yığını

| Katman | Seçim | Not |
|---|---|---|
| Runtime | Node.js (CommonJS) | `package.json` → `"type": "commonjs"` |
| Framework | Express 5.2 | `app.js` + `src/routes/*` |
| ORM | Sequelize 6.37 | PostgreSQL (tek dialect); SQLite yalnızca `DB_DIALECT=sqlite` geri dönüş yolu |
| DB | PostgreSQL 16 (docker, tünel `localhost:5433`) | `DB_DIALECT` env'i ile seçilir; şema 17 migration'dan gelir, bkz. §Veritabanı (PostgreSQL) |
| Auth | JWT (`jsonwebtoken`) | access 15 dk, refresh 7 gün; refresh DB'de bcrypt ile hash'li |
| Password | `bcryptjs` (cost 12) | `beforeCreate` + `beforeUpdate` hook'ları |
| Validation | `express-validator` 7 | `src/validators/*` + `middlewares/validate.js` |
| Upload | `multer` 2 (disk storage) | UUID dosya adı, max 10 dosya |
| Rate limit | `express-rate-limit` 8 | genel 100/60sn, auth 10/60sn, refresh 60/60sn |
| Security | `helmet` 8, `cors` | CORS origin listesi env ile |
| Logging | `morgan` (yalnız development) | SQL logging yalnız development |
| E-posta | `nodemailer` 8 (Mailtrap sandbox) | test/SMTP'siz ortamda noop |
| SMS | Twilio (opsiyonel) | `twilio` **package.json'de yok** → env tanımlıysa 500 |
| Dosya saklama | local `./uploads` | `express.static` ile servis edilir |

## Çalıştırma

```bash
cd apps/api
npm install

npm run dev        # nodemon — NODE_ENV=development (morgan + SQL logging)
npm start          # production
bash scripts/db-ready.sh # kapı: tünel/port + DB_DIALECT + .env + bekleyen migration kontrolü
npm run migrate    # sequelize-cli → Postgres (dev DB: beauty_salon)
npm run migrate:status   # uygulanan/bekleyen migration listesi
npm run seed       # manuel seed (idempotent; migration şemasına karşı koşar)
npm run seed:reset # tüm tabloları temizler + seed
node tests/helpers/ensure-test-db.js # beauty_salon_test yoksa oluşturur + 17 migration'ı koşar
npm test           # mocha (node --env-file=.env.test; Postgres test DB'si zorunlu)
```

### `src/server.js` açılış sırası

1. `dotenv` yüklenir
2. `connectDB()` → `sequelize.authenticate()` (Postgres; `DB_DIALECT` okunur)
3. `User.count() == 0 || Salon.count() == 0` ise `seed()` çalışır (seed şema eksikse açık hatayla durur)
4. `app.listen(PORT)`

> Açılışta **`sync()` / `ensureColumns()` / `dropBackupTables()` yoktur** (DB-001 P1). Şema yalnız migration'lardan oluşur;
> eksik migration varsa seed/test açık hata verir, şema sessizce onarılmaz.

### Veritabanı (PostgreSQL)

| Ortam | Dialect | DB adı | Şema kaynağı |
|---|---|---|---|
| development | `postgres` (`.env` → `DB_DIALECT=postgres`) | `beauty_salon` | 17 migration (`SequelizeMeta`) |
| test | `postgres` (`.env.test` → `DB_DIALECT=postgres`) | `beauty_salon_test` | `tests/helpers/migrator.js` (aynı 17 migration) + `TRUNCATE ... CASCADE` |
| geri dönüş | `sqlite` yalnızca `DB_DIALECT=sqlite` **açıkça** verilirse | `DB_STORAGE` / `src/*.sqlite` | bakımı durdurulmuş geri dönüş yolu (DB-001 §6) |

- Uygulanan migration kaydı `SequelizeMeta` tablosundadır (**17/17**); `npm run migrate:status` → hepsi `up`, bekleyen `0`.
- Dev DB docker'da koşar (Mint düğümü) ve `localhost:5433` tüneli üzerinden erişilir; tünel yoksa `scripts/db-ready.sh` açık hata verir (`exit 1`).
- `sqlite3` bağımlılığı ve `.sqlite` dosyaları yalnız geri dönüş penceresi için durur; runtime'ın varsayılanı değildir.

## Port

`.env` → `PORT=3000`. Bu makinede 3000 başka bir proje tarafından kullanıldığı için API **3200** ile başlatılıyor:

```bash
PORT=3200 NODE_ENV=development node src/server.js
```

Admin panel `.env.local` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:3200/api/v1`.

## Klasör yapısı

```
apps/api/
├── .env / .env.test
├── .sequelizerc                  # sequelize-cli yolları
├── package.json
├── scripts/
│   └── db-ready.sh               # kapı: tünel/port + DB_DIALECT + .env + bekleyen migration
├── uploads/                      # yüklenen dosyalar (UUID ad)
├── src/
│   ├── server.js                 # entry point
│   ├── app.js                    # Express app: güvenlik, parser, static, routes, error handler
│   ├── config/
│   │   ├── database.js           # tek connection factory (DB_DIALECT) + NUMERIC parser
│   │   └── sequelize-config.js   # sequelize-cli config (aynı factory)
│   ├── models/                   # 12 model + index.js (ilişkiler)
│   ├── controllers/              # 14 controller
│   ├── routes/                   # 14 route dosyası + index.js
│   ├── middlewares/              # auth, validate, upload, errorHandler
│   ├── validators/               # 6 validator dosyası (uuid.validator dahil)
│   ├── utils/                    # helpers, mailer, sms
│   ├── seeders/                  # seed.js, reset.js
│   └── database/migrations/      # 17 migration (Postgres)
└── tests/                        # 14 test dosyası + setup.js + helpers/
```

## Bağımlılıklar

**Runtime:** bcryptjs, cookie-parser, cors, dotenv, express, express-rate-limit, express-validator, helmet, jsonwebtoken, morgan, multer, nodemailer, pg, pg-hstore, sequelize, sharp, sqlite3, swagger-jsdoc, swagger-ui-express, uuid

**Dev:** chai 4, chai-http, mocha, nodemon, sequelize-cli, supertest

Kullanılmayan (ölü) bağımlılıklar: `sharp`, `swagger-jsdoc`, `swagger-ui-express`, `cookie-parser`. `pg`/`pg-hstore` **runtime sürücüsüdür**; `sqlite3` yalnız `DB_DIALECT=sqlite` geri dönüş yolunda kullanılır. Eksik bağımlılık: `twilio` (`utils/sms.js` `require('twilio')` yapar).
