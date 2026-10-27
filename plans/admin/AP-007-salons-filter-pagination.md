# AP-007 — Salon Yönetimi: tek satır filtre çubuğu, chip'ler, sayfalama (20/50/100) ve İşlemler kolonu

**Durum:** PLAN — uygulanmadı · **Tarih:** 2026-10-27 · **Rev. 2 (2026-10-27):** S1–S6 yanıtları işlendi (Düzenle yeter, menü yok; şehir/puan/sıralama dahil; hard delete yok; modal; diğer sayfalar kapsam dışı; düzenleme formu tam kapsam) · **Hedef uygulamalar:** `apps/admin_panel`, `apps/api`
**Tetikleyen istek:** "filtreleme sistemini geliştirelim ve filtreler tek satırda sığsın, filtrelenenler için chip'ler çıkartalım, temizle tuşu, sayfalama 20'den başlasın 50/100 gibi, işlemlere düzenle ve sistemi de koyalım"

---

## 1. Bugünkü durum (koddan okundu, ölçüm değil — dosya:satır kanıtlı)

| # | Bulgu | Kanıt |
|---|---|---|
| B1 | **Filtreler üç ayrı satırda**: arama `Input`, durum `Tabs`, görünüm `Tabs` dikey yığılmış (`flex flex-col gap-3`) | `apps/admin_panel/src/app/salons/page.tsx:305-337` |
| B2 | **Arama ve durum filtresi yalnız o anki 10 satırda çalışıyor.** `filtered` memo, sunucudan gelen sayfayı (`salons`) filtreliyor; sunucuya `search`/`status` gitmiyor → 12 salonun 2'si "Onaylı" ise 2. sayfada filtre boş görünür | `page.tsx:181-193` (client-side `filter`), `page.tsx:112-121` (istekte yalnız `page`+`limit`) |
| B3 | **Sekme sayaçları sayfa-lokal**: `counts` `salons` dizisinden hesaplanıyor; başlıktaki "0 onay bekliyor" ile sekmelerdeki sayı farklı kaynaklardan | `page.tsx:195-203`, `page.tsx:343-346` |
| B4 | **Sayfa boyutu sabit 10**, seçici yok; `Pagination` yalnız "Sayfa x / y" + ‹ › | `page.tsx:61`, `components/ui/Pagination.tsx:20-47` |
| B5 | **İşlemler kolonunda yalnız durum aksiyonları var** (Onayla / Pasife al / Etkinleştir); düzenleme yok; pasife alma onaysız çalışıyor | `page.tsx:205-249`, `page.tsx:281-289` |
| B6 | **API `GET /admin/salons` yalnız `page`, `limit`, `verified` destekliyor**; `search`, `status`, `city`, `district`, `minRating`, sıralama yok; global sayaç dönmüyor | `apps/api/src/controllers/admin.controller.js:135-152` |
| B7 | **Admin route'larında hiç query validasyonu yok** (public `GET /salons` validator'lı, admin değil) | `apps/api/src/routes/admin.routes.js:9`, karşılaştır: `src/routes/salon.routes.js:11` |
| B8 | `limit` üst sınırı 100, varsayılan 20 → 20/50/100 seçenekleri sözleşmeye uygun, ek API değişikliği gerekmez | `apps/api/src/utils/helpers.js:17-21` |
| B9 | `PATCH /salons/:id` (ADMIN dahil) **validasyonsuz**, gövde olduğu gibi `salon.update()`'e gidiyor (yalnız e-posta alanları çıkarılıyor) | `apps/api/src/routes/salon.routes.js:18`, `src/controllers/salon.controller.js:141-158` |

> B2/B3 bugün kullanıcıya yanlış bilgi veriyor: 12 salonun olduğu listede "Onaylı" sekmesine basınca yalnız eldeki 10 satır taranıyor. AP-007'nin asıl kazancı görsel değil, **filtrelerin sunucuya taşınması**.

---

