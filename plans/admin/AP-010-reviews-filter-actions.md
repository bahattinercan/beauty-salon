# AP-010 — Yorum Yönetimi: tek satır filtre çubuğu, chip'ler, sunucu tarafı filtreleme (20/50/100) ve kart işlemleri (Detay / Yanıtla / Görünürlük / Sil)

**Durum:** UYGULANDI (2026-10-28) · **Tarih:** 2026-10-28 · **Hedef uygulamalar:** `apps/admin_panel`, `apps/api`
**Kanıt (özet):** Gerçek chromium ölçümü (`/reviews?puan=5&yanit=yanıtlı&tarih=bu-ay`, 3 kart): 1440 ve 1280'de `singleRow true` (benzersiz dikey merkez **1**), `barHeight` **44px** (≤56), yatay taşma **0** (`scrollWidth = clientWidth`), `minSelectWidth` **178 / 143**, `selectsClipped false`; 390'da sarma (3 satır, 148px) ve taşma **0**. Kapılar: `apps/admin_panel` `npm run typecheck` temiz, `npm run lint` exit 0 (**0 uyarı**), `npm test` **110 node + 260 vitest** (30 dosya); `apps/api` `npm test` **354 passing / 0 failing**; `~/.pi/agent/bin/verify.sh` (mod=full) **TAMAM**. Kanıt dosyaları: `screenshots/admin-reviews-filters-{1440,1280,390}.png` + harness `screenshots/_harness/plan-admin-reviews-filters.js`. Plan↔kod farkları: **§10**.
**Tetiklleyen istek:** "admin panelde yorum yonetimi sayfasinda detayli bir filtreleme sistemi getirelim, filtreler tek satira sigmali, filtrelerin chipleri de altinda olsun, islemler kismi bos kalmis oraya da islemler ekleyelim"

> **Kapsam notu (istek ↔ ekran ayrımı):** Kullanıcı cümlesinde "randevu yönetimi" dedi, ancak ekran görüntüsü ve kod durumu **Yorum Yönetimi** sayfasını (`apps/admin_panel/src/app/reviews/page.tsx`) gösteriyor. Aynı isteğin randevu sayfası karşılığı **AP-008** (`plans/admin/AP-008-appointments-filter-actions.md`) ile zaten uygulandı ve kapandı. Bu plan **Yorum Yönetimi** sayfasını kapsar; randevu sayfasına dokunulmaz.

