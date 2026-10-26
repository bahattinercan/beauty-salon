# 10 — Testler

Framework: **mocha 11 + chai 4 + supertest 7**.

```bash
npm test                 # node --env-file=.env.test mocha "tests/**/*.test.js" --timeout 10000 --exit
npm run test:watch
npm run test:coverage    # nyc
```

## Sonuç (2026-10-23, bu ortamda)

**291 passing**, 0 failing (2026-10-23 ölçümü).

| Dosya | Test |
|---|---|
| `admin.test.js` | 8 |
| `app.test.js` | 11 |
| `appointment.test.js` | 38 |
| `auth.test.js` | 27 |
| `category.test.js` | 23 |
| `favorite.test.js` | 13 |
| `notification.test.js` | 22 |
| `product.test.js` | 23 |
| `review.test.js` | 22 |
| `salon.test.js` | 37 |
| `service-staff.test.js` | 26 |
| `settings.test.js` | 6 |
| `upload.test.js` | 12 |
| `user.test.js` | 23 |
| **Toplam** | **291** |

## `tests/setup.js`

- `syncDB()` → `sequelize.drop()` + `sequelize.sync({ force: true })` (test DB: `apps/api/src/test-database.sqlite`)
- Test verisi: 5 kullanıcı (admin, owner1, owner2, customer, customer2), 6 kategori, 2 salon, 2 staff, 4 service, 4 StaffService bağı, 3 randevu (COMPLETED / CONFIRMED / PENDING), 1 yorum
- `teardownDB()` **no-op**: birden fazla dosya aynı Sequelize bağlantısını paylaşır; dosya sonunda `close()` çağırmak sonraki dosyanın `before all` hook'unu kırardı (`ConnectionManager.getConnection was called after the connection manager was closed`). Bağlantı süreç çıkışında kapatılır.

## Test ortamı farkları

| Konu | Test davranışı |
|---|---|
| Rate limit | `NODE_ENV=test` ise limiter'lar **devre dışı** (aksi halde supertest 429 alırdı) |
| E-posta | `NODE_ENV=test` → `[mailer:noop]`, gerçek SMTP'ye bağlanmaz |
| DB dosyası | `test-database.sqlite` |
| `.env.test` | `PORT=3099`, ayrı JWT secret'ları, `RATE_LIMIT_MAX=10000` |

## Chai notu

Bu projede `expect(res).to.have.status(N)` **kullanılmıyor** — `chai-http` 5 ile `to.have.property('status', N)` tercih ediliyor.

## Route sırası tuzakları

- Spesifik route'lar (`/nearby`, `/owner/my-salons`, `/my`, `/unread-count`, `/read-all`) `/:id`'den **önce** tanımlanmalı.
- `notification.routes.js` ve `admin.routes.js` `router.use(authenticate, authorize(...))` ile toplu koruma kullanır.
- `product.routes.js`'te `PATCH`/`DELETE` `GET /:id`'den önce gelir.

## Çalıştırma notu

`npm test` Windows cmd'de `NODE_ENV=test mocha ...` biçimiyle başarısız oluyordu; script `node --env-file=.env.test ./node_modules/mocha/bin/mocha ...` olarak düzeltildi. Dosya bazında çalıştırmak da mümkündür:

```bash
npx mocha tests/auth.test.js --timeout 10000 --exit
```
