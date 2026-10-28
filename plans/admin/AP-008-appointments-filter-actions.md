# AP-008 — Randevu Yönetimi: tek satır filtre çubuğu, chip'ler, sunucu tarafı filtreleme (20/50/100) ve İşlemler kolonu

**Durum:** UYGULANDI (2026-10-27) · **Tarih:** 2026-10-27 · **Hedef uygulamalar:** `apps/admin_panel`, `apps/api`
**Kanıt (özet):** Gerçek chromium ölçümü (`/appointments?durum=COMPLETED`, 9 satır) — 1440 ve 1280'de `singleRow true` (benzersiz dikey merkez **1**), `barHeight` **44px** (≤56), yatay taşma **0** (`scrollWidth = clientWidth`), `minSelectWidth` **175 / 140**, `selectsClipped false`; 390'da sarma (beklenen) ve taşma **0**. Kapılar: `apps/admin_panel` `npm run typecheck` temiz, `npm run lint` temiz, `npm test` **65 node + 218 vitest**; `apps/api` `npm test` **320 passing / 0 failing**; `~/.pi/agent/bin/verify.sh` (mod=full) **TAMAM**. Kanıt dosyaları: `screenshots/admin-appointments-filters-{1440,1280,390}.png` + harness `screenshots/_harness/plan-admin-appointments-filters.js`. Plan↔kod farkları: **§8**.
**Tetikleyen istek:** "admin panelde randevu yönetimi sayfasında detaylı bir filtreleme sistemi getirelim, filtreler tek satıra sığmalı, filtrelerin chip'leri altında olsun, İşlemler kolonu boş kalmış oraya da işlemler ekleyelim"

Bu plan AP-007 (`plans/admin/AP-007-salons-filter-pagination.md`) ile **aynı yapıdadır**: aynı filtre çubuğu/chip/sayfalama deseni randevu sayfasına taşınır, fark olarak filtre seti randevu alanlarına (salon, personel, tarih aralığı) uyarlanır ve İşlemler kolonu tamamlanır. Aşağıdaki **SÖZLEŞME** bölümleri (§A, §A2, §A3) birebir uygulandı; tek yapısal sapma durum filtresindedir (sekmeler yerine tek select — §8 S1).

---

## 1. Bugünkü durum (koddan okundu, ölçüm değil — dosya:satır kanıtlı)

| # | Bulgu | Kanıt |
|---|---|---|
| B1 | **Filtre olarak yalnız tek bir durum sekme şeridi var**; arama, salon, personel, tarih, sıralama kontrolü yok. Şerit 6 sabit öğe (`ALL` + 5 statü), sayaç (`count`) verilmiyor | `apps/admin_panel/src/app/appointments/page.tsx:58` (`useState<FilterTab>('ALL')`), `:206-221` (segment kontrolünün `items` dizisi) |
| B2 | **Sunucuya yalnız `page`, `limit`, `status` gidiyor.** `search`/`salonId`/`staffId`/`dateFrom`/`dateTo`/`sort`/`order` parametresi hiç üretilmiyor | `page.tsx:68-69` (`let url = ...page=&limit=` + `if (filter !== 'ALL') url += &status=`) |
| B3 | **`ITEMS_PER_PAGE = 10` sabit**, sayfa boyutu seçici yok; `Pagination`'a `total`/`pageSize`/`onPageSize` verilmiyor (aralık metni ve boyut select'i basılmıyor) | `page.tsx:37`, `page.tsx:237` (`<Pagination page={...} totalPages={...} onPage={...} />`) |
| B4 | **Chip yok.** Sayfada `FilterChips` import edilmiyor; etkin filtre özeti/Temizle yok | `page.tsx:1-14` import bloğu; `grep -n "FilterBar\|FilterChips\|salonsQuery\|useDebouncedValue" apps/admin_panel/src/app/appointments/page.tsx` → **0 eşleşme** |
| B5 | **URL state yok.** Filtre/sayfa URL'de taşınmıyor, yenileme/paylaşım aynı görünümü açmıyor (`useSearchParams`/`router.replace` yok) | `page.tsx:3` (`import { useCallback, useEffect, useState } from 'react'`) — `next/navigation` import'u yok |
| B6 | **İşlem kolonu COMPLETED / CANCELLED / NO_SHOW satırlarında tamamen boş.** `rowActions` yalnız `PENDING` ve `CONFIRMED` için buton üretiyor; terminal statüde hiçbir buton (Detay dahil) basılmıyor | `page.tsx:104-134` (`rowActions`), `:185-189` (`key: 'actions'` hücresi) |
| B7 | **`GET /admin/appointments` yalnız `status` + `page`/`limit` destekliyor**; arama/salon/personel/tarih/sıralama yok, `meta`'da `counts`/`salons`/`staff` yok (yalnız `total/page/limit/totalPages`) | `apps/api/src/controllers/admin.controller.js:225-248` — `:227` (`paginate`), `:229` (`if (req.query.status) where.status`), `:239` (`order: [['createdAt','DESC']]` sabit), `:244` (`paginatedResponse(rows, count, page, limit)`) |
| B8 | **`/appointments` route'unda query validator yok.** `/salons` satırında `adminSalonQueryValidator + validate` var, `/appointments` çıplak | `apps/api/src/routes/admin.routes.js:11` (salons) vs `:12` (appointments) |
| B9 | **Admin validator dosyasında randevu doğrulayıcısı yok** — yalnız `adminSalonQueryValidator` export ediliyor | `apps/api/src/validators/admin.validator.js:7-22`, `:24` (`module.exports = { adminSalonQueryValidator }`) |
| B10 | **AP-007 bileşenleri hazır ama randevu sayfasında kullanılmıyor** (yeniden kullanılacak): tek satır kabuk, chip listesi, URL↔API saf modülü, debounce hook'u | `apps/admin_panel/src/components/ui/FilterBar.tsx:22-53`, `components/ui/FilterChips.tsx:30-70`, `src/lib/salonsQuery.ts:87-226`, `src/lib/useDebouncedValue.ts:12-21`; tek kullanım yeri `src/app/salons/page.tsx:451` ve `:526` |
| B11 | **API terminal statüden geçişe izin vermiyor** → terminal satırlarda aksiyon butonu üretmek yanlış olur (400 döner) | `apps/api/src/controllers/appointment.controller.js:265-266` (terminal kontrolü), `:269-273` (`validTransitions` = PENDING→CONFIRMED/CANCELLED, CONFIRMED→COMPLETED/CANCELLED/NO_SHOW) |
| B12 | **`COMPLETED` geçişi ayrıca zaman korumalı**: randevu bitiş saati geçmemişse 400 | `appointment.controller.js:282-289` (`appointmentEnd > new Date()`) |
| B13 | `Pagination` **zaten** opsiyonel `total`/`pageSize`/`pageSizeOptions`/`onPageSize` alıyor → randevu sayfası bunları vermekle aralık metni + 20/50/100 select'i bedava kazanır | `apps/admin_panel/src/components/ui/Pagination.tsx:24-42` |
| B14 | `limit` üst sınırı 100, varsayılan 20 → 20/50/100 sözleşmeye uygun, ek API değişikliği gerekmiyor | `apps/api/src/utils/helpers.js:17-21` |
| B15 | `APPOINTMENT_STATUS` Türkçe etiket haritası hazır (chip etiketleri buradan üretilir) | `apps/admin_panel/src/components/ui/Badge.tsx:37-43` |