## 2. Hedefler ve kabul ölçütleri

| Hedef | Ölçülebilir kabul |
|---|---|
| H1 Filtreler tek satır | ≥1024px viewport'ta filtre çubuğundaki tüm kontrollerin `offsetTop` değeri **tek değer** (tek satır); çubuk yüksekliği ≤ 56px. 390px'te yatay taşma yok (`scrollWidth <= clientWidth`) |
| H2 Chip'ler | Etkin her filtre için bir chip; chip'e basınca o filtre kalkar; "Temizle" hepsini sıfırlar ve `sayfa=1`'e döner; chip listesi `aria-live="polite"` ile duyurulur |
| H3 Sayfalama 20/50/100 | Varsayılan **20**; seçenekler 20/50/100; "21–40 / 87" aralık metni; sayfa boyutu değişince `page=1`; seçim `localStorage`'da hatırlanır |
| H4 Sunucu tarafı filtre | `search`, `status`, `city`, `minRating`, `sort` sunucuda uygulanır; panelde hiçbir filtre client-side dilimleme yapmaz |
| H5 Doğru sayaçlar | Sekme sayaçları ve başlık **global** (`meta.counts`); `counts.tümü === meta.total` (filtresiz) |
| H6 İşlemler | Her satırda **Düzenle** + durum aksiyonu (Onayla / Pasife al / Etkinleştir); Düzenle modal açar, kaydedince satır güncellenir; yıkıcı aksiyon (Pasife al) onay diyaloğu ister; kart modunda aynı aksiyonlar |
| H7 Paylaşılabilir durum | Filtre+sayfa URL'de (`?q=&durum=&sehir=&puan=&sayfa=&limit=&sirala=&gorunum=`); yenileme/paylaşım aynı görünümü açar; eski `?filter=bekliyor` deep-link'i çalışmaya devam eder |
| H8 Regresyon yok | `apps/api` 291 test + `apps/admin_panel` 156 test yeşil; typecheck/lint/build temiz; mevcut 4 sayfa (users/appointments/reviews) `Pagination` API'si değişmediği için dokunulmadan çalışır |

---

## 3. Kararlar (uygulamadan önce onay)

| # | Karar | Gerekçe |
|---|---|---|
| D1 | **Filtre seti:** arama, durum (segment), şehir (select), min puan (select), sayfa boyutu, görünüm toggle — hepsi tek satırda | "Filtreleme sistemini geliştirelim" + chip'lerin anlamlı olması için birden fazla filtre tipi gerekir |
| D2 | **Sunucu tarafı filtreleme** (client-side `filtered` memo kaldırılır) | B2: bugün yanlış sonuç veriyor; 100'lük sayfa boyutunda client-side filtre 100'le sınırlı kalırdı |
| D3 | **Global sayaçlar `meta.counts` içinde tek cevapta** | B3; ayrı `/facets` endpoint'i fazladan tur demek |
| D4 | **`Pagination` geriye uyumlu genişletilir** (`pageSize`, `onPageSize`, `total`, `pageSizeOptions` opsiyonel) | 4 sayfa paylaşıyor; zorunlu prop kırmak AP-001/AP-004 testlerini bozar |
| D5 | **İşlemler = mevcut durum aksiyonları + `Düzenle` butonu.** `⋯` menüsü **yok** ("sistem" yazım hatasıydı — kullanıcı onayı 2026-10-27) | Mevcut Onayla/Pasife al/Etkinleştir butonları korunur; yanlarına Düzenle eklenir. Yeni `Menu` primitifi gerekmez → W2 hafifler |
| D6 | **Düzenleme = modal (`Dialog`)**, ayrı sayfa değil (kullanıcı onayladı) | `Dialog` primitifi var (`components/ui/Dialog.tsx`), sayfa açmak router+form+test yükünü ikiye katlar |
| D7 | **API değişiklikleri additive**; `verified` parametresi korunur, `status` yeni parametre | Eski panel/istemciler kırılmaz; geri dönüş kolay |
| D8 | **Arama debounce 300ms + `AbortController` ile eski cevabı iptal** | Sunucu tarafı aramada her tuşta istek atmamak ve geç gelen cevabın yeni filtreyi ezmemesi için |
| D9 | **Sıralama** (`sirala=createdAt|name|rating`) kapsama dahil, UI'da tek `Select` | Sunucu zaten `order` veriyor; filtre çubuğunda tek kontrol maliyeti, listeyi gerçekten kullanışlı yapar |
| D10 | **Düzenleme formu tam kapsam** (kullanıcı onayı): temel bilgiler + `address`/`city`/`district` + `latitude`/`longitude` + `workingHours` (7 gün, açık/kapalı + saat) + `logoUrl`/`coverImageUrl` + `galleryImages` | S6 "olsun" yanıtı. Görseller **mevcut `POST /upload/single|multiple`** ucuyla yüklenir (yeni API işi yok), ayrıca "URL yapıştır" alanı kalır |
| D11 | **Hard delete yok, diğer sayfalar kapsam dışı** (kullanıcı onayı) | S3/S5 yanıtları: pasife alma soft delete olarak kalır; filtre çubuğu yalnız `/salons` |

