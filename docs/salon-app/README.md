# 🏨 Salon App — Detaylı Dokümantasyon

> **Kod:** `apps/salon_app/` (Flutter) · **Sürüm:** 1.0.0+1 · **Doküman tarihi:** 2026 · **Durum:** Kod tabanlı, dosyalardan doğrulanmış

Salon sahiplerinin kendi salonunu yönettiği mobil/web uygulama: randevu takibi, ekip yönetimi, hizmet yönetimi, yorum yanıtlama, salon profili, çalışma saatleri, galeri, tema/dil ayarları.

---

## 📚 Doküman Haritası

| # | Doküman | İçerik |
|---|---------|--------|
| 1 | [01-overview.md](01-overview.md) | Proje özeti, teknoloji yığını, platformlar, dosya ağacı |
| 2 | [02-architecture.md](02-architecture.md) | Mimari katmanlar, provider grafiği, veri akışı, desenler |
| 3 | [03-routing-navigation.md](03-routing-navigation.md) | GoRouter, auth redirect, web deep-link, alt navigasyon |
| 4 | [04-auth-security.md](04-auth-security.md) | Login/register, JWT, refresh interceptor, rol kısıtı, şifre akışları |
| 5 | [05-api-integration.md](05-api-integration.md) | ApiClient, ortam/URL çözümleme, medya URL, upload, endpoint sözleşmesi |
| 6 | [06-data-models.md](06-data-models.md) | Tüm model sınıfları, alanları, parsing kuralları, edge case'ler |
| 7 | [07-screens.md](07-screens.md) | Ekran ekran UI/etkileşim rehberi (dashboard → profil) |
| 8 | [08-design-system.md](08-design-system.md) | Renk paleti, gradient'ler, tipografi, tema extension, skeleton/empty/error |
| 9 | [09-i18n-theme.md](09-i18n-theme.md) | TR/EN çeviri katmanı, locale kalıcılığı, dark mode |
| 10 | [10-testing.md](10-testing.md) | Test mimarisi, FakeApi harness, test envanteri, nasıl çalıştırılır |
| 11 | [11-build-run-deploy.md](11-build-run-deploy.md) | Komutlar, dart-define'lar, Android/iOS/web/masaüstü, platform notları |
| 12 | [12-gaps-risks.md](12-gaps-risks.md) | Bilinen eksikler, teknik borç, riskler, iyileştirme önerileri |
| 13 | [13-feature-guide.md](13-feature-guide.md) | Yeni özellik ekleme reçetesi (checklist + kod şablonu) |

---

## ⚡ 60 Saniyede Özet

- **State:** Riverpod `AsyncNotifier` (kod üretimi yok, provider'lar elle yazılmış). DI container **yok** — `customer_app`'den farkı bu.
- **Veri katmanı:** `features/<x>/data/<x>_provider.dart` doğrudan `ApiClient().dio` çağırır; repository/entity katmanı yok.
- **Temel bağımlılık:** neredeyse tüm ekranlar `salonProvider`'a bağlı (salon ID çözümlemesi).
- **Auth:** `flutter_secure_storage`'da `access_token`, `refresh_token`, `user_id`, `user_name`. 401'de otomatik refresh + retry.
- **Rol kapısı:** yalnızca `SALON_OWNER` giriş yapabilir.
- **Navigasyon:** `/login`, `/register` public; geri kalan 6 route `ShellRoute` içinde `SalonMainScaffold` (5 sekme).
- **Test:** 48 test, network'siz (`FakeApi` interceptor) — `flutter test` ile geçiyor.

---

## 🔗 İlgili Dokümanlar (Repo Genelinde)

- `docs/SALON-APP.md` — kısa üst seviye özet (bu dizindeki detaylı dokümanların ana kaynağı)
- `docs/ARCHITECTURE.md` — 4 uygulamanın ortak mimarisi
- `docs/BACKEND-API.md` — API endpoint referansı
- `docs/customer-app/` — müşteri uygulaması dokümantasyonu
- `docs/admin-panel/` — Next.js admin paneli
- `apps/salon_app/CLAUDE.md` — agent'lar için proje içi kısa kurallar
