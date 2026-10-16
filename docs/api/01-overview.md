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
| ORM | Sequelize 6.37 | SQLite runtime; Postgres yalnız `sequelize-cli` için |
| DB | SQLite (`sqlite3`) | dosya tabanlı, bkz. §Veritabanı dosyası |
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
npm run seed       # manuel seed (idempotent)
npm run seed:reset # tüm tabloları temizler + seed
npm test           # mocha (node --env-file=.env.test)
npm run migrate    # sequelize-cli → Postgres (runtime DB'yi etkilemez)
```

### `src/server.js` açılış sırası

1. `dotenv` yüklenir
2. `connectDB()` → SQLite dosyasına bağlanır
3. `sequelize.sync()` → eksik tabloları oluşturur (**`alter: true` kullanılmaz**)
4. `dropBackupTables()` → eski `*_backup` tablolarını siler
5. `ensureColumns()` → eksik kolonları `ALTER TABLE ... ADD COLUMN` ile ekler
6. `User.count() == 0 || Salon.count() == 0` ise `seed()` çalışır
7. `app.listen(PORT)`

> ⚠️ `ensureColumns()` bir modelin tablosu yoksa patlar (`PRAGMA table_info` boş döner → `ALTER TABLE` "no such table"). Bu yüzden `sync()` **önce** çalışmalıdır.

### Veritabanı dosyası (önemli tuzak)

`src/config/database.js`:

```js
const dbStorage = path.join(__dirname, '..', process.env.NODE_ENV === 'test'
  ? 'test-database.sqlite' : 'database.sqlite');
```

`__dirname` = `apps/api/src/config`, dolayısıyla `..` = `apps/api/src`. Yani fiilen kullanılan dosyalar:

- `apps/api/src/database.sqlite` ← **gerçek runtime DB**
- `apps/api/src/test-database.sqlite` ← test DB

`apps/api/database.sqlite` ve `apps/api/test-database.sqlite` eski/yedek dosyalardır, kod tarafından **kullanılmaz**. `apps/api/database.sqlite` eski şemayı (composite PK `favorites`, `products`/`settings` yok, `products_backup` artığı) taşır.

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
├── uploads/                      # yüklenen dosyalar (UUID ad)
├── src/
│   ├── server.js                 # entry point
│   ├── app.js                    # Express app: güvenlik, parser, static, routes, error handler
│   ├── config/
│   │   ├── database.js           # Sequelize instance + ensureColumns + dropBackupTables
│   │   └── sequelize-config.js   # sequelize-cli config (postgres)
│   ├── models/                   # 12 model + index.js (ilişkiler)
│   ├── controllers/              # 14 controller
│   ├── routes/                   # 14 route dosyası + index.js
│   ├── middlewares/              # auth, validate, upload, errorHandler
│   ├── validators/               # 5 validator dosyası
│   ├── utils/                    # helpers, mailer, sms
│   ├── seeders/                  # seed.js, reset.js
│   └── database/migrations/      # 12 migration (postgres)
└── tests/                        # 14 test dosyası + setup.js
```

## Bağımlılıklar

**Runtime:** bcryptjs, cookie-parser, cors, dotenv, express, express-rate-limit, express-validator, helmet, jsonwebtoken, morgan, multer, nodemailer, pg, pg-hstore, sequelize, sharp, sqlite3, swagger-jsdoc, swagger-ui-express, uuid

**Dev:** chai 4, chai-http, mocha, nodemon, sequelize-cli, supertest

Kullanılmayan (ölü) bağımlılıklar: `sharp`, `swagger-jsdoc`, `swagger-ui-express`, `pg`, `pg-hstore`, `cookie-parser`. Eksik bağımlılık: `twilio` (`utils/sms.js` `require('twilio')` yapar).