---

## 4. API sözleşmesi (`apps/api`)

### 4.1 `GET /api/v1/admin/salons` — genişletilmiş sorgu

| Parametre | Tip / kural | Varsayılan | Not |
|---|---|---|---|
| `page` | int ≥1 | 1 | mevcut `paginate()` |
| `limit` | int 1..100 | **20** | 20/50/100 UI'dan gelir |
| `search` | string ≤100 | — | `name`, `address`, `city`, `district`, `owner.fullName`, `owner.email` üzerinde case-insensitive LIKE |
| `status` | `onaylı`\|`bekliyor`\|`pasif` | — | türetilmiş durum (aşağıdaki eşleme) |
| `city` | string ≤60 | — | tam eşleşme (case-insensitive) |
| `district` | string ≤60 | — | opsiyonel, `city` ile birlikte |
| `minRating` | float 0..5 | — | `ratingAvg >= minRating` |
| `sort` | `createdAt`\|`name`\|`rating` | `createdAt` | |
| `order` | `asc`\|`desc` | `desc` | |
| `verified` | `true`\|`false` | — | **korunur** (geriye uyum) |

Durum eşlemesi (paneldeki `mapSalon` ile birebir):

```
onaylı   → isActive = true  AND isVerified = true
bekliyor → isActive = true  AND isVerified = false
pasif    → isActive = false
```

Yanıt `meta` alanı:

```json
"meta": {
  "total": 12, "page": 1, "limit": 20, "totalPages": 1,
  "counts": { "tümü": 12, "onaylı": 10, "bekliyor": 0, "pasif": 2 },
  "cities": ["Ankara", "İstanbul", "İzmir"]
}
```

Kurallar:
- `counts` **filtreden bağımsız** (global) hesaplanır; `counts.tümü` = filtresiz toplam.
- `cities` filtreden bağımsız distinct şehir listesi (select seçenekleri).
- `search` + `owner` ilişkisi: `include` içindeki `where` `count`'u bozar → `findAndCountAll({ distinct: true, subQuery: false })` ve sahip araması üst seviye `where` içinde `Op.or` + `'$owner.fullName$'` biçiminde. **Bu, planın en riskli teknik noktası** (SQLite + Sequelize 6); W1'in ilk işi bunu tek testle kanıtlamak.
- Geçersiz `status` / `sort` / `minRating` → `422` + alan hatası (`express-validator`).
- `limit>100` → 100'e kırpılır (mevcut `paginate` davranışı korunur, hata değil).

### 4.2 Yeni/dokunulan dosyalar (API)

