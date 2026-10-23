# 12 · Bilinen Eksikler, Teknik Borç ve Riskler

Aşağıdakiler kod okunarak (ve API tarafıyla çapraz kontrol edilerek) tespit edilmiştir. Önem sırası: 🔴 kritik / 🟠 orta / 🟡 düşük.

---

## ✅ 1. (Kapatıldı 2026-10-23) Dashboard haftalık grafik ay başında eksik veri gösterirdi

**Çözüm notu:** Sorgu başlangıcı artık `min(ay başı, bugün-6)` olarak hesaplanıyor (`dashboardQueryRange`), böylece ayın ilk günlerinde de haftalık grafiğin 7 günü tek istekte kapsanıyor. Zaman kaynağı `dashboardNowProvider` üzerinden enjekte edildiği için sınır durumları deterministik test edilebiliyor. Kanıt: `test/features/dashboard/dashboard_week_boundary_test.dart` (6 test).

`DashboardNotifier._fetch()` sorgusu:
```dart
from = ay başı (YYYY-MM-01), to = bugün
weeklyChart = son 7 günün sayıları (now-6 … now)
```
**Problem:** Ayın ilk günlerinde (ör. 3 Ekim) son 7 günün 4 günü (27–30 Eylül) sorgu aralığında **değil** → grafikte 0 görünür. `weekCount` de aynı sebeple düşük hesaplanır.

**Çözüm:** `from = min(ayBaşı, bugün-6)` veya iki aralık istemek. Test: `DashboardNotifier ... haftalık chart` mevcut test ay ortası varsaydığı için bu durumu yakalamıyor.

---

## 🔴 2. Auth/upload çağrıları `apiClientProvider`'ı bypass ediyor

`auth_provider.dart` (6 çağrı) ve `upload_service.dart` `ApiClient()` ile **yeni Dio** üretiyor:
- Her çağrıda yeni interceptor + yeni connection → gereksiz yük
- Testlerde `FakeApi` override auth'a işlemiyor
- İleride timeout/logging/retry gibi ortak davranış eklemek zorlaşıyor

**Çözüm:** `ref.read(apiClientProvider).dio` kullanmak; `UploadService`'e dio parametresi vermek (zaten `{Dio? dio}` destekliyor).

---

## ✅ 3. (Kapatıldı 2026-10-23) Çıkış artık sunucu tarafında da yapılıyor

**Çözüm notu:** `logout()` artık `ref.read(apiClientProvider).dio.post('/auth/logout')` çağrısıyla refresh token'ı sunucu tarafında da iptal ediyor; ağ hatası (timeout/4xx/5xx) yerel çıkışı engellemiyor, hata yutulup storage yine siliniyor. Kanıt: `test/features/auth/auth_logout_test.dart` (2 test).

`logout()` sadece `_storage.deleteAll()`. API'de `POST /auth/logout` var ama çağrılmıyor → refresh token DB'de aktif kalır.

---

## 🟠 4. Bildirimler tamamen stub

- Dashboard header'daki zil ikonu: `Icon` sadece, `onTap` yok.
- Profil → "Bildirim Ayarları": `onTap: () {}`.
- API'de `Notification` modeli ve `notification.routes.js` mevcut; salon_app hiç kullanmıyor.

---

## 🟠 5. NO_SHOW durumu yönetilemiyor

Filtre chip'lerinde "Gelmedi" var ve enum API'de mevcut, ancak randevu kartında "Gelmedi olarak işaretle" aksiyonu yok. `updateStatus(id, 'NO_SHOW')` altyapısı hazır, UI eksik.

---

## 🟠 6. Profil istatistik kartı eksik

`_buildStat` yalnızca `reviewCount` gösteriyor. `S.staffCount` / `S.serviceCount` çevirileri tanımlı ama kullanılmıyor; `staffProvider`/`servicesProvider` zaten yükleniyor — kartta çalışan/hizmet sayısı gösterilebilir.

---

## 🟠 7. Yorum "yanıtsız" sayımı yalnızca yüklenen sayfaya göre