> **Asıl kazanç görsel değil:** bugün 10 satırlık sayfada yalnız durum filtresi var ve sunucuya tek parametre gidiyor; "Ayşe" araması, salon/personel daraltması ve tarih aralığı **hiç yapılamıyor**. B6 ise doğrudan kullanıcı şikâyeti: tamamlanmış/iptal/gelmedi satırlarında İşlem kolonu boş kalıyor.

> **Baseline notu:** Yukarıdaki tüm `dosya:satır` kanıtları planın yazıldığı andaki **`HEAD`** durumuna aittir (2026-10-27). Aynı worktree'de paralel bir worker W1'i (API) uygulamaya başlarsa `admin.controller.js` / `admin.validator.js` / `admin.routes.js` satır numaraları kayar; kanıtı yeniden doğrulamak için `git show HEAD:<dosya>` kullanın. Panel tarafı (`appointments/page.tsx`) W3'e kadar değişmez.

---

## 2. Hedefler ve kabul ölçütleri

| Hedef | Ölçülebilir kabul |
|---|---|
| **H1** Filtreler tek satır | ≥1280px viewport'ta filtre çubuğundaki **tüm kontrollerin benzersiz dikey merkez sayısı 1** ve dikey aralıklar kesişir (`max(top) < min(bottom)`); çubuk yüksekliği **≤56px**; yatay taşma yok (`scrollWidth <= clientWidth`). <1024px'te çubuk sarar (kabul istisnası, §5.2). **Ölçüldü (2026-10-27, gerçek chromium):** 1440 → merkez **1**, `barHeight` **44px**, `overflow 0` (1425 = 1425), `minSelectWidth` **175**; 1280 → merkez **1**, `barHeight` **44px**, `overflow 0` (945px çubuk), `minSelectWidth` **140**; 390 → sarma (4 satır, 200px), `overflow 0` |
| **H2** Chip'ler | Etkin her filtre için **bir chip**; chip'e basınca **yalnız o filtre** varsayılana döner ve `page=1` olur; "Temizle" **hepsini** sıfırlar ve `page=1`; chip listesi `aria-live="polite"` ile "N filtre etkin" özetini duyurur; 0 filtrede canlı bölge DOM'da kalır (boş metin) |
| **H3** İşlemler kolonu | **Her satırda en az bir buton**: en solda `Detay` (tüm statüler). `PENDING`'de ayrıca `Onayla`; `CONFIRMED`'de `Tamamla`/`Gelmedi`/`İptal`; `COMPLETED`/`CANCELLED`/`NO_SHOW`'da **yalnız `Detay`**. Boş İşlem hücresi sayısı = 0 (test: 5 statünün her biri için) |
| **H4** Sunucu tarafı filtreleme | `search`, `status`, `salonId`, `staffId`, `dateFrom`, `dateTo`, `sort`, `order` **sunucuda** uygulanır; panelde client-side dilimleme (`rows.filter(...)`) **yok**; sayfaya gelen `data.data` doğrudan `DataTable`'a gider |
| **H5** Doğru sayaçlar | Durum select seçenekleri `meta.counts`'tan beslenir (**global**, filtreden bağımsız; etiket biçimi `<Durum> (<sayac>)`); `counts["tümü"] === filtresiz meta.total`; `meta.salons`/`meta.staff` da filtrelerden bağımsız (select seçenekleri daralmaz) |
| **H6** Paylaşılabilir durum + sayfa boyutu | Filtre+sayfa+sıralama URL'de (`?q=&durum=&salon=&personel=&tarih=&sayfa=&limit=&sirala=`); yenileme/paylaşım aynı görünümü açar; eski `?filter=<status>` deep-link'i `durum`a alias'lanır; sayfa boyutu **20/50/100**, varsayılan **20**, seçim `localStorage`'da hatırlanır (`appointments_page_size`), boyut değişince `page=1` |
| **H7** Regresyon yok | `cd apps/api && npm test` yeşil (mevcut `admin.test.js:324` appointments describe'ı **değişmeden** geçer); `cd apps/admin_panel && npm run typecheck && npm run lint && npm test` yeşil; `Pagination` eski prop'larla eski davranışı verir (mevcut `Pagination.test.tsx` dokunulmadan geçer) |

---

## 3. Kararlar (uygulamadan önce onay)

| # | Karar | Gerekçe |
|---|---|---|
| **D1** | **Filtre seti:** arama (`Input`, `flex-1`), durum (`Select`, etiketinde sayaç — §8 S1), salon (`Select`), personel (`Select`), tarih preset (`Select`), sıralama (`Select`) — tek satırda. Sayfa boyutu seçici **`Pagination` içinde** (filtre çubuğunda değil) | "Detaylı filtreleme" isteği; 7. kontrol çubuğa eklenirse 1280px'te H1 riski (R1). B13: `Pagination` seçiciyi zaten destekliyor |
| **D2** | **Sunucu tarafı filtreleme**; panelde client-side filtre yok | B2/B7; 100'lük sayfa boyutunda client-side filtre 100 satırla sınırlı kalırdı (AP-007 D2 ile aynı gerekçe) |
| **D3** | **`counts` + `salons` + `staff` tek cevapta** (`meta` içinde), hepsi filtrelerden bağımsız | B7; ayrı `/facets` ucu fazladan tur + senkron riski demek. Select seçenekleri filtre uygulanınca daralmamalı |
| **D4** | **Tarih = tek preset `Select`** (`tümü/bugün/yarın/bu-hafta/bu-ay/geçmiş/gelecek`), iki ayrı `date` input **değil** | Tek satıra iki date input sığmaz; preset'ler gerçek kullanımı (bugün/yarın/bu hafta) tek tıkla karşılar. Serbest aralık gerekirse API `dateFrom`/`dateTo` hazır (kapsam dışı: özel aralık UI'ı) |
| **D5** | **Chip sırası sabit:** durum → salon → personel → tarih → arama; "Temizle" hepsini sıfırlar + `page=1` | AP-007 §5.2 deseniyle aynı; sıra `activeChips()` içinde **tek yerde** tanımlı, UI sırayı yeniden hesaplamaz |
| **D6** | **Terminal statüde yalnız `Detay`** | API `validTransitions` + terminal kontrolü (`appointment.controller.js:265-273`) başka geçişe izin vermiyor; buton basılsa 400 dönerdi |
| **D7** | **Yıkıcı/terminal geçişlerde onay `Dialog`'u**: `Tamamla`, `Gelmedi`, `İptal`. `Onayla` onaysız (geri alınabilir: CONFIRMED→CANCELLED serbest) | Yanlış tıklama maliyeti: `CANCELLED`/`NO_SHOW`/`COMPLETED` terminal, geri dönüşü yok |
| **D8** | **AP-007 bileşenleri yeniden kullanılır**, yeniden yazılmaz: `FilterBar`, `FilterChips`, `Pagination` (mevcut opsiyonel prop'lar), `useDebouncedValue`; `salonsQuery.ts` **deseni** kopyalanır → `appointmentsQuery.ts` | B10/B13; `FilterBar`/`FilterChips`/`Pagination` testleri (AP-007 W2) dokunulmadan geçer, iş yalnız sayfa + yeni lib'de |
| **D9** | **API değişiklikleri additive**: `status` parametresi **korunur** (aynı anlam), `meta`'ya alan **eklenir** | Eski panel/istemciler kırılmaz; API ve panel ayrı ayrı geri alınabilir (bkz. §7 Geri dönüş) |
| **D10** | **İşlem sırası sabit: `Detay` en solda** (outline, `Eye`), durum aksiyonları sağa doğru. Buton metni uçuş sırasında **değişmez**; `Loader2` + `disabled` ile geri bildirim | Kolon genişliği oynamasın, satır yüksekliği zıplamasın; AP-007 `SalonActions` deseniyle aynı |

### Varsayımlar (uygulamada varsayım olarak işaretlendi)

| # | Varsayım | Etkisi |
|---|---|---|
| V1 | Sayfa boyutu seçici `Pagination` içinde kalır (D1) | H1'de filtre çubuğu 6 kontrol; H6'daki `limit` davranışı `Pagination` üzerinden |
| V2 | `salon`/`personel` select seçenekleri `meta.salons`/`meta.staff` (global) | Filtre uygulanınca seçenek listesi daralmaz; seçili değer kaybolmaz |
| V3 | Arama `300ms` debounce + `AbortController` (AP-007 D8/R3 deseni) | Geç gelen cevap yeni filtreyi ezmez |
| V4 | `Detay` dialog'u **ağ isteği yapmaz**, satır verisiyle dolar | §A3 "ağ yok" şartı; ekstra endpoint gerekmez |
| V5 | Tarih preset'leri **yerel saat** ile `YYYY-MM-DD` üretir, `toISOString()` **kullanılmaz** | UTC kaydırması gün sınırını 1 gün kaydırırdı (§A2 kuralı) |

---

## 4. API sözleşmesi — §A (`apps/api`)

### 4.1 `GET /api/v1/admin/appointments` — genişletilmiş sorgu

| Parametre | Tip / kural | Varsayılan | Not |
|---|---|---|---|
| `page` | int ≥1 | 1 | mevcut `paginate()` (`helpers.js:17-21`) |
| `limit` | int 1..100 | **20** | 20/50/100 UI'dan gelir; `>100` **kırpılır**, hata değil |
| `search` | string ≤100 | — | `customer.fullName`, `customer.email`, `salon.name`, `staff.fullName`, `service.name` üzerinde **büyük/küçük harf duyarsız** LIKE |
| `status` | `PENDING`\|`CONFIRMED`\|`COMPLETED`\|`CANCELLED`\|`NO_SHOW` | — | **korunur** (geriye uyum, D9) |
| `salonId` | uuid | — | tam eşleşme |
| `staffId` | uuid | — | tam eşleşme |
| `dateFrom` | `YYYY-MM-DD` | — | `date >= dateFrom` |
| `dateTo` | `YYYY-MM-DD` | — | `date <= dateTo` |
| `sort` | `createdAt`\|`date` | `createdAt` | |
| `order` | `asc`\|`desc` | `desc` | |

Yanıt `meta` alanı (birebir):

```json
"meta": {
  "total": 87, "page": 1, "limit": 20, "totalPages": 5,
  "counts": {
    "tümü": 87, "PENDING": 12, "CONFIRMED": 21,
    "COMPLETED": 40, "CANCELLED": 9, "NO_SHOW": 5
  },
  "salons": [{ "id": "…uuid…", "name": "Güzellik Merkezi" }],
  "staff":  [{ "id": "…uuid…", "fullName": "Ayşe Yılmaz" }]
}
```

Kurallar:

- `counts`, `salons`, `staff` **filtrelerden bağımsız (global)** hesaplanır. `counts["tümü"]` = filtresiz toplam (`Appointment.count()`); `counts["tümü"] === meta.total` yalnız **filtresiz** istekte doğrudur (H5).
- `search`: `customer.fullName`, `customer.email`, `salon.name`, `staff.fullName`, `service.name` — hepsi `LOWER(kolon) LIKE %<term>%`. `$alias.col$` biçimi SQLite'ta alan adına çevrilmediği için **açık `LOWER(kolon)`** yazılır (AP-007 `getAllSalons` deseni, `admin.controller.js:167-185`).
- **Include tuzağı ve çözümü:** `search` koşulu include'ların içine değil **üst seviye `where`**'e yazılır; `findAndCountAll` bu durumda `count`'u bozabildiği için `distinct: true, subQuery: false` verilir. Randevu include'ları **hepsi `belongsTo`** (`customer`, `salon`, `staff`, `service` — `models/index.js:36-47`), yani **satır çoğalmaz**; `distinct: true` yine de korunur (join'li `count` + `$alias.col$` kombinasyonu için tek güvenli biçim).
- `sort=date` → `ORDER BY date <dir>, startTime ASC`; `sort=createdAt` → `ORDER BY createdAt <dir>`.
- Tarih filtresi `DATEONLY` kolon üzerinde: `dateFrom`/`dateTo` birlikte `Op.between`, tek başına `Op.gte`/`Op.lte` (`Appointment.js:26-31`).
- **Geçersiz parametre → `400`** (`express-validator` + `validate` middleware; `apps/api/src/middlewares/validate.js:7`). **`limit>100` → 100'e kırpılır**, hata **değil**. (Plan `422` diyordu; mevcut desen 400 — §8 S2)

### 4.2 Yeni/dokunulan dosyalar (API)

| Dosya | Değişiklik | ~LOC |
|---|---|---|
| `apps/api/src/controllers/admin.controller.js` | `getAllAppointments` yeniden yazılır: filtre `where` kurucusu, `distinct/subQuery`, `counts` + `salons` + `staff` için paralel sorgular, sıralama | ~95 |
| `apps/api/src/validators/admin.validator.js` | `adminAppointmentQueryValidator` eklenir (page/limit/search/status/salonId/staffId/dateFrom/dateTo/sort/order); `adminSalonQueryValidator` **dokunulmaz** | ~22 |
| `apps/api/src/routes/admin.routes.js` | `:12` satırı `adminAppointmentQueryValidator, validate` alır | ~1 |
| `apps/api/tests/admin.test.js` | `GET /admin/appointments` describe'ı genişletilir (mevcut 2 test korunur) | ~190 |

`getAllAppointments` taslak akışı (uygulama için bağlayıcı sıra):

```js
const { limit, offset, page } = paginate(req.query.page, req.query.limit);
const { search, status, salonId, staffId, dateFrom, dateTo, sort = 'createdAt', order = 'desc' } = req.query;
// 1) where: status, salonId, staffId, date aralığı, search (üst seviye Op.or + LOWER(col) LIKE)
// 2) order: sort === 'date' ? [['date', DIR], ['startTime', 'ASC']] : [['createdAt', DIR]]
// 3) Promise.all: findAndCountAll({ where, include, order, limit, offset, distinct: true, subQuery: false })
//                 + 6 × Appointment.count()  (global counts)
//                 + distinct salonId / staffId → Salon/Staff ad çözümü (global select seçenekleri)
// 4) payload = paginatedResponse(rows, count, page, limit); payload.meta.counts/salons/staff
```

### 4.3 API test listesi (kabul kanıtı)

1. `status=CONFIRMED` → dönen her satır `CONFIRMED`; `meta.total` doğru.
2. `search` **müşteri adında** eşleşir (`customer.fullName`).
3. `search` **müşteri e-postasında** eşleşir.
4. `search` **salon adında** eşleşir; büyük/küçük harf duyarsız (`AYŞE` = `ayşe`).
5. `search` **personel adında** eşleşir (join'li `count` doğru olmalı — R2).
6. `search` **hizmet adında** eşleşir.
7. `salonId` filtresi yalnız o salonun randevularını döndürür.
8. `staffId` filtresi yalnız o personelin randevularını döndürür.
9. `dateFrom` + `dateTo` aralığı; tek başına `dateFrom`; tek başına `dateTo`.
10. `sort=date&order=asc` → tarih artan, aynı gün içinde `startTime` artan; `sort=createdAt&order=asc` → createdAt artan.
11. `meta.counts` filtreden bağımsız: filtreli istekte de `counts["tümü"]` filtresiz toplam; `counts` 5 statünün toplamı + `tümü` tutarlı.
12. `meta.salons` / `meta.staff` filtreli istekte de aynı (global) ve `{id,name}` / `{id,fullName}` biçiminde.
13. `limit=1000` → `meta.limit === 100` (kırpma, hata değil); `limit=50` → 50 istenir.
14. Geçersiz `status=xyz`, `sort=price`, `dateFrom=27.10.2026`, `salonId=abc`, ters aralık (`dateFrom > dateTo`) → **400** (§8 S2).
15. Geriye uyum: `status` + `search` birlikte AND'lenir; `status`'suz istek bugünkü tüm listeyi verir (`admin.test.js:324` testi değişmeden geçer).

---

## 5. UI sözleşmesi (`apps/admin_panel`)

### 5.1 Yeni/yeniden yazılan bileşenler

| Bileşen | Sorumluluk | Not |
|---|---|---|
| `src/lib/appointmentsQuery.ts` (**yeni**) | Saf modül: durum ↔ URL ↔ API sorgusu eşlemesi, tarih preset → `dateFrom`/`dateTo`, chip listesi. **React/window/ağ yok** | §A2 birebir; `tests/lib/appointmentsQuery.test.ts` altında ağsız `node:test` (AP-002 kapısı) |
| `components/appointments/AppointmentActions.tsx` (**yeni**) | Satır aksiyonlarının **tek kaynağı**: `Detay` + duruma göre `Onayla`/`Tamamla`/`Gelmedi`/`İptal`; terminal geçişlerde onay `Dialog`'u; `Loader2`/`disabled` | §A3 birebir; tabloda ve `DataTable.actions` (kart/mobil) aynı bileşen |
| `components/appointments/AppointmentDetailDialog.tsx` (**yeni**) | Salt-okunur detay `Dialog`'u: müşteri (ad + e-posta), salon, hizmet + ücret, personel, tarih, saat aralığı, durum badge, not | **Ağ yok** (V4); `Dialog` primitifi hazır (`components/ui/Dialog.tsx:10-21`) |
| `src/app/appointments/page.tsx` (**yeniden yazılır**) | Filtre çubuğu + chip satırı + tablo + sayfalama; URL state, debounce, abort, `meta.counts` → Durum select etiketleri | B1–B6 kapanır; `salons/page.tsx` deseni izlenir |
| `components/ui/FilterBar.tsx`, `FilterChips.tsx`, `Pagination.tsx`, `src/lib/useDebouncedValue.ts` | **Değişmez** — olduğu gibi yeniden kullanılır | D8; AP-007 testleri dokunulmadan geçer |

### 5.2 Yerleşim (tek satır + chip satırı + tablo + sayfalama)

```
[ 🔍 Ara (flex-1) ] [ Durum ▾ (Tamamlandı (9)) ] [ Salon ▾ ] [ Personel ▾ ] [ Tarih ▾ ] [ Sırala ▾ ]
[ Durum: Onaylandı × ] [ Salon: Güzellik Merkezi × ] [ Tarih: Bu hafta × ] [ Arama: "ayşe" × ]   (4 filtre etkin)   [ Temizle ]
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Salon / Hizmet │ Müşteri │ Personel │ Tarih / Saat │ Tutar │ Durum │ İşlem
 …              │ …       │ …        │ …            │ …     │ …     │ [Detay] [Onayla]  ← her satırda en az 1 buton
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
[ 1–20 / 87 ]                                                                              [ 20 ▾ ]   ‹  ›
```

- **6 kontrol (uygulanan yerleşim):** `FilterBar` `leading` = arama (`min-w-[10rem] flex-1 overflow-hidden` sarmalayıcı — `Field`'ın `w-full` taban sınıfı genişliği ezer, AP-007 ölçüm notu); `children` = **Durum `Select`** + Salon + Personel + Tarih + Sıralama `Select`'leri. `trailing` kullanılmaz; `Yenile` `PageHeader.actions` içindedir.
- **Durum `Select`** (sekme şeridi değil — §8 S1): seçenek etiketleri `<Durum> (<meta.counts[sayac]>)`, ör. `Tamamlandı (9)`; ilk seçenek `Tümü (45)`. Seçili değer aynı biçimde görünür (ayrı bir etiket metni yok).
- **Sarmalayıcı sınıfları:** Durum `!min-w-[9.5rem] max-w-48 flex-1` (en uzun etiket `Tamamlandı (9)` ≈147px ister), diğer dört select `!min-w-[8.5rem] max-w-48 flex-1`. `!` şart: `FilterBar` kökündeki `[&>*]:min-w-0` kuralı `min-w-*` tabanını eziyordu (§8 S3).
- `<1024px`: `FilterBar` kökü `flex-wrap` ile sarar; chip satırı `FilterChips` içinde yatay kayar (kabul istisnası, H1). 390px ölçümü: 4 satır, çubuk 200px, yatay taşma **0**.
- Sayfa boyutu seçici + aralık metni `Pagination`'dan gelir: `<Pagination page totalPages total={meta.total} pageSize={query.limit} onPageSize={...} />` (B13).

### 5.3 §A2 — `src/lib/appointmentsQuery.ts` sözleşmesi (birebir)

```ts
export const APPOINTMENTS_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_STORAGE_KEY = 'appointments_page_size';

export type AppointmentStatusFilter =
  | 'tümü' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentSort = 'createdAt' | 'date';
export type SortOrder = 'asc' | 'desc';
export type DatePreset =
  | 'tümü' | 'bugün' | 'yarın' | 'bu-hafta' | 'bu-ay' | 'geçmiş' | 'gelecek';

export interface AppointmentsQueryState {
  q: string;
  status: AppointmentStatusFilter;
  salonId: string;
  staffId: string;
  date: DatePreset;
  page: number;
  limit: number;
  sort: AppointmentSort;
  order: SortOrder;
}

export const DEFAULT_APPOINTMENTS_QUERY: AppointmentsQueryState = {
  q: '', status: 'tümü', salonId: '', staffId: '',
  date: 'tümü', page: 1, limit: 20, sort: 'createdAt', order: 'desc',
};

export const APPOINTMENT_SORT_OPTIONS: {
  value: string; label: string; sort: AppointmentSort; order: SortOrder;
}[] = [
  { value: 'createdAt:desc', label: 'En yeni',        sort: 'createdAt', order: 'desc' },
  { value: 'date:asc',      label: 'Tarih (yakın)',   sort: 'date',      order: 'asc'  },
  { value: 'date:desc',     label: 'Tarih (uzak)',    sort: 'date',      order: 'desc' },
];

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'tümü',     label: 'Tüm tarihler' },
  { value: 'bugün',    label: 'Bugün' },
  { value: 'yarın',    label: 'Yarın' },
  { value: 'bu-hafta', label: 'Bu hafta' },
  { value: 'bu-ay',    label: 'Bu ay' },
  { value: 'geçmiş',   label: 'Geçmiş' },
  { value: 'gelecek',  label: 'Gelecek' },
];

export function parseAppointmentsQuery(search: string): AppointmentsQueryState;
export function buildAppointmentsQuery(state: AppointmentsQueryState): string;            // '?' öneki YOK, varsayılanlar yazılmaz
export function toApiSearchParams(state: AppointmentsQueryState, today: Date): string;    // page/limit/sort/order her zaman
export function dateRangeForPreset(preset: DatePreset, today: Date): { dateFrom?: string; dateTo?: string };
export function activeChips(
  state: AppointmentsQueryState,
  names?: { salon?: string; staff?: string }
): { key: 'status' | 'salon' | 'staff' | 'date' | 'q'; label: string; patch: Partial<AppointmentsQueryState> }[];
export function normalizeQuery(state: Partial<AppointmentsQueryState>): AppointmentsQueryState;
```

**URL parametre adları:** `q`, `durum`, `salon`, `personel`, `tarih`, `sayfa`, `limit`, `sirala` (`<sort>:<order>`).
**Eski alias:** `filter=<status>` → `durum`; `durum` varsa **`durum` kazanır** (AP-007 `?filter=` deep-link deseni).

**`toApiSearchParams` eşlemesi:** `page`/`limit`/`sort`/`order` **her zaman** yazılır; `q → search`, `status !== 'tümü' → status`, `salonId → salonId`, `staffId → staffId`, tarih preset → `dateRangeForPreset(...)` sonucu `dateFrom`/`dateTo`.

**Tarih preset kuralları (yerel saat, `YYYY-MM-DD`, UTC kaydırması YOK):**

| Preset | Aralık |
|---|---|
| `tümü` | aralık yok (`{}`) |
| `bugün` | `dateFrom = dateTo = today` |
| `yarın` | `dateFrom = dateTo = today + 1` |
| `bu-hafta` | Pazartesi..Pazar (**ISO hafta**, bugünü içeren) |
| `bu-ay` | ayın 1'i .. ayın son günü |
| `geçmiş` | `dateTo = today - 1` |
| `gelecek` | `dateFrom = today + 1` |

Biçimlendirme `getFullYear()/getMonth()/getDate()` ile yapılır; **`toISOString()` kullanılmaz** (UTC kaydırması günü 1 gün kaydırır — V5).

**Chip etiketleri (birebir):**

| Chip | Etiket | `patch` |
|---|---|---|
| `status` | `Durum: <APPOINTMENT_STATUS Türkçe etiket>` | `{ status: 'tümü', page: 1 }` |
| `salon` | `Salon: <names.salon ?? salonId>` | `{ salonId: '', page: 1 }` |
| `staff` | `Personel: <names.staff ?? staffId>` | `{ staffId: '', page: 1 }` |
| `date` | `Tarih: <preset etiketi>` | `{ date: 'tümü', page: 1 }` |
| `q` | `Arama: "<q>"` | `{ q: '', page: 1 }` |

`patch` **her zaman o alanı varsayılana çeker** ve `page: 1` ekler; `normalizeQuery` geçersiz/eksik değerleri varsayılana, `page < 1` değerini `1`'e çeker. Chip sırası: **durum → salon → personel → tarih → arama** (D5).

### 5.4 §A3 — İşlemler kolonu (`components/appointments/AppointmentActions.tsx`)

Sıra **sabittir**; en solda `Detay`, sonra duruma göre aksiyonlar:

| Sıra | Aksiyon | Koşul | Görsel | API çağrısı | Onay |
|---|---|---|---|---|---|
| 1 | **Detay** | **her satır** | `outline`, `Eye` ikonu | — (ağ yok, `AppointmentDetailDialog` satır verisiyle açılır) | — |
| 2 | **Onayla** | `PENDING` | `primary`, `CheckCircle2` | `PATCH /api/v1/appointments/:id/status` gövde `{ status: 'CONFIRMED' }` | **yok** (geri alınabilir) |
| 3 | **Tamamla** | `CONFIRMED` | `primary`, `CheckCheck` | aynı uç, `{ status: 'COMPLETED' }` | **Dialog** |
| 4 | **Gelmedi** | `CONFIRMED` | `outline`, `UserX` | aynı uç, `{ status: 'NO_SHOW' }` | **Dialog** |
| 5 | **İptal** | `PENDING`, `CONFIRMED` | `danger`, `XCircle` | aynı uç, `{ status: 'CANCELLED' }` | **Dialog** |
| — | *(hiçbiri)* | `COMPLETED`/`CANCELLED`/`NO_SHOW` | — | yalnız `Detay` kalır | — |

- **Uçuş geri bildirimi:** buton metni değişmez; `Loader2` (`animate-spin`) + `disabled`. Aynı satırdaki diğer butonlar da `disabled` (çift istek yok).
- **Hata:** API 400 dönerse (ör. `Tamamla` için "Randevu saati henüz geçmedi" — B12) satır üstünde `role="alert"` metni; buton durumu **geri alınmaz** (optimistic update yok).
- **Başarı:** satır `status` alanı yerinde güncellenir (yeniden fetch yok) + `aria-live` ile "Randevu güncellendi".
- **Yetki:** `PATCH /appointments/:id/status` `authorize('SALON_OWNER','ADMIN')` (`appointment.routes.js:11`) → admin panelde ADMIN rolü yeterli, ek uç gerekmez.

### 5.5 Sayfa akışı (`src/app/appointments/page.tsx`)

1. **Açılış:** `parseAppointmentsQuery(window.location.search)`; `localStorage.getItem('appointments_page_size')` geçerliyse `limit` ondan gelir (yalnız ilk mount, `useEffect` içinde — SSR'da `window` yok).
2. **Tek state:** `const [query, setQuery] = useState(DEFAULT_APPOINTMENTS_QUERY)`; `updateFilter(patch)` → `normalizeQuery({ ...query, ...patch, page: patch.page ?? 1 })`. Sayfa değişimi ayrı: `setPage(n)` → `{ ...query, page: n }`.
3. **URL yazımı:** `useEffect` → `router.replace(buildAppointmentsQuery(query) ? '/appointments?' + qs : '/appointments', { scroll: false })` (tek kaynak: state → URL; geri tuşu tutarlı).
4. **İstek:** `useDebouncedValue(query.q, 300)`; `apiFetch('/admin/appointments?' + toApiSearchParams({ ...query, q: debouncedQ }, new Date()), { signal })`; `AbortController` ile önceki istek iptal; iptal edilen istek state yazmaz.
5. **Sayaçlar:** `meta.counts` → Durum `Select` seçenek etiketleri (`Tamamlandı (9)`); `meta.salons` → salon `Select` seçenekleri; `meta.staff` → personel `Select`; `meta.total` → `Pagination total`.
6. **Tablo:** `rows = data.data` (client-side filtre **yok**); `columns` bugünküyle aynı 6 kolon + `İşlem` = `<AppointmentActions … />`; `DataTable.actions` prop'una da aynı bileşen (kart/mobil görünüm).
7. **Temizle:** `setQuery(DEFAULT_APPOINTMENTS_QUERY)` + `localStorage` sayfa boyutu korunur (`limit` korunur → `{ ...DEFAULT, limit: query.limit }`).

---

## 6. Fazlar, dosya sahipliği, kabul ve doğrulama

### Faz W1 — API (bağımsız, ilk)
- **Dosyalar (sahiplik):** `apps/api/src/controllers/admin.controller.js` (`getAllAppointments`), `apps/api/src/validators/admin.validator.js` (`adminAppointmentQueryValidator`), `apps/api/src/routes/admin.routes.js:12`, `apps/api/tests/admin.test.js`
- **Kabul:** §4.3'teki 15 test yeşil; mevcut `admin.test.js:324` appointments testi değişmeden geçer; `meta.counts/salons/staff` yanıtta var.
- **Doğrulama:** `cd apps/api && npm test`
- **Elle kanıt:**
  ```bash
  TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
    -d '{"email":"admin@beautysalon.com","password":"Admin123!"}' | jq -r .data.accessToken)
  curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/appointments?limit=20' | jq '.meta.counts'
  curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/appointments?search=ayşe&sort=date&order=asc' | jq '.meta.total'
  curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/appointments?status=xyz'  # 400 (§8 S2)
  ```

### Faz W2 — lib + aksiyon + dialog (W1'den bağımsız, paralel)
- **Dosyalar (sahiplik):** `apps/admin_panel/src/lib/appointmentsQuery.ts` (yeni), `components/appointments/AppointmentActions.tsx` (yeni), `components/appointments/AppointmentDetailDialog.tsx` (yeni), `tests/lib/appointmentsQuery.test.ts`, `tests/unit/components/AppointmentActions.test.tsx`, `tests/unit/components/AppointmentDetailDialog.test.tsx`
- **Kabul:** `appointmentsQuery` için ~20 saf test (parse/build/toApi/dateRange/activeChips/normalize, preset sınırları: ay sonu, ISO hafta, `geçmiş`/`gelecek`); `AppointmentActions` 5 statü × buton kümesi + terminal satırda **yalnız Detay** + onay dialog'u iptal edilince `apiFetch` **çağrılmaz** + uçuşta `Loader2`/`disabled`; dialog ağ çağrısı **yapmaz**.
- **Doğrulama:** `cd apps/admin_panel && npm run test:unit`

### Faz W3 — Sayfa entegrasyonu + test (W2'ye bağımlı)
- **Dosyalar (sahiplik):** `apps/admin_panel/src/app/appointments/page.tsx` (yeniden yazılır), `tests/unit/pages/appointments.test.tsx` (yeni)
- **Kabul:** H1–H6 ölçütleri; sayfa testi: filtre değişince `page=1`, `apiFetch` doğru query string ile çağrılır (`search`/`status`/`salonId`/`staffId`/`dateFrom`/`dateTo`/`sort`/`order`), chip kaldırma/Temizle URL'i sıfırlar, `limit` değişince `page=1` + `localStorage` yazılır, `meta.counts` **Durum select seçenek etiketlerine** yansır (`Tamamlandı (9)`), **her satırda ≥1 işlem butonu**.
- **Doğrulama:** `cd apps/admin_panel && npm run typecheck && npm run lint && npm test`

### Faz W4 — Kapı (W1+W3 yeşil olduktan sonra)
- **Dosyalar (sahiplik):** `screenshots/_harness/plan-admin-appointments-filters.js` (yeni, headless chromium), `docs/ADMIN-PANEL.md` (randevu filtre bölümü), `plans/admin/INDEX.md` (AP-008 satırı)
- **Kabul:** harness ölçümü: 1280/1440px'te filtre kontrollerinin `offsetTop` kümesi **tek eleman**, çubuk yüksekliği ≤56px, `scrollWidth <= clientWidth`; 390px'te taşma 0; ekran görüntüleri `screenshots/admin-appointments-filters-{1440,1280,390}.png`.
- **Doğrulama (uygulanan):** `cd apps/admin_panel && npm run build` → izole `next start -p 3010` + chromium (`--remote-debugging-port=9455`) → `ADMIN_BASE=http://127.0.0.1:3010 API_BASE=http://127.0.0.1:3000 CDP_PORT=9455 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-appointments-filters.js`; ayrıca `~/.pi/agent/bin/verify.sh`.

### Test özeti (hedef adet)

| Katman | Dosya | Adet (uygulanan) |
|---|---|---|
| API (mocha+chai) | `apps/api/tests/admin.test.js` | **+12** (dosyada 34 `it`; mevcut 22 test korundu) |
| Panel — saf mantık (`node:test`, ağsız) | `tests/lib/appointmentsQuery.test.ts` | **22** |
| Panel — bileşen (vitest+jsdom) | `AppointmentActions` (**11**), `AppointmentDetailDialog` (**7**) | **18** |
| Panel — sayfa | `tests/unit/pages/appointments.test.tsx` | **11** |
| Görsel | harness (tek satır + taşma + select genişliği/kırpılma) | 3 ölçüm |

Toplamlar (gerçek kapı çıktısı): `apps/api` **320 passing** · `apps/admin_panel` **65 node + 218 vitest** (27 dosya).

---

## 7. Riskler ve geri dönüş

### Riskler ve tuzaklar

| # | Risk | Önlem |
|---|---|---|
| **R1** | 6 kontrol + 6 sekmeli durum şeridi 1280px'te tek satıra sığmaz (H1 ihlali) | **Gerçekleşti ve çözüldü:** ölçümde çubuk 945px, arama yuvası 192px, şerit 624px → tek okunur select bile sığmıyordu; şerit **Durum `Select`**'ine dönüştürüldü (§8 S1). Sıralamayı `PageHeader`'a taşıyan yedek plan **uygulanmadı**. Ölçüm harness'ı ile kilitli: 1440/1280 `singleRow true`, `overflow 0` |
| **R2** | `search` + join'li `count` → yanlış `meta.total` (AP-007 R1'in randevu karşılığı) | `distinct: true, subQuery: false` + üst seviye `where` + `LOWER(kolon)`; **1 numaralı test** bu (§4.3 test 5) |
| **R3** | Tarih preset'i UTC kaydırmasıyla 1 gün kayar (`toISOString`) | `getFullYear/getMonth/getDate` ile biçimlendirme; `dateRangeForPreset` testleri ay sonu + yılbaşı sınırında |
| **R4** | `Tamamla` butonu bugünkü saati geçmemiş randevuda 400 alır (B12) → kullanıcı "bozuk" sanır | Buton **gizlenmez** (sözleşme); hata `role="alert"` ile API mesajı gösterilir. Kabul: 400 senaryosu `AppointmentActions` testinde |
| **R5** | Debounce + yavaş cevap → eski sonuç yeni filtreyi ezer | `AbortController` + iptal edilen istek state yazmaz (V3) |
| **R6** | Chip/Temizle URL'i güncellemezse geri tuşu tutarsız | Tek kaynak `state → URL` (`router.replace`, `scroll: false`); sayfa testi kilitler |
| **R7** | Terminal satırlarda İşlem hücresi yine boş kalır (asıl şikâyet) | H3 testi: 5 statünün her biri için `getAllByRole('button').length >= 1`; `Detay` koşulsuz |
| **R8** | `limit=1000` gibi URL değeri hata sanılır | `paginate()` kırpar (`helpers.js:17-21`), validator üst sınır koymaz (AP-007 ile aynı bilinçli karar). Test: `limit=1000` → `meta.limit === 100` |
| **R9** | `localStorage` SSR'da `window` yok → hydration hatası | Yalnız `useEffect` içinde okunur/yazılır; state başlangıcı `DEFAULT_PAGE_SIZE` |
| **R10** | Paralel worker'lar aynı worktree'de `git add -A` ile birbirinin dosyasını commit'ler | W1 (api) ve W2 (panel) dosya kümeleri **ayrık**; commit'ler pathspec'li: `git commit -m "..." -- <dosyalar>` |

### Geri dönüş

- **Migration yok**, veritabanı şeması değişmiyor → veri geri dönüşü gerekmez.
- **API değişiklikleri additive** (D9): yeni parametreler yoksa davranış bugünküyle aynı; `meta`'ya alan **eklemek** kırıcı değil → API ve panel **ayrı ayrı** geri alınabilir.
- **Panel:** W2 üç yeni dosya (silinmesi zararsız); W3 tek dosyada (`appointments/page.tsx`) yoğunlaşır → `git revert <W3 commit>` yeterli.
- Commit disiplini: W1..W4 ayrı commit'ler, pathspec'li; `git reset --hard` kullanılmaz.

### Kapsam dışı (bilinçli)

- **Toplu seçim / bulk aksiyon YOK** (checkbox kolonu, "seçilenleri iptal et").
- **Randevu düzenleme formu YOK** (tarih/saat/personel değiştirme; AP-007'deki `SalonEditDialog` muadili yok).
- **Randevu oluşturma YOK** (admin adına randevu açma).
- **Diğer sayfalar kapsam dışı** (users/reviews/salons filtre çubuklarına dokunulmaz).
- **DB migration YOK**; model/şema değişmez.
- Özel tarih aralığı UI'ı (iki `date` input), takvim/gantt görünümü, CSV dışa aktarma, e-posta/SMS tetikleme.

---

## 8. Uygulama sapmalari (plan → kod)

Uygulama bitti; aşağıdaki dört sapma **bilinçli**dir ve kod ile birebir uyumludur. Sapma dışında §4 (API) ve §5 (UI) sözleşmeleri aynen uygulandı.

| # | Sapma | Neden + kanıt |
|---|---|---|
| **S1** | **Durum filtresi sekme şeridi yerine TEK `Select`.** Seçenek etiketleri `<Durum> (<sayac>)` biçiminde (ör. `Tamamlandı (9)`), sayaçlar `meta.counts`'tan; kontrol sayısı **6**: arama + Durum + Salon + Personel + Tarih + Sıralama | Ölçüm: 1280px'te filtre çubuğu **945px**; `FilterBar` `leading` (arama) tabanı **192px sabit** (`FilterBar.tsx` `!min-w-[12rem]`), 6 sekmeli şerit `shrink-0` iken **624px** yer kaplıyordu → kalan `945 − 192 − 624 − 40 (gap) = 89px`'e **tek bir okunur select (≥136px) bile sığmıyordu**. Ayrıca `min-w-28` tabanı `FilterBar` kökündeki `[&>*]:min-w-0` kuralınca ezilip select'ler **~40px**'e çöküyordu (ekranda `Tü…`, `En…`). `!min-w-[7rem]` denemesi taşmayı büyüttü (1440 **+167px**, 1280 **+327px**) → şerit kaldırıldı. Sonuç: 1440 `minSelectWidth` **175**, 1280 **140**, `singleRow true`, `overflow 0` |
| **S2** | **Doğrulama hatası `422` değil `400`** | `apps/api/src/middlewares/validate.js:7` ve `errorHandler` 400 döndürüyor; AP-007'nin `adminSalonQueryValidator` yolu da 400. Yeni hata şeması yazılmadı → §4.1 ve §4.3'teki `422` ifadeleri **400**'e çekildi |
| **S3** | **Select sarmalayıcıları `!min-w-[8.5rem] max-w-48 flex-1`; Durum select'i `!min-w-[9.5rem]`** | `!` şart: `FilterBar`'ın `[&>*]:min-w-0` kuralı aynı özgüllükte ve sonra geldiği için `min-w-*` tabanını eziyor (AP-007 dersi). `8.5rem` (136px) `Tüm personel` (135px) için yeterli; Durum'un `Tamamlandı (9)` etiketi **147px** istediği için 1280'de 8.5rem 6px kısa kaldı → `9.5rem` (152px). Kanıt: 1280 `selectWidths [152,140,140,140,140]`, `selectsTextFits true` |
| **S4** | **Sayfa testi durum filtresini `combobox` üzerinden sınar; sayaçlar `option` etiketlerinde assert edilir** | Sekme şeridi kalktığı için `getByRole('tab', …)` imkânsız: `apps/admin_panel/tests/unit/pages/appointments.test.tsx:164` ve `:190` → `selectOptions(getByLabelText('Durum'), 'COMPLETED')`; `:288-295` → `option` adları (`Tümü (45)`, `Tamamlandı (20)`, …). Diğer 9 sayfa testi değişmedi (silme/zayıflatma yok) |

Ek not: §7 **R1**'deki "sığmazsa sıralamayı `PageHeader`'a taşı" yedek planı **uygulanmadı** — S1 yeterli alanı açtı, sıralama `Select`'i filtre çubuğunda kaldı.

**Uygulanan dosyalar ve gerçek test sayıları:**

| Katman | Dosya | Test |
|---|---|---|
| API | `apps/api/src/controllers/admin.controller.js` (`getAllAppointments`), `apps/api/src/validators/admin.validator.js` (`adminAppointmentQueryValidator`), `apps/api/src/routes/admin.routes.js`, `apps/api/tests/admin.test.js` | **+12** (dosyada 34 `it`; mevcut 22 test korundu) |
| Panel — saf mantık | `apps/admin_panel/src/lib/appointmentsQuery.ts` + `tests/lib/appointmentsQuery.test.ts` | **22** |
| Panel — bileşen | `src/components/appointments/AppointmentActions.tsx` (**11**), `AppointmentDetailDialog.tsx` (**7**) | **18** |
| Panel — sayfa | `src/app/appointments/page.tsx` (yeniden yazıldı, **605 satır**; ilk yazım 598 + T9 düzeltmesi 7) + `tests/unit/pages/appointments.test.tsx` | **11** |
| Görsel | `screenshots/_harness/plan-admin-appointments-filters.js` + `screenshots/admin-appointments-filters-{1440,1280,390}.png` | 3 ölçüm |

**Kapılar (2026-10-27, gerçek çıktı):** `cd apps/admin_panel && npm run typecheck` → çıktı yok (exit 0) · `npm run lint` → 0 hata/uyarı (exit 0) · `npm test` → **65 node + 218 vitest** (27 dosya) yeşil · `cd apps/api && npm test` → **320 passing, 0 failing** · `~/.pi/agent/bin/verify.sh` (mod=full) → **TAMAM** (5 adım ✔: test, build, typecheck, lint, api test).

**Ölçüm (gerçek chromium, `/appointments?durum=COMPLETED`, 9 satır):**

| Genişlik | singleRow | uniqueCenterCount | barHeight | overflow | minSelectWidth | selectsClipped |
|---|---|---|---|---|---|---|
| 1440×900 | **true** | 1 | **44px** | **0** (1425 = 1425) | **175** | false |
| 1280×800 | **true** | 1 | **44px** | **0** (945px çubuk) | **140** | false |
| 390×844 | false (sarma, beklenen) | 4 | 200px | **0** (375 = 375) | 168 | false |

---

## 9. Uygulama sırası (worker dağıtımı için — tamamlandı)

| Wave | Task | Model önerisi | Bağımlılık |
|---|---|---|---|
| 1 | W1 API filtre + sayaç + validasyon | bulut (Sequelize `count`/`subQuery`, R2) | — |
| 1 | W2 `appointmentsQuery` + `AppointmentActions` + `AppointmentDetailDialog` + testler | yerel (mekanik, dosya başına ayrık) | — |
| 2 | W3 sayfa refactor + sayfa testi | bulut (URL state + debounce + abort + tablo) | W2 |
| 3 | W4 görsel ölçüm + doküman + INDEX satırı | yerel | W1+W3 |

Doğrulama kapıları her wave sonunda: `cd apps/api && npm test` · `cd apps/admin_panel && npm run typecheck && npm run lint && npm test` · W4'te ek `~/.pi/agent/bin/verify.sh` + `npm run build`.

---

## 10. İndeks kaydı (`plans/admin/INDEX.md`)

Tablodaki AP-008 satırı **UYGULANDI** durumuna çekildi (diğer satırlar değişmedi):

```
| **AP-008-appointments-filter-actions.md** | `apps/admin_panel` Randevu Yönetimi: filtrelerin **tek satırda** toplanması (arama, durum, salon, personel, tarih preset, sıralama), etkin filtre **chip'leri + Temizle**, **sunucu tarafı** filtreleme (`search`/`status`/`salonId`/`staffId`/`dateFrom`/`dateTo`/`sort`/`order`), **global sayaçlar** (`meta.counts`) + `meta.salons`/`meta.staff`, sayfalama **20/50/100** (varsayılan 20, `localStorage` hatırlama), **İşlemler** kolonuna **Detay** (salt-okunur dialog) + duruma göre Onayla/Tamamla/Gelmedi/İptal (terminal geçişlerde onay dialog'u); `apps/api`'de `GET /admin/appointments` genişletmesi + admin appointment query validasyonu | **UYGULANDI** (2026-10-27) — 6 kontrol (arama + Durum/Salon/Personel/Tarih/Sıralama; durum filtresi sekme şeridi yerine **Select**, etiketler `Tamamlandı (9)` biçiminde, sayaçlar `meta.counts`'tan — sapma §8 S1), chip'ler + Temizle, İşlemler kolonunda **her satırda Detay** + duruma göre Onayla/Tamamla/Gelmedi/İptal (onay dialog'lu); gerçek chromium ölçümü: **1440/1280'de tek satır** (`barHeight` **44px** ≤56, `overflow 0`), `minSelectWidth` **175/140**, 390'da sarma + **taşma 0**; kapılar: admin_panel **65 node + 218 vitest**, api **320 passing / 0 failing**, `verify.sh` (mod=full) **TAMAM**; kanıt `screenshots/admin-appointments-filters-{1440,1280,390}.png` + harness `screenshots/_harness/plan-admin-appointments-filters.js` |
```

Kanıt komutu: `git diff --numstat -- plans/admin/INDEX.md` → `1 0` (AP-008 satırı `HEAD`'de **yok**; satırı önceki worker ekledi ve commit edilmedi → sayısal olarak yalnız **1 ekleme, 0 silme** görünür, "1 ekleme + 1 silme" beklenemez). **Yalnız o satırın** değiştiğinin kanıtı: `git diff -U0 -- plans/admin/INDEX.md` çıktısı **tek hunk** (`@@ -13,0 +14 @@`) ve `git diff -- plans/admin/INDEX.md | grep -c '^-[^-]'` → **0** (başka hiçbir satır değişmedi/silinmedi).