Bu plan AP-007/AP-008/AP-009 ile **aynı yapıdadır**: aynı filtre çubuğu / chip / sayfalama deseni yorum sayfasına taşınır. Üç bilinçli fark: (1) filtre seti yorum alanlarına uyarlanır (Görünüm / Puan / Yanıt / Salon / Tarih — sıralama UI'da **yok**), (2) kart ızgarası **korunur** (tabloya çevrilmez), (3) API'de **iki yeni admin ucu** gerekir (yanıt yazma + silme), çünkü bugün admin yanıt yazamıyor ve yorum silemiyor. Aşağıdaki **SÖZLEŞME** bölümleri (§A/§B/§C/§D/§E) uygulayıcı worker'lar için **bağlayıcıdır**: parametre adı, `meta` anahtarı, lib fonksiyon imzası ve bileşen prop'u **değiştirilemez**.

---

## 1. Bugünkü durum (koddan okundu, ölçüm değil — dosya:satır kanıtlı)

| # | Bulgu | Kanıt |
|---|---|---|
| B1 | **Filtre alanı tek satır değil.** Arama tam genişlik `Input` (kendi satırında), altında `Tabs` (Görünürlük) + `Field label="Puan"` ikinci satırda; `Field` etiketi kontrolün üstünde olduğu için ikinci satır daha da yükseliyor | `apps/admin_panel/src/app/reviews/page.tsx:141-177` — kapsayıcı `:141` (`mb-4 flex flex-col gap-3`), `Input` `:142-148`, alt satır `:149-176` (`Tabs` `:150-159`, `Field`+`Select` `:160-175`) |
| B2 | **Sunucuya yalnız `page` + `limit` gidiyor**; `search`/`rating`/`visibility`/`replied`/`salonId`/`dateFrom`/`dateTo`/`sort`/`order` parametresi hiç üretilmiyor | `reviews/page.tsx:83` — `apiFetch<ApiResponse>(\`/admin/reviews?page=${currentPage}&limit=${ITEMS_PER_PAGE}\`)` |
| B3 | **`ITEMS_PER_PAGE = 10` sabit**; sayfa boyutu seçici yok, `Pagination`'a `total`/`pageSize`/`pageSizeOptions`/`onPageSize` verilmiyor → aralık metni ve 20/50/100 select'i basılmıyor | `reviews/page.tsx:36` (`const ITEMS_PER_PAGE = 10;`), `:253` (`<Pagination page={currentPage} totalPages={totalPages} onPage={setCurrentPage} />`) |
| B4 | **`FilterBar` / `FilterChips` hiç kullanılmıyor** (import yok); etkin filtre özeti ve "Temizle" yok | `reviews/page.tsx:1-14` import bloğu; `grep -n "FilterBar\|FilterChips\|reviewsQuery\|useDebouncedValue" apps/admin_panel/src/app/reviews/page.tsx` → **0 eşleşme** |
| B5 | **URL state yok** — filtre/sayfa URL'de taşınmıyor, yenileme/paylaşım aynı görünümü açmıyor | `reviews/page.tsx:3` (`import { useCallback, useEffect, useState } from 'react';`) — `next/navigation` import'u yok |
| B6 | **Filtreleme İSTEMCİ tarafında:** yalnız o anki 10 satır üzerinde `reviews.filter(...)`. Sonuç: başlıktaki `${totalCount} yorum` (global toplam) ile ekranda görünen kart sayısı çelişir; filtre sayfayı kapsamaz (2. sayfadaki eşleşmeler görünmez) | `reviews/page.tsx:114-128` (`const filtered = reviews.filter(...)`); başlık `:133` (`subtitle={\`${totalCount} yorum\`}`); kartlar `:193` (`filtered.map`) |
| B7 | **`GET /admin/reviews` yalnız `page`/`limit` destekliyor**; sıralama sabit `createdAt DESC`, `meta`'da `counts`/`ratings`/`salons` yok (yalnız `total/page/limit/totalPages`) | `apps/api/src/controllers/admin.controller.js:344-363` — `:347` (`paginate`), `:354` (`order: [['createdAt','DESC']]`), `:359` (`paginatedResponse(rows, count, page, limit)`) |
| B8 | **`/admin/reviews` route'unda query validator yok** (salons ve appointments satırlarında var) | `apps/api/src/routes/admin.routes.js:13` (`router.get('/reviews', adminController.getAllReviews);`) vs `:11`/`:12` (`adminSalonQueryValidator` / `adminAppointmentQueryValidator` + `validate`) |
| B9 | **Admin yanıt yazamıyor:** yanıt ucu yalnız `SALON_OWNER` rolüne açık; admin panelden çağrılırsa `403` | `apps/api/src/routes/review.routes.js:10` (`router.patch('/:id/reply', authenticate, authorize('SALON_OWNER'), …)`) |
| B10 | **Admin yorum silemiyor:** `DELETE` ucu yok. Ayrıca silme, salonun `ratingAvg`/`reviewCount` alanlarını bayatlatır — yeniden hesap deseni `create()` içinde hazır ama silme yolunda tekrar kullanılmıyor | `review.routes.js:10-11` (yalnız `reply` + `toggle-visibility`); yeniden hesap deseni `apps/api/src/controllers/review.controller.js:38-55` (`Review.findAll` AVG/COUNT → `Salon.update`) |
| B11 | **Kart alt satırında yalnız "Gizle / Görünür yap" var.** Detay, Yanıtla, Sil yok → "işlemler kısmı boş kalmış" şikâyetinin kaynağı | `reviews/page.tsx:231-247` — `:231` (`mt-4 flex justify-end border-t border-border pt-3`), `:245` (`{review.isVisible ? 'Gizle' : 'Görünür yap'}`) |
| B12 | **Yeniden kullanılabilir bileşenler hazır** (AP-007/AP-008'den): tek satır kabuk, chip listesi, sayfalama (boyut seçici dahil), debounce hook'u | `src/components/ui/FilterBar.tsx:22-53`, `src/components/ui/FilterChips.tsx:30-77`, `src/components/ui/Pagination.tsx:24-42` (`total`/`pageSize`/`pageSizeOptions`/`onPageSize` opsiyonel), `src/lib/useDebouncedValue.ts:12-21`; bugünkü tek kullanım `src/app/appointments/page.tsx:430` ve `:525` |

> **Asıl kazanç görsel değil:** bugün "Ayşe" araması yalnız **ekrandaki 10 kart** içinde çalışıyor, `9 yorum` toplamı ile görünen kart sayısı çelişiyor ve 2. sayfadaki eşleşmeler hiç görünmüyor. Ayrıca admin bir yoruma **yanıt yazamıyor** ve **silemiyor**; karttaki tek işlem görünürlük anahtarı.

> **Baseline notu ve satır kayması:** Yukarıdaki tüm `dosya:satır` kanıtları planın yazıldığı andaki **`HEAD`** (`9065453`, 2026-10-28) durumuna aittir ve `git show HEAD:<dosya> | sed -n '<aralık>p'` ile tek tek doğrulandı. Görev tanımında verilen bazı numaralar bu `HEAD`'e göre kaymıştı; aşağıdaki tablo farkları kaydeder (kanıt olarak **güncel** değerler kullanıldı):
>
> | Bulgu | Görevde verilen | `HEAD`'de doğrulanan | Not |
> |---|---|---|---|
> | B1 | `:141-183` | **`:141-177`** | `Input` `:142-148`, `Tabs` `:150-159`, `Field` `:160-175` |
> | B2 | `:75` | **`:83`** | `apiFetch` çağrısı tek satır |
> | B3 | `:35`, `:280` | **`:36`**, **`:253`** | `ITEMS_PER_PAGE` ve `Pagination` |
> | B6 | `:114-130` | **`:114-128`** | `reviews.filter(...)` bloğunun gerçek sonu |
> | B9 | `review.routes.js:9` | **`:10`** | `:9` = `GET /salon/:salonId` |
> | B10 | `review.controller.js:41-58` | **`:38-55`** | `:38` yorum satırı, `:39-47` AVG/COUNT, `:49-55` `Salon.update` |
> | B11 | `:257-273` | **`:231-247`** | dosya 256 satır |
> | B4, B5, B7, B8, B12 | — | **birebir aynı** | değişiklik yok |
>
> Aynı worktree'de W1/W2 (API) ve W4 (panel sayfası) ilerledikçe bu satırlar kayar; kanıtı yeniden doğrulamak için yine `git show HEAD:<dosya>` kullanın.

---

## 2. Hedefler ve kabul ölçütleri

| Hedef | Ölçülebilir kabul |
|---|---|
| **H1** Filtreler tek satır | **1440px ve 1280px**'te filtre çubuğundaki kontrollerin **benzersiz dikey merkez sayısı 1** (`offsetTop + offsetHeight/2` kümesinin eleman sayısı) ve dikey aralıklar kesişir (`max(top) < min(bottom)`); çubuk yüksekliği **≤56px**; yatay taşma **0** (`scrollWidth === clientWidth`); `minSelectWidth ≥120` (1280). **<1024px sarar** (kabul istisnası, §5.2), orada da taşma **0** |
| **H2** Chip'ler | Etkin her filtre için **bir chip**; chip'e basınca **yalnız o filtre** varsayılana döner ve `page=1` olur; "Temizle" **hepsini** sıfırlar + `page=1`; liste `aria-live="polite"` ile "N filtre etkin" özetini duyurur; **0 filtrede canlı bölge DOM'da kalır** (boş metin) |
| **H3** İşlemler | **Her kartta en az 4 buton**: `Detay` / `Yanıtla`–`Yanıtı düzenle` / `Görünür yap`–`Gizle` / `Sil`. Boş işlem alanı sayısı **0** (test: `getAllByRole('button').length >= 4` her kart için) |
| **H4** Sunucu tarafı filtreleme | `search`, `rating`, `visibility`, `replied`, `salonId`, `dateFrom`, `dateTo`, `sort`, `order` **API'de** uygulanır; panelde client-side filtreleme (`reviews.filter(...)`) **yok**; API'den gelen `data.data` doğrudan basılır |
| **H5** Doğru sayaçlar | Select etiketleri `meta.counts` / `meta.ratings`'ten beslenir; değerler **GLOBAL** (filtreden bağımsız) — filtre uygulanınca seçenek listesi ve sayaçlar **daralmaz** |
| **H6** Paylaşılabilir durum + sayfa boyutu | Filtre + sayfa + limit URL'de (`?q=&gorunum=&puan=&yanit=&salon=&tarih=&sayfa=&limit=&sirala=`); yenileme/paylaşım aynı görünümü açar; sayfa boyutu **20/50/100**, varsayılan **20**, seçim `localStorage`'da (`reviews_page_size`) hatırlanır, boyut değişince `page=1` |
| **H7** Regresyon yok | `cd apps/admin_panel && npm run typecheck && npm run lint && npm test` yeşil — mevcut `FilterBar`, `FilterChips`, `Pagination` (`Pagination.test.tsx` + `Pagination.pageSize.test.tsx`), `AppointmentActions`, `AppointmentDetailDialog` testleri **değişmeden** geçer; `cd apps/api && npm test` yeşil — mevcut `admin.test.js:560` `GET /admin/reviews` testi **değişmeden** geçer |

---

## 3. Kararlar (uygulamadan önce onay)

| # | Karar | Gerekçe |
|---|---|---|
| **D1** | **Filtre seti 6 kontrol:** arama (`Input`, `leading`/`flex-1`) + **Görünüm** + **Puan** + **Yanıt** + **Salon** + **Tarih** (5 `Select`). **Sıralama UI'da YOK** (sabit `createdAt:desc`); lib `sirala` parametresini yine de destekler | "Detaylı filtreleme" isteği. 7. select 1280px'te H1'i riske atıyor (AP-008 R1/S1 ölçümü: 6 kontrol + sıralama sınırdaydı). Sıralama ihtiyacı `sirala=rating:desc` deep-link'i ile karşılanır |
| **D2** | **Sunucu tarafı filtreleme**; panelde client-side filtre **kaldırılır** (B6) | 100'lük sayfa boyutunda client-side filtre 100 satırla sınırlı kalır ve global toplamla çelişir (AP-007/AP-008 D2 ile aynı) |
| **D3** | **`counts` + `ratings` + `salons` tek cevapta** (`meta` içinde), hepsi **global** | Ayrı `/facets` ucu fazladan tur + senkron riski demek; select seçenekleri filtre uygulanınca daralmamalı (H5) |
| **D4** | **Tarih = tek preset `Select`** (`tümü/bugün/yarın/bu-hafta/bu-ay/geçmiş/gelecek`), iki `date` input **değil** | Tek satıra iki date input sığmaz; API `dateFrom`/`dateTo` hazır (özel aralık UI'ı kapsam dışı) |
| **D5** | **Chip sırası sabit:** görünüm → puan → yanıt → salon → tarih → arama; "Temizle" hepsini sıfırlar + `page=1` | Sıra `activeChips()` içinde **tek yerde** tanımlı; UI sırayı yeniden hesaplamaz |
| **D6** | **İşlem sırası sabit:** `Detay`, `Yanıtla`/`Yanıtı düzenle`, `Görünür yap`/`Gizle`, `Sil`; `Sil` **`danger`**, diğerleri **`outline`** | Kart genişliği oynamasın, yıkıcı işlem en sağda ve tek renkli işaretle ayrışsın (AP-007 `SalonActions` deseni) |
| **D7** | **Onay isteyen işlem: yalnız `Sil`** (geri dönüşü yok). `Yanıt` ve `Görünürlük` **onaysız** (geri alınabilir: yanıt yeniden yazılır, görünürlük tek tıkla geri döner) | Onay dialog'u yalnız geri alınamaz işlemde; AP-008 D7'nin yorum karşılığı |
| **D8** | **AP-007/AP-008 bileşenleri yeniden kullanılır**, yeniden yazılmaz: `FilterBar`, `FilterChips`, `Pagination`, `useDebouncedValue`, `Dialog`, `Button`, `Badge`, `Field` (`Input`/`Select`/`Textarea`). Yeni saf lib `reviewsQuery.ts`, `appointmentsQuery.ts` deseninin **kopyası** — **import YOK** (bağımsız modül) | B12; AP-007 testleri dokunulmadan geçer, iş yalnız sayfa + yeni lib + 3 yeni bileşende |
| **D9** | **API değişiklikleri additive:** `page`/`limit` ve mevcut uçlar **korunur**; yeni uçlar (`reply`/`delete`) **admin rotasında** açılır (mevcut salon yanıt ucu ve `toggle-visibility` dokunulmaz) | Eski panel/istemciler kırılmaz; API ve panel ayrı ayrı geri alınabilir (§8) |
| **D10** | **Admin yanıtı salon yanıtının üzerine yazar** (`salonReply` + `salonReplyAt` güncellenir); ayrı `adminReply` alanı **yok** | Modelde tek yanıt alanı var (`apps/api/src/models/Review.js:39-48`); ayrı alan migration + tüm istemcilerde çift alan demekti. Salon yanıtı zaten `SALON_OWNER` ucundan aynı alanı yazıyor (`review.controller.js:128-131`) |

### Varsayımlar (uygulamada varsayım olarak işaretlendi)

| # | Varsayım | Etkisi |
|---|---|---|
| V1 | Yorum sayısı küçük olduğu için **silme sonrası tam refetch yeterli** (optimistik silme yok) | Silme akışı: `DELETE` → başarılıysa `fetchReviews()`; satır kaydırma/geri alma mantığı yazılmaz |
| V2 | `Salon` select seçenekleri `meta.salons` (**global**); filtre uygulanınca **daralmaz** | Seçili değer kaybolmaz; ek `/salons` çağrısı yok |
| V3 | Arama **300ms debounce + `AbortController`** (AP-007/AP-008 deseni) | Geç gelen cevap yeni filtreyi ezmez; iptal edilen istek state yazmaz |
| V4 | `images` alanı **dialogda gösterilir**; yükleme/düzenleme **kapsam dışı** | `Review.images` `JSONB` (`Review.js:35-38`); yalnız okunur küçük görsel listesi basılır |

---

## 4. API sözleşmesi — §A / §B (`apps/api`)

### 4.1 §A — `GET /api/v1/admin/reviews` (genişletilmiş sorgu)

Query parametreleri (hepsi opsiyonel):

| Parametre | Tip / kural | Varsayılan | Not |
|---|---|---|---|
| `page` | int ≥1 | 1 | mevcut `paginate()` (`apps/api/src/utils/helpers.js:17-21`) |
| `limit` | int ≥1 | **20** | mevcut `paginate()`; **`>100` kırpılır**, hata değil |
| `search` | string ≤100 | — | `LOWER(customer.fullName) LIKE`, `LOWER(salon.name) LIKE`, `LOWER(comment) LIKE` |
| `rating` | int 1..5 | — | tam eşleşme |
| `visibility` | `'all'`\|`'visible'`\|`'hidden'` | `all` | `isVisible` |
| `replied` | `'all'`\|`'replied'`\|`'unreplied'` | `all` | `salonReply` dolu / boş |
| `salonId` | uuid | — | tam eşleşme |
| `dateFrom` | `YYYY-MM-DD` | — | `createdAt >= dateFrom 00:00:00` |
| `dateTo` | `YYYY-MM-DD` | — | `createdAt <= dateTo 23:59:59.999` |
| `sort` | `'createdAt'`\|`'rating'` | `createdAt` | |
| `order` | `'asc'`\|`'desc'` | `desc` | |

Yanıt `meta` alanı (birebir):

```json
"meta": {
  "total": 9, "page": 1, "limit": 20, "totalPages": 1,
  "counts": { "all": 9, "visible": 7, "hidden": 2, "replied": 4, "unreplied": 5 },
  "ratings": { "1": 0, "2": 0, "3": 1, "4": 3, "5": 5 },
  "salons": [ { "id": "uuid", "name": "Zen SPA & Masaj" } ]
}
```

Kurallar:

- `counts`/`ratings`/`salons` **GLOBAL**: filtrelerden bağımsız hesaplanır (select seçenekleri daralmaz).
- `counts.all` = filtresiz toplam yorum sayısı. `counts.visible`/`hidden` = `isVisible`. `counts.replied`/`unreplied` = `salonReply` dolu/boş.
- `ratings` anahtarları **STRING** (`"1"`..`"5"`), eksik puanlar **0**.
- `salons` = yorumu olan salonların **tekil** listesi, ada göre **artan**.
- `search` include'ların **içine değil**, **üst seviye `where`**'e yazılır; `findAndCountAll`'a **`distinct: true, subQuery: false`** verilir.
- Geçersiz parametre → **400** (`express-validator` + mevcut `validate` middleware, `apps/api/src/middlewares/validate.js`). `limit>100` **kırpılır**, hata değil.
- Mevcut `page`/`limit` davranışı korunur (**additive** değişiklik, D9).

Uygulama akışı (bağlayıcı sıra):

```js
const { limit, offset, page } = paginate(req.query.page, req.query.limit);
const { search, rating, visibility = 'all', replied = 'all', salonId, dateFrom, dateTo, sort = 'createdAt', order = 'desc' } = req.query;
// 1) where: visibility (isVisible), replied (salonReply Op.ne null / Op.eq null), rating, salonId,
//           createdAt aralığı (dateFrom 00:00:00, dateTo 23:59:59.999), search (üst seviye Op.or + LOWER(col) LIKE)
// 2) order: sort === 'rating' ? [['rating', DIR], ['createdAt', 'DESC']] : [['createdAt', DIR]]
// 3) Promise.all: findAndCountAll({ where, include, order, limit, offset, distinct: true, subQuery: false })
//                 + Review.count() × 5 (all/visible/hidden/replied/unreplied — GLOBAL)
//                 + ratings: GROUP BY rating (GLOBAL) → eksik puanlar 0 ile doldurulur
//                 + salons: yorumu olan tekil salonId → Salon ad çözümü (GLOBAL, ada göre ASC)
// 4) payload = paginatedResponse(rows, count, page, limit); payload.meta.counts/ratings/salons
```

### 4.2 §B — yeni admin uçları

| Uç | Yetki | Gövde / kural | Yanıt |
|---|---|---|---|
| `PATCH /api/v1/admin/reviews/:id/reply` | `ADMIN` | `{ "reply": "..." }` — `trim`, **1..2000** karakter (`adminReviewReplyValidator`) | `200` → `successResponse(res, { id, salonReply, salonReplyAt })` · `404` → `"Yorum bulunamadı"` (`res.status(404).json({success:false,message})`) · `400` → validator |
| `DELETE /api/v1/admin/reviews/:id` | `ADMIN` | **transaction içinde**: yorumu sil + salonun `ratingAvg`/`reviewCount` değerini **yeniden hesapla** | `200` → `successResponse(res, { id, salonId, ratingAvg, reviewCount })` · `404` → `"Yorum bulunamadı"` |

Kurallar:

- Her iki uç **`apps/api/src/routes/admin.routes.js`** içinde tanımlanır — dosyada `router.use(authenticate, authorize('ADMIN'))` zaten var (`:8`), ek yetki satırı gerekmez.
- **Yeniden hesap deseni:** `apps/api/src/controllers/review.controller.js:38-55` — `Review.findAll` ile `AVG(rating)` + `COUNT(id)`, **yalnız `isVisible: true`** yorumlar üzerinden; `ratingAvg` **1 ondalık** (`Math.round(x * 10) / 10`); yorum kalmadıysa `0` / `0`.
- `DELETE` transaction'ı: `Review.destroy` + `Salon.update` **aynı** `sequelize.transaction` içinde (desen: `create()` `:28-58`).
- `D10` gereği admin yanıtı `salonReply` + `salonReplyAt` alanlarını **günceller**; yeni alan eklenmez.

### 4.3 API test listesi (kabul kanıtı)

1. `rating=5` → dönen her satır `rating === 5`; `meta.total` doğru.
2. `visibility=hidden` → hepsi `isVisible === false`; `visibility=visible` → hepsi `true`.
3. `replied=replied` → hepsinde `salonReply` dolu; `replied=unreplied` → hepsinde `null`/boş.
4. `search` **müşteri adında** eşleşir; büyük/küçük harf duyarsız (`AYŞE` = `ayşe`).
5. `search` **salon adında** eşleşir (join'li `count` doğru kalmalı — R2).
6. `search` **yorum metninde** eşleşir.
7. `salonId` filtresi yalnız o salonun yorumlarını döndürür.
8. `dateFrom` + `dateTo` aralığı; tek başına `dateFrom`; tek başına `dateTo`.
9. `sort=rating&order=asc` → puan artan; `sort=createdAt&order=asc` → createdAt artan.
10. `meta.counts` **filtreden bağımsız**: filtreli istekte de `counts.all` filtresiz toplam; `counts.all === visible + hidden` ve `counts.all === replied + unreplied`.
11. `meta.ratings` filtreli istekte de aynı (global), anahtarlar **string**, eksik puan **0**.
12. `meta.salons` filtreli istekte de aynı (global), `{id,name}` biçiminde, ada göre artan, tekil.
13. `limit=1000` → `meta.limit === 100` (kırpma, hata değil); `limit=50` → 50 istenir.
14. Geçersiz `rating=9`, `visibility=xyz`, `replied=belki`, `sort=price`, `salonId=abc`, `dateFrom=28.10.2026` → **400**.
15. `PATCH /admin/reviews/:id/reply`: 200 + `salonReply` gövdeyle aynı + `salonReplyAt` dolu; boş gövde → 400; 2001 karakter → 400; olmayan id → 404.
16. `DELETE /admin/reviews/:id`: 200 + gövdede `{ id, salonId, ratingAvg, reviewCount }`; silinen salonun `ratingAvg`/`reviewCount` **yeniden hesaplanmış** (son görünür yorum silinince `0`/`0`); gizli yorum silinince ortalama **değişmez**; olmayan id → 404.
17. Geriye uyum: `admin.test.js:560` `GET /admin/reviews` testi **değişmeden** geçer; parametresiz istek bugünkü listeyi verir.

---

## 5. Panel sözleşmesi — §C / §D / §E (`apps/admin_panel`)

### 5.1 §C — `src/lib/reviewsQuery.ts` (saf modül, birebir)

Desen kaynağı (kopyalanacak): `src/lib/appointmentsQuery.ts`. **React/window/localStorage/ağ YOK**, `appointmentsQuery`'den **import YOK** (bağımsız modül; `DATE_PRESET_OPTIONS` ve `dateRangeForPreset` yerel kopya).

```ts
export const REVIEWS_PAGE_SIZES: number[] = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_STORAGE_KEY = 'reviews_page_size';

export type ReviewVisibilityFilter = 'tümü' | 'görünür' | 'gizli';
export type ReviewReplyFilter = 'tümü' | 'yanıtlı' | 'yanıtsız';
export type ReviewRatingFilter = 'tümü' | 1 | 2 | 3 | 4 | 5;
export type ReviewSort = 'createdAt' | 'rating';
export type SortOrder = 'asc' | 'desc';
export type DatePreset = 'tümü' | 'bugün' | 'yarın' | 'bu-hafta' | 'bu-ay' | 'geçmiş' | 'gelecek';

export const REVIEW_VISIBILITY_FILTERS: ReviewVisibilityFilter[];
export const REVIEW_REPLY_FILTERS: ReviewReplyFilter[];
export const REVIEW_RATING_FILTERS: ReviewRatingFilter[];

export const REVIEW_SORT_OPTIONS: { value: string; label: string; sort: ReviewSort; order: SortOrder }[] = [
  { value: 'createdAt:desc', label: 'En yeni', sort: 'createdAt', order: 'desc' },
  { value: 'rating:desc', label: 'En yüksek puan', sort: 'rating', order: 'desc' },
  { value: 'rating:asc', label: 'En düşük puan', sort: 'rating', order: 'asc' },
];

/** `appointmentsQuery` ile aynı 7 değer/etiket. */
export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[];

export interface ReviewsQueryState {
  q: string;
  visibility: ReviewVisibilityFilter;
  rating: ReviewRatingFilter;
  reply: ReviewReplyFilter;
  salonId: string;
  date: DatePreset;
  page: number;
  limit: number;
  sort: ReviewSort;
  order: SortOrder;
}

export const DEFAULT_REVIEWS_QUERY: ReviewsQueryState = {
  q: '', visibility: 'tümü', rating: 'tümü', reply: 'tümü',
  salonId: '', date: 'tümü', page: 1, limit: 20, sort: 'createdAt', order: 'desc',
};

export function parseReviewsQuery(search: string): ReviewsQueryState;
export function buildReviewsQuery(state: ReviewsQueryState): string;          // '?' öneki YOK, varsayılanlar yazılmaz
export function toApiSearchParams(state: ReviewsQueryState, today: Date): string;
export function dateRangeForPreset(preset: DatePreset, today: Date): { dateFrom?: string; dateTo?: string };
export function activeChips(
  state: ReviewsQueryState,
  names?: { salon?: string }
): { key: string; label: string; patch: Partial<ReviewsQueryState> }[];
export function normalizeQuery(state: Partial<ReviewsQueryState>): ReviewsQueryState;
```

**URL parametreleri (Türkçe):** `q`, `gorunum`, `puan`, `yanit`, `salon`, `tarih`, `sayfa`, `limit`, `sirala`.

- `gorunum`: `'tümü'|'görünür'|'gizli'`; eski deep-link `?filter=visible|hidden` → `gorunum` **alias**'ı (**`gorunum` varsa o kazanır**).
- `puan`: `'1'..'5'`; `yanit`: `'tümü'|'yanıtlı'|'yanıtsız'`; `sirala`: `'createdAt:desc'|'rating:desc'|'rating:asc'`.
- **Varsayılanlar URL'e YAZILMAZ**; geçersiz değer varsayılana döner (**hata atılmaz**).

**`toApiSearchParams` eşlemesi:**

| Panel alanı | API parametresi |
|---|---|
| `q` | `search` |
| `puan` | `rating` |
| `gorunum`: `tümü` | **gönderilmez** |
| `gorunum`: `görünür` | `visibility=visible` |
| `gorunum`: `gizli` | `visibility=hidden` |
| `yanit`: `tümü` | **gönderilmez** |
| `yanit`: `yanıtlı` | `replied=replied` |
| `yanit`: `yanıtsız` | `replied=unreplied` |
| `salonId` | `salonId` |
| `tarih` | `dateFrom` / `dateTo` (**yerel takvim, `toISOString()` YOK**) |
| `page` / `limit` / `sort` / `order` | **her zaman** yazılır |

**`activeChips` sırası SABİT:** görünüm → puan → yanıt → salon → tarih → arama. Etiketler birebir:

| Chip | Etiket | `patch` |
|---|---|---|
| görünüm | `Görünüm: Görünür` (seçili değerin etiketi) | `{ visibility: 'tümü', page: 1 }` |
| puan | `Puan: 5 yıldız` | `{ rating: 'tümü', page: 1 }` |
| yanıt | `Yanıt: Yanıtlı` | `{ reply: 'tümü', page: 1 }` |
| salon | `Salon: <ad>` (`names.salon ?? salonId`) | `{ salonId: '', page: 1 }` |
| tarih | `Tarih: <etiket>` | `{ date: 'tümü', page: 1 }` |
| arama | `Arama: "<q>"` | `{ q: '', page: 1 }` |

Her `chip.patch` **ilgili alanı varsayılana çeker** ve **`page: 1`** verir. **Sıralama/sayfa/limit chip üretmez.** `normalizeQuery` geçersiz/eksik değerleri varsayılana, `page < 1` değerini `1`'e, listede olmayan `limit`'i `20`'ye çeker.

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

Biçimlendirme `getFullYear()/getMonth()/getDate()` ile; **`toISOString()` kullanılmaz** (UTC kaydırması günü 1 gün kaydırır — V3/R3).

### 5.2 §D — bileşenler: `src/components/reviews/`

**D1) `Stars.tsx`**

```tsx
export default function Stars({ rating }: { rating: number })
```
Mevcut `reviews/page.tsx` içindeki `Stars` ile **aynı çıktı** (5 ikon, dolu/boş) + `aria-label="<n> yıldız"`.

**D2) `ReviewActions.tsx`**

```tsx
export type ReviewPendingAction = 'reply' | 'visibility' | 'delete' | null;

export default function ReviewActions({
  isVisible,
  hasReply,
  pending = null,
  onDetail,
  onReply,
  onToggleVisibility,
  onDelete,
  className,
}: {
  isVisible: boolean;
  hasReply: boolean;
  pending?: ReviewPendingAction;
  onDetail: () => void;
  onReply: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  className?: string;
})
```

Sıra **SABİT**, hepsi ikonlu (ikonlar `aria-hidden`):

| Sıra | Buton | Metin kuralı | Görsel |
|---|---|---|---|
| 1 | Detay | her zaman `Detay` | `outline`, `Eye` |
| 2 | Yanıtla | `hasReply === true` ise **`Yanıtı düzenle`** | `outline`, `MessageSquare` |
| 3 | Görünürlük | `isVisible === true` ise **`Gizle`**, değilse `Görünür yap` | `outline`, `Eye` / `EyeOff` |
| 4 | Sil | her zaman `Sil` | **`danger`**, `Trash2` |

**Uçuş kuralı (`AppointmentActions` ile aynı):** buton metni **DEĞİŞMEZ**, yalnız uçuştaki buton `disabled` + `Loader2` (`animate-spin`). Dış kapsayıcı: `flex flex-wrap items-center justify-end gap-2`.

**D3) `ReviewDetailDialog.tsx`**

```tsx
export interface ReviewDetail {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  salonReply: string | null;
  salonReplyAt: string | null;
  createdAt: string;
  customerName: string;
  salonName: string;
  images?: string[];
}

export default function ReviewDetailDialog({
  review,
  open,
  onClose,
}: {
  review: ReviewDetail | null;
  open: boolean;
  onClose: () => void;
})
```

- Mevcut `Dialog` bileşeni kullanılır: `title="Yorum detayı"`, `size="lg"`, `footer` = `Kapat` butonu. **Ağ isteği YOK.**
- İçerik: müşteri adı + salon adı, `Stars`, tarih (`tr-TR` uzun biçim), yorum metni (yoksa `"Yorum yazılmamış."`), `images` varsa küçük görsel listesi (`img`, `alt="<müşteri> yorum görseli <n>"`), salon yanıtı + tarihi varsa blok, görünürlük rozeti (`Badge`: `Görünür` / `Gizli`).
- `review === null` ise **`open` olsa bile `null` render**.

### 5.3 §E — sayfa: `src/app/reviews/page.tsx`

- **Kart ızgarası (`grid-cols-1 gap-4 lg:grid-cols-2`) KORUNUR** (`:192`); filtre çubuğu + chip satırı + sunucu taraflı filtreleme + işlemler **eklenir**. Tabloya çevrilmez.
- **Durum:** `ReviewsQueryState` + URL senkronu — `appointments/page.tsx` deseni: `window.location` okuma (`useSearchParams` statik prerender'da `Suspense` zorunlu kıldığı için), `router.replace`, `lastWrittenQuery` ref, `updateFilter`, `clearFilters`, `AbortController`, `useDebouncedValue(q, 300)`.
- **Filtre çubuğu** (`FilterBar`, `leading` = arama `Input`; sarmalayıcı `min-w-[10rem] flex-1 overflow-hidden`):

| Kontrol | Seçenekler |
|---|---|
| `Select` "Görünüm" | `Tümü (counts.all)` · `Görünür (counts.visible)` · `Gizli (counts.hidden)` |
| `Select` "Puan" | `Tüm puanlar` · `5..1 yıldız` (`meta.ratings["n"]`) |
| `Select` "Yanıt" | `Tümü (counts.all)` · `Yanıtlı (counts.replied)` · `Yanıtsız (counts.unreplied)` |
| `Select` "Salon" | `Tüm salonlar` + `meta.salons` |
| `Select` "Tarih" | `DATE_PRESET_OPTIONS` |

- **Sayaçlar `meta` yoksa parantezsiz** basılır (ilk yüklemede `()` görünmesin).
- **Sıralama UI'da YOK** (sabit `createdAt:desc`; lib `sirala` parametresini destekler).
- **Genişlik sınıfları `appointments/page.tsx` ile aynı desen:** her select sarmalayıcısı `!min-w-[8.5rem] max-w-48 flex-1`. `!` şart: `FilterBar` kökündeki `[&>*]:min-w-0` kuralı `min-w-*` tabanını eziyor (AP-007/AP-008 dersi).
- **Chip satırı:** `FilterChips` — `chips={activeChips(query, { salon: seciliSalonAdi })}`, `onClearAll={clearFilters}`. Filtre çubuğundan **ayrı blok** (AP-009 §2.3 deseni).
- **Kart alt satırı** (`border-t`) **SAĞA hizalı** `ReviewActions` ile doldurulur; **boş işlem alanı KALMAZ** (H3).
- **Tek `pending` state:** `` `${id}-reply` `` | `` `${id}-visibility` `` | `` `${id}-delete` `` → `ReviewActions` `pending` prop'una çevrilir.
- **İşlem akışları:**

| İşlem | Akış |
|---|---|
| **Detay** | `ReviewDetailDialog` (satır verisiyle; **ağ isteği yok**) |
| **Yanıtla** | `Dialog` + `Textarea` (mevcut `salonReply` ile dolu, 1..2000) → `PATCH /admin/reviews/:id/reply` gövde `{ reply }` |
| **Görünürlük** | `PATCH /reviews/:id/toggle-visibility` (**mevcut uç**, `review.routes.js:11`), **optimistik** güncelleme |
| **Sil** | onay `Dialog`'u ("Yorum kalıcı olarak silinecek") → `DELETE /admin/reviews/:id` → başarıda `fetchReviews()` (V1) |

- **Başarı/hata mesajı:** `<p role="status" aria-live="polite">` ile (`appointments/page.tsx` notice deseni). **`alert()` KULLANMA** (bugün `:108` `alert(...)` var — kaldırılır).
- **Pagination:** `<Pagination total={meta.total} pageSize={query.limit} pageSizeOptions={REVIEWS_PAGE_SIZES} onPageSize={changePageSize} … />`; `localStorage` anahtarı `REVIEWS_PAGE_SIZE` (`'reviews_page_size'`), boyut değişince `page=1`.
- **Client-side filtreleme (`reviews.filter`) KALDIRILIR**; API'den gelen `data.data` doğrudan basılır (H4). `filtered.length === 0` → `EmptyState` yerine `rows.length === 0`.
- **401/403 → `router.push('/login')`**; diğer hatalar `ErrorState` + `Yenile`.

### 5.4 Yerleşim (tek satır + chip satırı + kart ızgarası + sayfalama)

```
[ 🔍 Ara (flex-1) ] [ Görünüm ▾ ] [ Puan ▾ ] [ Yanıt ▾ ] [ Salon ▾ ] [ Tarih ▾ ]
[ Görünüm: Görünür × ] [ Puan: 5 yıldız × ] [ Tarih: Bu ay × ] [ Arama: "ayşe" × ]   (4 filtre etkin)   [ Temizle ]
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Ayşe Yılmaz   [Görünür]     │  │ Mehmet K.     [Gizli]       │
│ Zen SPA & Masaj             │  │ Güzellik Merkezi            │
│ ★★★★★            28.10.2026│  │ ★★★☆☆            27.10.2026│
│ Yorum metni…                │  │ Yorum metni…                │
│ ┌ Salon yanıtı ───────────┐ │  │                             │
│ └─────────────────────────┘ │  │                             │
│ ─────────────────────────── │  │ ─────────────────────────── │
│   [Detay][Yanıtla][Gizle][Sil] │   [Detay][Yanıtla][Görünür yap][Sil]
└─────────────────────────────┘  └─────────────────────────────┘
[ 1–20 / 9 ]                                                                       [ 20 ▾ ]   ‹  ›
```

- **6 kontrol** (arama + 5 select); `trailing` kullanılmaz, `Yenile` `PageHeader.actions` içinde kalır.
- `<1024px`: `FilterBar` kökü `flex-wrap` ile sarar; chip satırı `FilterChips` içinde yatay kayar (**kabul istisnası**, H1).

---

## 6. Uygulama dalgaları ve dosya sahipliği (W1..W5)

| Wave | Görev | Dosyalar (sahiplik) | Bağımlılık |
|---|---|---|---|
| **W1** | **API filtre + global sayaçlar** — `getAllReviews` yeniden yazılır (§4.1), `adminReviewQueryValidator` eklenir, route'a validator bağlanır, testler | `apps/api/src/controllers/admin.controller.js` (`getAllReviews`), `apps/api/src/validators/admin.validator.js`, `apps/api/src/routes/admin.routes.js:13`, `apps/api/tests/admin.test.js` | — |
| **W2** | **API yeni uçlar** — `PATCH /admin/reviews/:id/reply` + `DELETE /admin/reviews/:id` (§4.2), `adminReviewReplyValidator`, transaction'lı yeniden hesap, testler | `apps/api/src/controllers/admin.controller.js` (`replyReview`, `deleteReview`), `apps/api/src/validators/admin.validator.js`, `apps/api/src/routes/admin.routes.js`, `apps/api/tests/admin.test.js` | **W1** (aynı dosyalar — sıralı, paralel değil) |
| **W3** | **Panel saf modül + bileşenler** — `reviewsQuery.ts`, `Stars.tsx`, `ReviewActions.tsx`, `ReviewDetailDialog.tsx` + testleri | `apps/admin_panel/src/lib/reviewsQuery.ts`, `src/components/reviews/{Stars,ReviewActions,ReviewDetailDialog}.tsx`, `tests/lib/reviewsQuery.test.ts`, `tests/unit/components/{ReviewActions,ReviewDetailDialog}.test.tsx` | — (W1'den bağımsız; sözleşme §5.1/§5.2 sabit) |
| **W4** | **Panel sayfa entegrasyonu** — `reviews/page.tsx` yeniden yazılır (§5.3/§5.4), sayfa testi | `apps/admin_panel/src/app/reviews/page.tsx`, `apps/admin_panel/tests/unit/pages/reviews.test.tsx` | **W2 + W3** (yeni uçlar + bileşenler) |
| **W5** | **Kapı + doküman + indeks** — chromium harness, `docs/ADMIN-PANEL.md` yorum filtresi bölümü, `plans/admin/INDEX.md` AP-010 satırı | `screenshots/_harness/plan-admin-reviews-filters.js`, `screenshots/admin-reviews-filters-{1440,1280,390}.png`, `docs/ADMIN-PANEL.md`, `plans/admin/INDEX.md` | **W2 + W4** yeşil |

### Test özeti (hedef adet)

| Katman | Dosya | Adet (hedef) |
|---|---|---|
| API (mocha+chai) | `apps/api/tests/admin.test.js` | **+17** (mevcut `GET /admin/reviews` testi korunur) |
| Panel — saf mantık (`node:test`, ağsız) | `tests/lib/reviewsQuery.test.ts` | **~22** (parse/build/toApi/dateRange/activeChips/normalize; preset sınırları: ay sonu, ISO hafta, yılbaşı) |
| Panel — bileşen (vitest+jsdom) | `ReviewActions` (~10), `ReviewDetailDialog` (~7), `Stars` (~3) | **~20** |
| Panel — sayfa | `tests/unit/pages/reviews.test.tsx` | **~12** |
| Görsel | harness (tek satır + taşma + select genişliği + kart işlem sayısı) | 3 ölçüm |

### Riskler ve tuzaklar

| # | Risk | Önlem |
|---|---|---|
| **R1** | 6 kontrol 1280px'te tek satıra sığmaz (H1 ihlali) | Sarmalayıcı `!min-w-[8.5rem] max-w-48 flex-1` (AP-008 S3 dersi); arama yuvası `min-w-[10rem] flex-1 overflow-hidden`. Sığmazsa **ilk düşürülecek kontrol "Puan" değil "Yanıt"tır** — gerekçe yazılır (§10) |
| **R2** | `search` + join'li `count` → yanlış `meta.total` (AP-007 R1'in yorum karşılığı) | `distinct: true, subQuery: false` + üst seviye `where` + `LOWER(kolon)`; kilit test: §4.3 test 5 |
| **R3** | Tarih preset'i `toISOString()` ile 1 gün kayar | `getFullYear/getMonth/getDate`; `dateRangeForPreset` testleri ay sonu + yılbaşı sınırında |
| **R4** | `DELETE` sonrası `ratingAvg`/`reviewCount` bayat kalır (B10) | Yeniden hesap **aynı transaction'da**; kilit test: §4.3 test 16 (gizli yorum silinince ortalama değişmez) |
| **R5** | Debounce + yavaş cevap → eski sonuç yeni filtreyi ezer | `AbortController` + iptal edilen istek state yazmaz (V3) |
| **R6** | Chip/Temizle URL'i güncellemezse geri tuşu tutarsız | Tek kaynak `state → URL` (`router.replace`, `scroll: false`); sayfa testi kilitler |
| **R7** | İşlem alanı yine eksik kalır (asıl şikâyet) | H3 testi: her kartta `getAllByRole('button').length >= 4` |
| **R8** | `meta.ratings` anahtarları sayı sanılıp `ratings[5]` ile okunur | Anahtarlar **string**; panel `meta.ratings[String(n)]` okur (§5.3) |
| **R9** | `localStorage` SSR'da `window` yok → hydration hatası | Yalnız `useEffect` içinde okunur/yazılır; state başlangıcı `DEFAULT_PAGE_SIZE` |
| **R10** | Paralel worker'lar aynı worktree'de birbirinin dosyasını commit'ler | W1/W2 ve W3/W4 dosya kümeleri **ayrık**; commit'ler pathspec'li: `git commit -m "…" -- <dosyalar>` |
| **R11** | `admin.test.js` içinde W1 ve W2 aynı dosyaya yazar | W1 → W2 **sıralı** (paralel değil); W2 başlamadan W1 commit'lenir |

---

## 7. Geri dönüş (rollback)

- **Migration YOK**, veritabanı şeması değişmiyor → veri geri dönüşü gerekmez. Yeni alan da eklenmiyor (D10: `adminReply` yok).
- **API additive (D9):** yeni parametreler yoksa davranış bugünküyle aynı; `meta`'ya alan **eklemek** kırıcı değil. Yeni uçlar (`reply`/`delete`) **yeni yol** — silinmeleri eski istemcileri etkilemez. Dolayısıyla **API ve panel ayrı ayrı** geri alınabilir.
- **Panel:** W3 üç yeni dosya + `reviewsQuery.ts` (silinmesi zararsız; hiçbir mevcut dosya onlara bağımlı değil); W4 **tek** dosyada yoğunlaşır (`reviews/page.tsx`) → `git revert <W4 commit>` yeterli, kart ızgarası ve mevcut `toggle-visibility` akışı eski hâline döner.
- **Bağımsız geri alma:** her dosya kendi commit'inde → `git checkout <commit>~1 -- <dosya>` ile tek dosya geri alınabilir. `git reset --hard` kullanılmaz; commit'ler pathspec'li.
- **Veri etkisi:** `DELETE` ucu geri alınırsa silinmiş yorumlar **geri gelmez** (fiziksel silme); bu yüzden silme **onay dialog'lu** (D7) ve uç yalnız `ADMIN` rolüne açık.

### Kapsam dışı (bilinçli)

- **Toplu (bulk) işlem YOK** (checkbox + "seçilenleri sil").
- **Yeni yorum oluşturma / düzenleme YOK** (müşteri akışı `apps/customer_app`).
- **Görsel yükleme/düzenleme YOK** (V4: yalnız okuma).
- **Tablo görünümü / `DataTable` YOK** — kart ızgarası korunur.
- **Sıralama UI'ı YOK** (D1; lib `sirala` destekler).
- **Diğer sayfalar kapsam dışı** (salons/appointments/categories filtre çubuklarına dokunulmaz).
- Özel tarih aralığı UI'ı (iki `date` input), CSV dışa aktarma, e-posta/SMS tetikleme.

---

## 8. Doğrulama komutları ve kanıt beklentileri

### 8.1 Kapı komutları

```bash
# Panel (H7)
cd /home/baris/orca/beauty-salon/apps/admin_panel && npm run typecheck && npm run lint && npm test
# API (H7)
cd /home/baris/orca/beauty-salon/apps/api && npm test
# Tek komut kapı (tam mod)
~/.pi/agent/bin/verify.sh
```

**Ölçülen kanıt (2026-10-28, gerçek çıktı):** `typecheck` çıktısız **exit 0** · `lint` **exit 0, 0 uyarı** · `npm test` **110 node + 260 vitest** (30 dosya, baseline AP-009 **84 + 218** → **+26 / +42**) · `cd apps/api && npm test` **354 passing / 0 failing** (baseline **329** → **+25**, sonuncusu gun siniri testi) · `verify.sh` (mod=full) **TAMAM ✔** (exit 0, 5 adım).

### 8.2 Elle API kanıtı

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@beautysalon.com","password":"Admin123!"}' | jq -r .data.accessToken)

# §A: meta anahtarları (counts/ratings/salons) + global olduğunun kanıtı
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/reviews?limit=20' | jq '.meta'
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/reviews?rating=5&visibility=visible' | jq '.meta.counts, .meta.ratings'
# → filtreli istekte de sayaçlar filtresiz değerleri vermeli (H5)

# §A: sunucu tarafı filtre + sıralama
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/reviews?search=zen&sort=rating&order=desc' | jq '.meta.total, .data[0].rating'

# §A: geçersiz parametre → 400
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN" 'localhost:3000/api/v1/admin/reviews?rating=9'

# §B: admin yanıtı + silme
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"reply":"Geri bildiriminiz için teşekkürler."}' \
  "localhost:3000/api/v1/admin/reviews/$RID/reply" | jq '.data'
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "localhost:3000/api/v1/admin/reviews/$RID" | jq '.data'
```

### 8.3 Görsel kanıt (W5)

```bash
cd /home/baris/orca/beauty-salon/apps/admin_panel && npm run build
# izole next start -p 3011 + chromium --remote-debugging-port=9456
ADMIN_BASE=http://127.0.0.1:3011 API_BASE=http://127.0.0.1:3000 CDP_PORT=9456 \
  node screenshots/_harness/drive.js screenshots/_harness/plan-admin-reviews-filters.js
```

**Ölçülen değerler (H1/H3, gerçek chromium — hedef `/reviews?puan=5&yanit=yanıtlı&tarih=bu-ay`, 3 kart):**

| Genişlik | `singleRow` | `uniqueCenterCount` | `barHeight` | `overflow` | `minSelectWidth` | `cardsWith4Actions` |
|---|---|---|---|---|---|---|
| 1440×900 | **`true`** | 1 | **44px** | **0** (1440 = 1440) | **178** | **3/3** |
| 1280×800 | **`true`** | 1 | **44px** | **0** (1265 = 1265) | **143** | **3/3** |
| 390×844 | `false` (sarma: 3 satır, 148px — beklenen) | 3 | 148px | **0** (375 = 375) | 143 | **3/3** |

Ek ölçümler: `selectsClipped false` ve `selectsTextFits true` (1440/1280/390) · arama input'u ↔ ilk select arası **8px** (kesişim yok) · chip satırı 3 chip, özet ile örtüşme **0** (390'da liste kendi içinde kayar `403/343`, özet alt satırda) · kart başına **4** buton, boş işlem alanı **0** · konsol hatası / JS hatası / başarısız ağ isteği **0** (`diag`).

Ekran görüntüleri: `screenshots/admin-reviews-filters-{1440,1280,390}.png`.

### 8.4 Değişiklik kapsamı kanıtı

```bash
cd /home/baris/orca/beauty-salon && git status --short   # yalnız planlanan dosyalar
git diff --numstat -- plans/admin/INDEX.md               # 1 ekleme, 0 silme
git diff -U0 -- plans/admin/INDEX.md                     # tek hunk (AP-010 satırı)
```

---

## 9. İndeks kaydı (`plans/admin/INDEX.md`)

Tabloya **tek satır** eklendi (AP-009 satırının hemen altına; başka satır değişmedi) — `git diff --numstat -- plans/admin/INDEX.md` → **1 0**, tek hunk `@@ -15,0 +16 @@`, silme **0**:

```
| **AP-010-reviews-filter-actions.md** | `apps/admin_panel` Yorum Yönetimi: filtrelerin **tek satırda** toplanması (arama, görünüm, puan, yanıt, salon, tarih preset), etkin filtre **chip'leri + Temizle**, **sunucu tarafı** filtreleme (`search`/`rating`/`visibility`/`replied`/`salonId`/`dateFrom`/`dateTo`/`sort`/`order`), **global sayaçlar** (`meta.counts`) + `meta.ratings`/`meta.salons`, sayfalama **20/50/100** (varsayılan 20, `localStorage` `reviews_page_size`), URL senkronu (`q`/`gorunum`/`puan`/`yanit`/`salon`/`tarih`/`sayfa`/`limit`/`sirala`), kart işlemleri **Detay / Yanıtla-Yanıtı düzenle / Görünür yap-Gizle / Sil**; `apps/api`'de `GET /admin/reviews` genişletmesi + `PATCH /admin/reviews/:id/reply` + `DELETE /admin/reviews/:id` | **UYGULANDI** (2026-10-28) — 6 kontrol (arama + Görünüm/Puan/Yanıt/Salon/Tarih; sıralama UI'da yok), chip'ler + Temizle, kart işlemleri **Detay / Yanıtla-Yanıtı düzenle / Görünür yap-Gizle / Sil**, istemci filtresi kaldırıldı; gerçek chromium ölçümü: **1440/1280'de tek satır** (`barHeight` **44px** ≤56, `overflow 0`), `minSelectWidth` **178/143**, 390'da sarma + **taşma 0**; kapılar: admin_panel **110 node + 260 vitest**, api **354 passing / 0 failing**, `verify.sh` (mod=full) **TAMAM**; kanıt `screenshots/admin-reviews-filters-{1440,1280,390}.png` + harness `screenshots/_harness/plan-admin-reviews-filters.js` |
```

---

## 10. Plan ↔ kod farkları (§8)

Uygulama bitti; aşağıdaki **dört** sapma bilinçlidir ve kodla birebir uyumludur. Sapma dışında §4 (API) ve §5 (panel) sözleşmeleri — parametre adları, `meta` anahtarları, lib imzaları, bileşen prop'ları — **aynen** uygulandı.

### 10.1 Sapmalar

| # | Sapma | Neden + kanıt |
|---|---|---|
| **S1** | **Yanıt handler'ının adı `replyToReview`** (plan §6 W2 satırında `replyReview` yazıyordu) | Uç yolu, gövdesi ve yanıt şeması sözleşmeyle aynı (`admin.routes.js` → `router.patch('/reviews/:id/reply', …)` → `admin.controller.js` `replyToReview`); yalnız iç fonksiyon adı farkı, API sözleşmesine etkisi yok |
| **S2** | **Tarih sınırları API'de UTC yorumlanıyordu** (`createdAt >= …T00:00:00.000Z`, `<= …T23:59:59.999Z`); plan zaman dilimi belirtmiyordu, panel ise **yerel takvim** `YYYY-MM-DD` üretiyor | `admin.controller.js` içindeki `dateRange[Op.gte] = new Date(\`${dateFrom}T00:00:00.000Z\`)`. UTC+3'te filtre penceresi **3 saat kayıyordu**: günün ilk saatlerindeki yorumlar `bugün`/`bu-ay` dışında kalabiliyordu. **Düzeltildi** (2026-10-28): sınır artık `Z` olmadan, yani **yerel** parse ediliyor (`T00:00:00.000` / `T23:59:59.999`); sınır kanıtı `admin.test.js` içindeki `dateFrom gün sınırı YEREL takvimde…` testinde (gün başı +30 dk döner, önceki gün 23:30 dönmez) — §10.2 R1 |
| **S3** | **`npm run lint` 1 uyarı veriyordu** (`@next/next/no-img-element`, `components/reviews/ReviewDetailDialog.tsx`); plan §8.1 "0 hata/uyarı" diyordu | **DÜZELTİLDİ (2026-10-28):** `next/image` yerine hedefli `eslint-disable-next-line` + Türkçe gerekçe yorumu eklendi (uzak alan adı `remotePatterns` yapılandırması hâlâ kapsam dışı, V4). `npm run lint` artık **0 uyarı**, exit 0 |
| **S4** | **Kart işlemleri `pending` durumunu tek string ile taşıyor** (`` `${id}-reply` `` / `` `-visibility` `` / `` `-delete` `` + `pendingFor()` çevirici) | Plan §5.3 "tek `pending` state" diyordu; uygulama aynı semantiği string anahtarla kurdu (`reviews/page.tsx` `pendingFor`). Davranış sözleşmeyle aynı, `ReviewActions` prop'u `ReviewPendingAction` |

**Sapma olmayan, doğrulanan noktalar:** filtre seti 6 kontrol (D1) · chip sırası görünüm→puan→yanıt→salon→tarih→arama (D5) · işlem sırası ve `danger` yalnız `Sil`'de (D6) · onay yalnız `Sil`'de (D7) · `counts`/`ratings`/`salons` global (D3/H5) · admin yanıtı `salonReply` alanını günceller, `adminReply` yok (D10) · istemci filtresi kaldırıldı (H4) · `alert()` yok, `role="status"` var · `reviews_page_size` + boyut değişince `page=1` (H6) · AP-007/AP-008 bileşenleri **değişmeden** yeniden kullanıldı (D8) — `FilterBar`/`FilterChips`/`Pagination`/`AppointmentActions` testleri dokunulmadan geçiyor · `?filter=visible|hidden` eski deep-link alias'ı çalışıyor.

### 10.2 Kalan riskler

| # | Risk | Durum |
|---|---|---|
| **R1** | Tarih sınırı UTC ↔ panel yerel takvim (S2) | **DÜZELTİLDİ** (2026-10-28): sınır **yerel takvim** olarak kuruluyor (`new Date(\`${dateFrom}T00:00:00.000\`)` / `…T23:59:59.999`, `Z` yok) ve sınır testi eklendi (`apps/api/tests/admin.test.js` — gün başından 30 dk sonraki yorum `dateFrom=<gün>` ile **döner**, önceki gün 23:30'daki **dönmez**). `getAllAppointments` etkilenmedi (randevu tarihi `DATEONLY`) |
| **R2** | Seed'de **gizli yorum yok** (`counts.hidden = 0`) | `Gizli` filtresi ve `Gizli` rozeti **gerçek veriyle doğrulanmadı**; kapsam API testinde (`visibility=hidden`) ve sayfa testinde |
| **R3** | Lint uyarısı (S3) | **Kapandı:** 0 uyarı (hedefli eslint-disable + gerekçe). `next/image` + `remotePatterns` ayrı bir iş kalemi olarak duruyor |
| **R4** | Arama input'u 1440px'te 192px; placeholder (`Müşteri, salon veya yorum metni ara…`) kırpılıyor | Ölçüldü (ekran görüntüsü); işlevsel değil, `aria-label="Yorum ara"` erişilebilir adı tam. Kabul edildi |