```dart
final unrepliedCount = feed.reviews.where((r) => !r.hasReply).length;
```
`feed.total` salonun tüm yorumlarını temsil eder; sayfa sonuna kadar yüklenmeden "Yanıtsız" sayısı eksik kalır.

---

## 🟠 8. 401 interceptor'da retry döngüsü riski

Refresh sonrası `_dio.fetch(err.requestOptions)` tekrar 401 dönerse interceptor yeniden tetiklenir. Pratikte sonlanır ama **retry sayacı** eklenmesi (ör. `options.extra['retried']`) güvenli olur.

---

## 🟠 9. Logout dil/tema tercihlerini de siliyor

`deleteAll()` → `app_locale` ve `app_theme` de silinir. Kullanıcı tekrar giriş yaptığında TR/system'e döner.

---

## 🟡 10. Hardcoded Türkçe metinler (i18n boşluğu)

- Profil: "Salonu Sil", dialog metinleri, "Sil", "İptal"
- `WorkingDay.displayTimeRange` → `"Kapalı"`
- Dashboard: `"₺"` literal
- Footer: `"Salon App v1.0.0"`

EN kullanıcı için karışık görünür.

---

## 🟡 11. Randevularda çift filtre

Server `date` + `status` ile filtrelerken `_filterList` client-side tekrar filtreliyor. Zararsız ama `refresh(date: ...)` sonrası gereksiz.

---

## 🟡 12. Çalışma saatleri validasyonu yok

Sheet'te açılış > kapanış olabilir (ör. 18:00 – 09:00). API tarafında da kontrol görünmüyor. `open < close` kontrolü eklenmeli.

---

## 🟡 13. OTP mesajı belirsiz

`otpSentToEmail(widget.salon?.email)` → **mevcut** e-postayı gösteriyor, değişikliği istenen yeni adresi değil. Kullanıcı kodun nereye gittiğinden emin olamayabilir.

---

## 🟡 14. Eksik özellikler (API var, app kullanmıyor)

| API kapasitesi | salon_app durumu |
|---|---|
| `GET/POST /salons/{id}/products` | Ürün yönetimi yok |
| `POST /appointments` (randevu oluşturma) | Salon tarafında manuel randevu oluşturma yok |
| `/upload/single` | Kullanılmıyor |
| `PATCH /salons/{id}/verify` | Admin işi, app'te yok |
| Staff avatar / service image | UI'da yok (avatar baş harflerden üretiliyor) |
| Çoklu salon | App ilk salonu alıyor, salon değiştirme UI'sı yok |

---

## 🟡 15. Yapısal / hijyen notları

- `assets/images/` pubspec'ta declare edilmiş ama dizin boş.
- `main.dart` içinde `SystemChrome.setSystemUIOverlayStyle` her rebuild'de çağrılıyor.
- Dashboard grafik başlığında tema tespiti `c.background == const Color(0xFFFAFAFC)` karşılaştırmasıyla yapılıyor — kırılgan; `Theme.of(context).brightness` kullanılmalı.
- `salon_profile_screen.dart` 1.274 satır — `customer_app`'deki `CA-017-large-widget-split` benzeri bir bölme faydalı olur.
- Ekran testleri yok (bkz. [10-testing.md](10-testing.md)).
- `web/manifest.json` hâlâ Flutter default `#0175C2` tema rengi.

---

## Önceliklendirilmiş İyileştirme Listesi

| # | İş | Efor | Kazanım |
|---|---|---|---|
| 1 | Dashboard `from` aralığını `min(monthStart, today-6d)` yap | ~10 satır | Doğru haftalık grafik |
| 2 | Auth/upload'u `apiClientProvider`'a taşı | ~20 satır | Test edilebilirlik + tutarlılık |
| 3 | Logout'ta `POST /auth/logout` çağır | ~5 satır | Güvenlik |
| 4 | NO_SHOW aksiyonu ekle | ~20 satır | Özellik tamamlanma |
| 5 | Interceptor'a retry sayacı | ~10 satır | Dayanıklılık |
| 6 | Bildirim merkezi (API zaten var) | orta | Özellik |
| 7 | Hardcoded TR metinleri `S`'e taşı | ~30 satır | i18n |
| 8 | Profil ekranını parçalara böl | orta | Bakım |
