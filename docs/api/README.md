# 🏨 Beauty Salon API — Detaylı Dokümantasyon

> **Kapsam:** `apps/api/` (Node.js 22.23.4 — `.tool-versions` ile pinli / Express 5 / Sequelize 6 / PostgreSQL — SQLite yalnızca `DB_DIALECT=sqlite` geri dönüş yolu)
> **Kaynak:** `src/` kodu, `tests/` suite'i, `src/database/migrations/**` (17 migration) + canlı Postgres şeması ve canlı sunucu (`http://localhost:3200/api/v1`) üzerinde yapılan gerçek istekler. (`src/database.sqlite` yalnızca arşiv dosyasıdır, şema kaynağı değildir — bkz. `09-seed-and-migrations.md`.)
> **Son doğrulama:** 2026-11-02 (davranış iddiaları `src/` kodu okunarak doğrulandı; güncel test sayısı ve koşum sonucu için `10-tests.md` son bölümüne bak). 2026-10-23 tarihli canlı probe ve SQLite dönemi sayımı **tarihsel kayıttır**, bugünkü durumu göstermez.

Bu dizin, API'nin modül modül bölünmüş dokümantasyonudur. Tek dosya özeti için: `docs/BACKEND-API.md`.

## Dosyalar

| Dosya | İçerik |
|---|---|
| [01-overview.md](01-overview.md) | Proje özeti, teknoloji yığını, çalıştırma, klasör yapısı |
| [02-architecture.md](02-architecture.md) | İstek yaşam döngüsü, middleware sırası, yanıt formatı, hata işleme |
| [03-auth.md](03-auth.md) | JWT, roller, `authenticate`/`authorize`, refresh, OTP akışları |
| [04-data-model.md](04-data-model.md) | ER diyagramı, 12 model, kolon kolon şema, indexler, ilişkiler |
| [05-endpoints.md](05-endpoints.md) | Tam endpoint referansı (istek/yanıt örnekleriyle) |
| [06-business-rules.md](06-business-rules.md) | Randevu, slot, puanlama, sahiplik, soft delete kuralları |
| [07-validators.md](07-validators.md) | express-validator kuralları ve route eşleşmeleri |
| [08-integrations.md](08-integrations.md) | Dosya yükleme, e-posta, SMS, Settings |
| [09-seed-and-migrations.md](09-seed-and-migrations.md) | Seed verileri, migration'lar, şema tutarsızlıkları |
| [10-tests.md](10-tests.md) | Test altyapısı, dosya bazında sonuçlar, tuzaklar |
| [11-known-issues.md](11-known-issues.md) | Doğrulanmış güvenlik açıkları ve teknik borç |
| [12-quickstart.md](12-quickstart.md) | curl ile hızlı başlangıç |
| [openapi.yaml](openapi.yaml) | OpenAPI 3.0 şeması (tüm endpoint'ler) |

## Kısa harita

```
GET  /api/v1/health                 public
POST /api/v1/auth/*                 register/login public, geri kalan required
GET  /api/v1/salons                 public (yalnız aktif + onaylı salonlar)
POST /api/v1/salons                 SALON_OWNER
GET  /api/v1/categories             public
POST /api/v1/categories             ADMIN
POST /api/v1/appointments           required (CUSTOMER)
POST /api/v1/reviews                required (CUSTOMER)
GET  /api/v1/notifications          required
GET  /api/v1/admin/*                ADMIN
GET  /api/v1/settings               ADMIN
POST /api/v1/upload/*               required
```

## Roller

| Rol | Ne yapabilir |
|---|---|
| `CUSTOMER` | Salon/hizmet/çalışan okur, randevu alır, randevusunu iptal eder, yorum yapar, favori ekler, bildirimlerini okur, kendi profilini günceller |
| `SALON_OWNER` | Kendi salonunu ve salonunun çalışan/hizmet/ürünlerini yönetir, randevu durumunu değiştirir, yorumlara yanıt verir, e-posta/telefonunu OTP ile değiştirir |
| `ADMIN` | Platform geneli okuma, salon onaylama, kullanıcı aktif/pasif, yorum görünürlüğü, Settings, kategori CRUD |

> `ADMIN` rolü `POST /auth/register` ile oluşturulamaz (validator yalnız `CUSTOMER`/`SALON_OWNER` kabul eder). Admin yalnız seed ile veya DB'den oluşur.
