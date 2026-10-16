<div align="center">

# Beauty Salon Platform

**Güzellik salonları için çok kiracılı rezervasyon ve işletme platformu.**
Müşteri salon keşfeder ve randevu alır; salon sahibi ekibini, hizmetlerini ve randevularını yönetir;
platform yöneticisi tüm kiracıları denetler — hepsi tek bir backend üzerinden.

4 uygulama · 535 test · rol bazlı yetkilendirme

[![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Sequelize](https://img.shields.io/badge/Sequelize%206-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

</div>

<p align="center"><img src="screenshots/salon_app/02_dashboard_desktop.png" alt="Salon uygulaması panel ekranı" width="880"></p>

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
| [`apps/admin_panel`](apps/admin_panel) | Next.js 16 · TypeScript · Tailwind 4 · recharts | Platform yönetim paneli (kiracılar, kullanıcılar, kategoriler, ayarlar) |
| [`apps/customer_app`](apps/customer_app) | Flutter · Riverpod 3 · go_router · Dio | Müşteri mobil uygulaması |
| [`apps/salon_app`](apps/salon_app) | Flutter · Riverpod 3 · go_router · Dio | Salon sahibi mobil uygulaması (randevu, ekip, hizmet, panel) |

## Mimari

```
Flutter customer_app ─┐
Flutter salon_app ────┼──►  Express API  ──►  Sequelize  ──►  SQLite (varsayılan)
Next.js admin_panel ──┘        │                              PostgreSQL (yapılandırılabilir)
                               ├── JWT access (15 dk) + refresh (7 gün), bcrypt
                               ├── express-validator ile gövde doğrulama
                               ├── Multer + sharp ile görsel yükleme (maks. 5 MB)
                               ├── rate limit · Helmet · CORS allowlist
                               └── Nodemailer (SMTP) · Twilio (SMS, kimlik yoksa konsola düşer)
```

**İzolasyon sınırı kiracıdır (salon).** Yetkilendirme rol bazlı; salon sahibi yalnızca kendi
salonunun verisini görebilir, admin uçları müşteri ve salon rollerine kapalıdır. Bu kural test edilir
(`tests/admin.test.js` → *Session isolation*, *Role-based access*).

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

## Test

Sayılar bu repoda çalıştırılarak alındı, dokümandan kopyalanmadı:

| Uygulama | Komut | Sonuç |
|---|---|---|
| API | `npm test` (Mocha) | **286 test geçiyor** |
| customer_app | `flutter test` | **201 test geçiyor** |
| salon_app | `flutter test` | **48 test geçiyor** |
| admin_panel | — | test yok (aşağıya bakın) |

Testler; oturum izolasyonu, rol bazlı erişim, randevu durum geçişleri, medya yolu çözümlemesi ve
gövde doğrulama kenar durumlarını kapsar. Örnek: `DashboardNotifier` için *"randevular için tek
istek yapar (gün başına N+1 yok)"* testi vardır — panel istatistikleri gün sayısı kadar istek atmaz.

## Güvenlik notları

- `.env`, `*.sqlite`, `uploads/` **izlenmez**; repoda yalnızca `.env.example` yer tutucuları var.
- Üretimde (`NODE_ENV=production`) varsayılan demo şifreleriyle seed reddedilir.
- JWT: kısa ömürlü access token + refresh token; şifreler bcrypt ile saklanır.
- Yükleme: tür ve boyut doğrulaması, `sharp` ile işleme; hatalı yükleme 500 yerine 400 döner.
- CORS origin listesi ortam değişkeninden gelir; varsayılanı yalnızca yerel geliştirmedir.
- Yönetim panelinde giriş formu üretim derlemesinde **boş** açılır; demo ön doldurma yalnızca
  geliştirmede etkindir (Next.js `NODE_ENV` kapısı, üretimde dead-code olarak elenir).

## Bilinen sınırlar

Bunları saklamıyorum; reponun bugünkü gerçeği:

- **Migration yok.** Şema `sequelize.sync()` + `ensureColumns()` ile hizalanıyor. Geri alınabilir
  şema değişikliği için `sequelize-cli` migration'larına geçilmesi gerekiyor.
- **`admin_panel` test edilmiyor.** En çok ekran burada; öncelikli borç.
- **Swagger paketleri bağlanmamış.** `swagger-jsdoc` ve `swagger-ui-express` bağımlılık olarak var
  ama `src/` içinde hiçbir yere mount edilmemiş. Bugünkü API dokümantasyonu `docs/api/` altındaki
  Markdown dosyaları — ya Swagger bağlanmalı ya bağımlılıklar kaldırılmalı.
- **Yüklemeler yerel diske yazılıyor.** Yatay ölçekleme veya çok örnekli dağıtım için paylaşımlı
  nesne depolamaya taşınmalı.
- **Ödeme ve abonelik yok.** Platform yönetimi var, tahsilat yok.
- **SMS/е-posta sağlayıcıları dış servis.** Kimlik bilgisi yoksa SMS konsola loglanır (geliştirme).

## Dizin yapısı

```
apps/
  api/            # Express API · 13 model · 14 route · 14 test dosyası
  admin_panel/    # Next.js 16 yönetim paneli
  customer_app/   # Flutter müşteri uygulaması
  salon_app/      # Flutter salon uygulaması
docs/             # ARCHITECTURE, BACKEND-API, ADMIN-PANEL, CUSTOMER-APP, SALON-APP
plans/            # özellik planları ve karar kayıtları
screenshots/      # uygulama ekran görüntüleri (E2E doğrulama çıktıları)
```

## Dokümantasyon

- [Mimari ve teknoloji yığını](docs/ARCHITECTURE.md)
- [API sözleşmesi](docs/BACKEND-API.md) · [uç nokta listesi](docs/api/05-endpoints.md) · [hızlı başlangıç](docs/api/12-quickstart.md)
- [Admin panel](docs/ADMIN-PANEL.md) · [müşteri uygulaması](docs/CUSTOMER-APP.md) · [salon uygulaması](docs/SALON-APP.md)
- [Eksik özellikler ve bilinen boşluklar](docs/MISSING_FEATURES.md)

---

<sub>**English** — A multi-tenant booking and management platform for beauty salons: an Express 5 +
Sequelize REST API, a Next.js admin panel and two Flutter apps (customer and salon owner), with
role-based access control and tenant isolation. 535 tests, run to verify the numbers in this README.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture.</sub>
