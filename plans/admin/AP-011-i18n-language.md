# AP-011 — Admin Paneli Dil Sistemi: `tr`/`en` arayüz, `system|tr|en` modu, `localStorage` tercihi ve API `language` ayarı

**Durum:** UYGULANDI (2026-10-28) · **Tarih:** 2026-10-28 · **Hedef uygulamalar:** `apps/admin_panel`, `apps/api`
**Kanıt (özet):** Bu plan **uygulamadan sonra yazıldı** — içeriğin tamamı bu oturumda okunan/ölçülen gerçek dosyalardan türetildi (`wc -l`, `grep -o … | wc -l`, dosya okumaları; sayılar §5 tablosundadır). Dış i18n paketi **kurulmadı**: çekirdek `src/lib/i18n/index.ts` (**174 satır**, bağımlılıksız saf TS), React bağlantısı `src/providers/LocaleProvider.tsx` (**158 satır**), sözlükler `src/lib/i18n/messages/*.ts` (**11 dosya, toplam 1838 satır**). K2 (cookie tabanlı SSR başlangıç dili) **2026-11-02'de kapatıldı**: `src/lib/i18n/localeCookie.ts` (26), `src/lib/i18n/server.ts` (46), async `src/app/layout.tsx` (85) — ölçüm ve mimari karar §10.1. Kapılar: `apps/admin_panel` `npm run typecheck` + `npm run lint` (bu oturumda koşuldu, §9), `npm test` / `npm run build` ve `apps/api` `npm test` üst görev raporlarında yeşil (bu oturumda yeniden koşulmadı, §9).

