<sub><a href="README.en.md">English</a> · <b>Türkçe</b></sub>

<div align="center">

# Beauty Salon Platform

**Güzellik salonları için çok kiracılı rezervasyon ve işletme platformu.**
Müşteri salon keşfeder ve randevu alır; salon sahibi ekibini, hizmetlerini ve randevularını yönetir;
platform yöneticisi tüm kiracıları denetler — hepsi tek bir backend üzerinden.

4 uygulama · 802 test · rol bazlı yetkilendirme

[![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Sequelize](https://img.shields.io/badge/Sequelize%206-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

</div>

<p align="center"><img src="docs/media/hero.webp" alt="Solda müşteri uygulaması, sağda platform yönetim paneli" width="880"></p>

---

## Ne çözüyor?

Bir salonun günlük işi tek bir yerden yürümesi gerekiyor: müşteri doğru çalışandan doğru hizmeti
alabilmeli, salon kapasitesini görebilmeli, platform da kiracıları birbirine karıştırmadan
denetleyebilmeli. Bu repo o zincirin tamamını içerir.

| Rol | Yapabildiği |
|---|---|
| **Müşteri** | Salon keşfi, hizmet ve çalışan seçerek randevu, randevu geçmişi, yorum, favoriler |
| **Salon sahibi** | Çalışan ve hizmet yönetimi, çalışan–hizmet eşleştirmesi, randevu onay/iptal, panel ve gelir istatistikleri, salon profili ve medya |
| **Platform yöneticisi** | Kiracı (salon) ve kullanıcı yönetimi, kategoriler, yorum moderasyonu, platform ayarları |

## Uygulamalar

Bu bir monorepo; dört uygulama aynı API sözleşmesini paylaşır.

| Uygulama | Teknoloji | Ne yapar |
|---|---|---|
| [`apps/api`](apps/api) | Node.js · Express 5 · Sequelize 6 · JWT | REST API, iş kuralları, yetkilendirme, dosya yükleme, bildirim |
| [`apps/admin_panel`](apps/admin_panel) | Next.js 16 · TypeScript · Tailwind 4 · recharts | Platform yönetim paneli (salonlar, kullanıcılar, randevular, yorumlar, kategoriler, ayarlar) |
| [`apps/customer_app`](apps/customer_app) | Flutter · Riverpod 3 · go_router · Dio | Müşteri mobil uygulaması |
| [`apps/salon_app`](apps/salon_app) | Flutter · Riverpod 3 · go_router · Dio | Salon sahibi mobil uygulaması (randevu, ekip, hizmet, panel) |

## Mimari

```
Flutter customer_app ─┐
Flutter salon_app ────┼──►  Express API  ──►  Sequelize  ──►  SQLite (varsayılan)
Next.js admin_panel ──┘        │                              PostgreSQL (yapılandırılabilir)
                               ├── JWT access (15 dk) + refresh (7 gün), bcrypt
                               ├── express-validator ile gövde doğrulama
                               ├── Multer ile görsel yükleme (JPEG/PNG/WebP/GIF, maks. 5 MB, diske)
                               ├── rate limit · Helmet · CORS allowlist
                               └── Nodemailer (SMTP) · Twilio (SMS, kimlik yoksa konsola düşer)
```

**İzolasyon sınırı kiracıdır (salon).** Yetkilendirme rol bazlı; salon sahibi yalnızca kendi
salonunun verisini görebilir, admin uçları müşteri ve salon rollerine kapalıdır. Bu kural test edilir
(`tests/user.test.js` → *Session isolation*, *Role-based access*).

Veri modeli 12 tablo: `User`, `Salon`, `Staff`, `StaffService`, `Service`, `ServiceCategory`,
`Appointment`, `Review`, `Favorite`, `Notification`, `Product`, `Setting`.
`StaffService` aynı zamanda çalışan–hizmet ilişkisini taşıyan bağlantı tablosudur.

## Hızlı başlangıç

```bash
# 1) API
cd apps/api
npm install
cp .env.example .env          # JWT_SECRET / JWT_REFRESH_SECRET doldurun (min. 32 karakter)
npm run seed                  # demo veri (idempotent)
npm run dev                   # http://localhost:3000/api/v1

# 2) Admin paneli
cd apps/admin_panel
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
npm run dev -- -p 3001         # API 3000'de olduğu için panel farklı portta

# 3) Flutter uygulamaları
cd apps/customer_app          # veya apps/salon_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1
```

Mobil uygulamalarda adres derleme zamanında override edilir: `API_BASE_URL`, `MEDIA_BASE_URL`,
`WS_BASE_URL` (`lib/app/environment.dart`). Verilmezse yerel geliştirme varsayılanı kullanılır.

`npm run seed` idempotenttir; birden fazla kez çalıştırılabilir. Veritabanını demo veriyle
sıfırdan doldurmak için `npm run seed:reset`. Demo hesapların şifreleri üretimde zorunlu olarak
ortam değişkeninden gelir (`SEED_ADMIN_PASSWORD`, `SEED_SALON_PASSWORD`, `SEED_CUSTOMER_PASSWORD`) —
verilmezse seed **çalışmayı reddeder**, böylece canlı kurulumda herkesin bildiği bir yönetici
şifresi oluşmaz.

### Geliştirme ortamı

- `node` 22.23.4 ve `flutter` 3.47.7 sürümleri depo kökündeki `.tool-versions` dosyasında pinlidir.
- Kapı komutu: `bash scripts/check_toolchain.sh` — sürümler pinlerle uyuşmazsa `exit 1` döner.
- Not: flutter 3.47.7, `flutter analyze` / `flutter test` sırasında `analyzer.exclude` bloğunu kendisi
  yazar. Bu blok artık `apps/customer_app` ve `apps/salon_app` içinde deterministik olarak commit'li
  olduğu için test sonrası çalışma ağacı kirlenmez.

## Test

Sayılar bu repoda çalıştırılarak alındı (2026-10-26 koşum ölçümü), dokümandan kopyalanmadı:

| Uygulama | Komut | Sonuç |
|---|---|---|
| API | `npm test` (Mocha) | **291 test geçiyor** |
| customer_app | `flutter test` | **271 test geçiyor** |
| salon_app | `flutter test` | **84 test geçiyor** |
| admin_panel | `npm test` (node:test + vitest) | **156 test** (29 node + 127 bileşen) |

2026-10-26 ölçümü: toplam 802 test (API 291 · customer_app 271 · salon_app 84 · admin_panel 156).

Testler; oturum izolasyonu, rol bazlı erişim, randevu durum geçişleri, medya yolu çözümlemesi ve
gövde doğrulama kenar durumlarını kapsar. Örnek: `DashboardNotifier` için *"randevular için tek
istek yapar (gün başına N+1 yok)"* testi vardır — panel istatistikleri gün sayısı kadar istek atmaz.

## Güvenlik notları

- `.env`, `*.sqlite`, `uploads/` **izlenmez**; repoda yalnızca `.env.example` yer tutucuları var.
- Üretimde (`NODE_ENV=production`) varsayılan demo şifreleriyle seed reddedilir.
- JWT: kısa ömürlü access token + refresh token; şifreler bcrypt ile saklanır.
- Yükleme: tür ve boyut doğrulaması (JPEG/PNG/WebP/GIF, varsayılan 5 MB); hatalı yükleme 500 yerine
  400 döner. Görseller olduğu gibi diske yazılıyor; yeniden boyutlandırma/dönüştürme adımı yok.
- CORS origin listesi ortam değişkeninden gelir; varsayılanı yalnızca yerel geliştirmedir.
- Yönetim panelinde giriş formu üretim derlemesinde **boş** açılır; demo ön doldurma yalnızca
  geliştirmede etkindir (Next.js `NODE_ENV` kapısı, üretimde dead-code olarak elenir).

## Bilinen sınırlar

Bunları saklamıyorum; reponun bugünkü gerçeği:

- **Migration'lar tanımlı ama runtime çalıştırmıyor.** `.sequelizerc` → `src/config/sequelize-config.js`
  (dialect **postgres**) ve `src/database/migrations/` altında 12 migration dosyası duruyor; `npm run migrate`,
  `migrate:status`, `migrate:undo` script'leri tanımlı. Buna karşın açılışta migration çalışmıyor: şema
  `sequelize.sync()` + `ensureColumns()` ile hizalanıyor ve SQLite veritabanında `SequelizeMeta` tablosu
  yok (`src/test-database.sqlite` kontrol edildi) — yani migration'lar hiç uygulanmamış, model tanımlarıyla
  birebir uyuşmuyor. Geri alınabilir şema değişikliği için runtime'ın migration'lara geçirilmesi gerekiyor
  (ayrıntı: [docs/api/09-seed-and-migrations.md](docs/api/09-seed-and-migrations.md)).
- **Swagger paketleri bağlanmamış.** `swagger-jsdoc` ve `swagger-ui-express` bağımlılık olarak var
  ama `src/` içinde hiçbir yere mount edilmemiş. Bugünkü API dokümantasyonu `docs/api/` altındaki
  Markdown dosyaları — ya Swagger bağlanmalı ya bağımlılıklar kaldırılmalı.
- **Yüklemeler yerel diske yazılıyor.** Yatay ölçekleme veya çok örnekli dağıtım için paylaşımlı
  nesne depolamaya taşınmalı.
- **`sharp` bağımlılığı kullanılmıyor.** Dosyalar Multer ile olduğu gibi diske yazılıyor; yeniden
  boyutlandırma veya format dönüştürme yok. `sharp` `package.json`'da duruyor ama `src/` içinde
  require edilmiyor — ya görsel işleme eklenmeli ya bağımlılık kaldırılmalı.
- **Ödeme ve abonelik yok.** Platform yönetimi var, tahsilat yok.
- **SMS/е-posta sağlayıcıları dış servis.** Kimlik bilgisi yoksa SMS konsola loglanır (geliştirme).

## Dizin yapısı

```
apps/
  api/            # Express API · 12 model · 14 route · 14 test dosyası
  admin_panel/    # Next.js 16 yönetim paneli
  customer_app/   # Flutter müşteri uygulaması
  salon_app/      # Flutter salon uygulaması
docs/             # ARCHITECTURE, BACKEND-API, ADMIN-PANEL, CUSTOMER-APP, SALON-APP
plans/            # özellik planları ve karar kayıtları
screenshots/      # CDP harness (*.js); üretilen kareler git-ignored
```

`screenshots/` altında üretilen kareler — `CA-019` görsel yenileme doğrulama koşuları dahil —
**git-dışı koşu artefaktıdır** (`.gitignore` PNG/JPG'yi dışlar); repoda yalnızca CDP harness
betikleri (`*.js`) sürümlenir.

## Dokümantasyon

- [Mimari ve teknoloji yığını](docs/ARCHITECTURE.md)
- [API sözleşmesi](docs/BACKEND-API.md) · [uç nokta listesi](docs/api/05-endpoints.md) · [hızlı başlangıç](docs/api/12-quickstart.md)
- [Admin panel](docs/ADMIN-PANEL.md) · [müşteri uygulaması](docs/CUSTOMER-APP.md) · [salon uygulaması](docs/SALON-APP.md)
- [Eksik özellikler ve bilinen boşluklar](docs/MISSING_FEATURES.md)

---

<sub>İngilizce sürüm: [README.en.md](README.en.md)</sub>