| Dosya | Değişiklik | ~LOC |
|---|---|---|
| `src/controllers/admin.controller.js` | `getAllSalons` yeniden yazılır: filtre where kurucusu, `distinct/subQuery`, `counts` + `cities` için paralel sorgular, sıralama | ~110 |
| `src/validators/admin.validator.js` (**yeni**) | `adminSalonQueryValidator` (page/limit/search/status/city/district/minRating/sort/order/verified) | ~35 |
| `src/routes/admin.routes.js` | `/salons` route'una validator + `validate` eklenir | ~3 |
| `src/validators/salon.validator.js` | `updateSalonValidator` (D10 kapsamı: `name`, `phone`, `address`, `city`, `district`, `description`, `latitude`/`longitude` aralık, `workingHours` nesnesi — 7 gün, `HH:MM` + `open<close`, `logoUrl`/`coverImageUrl` string, `galleryImages` dizi ≤12, `isActive` boolean; **whitelist değil**, mevcut geçiş davranışı korunur) | ~55 |
| `src/routes/salon.routes.js` | `PATCH /:id`'ye `updateSalonValidator` eklenir (B9) | ~2 |
| `tests/admin.test.js` | yeni `describe`: 12 test (aşağıda) | ~200 |

### 4.3 API test listesi (kabul kanıtı)