> **Kapsam notu (ne var, ne yok):** Bu plan yalnız **admin panelinin arayüz dilini** kapsar: kabuk, gezinme, ayarlar, sekiz ekranın görünen metinleri, ortak UI bileşenleri ve tarih/para biçimlendirme (`Intl` / `toLocaleDateString` çağrıları `useI18n().locale`'e bağlı — §10 K1 kapatıldı). `apps/customer_app` / `apps/salon_app` arayüzleri ve API'den dönen mesajlar (ör. `Geçersiz dil; 'tr', 'en' veya 'system' olmalı` — `apps/api/src/controllers/settings.controller.js:45`) kapsam dışıdır. Yeni bir paket (next-intl / react-i18next) **bilinçli olarak** eklenmedi.

---

## 1. Amaç ve kapsam

| # | Kazanım |
|---|---|
| K1 | Panel tek bir `t('ns.anahtar')` sözleşmesiyle **iki dilde** (tr/en) çalışıyor; görünen metin kod içinde sabit string olarak kalmadı |
| K2 | Dil modu üç değerli: **`system` (varsayılan) / `tr` / `en`**; `system` tarayıcı dilini izler |
| K3 | Tercih **`localStorage`**'da (`app_locale_mode`) kalıcı; sunucudaki `language` ayarı yalnız yerel tercih yokken uygulanıyor |
| K4 | **Ayarlar > Dil** kartından değiştiriliyor; değer `PUT /settings` ile API'e de yazılıyor (geçersiz değer → `400`) |
| K5 | İlk boyamada yanlış `<html lang>`'ı önleyen **inline `localeInitScript`** (localStorage → cookie → sistem dili) |
| K6 | Dil mantığı **ağsız `node:test`** ile doğrulanabiliyor (React/DOM gerekmiyor) + tr/en **anahtar parity** testleri |

### Kapsam dışı (bilinçli)

- Diğer uygulamaların (`customer_app`, `salon_app`) yerelleştirilmesi.
- API hata mesajları, bildirim içerikleri, e-posta şablonları.
- Çoğul (plural) kuralları: yer tutucu `{count}` var, çekim kuralı yok.

---

## 2. Çekirdek sözleşme (`apps/admin_panel`)

Bağımlılık yok — `src/lib/i18n/index.ts` React/Next import etmez, bu yüzden `node --test` ile doğrudan yüklenir. `messages/*` importları bilinçli olarak `.ts` uzantılıdır (Node ESM uzantısız göreli yolu çözmez; `tsconfig`'te `allowImportingTsExtensions` açık — AP-003'ten gelen ayar).

| İhraç edilen | Değer / imza | Not |
|---|---|---|
| `Locale` | `'tr' \| 'en'` | somut dil |
| `LocaleMode` | `'system' \| 'tr' \| 'en'` | kullanıcı tercihi |
| `LOCALES` / `LOCALE_MODES` | `['tr','en']` / `['system','tr','en']` | doğrulama listeleri |
| `LOCALE_STORAGE_KEY` | `'app_locale_mode'` | tema için `app_theme` deseninin dil karşılığı |
| `LOCALE_COOKIE_NAME` | `'app_locale_mode'` (= `LOCALE_STORAGE_KEY`) | SSR'in okuyabildiği ikinci taşıyıcı (K2); aynı ad bilinçli |
| `LOCALE_COOKIE_MAX_AGE` | `31536000` (1 yıl) | cookie ömrü |
| `DEFAULT_LOCALE_MODE` | `'system'` | kayıt yoksa başlangıç |
| `normalizeLocaleMode(value)` | geçerli mod ya da `DEFAULT_LOCALE_MODE` | `parseLocaleMode` + varsayılan; sunucu ve istemci aynı fonksiyonu kullanır |
| `localeModeCookie(mode)` | `app_locale_mode=<mode>; path=/; max-age=31536000; samesite=lax` | cookie metninin **tek** üretim noktası |
| `detectSystemLocaleFromAcceptLanguage(header)` | `q` ağırlığına göre ilk etiket → `detectSystemLocale` | sunucunun `system` modu tahmini (K2) |
| `MESSAGES` | `Record<Locale, MessageTree>` | 11 namespace: `common, nav, shell, settings, dashboard, pages, reviews, salons, appointments, ui, categories` |
| `detectSystemLocale(navigatorLanguage)` | `'tr'` / `'tr-*'` → `tr`; **diğer/boş → `en`** | panelin ana dili Türkçe, bilinmeyen dil İngilizceye düşer |
| `parseLocaleMode(value)` | geçerli mod ya da `null` | geçersiz/boş → `null` (çağıran varsayılana düşer) |
| `resolveLocale(mode, language)` | `'system'` → `detectSystemLocale(...)`, değilse mod'un kendisi | |
| `translate(locale, key, vars?)` | nokta yolunu ağaçta gezer | **eksik anahtar hata atmaz, anahtarın kendisi döner**; `{ad}` yer tutucuları `vars` ile dolar, verilmeyen yer tutucu olduğu gibi kalır |

`LocaleProvider` (`src/providers/LocaleProvider.tsx`, **158 satır**) sözleşmesi:

- İlk `mode` önceliği: **bu oturumdaki seçim → `localStorage` → `initialMode` prop'u (sunucu/cookie) → `DEFAULT_LOCALE_MODE`**.
  - İlk **hidrasyon** render'ında `localStorage` ve `navigator.language` okunmaz: `useSyncExternalStore`'un sunucu anlık görüntüsü (`null`) kullanılır, yani ilk render sunucunun `initialMode` / `initialSystemLocale` değerini üretir → **hidrasyon uyuşmazlığı yok**.
  - Hidrasyondan sonra istemci anlık görüntüsü devreye girer (`localStorage` birincil kaynak kalır) ve `AppShell` yalnız o zaman yeniden render olur (K2).
- `locale = mode === 'system' ? systemLocale : mode`; `systemLocale` sunucudan `Accept-Language` tahminiyle gelir, istemcide `languagechange` olayı ile canlı kalır.
- `setMode` üç yeri birlikte yazar: state + `localStorage` + **cookie** (`writeLocaleModeCookie`, tek yazım noktası) ve effect'i beklemeden `<html lang>`'ı günceller.
- Mount'ta `localStorage`'da kalmış tercih cookie'ye kopyalanır (eski ziyaretçinin bir sonraki isteği de doğru dilde SSR edilir).
- `localStorage` / `document.cookie` erişimi `try/catch` (private mode / cookie kapalı → oturum boyunca state yeterli).
- `useI18n()` provider dışında da çalışır: fallback değer döner, **hata fırlatmaz** (tek başına render edilen test bileşeni patlamasın).

---

## 3. Dosyalar

### 3.1 Çekirdek + sözlükler (`wc -l` ölçümü)

| Dosya | Satır |
|---|---|
| `src/lib/i18n/index.ts` | 174 |
| `src/lib/i18n/localeCookie.ts` | 26 |
| `src/lib/i18n/server.ts` | 46 |
| `src/providers/LocaleProvider.tsx` | 158 |
| `src/lib/i18n/messages/appointments.ts` | 256 |
| `src/lib/i18n/messages/categories.ts` | 236 |
| `src/lib/i18n/messages/common.ts` | 29 |
| `src/lib/i18n/messages/dashboard.ts` | 84 |
| `src/lib/i18n/messages/nav.ts` | 46 |
| `src/lib/i18n/messages/pages.ts` | 133 |
| `src/lib/i18n/messages/reviews.ts` | 233 |
| `src/lib/i18n/messages/salons.ts` | 326 |
| `src/lib/i18n/messages/settings.ts` | 105 |
| `src/lib/i18n/messages/shell.ts` | 31 |
| `src/lib/i18n/messages/ui.ts` | 111 |
| **`messages/*` toplam** | **1838** |

Her sözlük dosyası `{ tr, en }` çifti export eder ve başındaki yorumda hangi dosyaların bu namespace'i kullandığı yazar. Kural (sözlük yorumlarında yazılı): **`tr` bugünkü arayüz kopyasının birebir aynısı, `en` doğal İngilizce**.

### 3.2 Bağlantı noktaları

- `src/app/layout.tsx` (**85 satır**): `RootLayout` artık **async** sunucu bileşenidir; `readLocalePreferences()` ile cookie (mod) + `Accept-Language` (sistem dili) okur, `serverLocale(...)` sonucunu `<html lang>`'a ve `LocaleProvider`'ın `initialMode` / `initialSystemLocale` prop'larına verir. `LocaleProvider` `ThemeProvider`'ın **üstünde** sarar (`<LocaleProvider><ThemeProvider><AppShell>`), `<head>` içinde `themeInitScript`'ten sonra `localeInitScript` çalışır. Script artık **localStorage → cookie → `system`** sırasıyla okur (sunucu cookie'yi, istemci localStorage'ı birincil sayar; iki yol aynı sonuca varır), `tr|en|system` dışı değeri `system` sayar, `system` ise `navigator.language` küçültülmüş hali `tr` veya `tr-*` ise `tr` değilse `en` olarak `<html lang>`'ı **ilk boyamadan önce** yazar. `suppressHydrationWarning` korunur (script'in `lang` yazımı React'in hidrasyon kontrolüne takılmasın).
- Orta katman `labelKey` taşır, çeviriyi sayfa basar: `src/lib/nav.ts` (`NAV_ITEMS[].labelKey`, 9 adet), `src/lib/salonsQuery.ts`, `appointmentsQuery.ts`, `reviewsQuery.ts`, `categoriesQuery.ts` (filtre/etiket anahtarları) ve `src/components/ui/Badge.tsx` durum haritaları (`USER_ROLE`, `APPOINTMENT_STATUS`, salon durumları → `{ labelKey, tone }`). Böylece saf modüller dile bağlı metin taşımaz.
- `useI18n` import eden dosya sayısı (ölçüm): `grep -rl "providers/LocaleProvider" src | wc -l` → **32**; bu 32'nin biri `src/lib/i18n/index.ts` (yalnız yorum metni) → **fiili 31 dosya**.

---

## 4. Namespace'ler ve sayfa eşlemesi

| Namespace | Sahip olduğu ekran/bileşen |
|---|---|
| `common` | ekranlar arası ortak eylem/durum metinleri (`common.ts`, 29 satır) |
| `nav` | gezinme öğeleri + gezinme bölgelerinin erişilebilirlik adları (`src/lib/nav.ts` besler) |
| `shell` | kabuk: marka, oturum, tema metinleri (`SideRail`, `MobileDrawer`, `BottomPillNav`, `AppShell`) |
| `settings` | Ayarlar sayfasının bölüm ve alan etiketleri (Dil kartı dahil) |
| `dashboard` | Panel sayfası (`src/app/page.tsx`): hero, istatistik kartları, grafik başlıkları, yorum listesi |
| `pages` | Giriş (`login`) + Kullanıcılar (`users`) ekranlarının tüm görünen metinleri |
| `salons` | Salon Yönetimi + `components/salons/*` + `SalonCard` + `salonsQuery` anahtarları |
| `appointments` | Randevu Yönetimi + `AppointmentActions`, `AppointmentDetailDialog` |
| `categories` | Kategori Yönetimi + `VideoField` + `categoriesQuery` `labelKey`'leri |
| `reviews` | Yorum Yönetimi + `ReviewActions`, `ReviewDetailDialog`, `Stars` |
| `ui` | `components/ui/*` bileşenlerinin **kendi** sabit metinleri (prop ile gelen metinler burada değil) |

---

## 5. Çevrilmiş kapsam (ölçüm — uydurma değil)

`literal` = `grep -o "t([\"'][a-z]" <dosya> | wc -l` (doğrudan anahtarla çağrı), `dynamic` = `grep -o "t([a-z(]" <dosya> | wc -l` (`t(labelKey)` gibi değişkenden çağrı). Aşağıdaki tüm sayılar bu oturumda üretilmiştir.

| Dosya | literal | dynamic |
|---|---|---|
| `src/app/settings/page.tsx` | 33 | 0 |
| `src/app/page.tsx` (Panel) | 30 | 0 |
| `src/app/login/page.tsx` | 12 | 0 |
| `src/app/users/page.tsx` | 24 | 0 |
| `src/app/salons/page.tsx` | 42 | 12 |
| `src/app/appointments/page.tsx` | 38 | 13 |
| `src/app/categories/page.tsx` | 62 | 11 |
| `src/app/reviews/page.tsx` | 44 | 21 |
| `src/components/shell/SideRail.tsx` | 7 | 0 |
| `src/components/shell/BottomPillNav.tsx` | 2 | 0 |
| `src/components/shell/MobileDrawer.tsx` | 6 | 0 |
| `src/components/shell/AppShell.tsx` | 2 | 0 |
| `src/components/ui/Badge.tsx` | 0 (2 `labelKey` alanı, `t(labelKey)` ile basılır) | — |
| `src/components/ui/Pagination.tsx` | 6 | 0 |
| `src/components/ui/FilterChips.tsx` | 4 | 0 |
| `src/components/ui/FilterBar.tsx` | 1 | 0 |
| `src/components/ui/Dialog.tsx` | 2 | 0 |
| `src/components/ui/DataTable.tsx` | 1 | 0 |
| `src/components/ui/States.tsx` | 3 | 0 |
| `src/components/ui/SalonCard.tsx` | 2 | 0 |
| `src/components/salons/ImageField.tsx` | 13 (anahtarların 12'si `salons.*`) | 0 |
| `src/components/salons/SalonEditDialog.tsx` | 37 | 0 |
| `src/components/salons/SalonActions.tsx` | 4 | 0 |
| `src/components/salons/WorkingHoursEditor.tsx` | 8 | 0 |
| `src/components/appointments/AppointmentDetailDialog.tsx` | 18 | 0 |
| `src/components/appointments/AppointmentActions.tsx` | 5 | 0 |
| `src/components/reviews/ReviewActions.tsx` | 6 | 0 |
| `src/components/reviews/ReviewDetailDialog.tsx` | 12 | 0 |
| `src/components/reviews/Stars.tsx` | 1 | 0 |
| `src/components/categories/VideoField.tsx` | 12 (tümü `categories.videoField.*`) | 0 |

**Not (paylaşılan taşıyıcı bileşen):** `src/components/salons/ImageField.tsx` hem salon düzenleme diyaloğunda (`components/salons/SalonEditDialog.tsx`) hem kategori sayfasında (`src/app/categories/page.tsx`) kullanılıyor — ölçüm: `grep -rln "ImageField" src/app src/components` → `src/app/categories/page.tsx`, `src/components/salons/SalonEditDialog.tsx`. Bu yüzden görsel alanının metinleri `categories.*` değil **`salons.*`** namespace'inden gelir (12 çağrının tamamı); kategori tarafına özel bir `imageField.*` namespace'i yok. Yeni bir taşıyıcı bileşen eklerken aynı kural: metin ya `common`/`ui`'a ya da onu ilk doğuran ekranın namespace'ine yazılır.

---

## 6. Davranış sözleşmesi

**Öncelik sırası (kesin):**

```
1. localStorage['app_locale_mode']        → kullanıcının bu tarayıcıdaki seçimi (en yetkili)
2. sunucu `language` (GET /settings)      → YALNIZ yerel tercih yokken uygulanır
3. sistem dili (navigator.language)       → 'tr' veya 'tr-*' → tr, diğer/boş → en
```

- Ayarlar sayfasında sunucu değeri **bir kez** ve `readStoredLocaleMode() === null` ise uygulanır (`src/app/settings/page.tsx` yükleme effect'i; `setMode` ref üzerinden okunur ki dil değişimi formu sıfırlamasın).
- Mod değişimi anında etkilidir: `setMode` state'i, `localStorage`'ı ve `<html lang>`'ı aynı turda yazar; sayfa yenileme gerektirmez.
- Kayıt yoksa ilk render `system` kabul edilir, `system` modunda sunucu dili `Accept-Language`'dan tahmin edilir; `localeInitScript` yalnız `<html lang>`'ı doğru yazar. Sunucu HTML'i **ziyaretçinin dilinde** üretilir (cookie + `Accept-Language`), böylece ilk boyamada dil atlaması (flash) oluşmaz (K2 kapandı).
- Tercih yalnız panelde tutulur; `language` API ayarı **genel bir panel tercihi** olarak `settings` satırında saklanır, kullanıcı bazlı değildir (`Setting` anahtar/değer tablosu).

---

## 7. Ayarlar > Dil kartı ve API `language` alanı

**Panel:** Ayarlar sayfasında `settings.sections.language` başlıklı kart, `settings.fields.language` etiketli `Select` (`id="language"`), üç seçenek: `settings.fields.languageSystem` / `languageTr` / `languageEn`. Seçim `setMode(mode)` ile anında uygulanır ve kaydetmede `PUT /settings` gövdesine `language: mode` olarak girer.

**API (`apps/api`):**

| Uç | Davranış | Kanıt |
|---|---|---|
| `GET /api/v1/settings` | `language` anahtarı `DEFAULTS`'ta `'system'` ile döner (DB'de satır yoksa varsayılan) | `src/controllers/settings.controller.js:16`, `:23-31` |
| `PUT /api/v1/settings` | `language` **zorunlu değil**; gelirse `ALLOWED_LANGUAGES = ['tr','en','system']` dışındaysa `400` + `Geçersiz dil; 'tr', 'en' veya 'system' olmalı`, hiçbir alan yazılmaz | `settings.controller.js:19`, `:39-49` |
| Route'lar | `GET /` ve `PUT /` (auth/role middleware arkasında, mevcut settings route'ları) | `src/routes/settings.routes.js:7-8`, `src/routes/index.js:40` |

**API testleri** (`apps/api/tests/settings.test.js`, 9 `it()`; `language` ile ilgili 3'ü): `language varsayılanı system döner` (`:50`), `language güncellenir ve geri okunur` (`:105`), `geçersiz language 400 döner, değer değişmez` (`:120`).

---

## 8. Test stratejisi (mevcut dosyalar)

Panel testleri i18n'i **iki katmanda** kilitler (`apps/admin_panel/tests/lib/`):

| Test dosyası | Ne kilitler |
|---|---|
| `i18n.test.ts` | dil algılama, mod ayrıştırma/çözümleme, nokta yolu çevirisi, yer tutucu, eksik anahtar davranışı ve **tr/en anahtar parity'si** (`MESSAGES` ağacı düzleştirilerek; 17 `it()`/`test()`) |
| `i18nCookie.test.ts` (**8 test**, K2) | `localeModeCookie` tam nitelik metni, `LOCALE_COOKIE_NAME` = localStorage anahtarı, `normalizeLocaleMode` (geçerli/geçersiz/boş/kırpma), `detectSystemLocaleFromAcceptLanguage` (tr-\*, desteklenmeyen dil, **`q` ağırlığı sıralaması**, bozuk giriş) |
| `pagesMessages.test.ts`, `appointmentsMessages.test.ts`, `reviewsMessages.test.ts`, `categoriesMessages.test.ts`, `uiMessages.test.ts` | (a) namespace bazında tr/en anahtar eşitliği, (b) ilgili sayfa dosyasında **grep** ile bulunan `ns.*` anahtarlarının sözlükte gerçekten var olması, (c) `tr` kopyasının bugünkü sayfa metniyle birebir aynı kalması |

Parity testi olmasaydı tek dile eklenen bir metin arayüzde ham anahtar (`reviews.card.salonReply`) olarak görünürdü. Yeni metin eklerken kural: **tr ve en aynı commit'te**, sonra ilgili `*Messages.test.ts` anahtar grep'ini genişlet.

K2'nin (`tests/unit`, jsdom) kanıt dosyaları:

| Test dosyası | Ne kilitler |
|---|---|
| `tests/unit/lib/localeServer.test.tsx` (**6 test**) | `next/headers` mock'u ile `readLocalePreferences` / `serverLocale`: cookie `tr` → SSR dili `tr`, cookie `en` → `tr` tarayıcıda bile `en`, **cookie yok → varsayılan `system` + dil `Accept-Language`'dan**, cookie yok ve başlık yok → `system`/`en`, **geçersiz cookie (`klingon`) → varsayılan**, cookie `system` → mod korunur |
| `tests/unit/providers/LocaleProvider.cookie.test.tsx` (**5 test**) | `setMode` cookie'yi **tam nitelik metniyle** yazar (`path`/`max-age`/`samesite`), mount'ta localStorage tercihi cookie'ye eşitlenir, localStorage boşken gereksiz yazım olmaz, **hidrasyonda uyuşmazlık yok** (`hydrateRoot` + `onRecoverableError` boş dizi; negatif kontrol: sunucu anlık görüntüsü `readStoredMode` yapıldığında test kırmızıya düşer), sunucu `system` + `Accept-Language` `tr` iken ilk render Türkçe kalır |

---

## 9. Doğrulama kapıları

| Kapı | Komut | Durum |
|---|---|---|
| Tip kontrolü | `cd apps/admin_panel && npm run typecheck` | **K2 oturumunda koşuldu:** `tsc --noEmit` çıktısız (exit 0) |
| Lint | `cd apps/admin_panel && npm run lint` | **K2 oturumunda koşuldu:** `eslint` çıktısız — 0 hata, 0 uyarı (exit 0) |
| Test | `cd apps/admin_panel && npm test` (`test:node` + `test:unit`) | **K2 oturumunda koşuldu:** 188 node (`pass 188 / fail 0`) + 300 vitest (37 dosya, `Tests 300 passed`) — önce 180 + 289 |
| Build | `cd apps/admin_panel && npm run build` | **K2 oturumunda koşuldu:** exit 0; rota tablosu 9/9 `ƒ (Dynamic)` (önce 9/9 `○ Static`) — §10.1 |
| API | `cd apps/api && npm test` (`tests/settings.test.js` `language` vakaları) | bu iş `apps/api`'ye dokunmadı; K2 oturumunda yeniden koşulmadı |

Plan yazımında bu oturumda yeniden ölçüm yalnız `wc -l` / `grep` sayaçları ve panel `typecheck` + `lint` için yapıldı; test/build sayıları için uydurma sayı yerine "üst görev raporlarında yeşil" denildi. Not: ortak worktree'de i18n işinin kendisi de hâlâ commit'lenmemiş durumda (`git status`te `src/lib/i18n/`, `src/providers/LocaleProvider.tsx`, `tests/lib/*Messages.test.ts` untracked); bu yüzden test/build sayıları commit'lenmiş bir ağaca değil, görev raporlarına atıftır.

---

## 10. Kalan işler
| # | İş | Kanıt / not |
|---|---|---|
| K1 | **KAPATILDI (2026-11-01) — Tarih/para biçimlendirme aktif `locale`'e bağlandı** | Biçimlendirici kullanan **6 dosya, 9 `Intl`/`toLocaleDateString` çağrısı (+ 1 yorum)** içindeki sabit `'tr-TR'` kaldırıldı; yardımcılar `locale: Locale = 'tr'` parametresi alır, bileşenler `useI18n().locale` değerini iletir: `src/app/page.tsx:37,44` · `src/app/appointments/page.tsx:125,129` · `src/app/reviews/page.tsx:96` · `src/app/users/page.tsx:46` · `src/components/appointments/AppointmentDetailDialog.tsx:36,53` · `src/components/reviews/ReviewDetailDialog.tsx:34,38`. `grep -rn "tr-TR" src` çıktısı **11 → 1** eşleşmeye indi (kalan tek eşleşme `src/lib/i18n/index.ts:72` içindeki `detectSystemLocale` JSDoc yorumudur). `tr`/`en` biçimlendirme farkı `tests/unit/pages/{dashboard,users,appointments,reviews}.test.tsx` ve `tests/unit/components/{AppointmentDetailDialog,ReviewDetailDialog}.test.tsx` ile kilitlendi |
| K2 | **KAPATILDI (2026-11-02) — Cookie tabanlı `initialMode`: SSR ilk boyamada doğru dil** | `setMode` modu `app_locale_mode=<mode>; path=/; max-age=31536000; samesite=lax` cookie'sine de yazar (`src/lib/i18n/localeCookie.ts`, tek yazım noktası); kök layout (`src/app/layout.tsx`, async) `readLocalePreferences()` ile cookie'yi okur ve `LocaleProvider`'a `initialMode` verir, `system` modu için `Accept-Language` tahmini `initialSystemLocale` olarak geçer. Hidrasyon uyumu `useSyncExternalStore` sunucu anlık görüntüsü (`null`) ile sağlanır: ilk render sunucu değeri, `localStorage` farkı hidrasyon sonrası uygulanır; `localeInitScript` kaynak sırası **localStorage → cookie → `system`** olacak şekilde genişletildi (strateji bozulmadı). Testler: `tests/lib/i18nCookie.test.ts` (8 node testi), `tests/unit/lib/localeServer.test.tsx` (6), `tests/unit/providers/LocaleProvider.cookie.test.tsx` (5, hidrasyon negatif kontrolü dahil) → panel test toplamı **180 node + 289 vitest → 188 node + 300 vitest**. **Mimari bedel §10.1'de ölçülü** |
| K3 | **API'den gelen enum/rol adları sayfa içi haritalarla lokalize ediliyor** — yeni bir rol/durum/enum değeri eklenirse bu haritalar güncellenmezse arayüzde ham değer görünür: `src/components/ui/Badge.tsx` (`USER_ROLE`, `APPOINTMENT_STATUS`, salon durum map'leri `:55-62`), `src/app/users/page.tsx:53-57` (`ROLE_LABEL_KEYS`), `src/app/appointments/page.tsx:151` (`appointments.status.PENDING` vb.), `src/lib/*Query.ts` içindeki `labelKey` sözlükleri | Kural: API'e yeni enum değeri ekleyen PR, `ui.ts` veya ilgili namespace'e anahtar + `*Messages.test.ts` girdisi eklemeli |
| K4 | **Çoğul desteği yok** — `{count}` yer tutucusu var, dil bilgisi çekimi yok (`1 yorum` / `2 yorum` TR'de aynı, EN'de `comment/comments` farklı olmalı). Sayfa metinlerinde bu bugünkü kopyayla örtüşüyor; EN kopyasında toplu gözden geçirme gerekir | `src/lib/i18n/index.ts` `translate` yalnız `{var}` değiştirir |

### 10.1 Mimari karar — `cookies()` kök layout'ta (K2'nin bedeli)

**Sorun:** `cookies()` / `headers()` Next.js'in *request-time API*'leridir; kök layout'ta çağrılmaları rotayı [dinamik render](https://nextjs.org/docs/app/glossary#dynamic-rendering)'a çevirir. Bu, statik prerender sayısını değiştirir.

**Ölçüm (`cd apps/admin_panel && npm run build`, Next.js 16.4.3 Turbopack):**

| | Önce | Sonra |
|---|---|---|
| Rota tablosu | **9/9 `○ (Static)`** (`/`, `/_not-found`, `/appointments`, `/categories`, `/login`, `/reviews`, `/salons`, `/settings`, `/users`) | **9/9 `ƒ (Dynamic)`**; `○ (Static)` prerender **kalmadı** |
| Build sonucu | exit 0, compiled 862ms | exit 0, compiled 1949ms, hata/uyarı yok |
| `Generating static pages` | 11/11 | 11/11 (build çıktısı aynı sayıyı basıyor; rota tablosu dinamik) |

**Karar (koordinatör onayı, A seçeneği):** dinamik render **kabul edildi**. Gerekçe: (1) panel login arkasında ve tüm ekranlar client-fetch (`axios`) ile besleniyor — statik HTML'in CDN'de önbelleklenmesi bugünkü mimaride kullanılmıyor; (2) AP-011'in hedefi ilk boyamada dil flash'ını kapatmak, bu ancak sunucunun dili bilmesiyle mümkün; (3) build kırılmıyor, yalnız render stratejisi değişiyor; (4) `/login` gibi statik kalması anlamlı tek ekran da dil bağımlı olduğu için istisna yapılmadı.

**Reddedilen alternatifler:**

| Seçenek | Neden uygulanmadı |
|---|---|
| **B — layout `cookies()` okumasın, cookie yalnız istemcide (mount sonrası) uygulanır** | 9/9 rota Static kalırdı ama SSR HTML'i yine varsayılan dilde üretilir; hedef (flash'ın kapanması) karşılanmaz |
| **C — `cacheComponents` + `partialPrefetching` (PPR) ile statik shell + dinamik dil dilimi** | `next.config.ts` değişikliği gerektirir (bu işin sahiplik alanı dışında) ve tüm uygulamanın caching/navigation davranışını değiştirir; ayrıca `AppShell`'in tamamı dile bağımlı olduğu için statik shell neredeyse boş kalırdı |
| **D — `app/[locale]/...` + `generateStaticParams` + middleware rewrite** | Her rota taşınır (tüm sayfa dosyaları sahiplik alanı dışında), dil başına statik HTML verir; AP-011 kapsamı için orantısız refactor |

