# Backend Plan İndeksi

> `apps/api/` · Node.js + Express 5 + Sequelize (SQLite)
> Doğrulama komutu: `cd apps/api && npm test` (Windows'ta `node --env-file=.env.test` kullanılır)

| # | Plan | Konu | Durum |
|---|------|------|-------|
| 1 | [plan-1](plan-1-service-controller.md) | `/services` controller + route | ✅ tamam |
| 2 | [plan-2](plan-2-category-controller.md) | `/categories` controller + route | ✅ tamam |
| 3 | [plan-3](plan-3-product-controller.md) | `/products` controller + route | ✅ tamam |
| 4 | [plan-4](plan-4-notification-controller.md) | `/notifications` controller + route | ✅ tamam |
| 5 | [plan-5](plan-5-test-missing.md) | Test eksikleri | ✅ tamam (243 test) |
| 6 | [plan-6](plan-6-error-handling.md) | Global hata yönetimi | ✅ tamam |

## Gerçek durum (2026-10-12 ölçümü)

- **Controller'lar:** 13 controller, hepsi route'a bağlı (`src/routes/index.js`)
- **Testler:** 11 dosya, 243 test, 0 failing
- **Orta kalanlar:**
  - `upload` endpoint'leri test edilmiyor (dosya yükleme akışı)
  - `admin` endpoint'lerinin dashboard dışı kısmı (`/admin/salons`, `/admin/appointments`, `/admin/reviews`) sadece service-staff.test.js içinde sınırlı test ediliyor
  - `product` ve `notification` Flutter taraflarında (customer_app / salon_app) henüz kullanılmıyor
