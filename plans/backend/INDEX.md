# Backend Plan İndeksi

> `apps/api/` · Node.js + Express 5 + Sequelize (SQLite)
> Doğrulama komutu: `cd apps/api && npm test` (Windows'ta `node --env-file=.env.test` kullanılır)

| # | Plan | Konu | Durum |
|---|------|------|-------|
| 1 | [plan-1](plan-1-service-controller.md) | `/services` controller + route | ✅ tamam |
| 2 | [plan-2](plan-2-category-controller.md) | `/categories` controller + route | ✅ tamam |
| 3 | [plan-3](plan-3-product-controller.md) | `/products` controller + route | ✅ tamam |
| 4 | [plan-4](plan-4-notification-controller.md) | `/notifications` controller + route | ✅ tamam |
| 5 | [plan-5](plan-5-test-missing.md) | Test eksikleri | ✅ tamam (o tarihte 243 test) |
| 6 | [plan-6](plan-6-error-handling.md) | Global hata yönetimi | ✅ tamam |

## Gerçek durum (2026-10-23 ölçümü)

- **Controller'lar:** 14 controller, hepsi route'a bağlı (`src/routes/index.js` 14 router mount ediyor)
- **Testler:** 14 test dosyası (+ `tests/setup.js`), 291 test, 0 failing (`cd apps/api && npm test`)
- **Doğrulanan kapsam** (artık "orta kalan" değil):
  - `upload`: `tests/upload.test.js` (245 satır, 12 test) — tek/çoklu yükleme, kimlik doğrulama (401),
    mime reddi, boyut aşımı, beklenmeyen alan adı, `/uploads` statik sunumu, galeriye yazma E2E.
  - `admin`: `tests/admin.test.js` (8 test) — `/admin/dashboard`, `/admin/salons`, `/admin/appointments`,
    `/admin/reviews` ve yetkilendirme (401/403) ayrı ayrı test ediliyor.
- **Orta kalanlar:**
  - `product` iki Flutter uygulamasında da kullanılmıyor (customer_app / salon_app altında product ekranı yok).
  - `notification` customer_app'te tam katman olarak var (`lib/features/notifications`, `lib/app/router.dart:162`);
    salon_app'te bildirim akışı yok.