**Geri dönüş:** tek dosya — `src/app/layout.tsx`'te `await readLocalePreferences()` çağrısını ve `initialMode` / `initialSystemLocale` prop'larını kaldırmak; rota tablosu tekrar 9/9 static olur, davranış eski (flash'lı) hale döner. `src/lib/i18n/server.ts` ve cookie yazımı zararsız kalır (kullanılmaz).

---

## 11. Geri dönüş planı

- Migration yok; API tarafında tek kalıcı değişiklik `settings` tablosundaki `language` satırı (additive, varsayılanı `system`). Geri dönüş: `PUT /settings {"language":"system"}` veya satırı silmek.
- Panel tarafı yoğunlaşmış: çekirdek iki dosya (`src/lib/i18n/index.ts`, `src/providers/LocaleProvider.tsx`) + `src/lib/i18n/localeCookie.ts` + `src/lib/i18n/server.ts` + 11 sözlük dosyası. Sayfalar `t()` çağrıları dağıldığı için tam geri dönüş dosya bazlı revert ister; en ucuz geri alma `LocaleProvider`'ı sabit `tr` sözlüğüne bağlamak (davranış bugünkü kopyayla birebir aynı, çünkü `tr` metinleri eski kopyanın aynısıdır).
- K2 (cookie/SSR): `layout.tsx`'teki `await readLocalePreferences()` + iki prop kaldırılınca rota tablosu tekrar tamamen statik olur (§10.1).
- Commit'ler pathspec'li olmalı: ortak worktree'de `git add -A` kullanılmaz (AP-007 R9).

---

## 12. Diğer planlarla ilişki

- AP-007/AP-008/AP-009/AP-010'un filtre, chip ve İşlemler metinleri bu planın `salons.*`, `appointments.*`, `categories.*`, `reviews.*`, `ui.*` namespace'lerinde durur; `*Query.ts` modülleri `labelKey` üretir, çeviriyi sayfa basar.
- `docs/ADMIN-PANEL.md` içindeki **Dil sistemi (i18n)** bölümü bu planın özetidir; ayrıntı gerektiğinde bu dosyaya bağlantı verilir.