1. `status=onaylı` → dönen her satır `isActive&&isVerified`; `meta.total` doğru.
2. `status=bekliyor`, `status=pasif` aynı şekilde.
3. `search` salon adında eşleşir.
4. `search` **sahip adında** eşleşir (B6'nın en kırılgan yeri; `count` doğru olmalı).
5. `search` adreste/şehirde eşleşir; büyük/küçük harf duyarsız.
6. `city` filtresi.
7. `minRating=4` → yalnız 4+ puanlılar.
8. `sort=name&order=asc` alfabetik; `sort=rating&order=desc` puana göre.
9. `limit=1000` → `meta.limit === 100` (kırpma), `limit=50` → 50 satır istenir.
10. `meta.counts.tümü === meta.total` (filtresiz istekte) ve `counts` toplamı = `counts.tümü`.
11. Geçersiz `status=xyz` → 422.
12. Geriye uyum: `verified=true` bugünkü sonucu verir; `search`+`status` birlikte AND'lenir.
13. `PATCH /salons/:id` (ADMIN) `workingHours` + `latitude/longitude` + `galleryImages` ile günceller; `workingHours` yanıtta nesne olarak döner (çift stringify tuzağı — `Salon.js:98-117` setter'ı).
14. `PATCH /salons/:id` geçersiz `workingHours` (`open>close`, `25:00`) → `422`.
15. Mevcut owner akışı: `salon.test.js`'teki PATCH senaryoları **değişmeden** geçer.

---

## 5. UI sözleşmesi (`apps/admin_panel`)

### 5.1 Yeni/yeniden yazılan bileşenler

| Bileşen | Sorumluluk | Not |
|---|---|---|
| `components/ui/FilterBar.tsx` (**yeni**) | Tek satır yerleşim kabuğu: `flex flex-wrap items-center gap-2 lg:flex-nowrap`; `leading` (arama, `flex-1 min-w-[12rem]`) ve `trailing` (select/toggle grubu) yuvaları | Sayfaya özel mantık yok, yalnız ölçü/dizilim |
| `components/ui/FilterChips.tsx` (**yeni**) | `chips: { key, label, onRemove }[]`, `onClearAll`, `clearLabel="Temizle"`, `aria-live` özet ("3 filtre etkin") | Chip = `rounded-pill border bg-surface` + `X` ikonu; `X` `aria-label="<filtre> filtresini kaldır"` |
| `components/ui/Pagination.tsx` (genişlet) | `pageSize?`, `pageSizeOptions?`, `onPageSize?`, `total?` → aralık metni ("21–40 / 87") + sayfa boyutu `Select`; mevcut prop'larla **birebir** çalışmaya devam eder | AP-001/AP-004 testleri kırılmamalı |
| `components/ui/Menu.tsx` | **Gerekmiyor** (D5: menü yok) | — |
| `components/salons/SalonEditDialog.tsx` (**yeni**) | `Dialog` + `Field`/`Input`/`Select`, 5 bölüm: **Temel** (`name`, `phone`, `description`), **Adres** (`address`, `city`, `district`), **Konum** (`latitude`, `longitude`), **Çalışma saatleri** (`WorkingHoursEditor`), **Görseller** (`ImageField` × logo/cover + galeri listesi); kaydet → `PATCH /salons/:id`; alan bazlı hata; başarıda satır güncellenir | `email` alanı **bilinçli yok** (OTP akışı: `salon.controller.js:151-153` e-posta alanlarını PATCH'te çıkarıyor) |
| `components/salons/WorkingHoursEditor.tsx` (**yeni**) | 7 gün × (kapalı anahtarı + `open`/`close` `time` input'ları); varsayılan `{open:'09:00', close:'18:00'}`; kapalı gün `workingHours`'a **yazılmaz** | Veri biçimi seed ile aynı: `{ monday: { open, close }, … }` (`apps/api/src/seeders/seed.js`) |
| `components/salons/ImageField.tsx` (**yeni**) | Dosya seç → `POST /upload/single` (`FormData`) → dönen `/uploads/<ad>` yolu; önizleme `API_ORIGIN + url`; "URL yapıştır" alternatifi; kaldır butonu | `uploadFile()` yardımcısı `src/lib/api.ts`'e eklenir (JSON `Content-Type` **göndermez**) |
| `components/salons/SalonActions.tsx` (**yeni**) | Tek kaynak satır aksiyonları: `Düzenle` + mevcut `Onayla` / `Pasife al` / `Etkinleştir`; tabloda ve kartta aynı | `DataTable.actions` ve `İşlem` kolonu aynı bileşeni kullanır (çift render yok) |

### 5.2 `src/app/salons/page.tsx` refactor

- `ITEMS_PER_PAGE = 10` → `DEFAULT_PAGE_SIZE = 20`, `PAGE_SIZE_OPTIONS = [20, 50, 100]`.
- Durum tek nesnede: `{ q, status, city, minRating, sort, order, page, limit, view }` (tek `useState`, `useReducer` değil — 8 alan için yeterli).
- URL eşlemesi `src/lib/salonsQuery.ts` (**yeni, saf fonksiyonlar**): `parseSalonsQuery(search)`, `buildSalonsQuery(state)`, `activeChips(state)`, `normalizeQuery(state)`. Saf olduğu için `tests/lib/` altında **ağsız `node:test`** ile test edilir (AP-002 kapısı).
- `fetchSalons`: `apiFetch(..., { signal })`, `useEffect` içinde `AbortController`; `[state]` değişince istek.
- `filtered` memo **silinir**; `rows = salons` doğrudan `DataTable`'a.
- `counts` state'ten değil `meta.counts`'tan gelir.
- Filtre değişimi `page=1`'e döner (tek yardımcı: `updateFilter(patch)`).
- Arama `300ms` debounce (yerel `useDebouncedValue` hook'u, `src/lib/useDebouncedValue.ts` — 20 satır).
- `?filter=bekliyor` eski deep-link'i `durum`'a alias'lanır (PageHeader'dan gelen link korunur).

### 5.3 Yerleşim (tek satır kuralı)

```
[ 🔍 Ara (flex-1) ] [ Durum: segment ] [ Şehir ▾ ] [ Puan ▾ ] [ Sırala ▾ ] [ 20 ▾ ] [ Tablo|Kartlar ]
[ Durum: Onaylı × ] [ Şehir: İstanbul × ] [ Arama: "kuaför" × ]   (3 filtre etkin)   [ Temizle ]
────────────────────────────────────────────────────────────────────────────────────────────────
tablo / kartlar
[ 1–20 / 87 ]                                                    [ 20 ▾ ]   ‹  1  2  3  ›
```

- `<lg`: çubuk `flex-wrap` ile 2 satıra düşebilir (390px'te 7 kontrol tek satıra sığmaz — bu bir kabul istisnası, H1'de "≥1024px" olarak yazıldı). Chip satırı her zaman yatay kaydırılır (`overflow-x-auto`, scrollbar gizli — `Tabs` deseniyle aynı).
- Durum seçici, mevcut `Tabs` bileşeninin kompakt varyantı (`size="sm"`) olarak kullanılır; sayaçlar `meta.counts`'tan beslenir.

### 5.4 İşlemler kolonu

| Aksiyon | Koşul | Davranış |
|---|---|---|
| **Düzenle** (`Pencil`, outline/sm) | her satır | `SalonEditDialog` (D10 tam form); kaydet → `PATCH /salons/:id` → satır güncellenir, modal kapanır, `aria-live` ile "Salon güncellendi" |
| Onayla | yalnız `bekliyor` | `PATCH /salons/:id/verify` (onay diyaloğu yok, geri alınabilir) |
| Pasife al | `onaylı`/`bekliyor` | **Onay `Dialog`'u** ("Salon pasife alınacak; mevcut randevular silinmez") → `DELETE /salons/:id` (soft) |
| Etkinleştir | yalnız `pasif` | `PATCH /salons/:id { isActive: true }` → durum `bekliyor` |

Kolondaki sıra: `Düzenle` (sabit, en solda) · durum aksiyonu (duruma göre tek buton). Üç buton aynı satırda görünmez → kolon genişliği artmaz.

Mobil: `İşlem` kolonu `mobile: false` kalır; kart modunda `SalonCard`'a aynı `SalonActions` verilir (bugünkü `actions` prop deseni korunur).

---

## 6. Fazlar, dosyalar, kabul ve doğrulama

### Faz W1 — API (bağımsız, ilk)
- **Dosyalar:** `admin.controller.js`, `validators/admin.validator.js` (yeni), `routes/admin.routes.js`, `validators/salon.validator.js`, `routes/salon.routes.js`, `tests/admin.test.js`
- **Kabul:** §4.3'teki 12 test yeşil; `curl` ile 3 örnek doğrulama (aşağıda).
- **Doğrulama:** `cd apps/api && npm test`
- **Kanıt (elle):**
  ```bash
  TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"admin@beautysalon.com","password":"Admin123!"}' | jq -r .data.accessToken)
  curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/salons?status=onaylı&limit=20' | jq '.meta'
  curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/salons?search=Fatma' | jq '.meta.total'
  ```

### Faz W2 — UI primitifleri (W1'den bağımsız, paralel)
- **Dosyalar:** `components/ui/FilterBar.tsx`, `FilterChips.tsx`, `Pagination.tsx` (genişlet), `components/salons/WorkingHoursEditor.tsx`, `ImageField.tsx`, `src/lib/api.ts` (`uploadFile` eklenir), `tests/unit/components/{FilterBar,FilterChips,Pagination,WorkingHoursEditor,ImageField}.test.tsx`
- **Kabul:** ~34 yeni bileşen testi; `Pagination` eski prop'larla eski davranışı verir (mevcut 8 test dokunulmadan geçer); `Menu` yok (D5).
- **Doğrulama:** `cd apps/admin_panel && npm run test:unit`

### Faz W3 — Sayfa + düzenleme diyaloğu (W2'ye bağımlı)
- **Dosyalar:** `app/salons/page.tsx` (refactor), `lib/salonsQuery.ts` (yeni), `lib/useDebouncedValue.ts` (yeni), `components/salons/SalonEditDialog.tsx`, `components/salons/SalonActions.tsx`, `tests/lib/salonsQuery.test.ts`, `tests/unit/pages/salons.test.tsx`, `tests/unit/components/SalonEditDialog.test.tsx`
- **Kabul:** H1–H7 ölçütleri; sayfa testi: filtre değişince `page=1`, `apiFetch` doğru query ile çağrılır, chip kaldırma/Temizle URL'i sıfırlar, sayfa boyutu `limit`'e yansır; dialog testi: `workingHours`/konum/görsel alanları `PATCH` gövdesine doğru biçimde girer, e-posta gövdeye **girmez**.
- **Doğrulama:** `cd apps/admin_panel && npm run typecheck && npm run lint && npm test`

### Faz W4 — Görsel doğrulama + doküman
- **Dosyalar:** `screenshots/_harness/plan-admin-salons-filters.js` (yeni, headless chromium), `docs/ADMIN-PANEL.md` (filtre/sayfalama bölümü), `README.md` (admin panel satırı: 156 → yeni test sayısı), `plans/admin/INDEX.md` (bu plan satırı)
- **Kabul:** harness çıktısı: 1440px'te filtre kontrollerinin `offsetTop` kümesi tek eleman; 390px'te `scrollWidth <= clientWidth`; ekran görüntüsü `screenshots/admin-salons-filters-{1440,390}.png`
- **Doğrulama:** `node screenshots/_harness/plan-admin-salons-filters.js && cd apps/admin_panel && npm run build`

---

## 7. Test planı (özet)

| Katman | Dosya | Adet (hedef) |
|---|---|---|
| API (mocha+chai) | `apps/api/tests/admin.test.js` | +12 |
| API — PATCH validasyonu | `apps/api/tests/salon.test.js` (mevcut dosyaya ek) | +3 |
| Panel — saf mantık (node:test, ağsız) | `tests/lib/salonsQuery.test.ts` | +14 |
| Panel — bileşen (vitest+jsdom) | `FilterBar`, `FilterChips`, `Pagination` (ek), `WorkingHoursEditor`, `ImageField`, `SalonEditDialog`, `SalonActions` | +42 |
| Panel — sayfa | `tests/unit/pages/salons.test.tsx` (`@/lib/api` mock) | +8 |
| Görsel | harness ölçümü (tek satır + taşma) | 2 ölçüm |

Beklenen toplam: **admin_panel 156 → ~220**, **api 291 → ~306**.

---

## 8. Riskler ve tuzaklar

| # | Risk | Önlem |
|---|---|---|
| R1 | Sequelize `include.where` + `findAndCountAll` → yanlış `count` (sahip aramasında) | `distinct: true, subQuery: false` + `'$owner.fullName$'`; W1'in **1 numaralı testi** bu |
| R2 | Filtre değişince sayfa 1'e dönmezse boş sayfa görünür | tek `updateFilter()` yardımcısı, sayfa sıfırlama orada; sayfa testi bunu kilitler |
| R3 | Debounce + yavaş cevap → eski sonuç yeni filtreyi ezer | `AbortController` + istek kimliği; iptal edilen istek `setSalons` çağırmaz |
| R4 | `Pagination`'a zorunlu prop eklemek 4 sayfayı kırar | tüm yeni prop'lar opsiyonel; mevcut testler değiştirilmez |
| R5 | Chip/Temizle URL'i güncellemezse geri tuşu tutarsız olur | tek kaynak: `state → URL` (`router.replace`, `scroll: false`) |
| R6 | Düzenleme modalında `workingHours` çift stringify / saat doğrulaması | `Salon.js:98-117` setter'ı JSON string de kabul ediyor → istemci **nesne** gönderir; API validator `HH:MM` + `open<close`; test 13/14 |
| R6b | Görsel yükleme `Content-Type: application/json` ile giderse multer reddeder | `uploadFile()` `FormData` kullanır, `apiFetch`'e eklenen yardımcı header **göndermez**; test: `fetch` çağrısında `Content-Type` yok |
| R7 | Pasife alma onaysız → yanlış tıklama | onay `Dialog`'u; test: iptal edilince `apiFetch` **çağrılmaz** |
| R8 | `PATCH /salons/:id` validasyonu owner akışını bozar | whitelist **değil**, yalnız tip/uzunluk; `npm test` (salon.test.js) kapı |
| R9 | Aynı worktree'de paralel worker'lar `git add -A` ile birbirinin dosyasını commit'ler | W1 ve W2 dosya kümeleri ayrık; commit'ler pathspec'li (`git commit -m ... -- <dosyalar>`) |
| R10 | ~~"Sistem" isteğinin farklı okunması~~ | **Kapandı** — kullanıcı: yazım hatasıydı, `Düzenle` yeterli (D5) |

---

## 9. Kararlar kapandı (kullanıcı yanıtları, 2026-10-27)

| # | Soru | Yanıt | Plana yansıması |
|---|---|---|---|
| S1 | "sistemi" ne demek? | **Yazım hatasıydı; `Düzenle` butonu yeterli** | `⋯` menüsü ve `Menu` primitifi plandan **çıkarıldı** (D5) |
| S2 | Şehir + min puan + sıralama? | **Evet, ekle** | D1/D9 aynen; chip'ler 4 tip (arama, durum, şehir, puan) |
| S3 | Kalıcı silme? | **Gerek yok** | Soft delete kalır; hard delete kapsam dışı |
| S4 | Modal mı sayfa mı? | **Modal yeterli** | D6 aynen |
| S5 | Diğer sayfalar? | **Gerek yok** | Yalnız `/salons`; `Pagination` yine geriye uyumlu genişletilir |
| S6 | `workingHours`/konum/görseller? | **Olsun** | D10: düzenleme formu tam kapsam + `WorkingHoursEditor`, `ImageField`, `uploadFile` (W2'ye taşındı) |

---

## 10. Kapsam dışı (bilinçli)

- Diğer 3 liste sayfasının filtre çubuğu (S5).
- Kalıcı silme (hard delete), toplu (bulk) işlem, CSV dışa aktarma (S3).
- Salon **detay sayfası** (`/salons/[id]`) ve salon **oluşturma** formu.
- E-posta/telefon değişikliği (OTP akışı) — düzenleme modalında bilinçli olarak yok.
- API'de `PATCH /salons/:id` için alan whitelist'i (güvenlik dilimi, AP-008 adayı).
- `apps/api` admin uçları için sayfalama dışı (appointments/reviews) filtre genişletmesi.

---

## 11. Geri dönüş planı

- Migration yok, veritabanı şeması değişmiyor → veri geri dönüşü gerekmez.
- API değişiklikleri **additive**: `status/search/city/minRating/sort/order` yoksa davranış bugünküyle aynı; `meta`'ya alan eklemek kırıcı değil. Bu yüzden API ve panel ayrı ayrı geri alınabilir.
- Panel tarafı: W2 primitifleri yeni dosyalar (silinmesi zararsız); W3 tek dosyada (`salons/page.tsx`) yoğunlaşır → `git revert <W3 commit>` yeterli.
- Commit disiplini: W1..W4 ayrı commit'ler, pathspec'li; `git reset --hard` kullanılmaz.

---

## 12. Uygulama sırası (worker dağıtımı için)

| Wave | Task | Model önerisi | Bağımlılık |
|---|---|---|---|
| 1 | W1 API filtre+sayaç+validasyon (D10 alanları dahil) | bulut (Sequelize incelikleri, R1) | — |
| 1 | W2 UI primitifleri (FilterBar, FilterChips, Pagination, WorkingHoursEditor, ImageField) + testler | yerel (mekanik, dosya başına ayrık) | — |
| 2 | W3 sayfa refactor + düzenleme modalı | bulut (URL state + debounce + abort + form) | W2 |
| 3 | W4 görsel ölçüm + doküman | yerel | W3 |

Doğrulama kapıları her wave sonunda: `cd apps/api && npm test` · `cd apps/admin_panel && npm run typecheck && npm run lint && npm test` · W4'te ek `npm run build`.
