# 🏨 Admin Panel — Detaylı Doküman

> Oluşturulma: 2026-01  
> Kapsam: `apps/admin_panel/` (Next.js)

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Proje Yapısı](#proje-yapısı)
4. [Routing](#routing)
5. [Layout](#layout)
6. [Admin Endpoint'ler](#admin-endpointler)

---

## Proje Özeti

Admin Panel, salon sahibinin salonunu yönetmek için kullanılır.

---

## Teknoloji Yığını

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| Framework | Next.js 16.1.6 | |
| UI | Tailwind CSS 4 | |
| Chart | recharts | |
| Icons | lucide-react | |
| Language | TypeScript 5 | |

---

## Proje Yapısı

```
apps/admin_panel/
├── .next/                    # Next.js build output
├── public/                    # Static files
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with Sidebar
│   │   ├── globals.css        # Global styles
│   │   ├── page.tsx           # Main page
│   │   ├── appointments/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── settings/page.tsx
│   │   └── users/page.tsx
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── providers/
│   │   └── DashboardProvider.tsx
│   └── ...
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Routing

```
/login                          (public, no scaffold)
/register                       (public, no scaffold)
ShellRoute (SalonMainScaffold)
  /dashboard                    → DashboardScreen
  /salons                       → SalonsScreen
  /appointments                 → AppointmentsScreen
  /users                        → UsersScreen
  /settings                     → SettingsScreen
  /reviews                      → ReviewsScreen
```

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Beauty Salon Admin Panel                     │
├──────────────────────────────────────────────────────────────────────┤
│  Sidebar (Sidebar)                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Main Content                                                   ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tema (Dark Mode)

Admin panel **light / dark / system** olmak üzere üç durumlu tema destekler.

### Mimari

```
:root            → light CSS değişkenleri      (src/app/globals.css)
.dark            → dark CSS değişkenleri       (aynı dosya, :root'tan SONRA)
@theme inline    → Tailwind utility'leri       (bg-surface, text-fg, border-border …)
```

Sayfalar **semantic token** kullanır; tema `dark:` yazmadan otomatik döner.

| Token | Light | Dark |
|---|---|---|
| `background` | `#F4EEE3` | `#14110D` |
| `surface` | `#FFFDF8` | `#221C16` |
| `surface-variant` | `#F1E9DC` | `#2C241C` |
| `border` | `#DFD5C4` | `#3D3327` |
| `border-strong` | `#C6B9A3` | `#5A4C3B` |
| `divider` | `#E3D9C7` | `#332B22` |
| `fg` | `#1A1815` | `#F4EDE1` |
| `fg-muted` | `#5C5449` | `#BDB2A0` |
| `fg-subtle` | `#736959` | `#9A8F7C` |
| `primary` | `#6B4FB8` | `#B29AE8` |
| `primary-dark` | `#43307F` | `#9C82DC` |
| `primary-light` | `#9A82D0` | `#C9B6F0` |
| `primary-solid` / `primary-solid-hover` | `#4E3893` / `#43307F` | `#9C82DC` / `#8F72D8` |
| `on-primary` | `#FFFFFF` | `#14110D` |
| `secondary` | `#EFE6D8` | `#2C241C` |
| `accent` | `#C9B79A` | `#D8C6A4` |
| `accent-lime` / `on-accent-lime` | `#C6A664` / `#1A1815` | `#D8B872` / `#14110D` |
| `nav-pill` / `on-nav-pill` | `#1A1815` / `#F4EEE3` | `#0E0B08` / `#F4EDE1` |
| `on-nav-pill-muted` | `#B7AC99` | `#A79C88` |
| `hero-surface` | `#EFE6D8` | `#2C241C` |
| `banner-from` / `banner-to` | `#4E3893` / `#2A1F52` | `#3A2A6E` / `#1E1440` |
| `success` / `error` / `warning` / `info` | `#2F6B4F` / `#A8323C` / `#7A5200` / `#2A5A8C` | `#6FC08F` / `#F08A8A` / `#E0B060` / `#8AB4E8` |

Palet kaynağı (LX-001, “lux editorial”): `plans/admin/AP-012-lux-editorial-tokens.md`.

`fg-subtle` yalnızca ikon/ipucu içindir; gövde metni `fg-muted` kullanır.
`on-primary`, `bg-primary` üzerindeki metin/ikon içindir (dark'ta beyaz okunmaz).
`accent-lime` artık **şampanya** altını: yalnızca dolgu / kenarlık / hairline / ikon olarak kullanılır, **metin rengi olamaz** (`#C6A664` açık yüzeyde 2.29:1). Metin gerekiyorsa `fg` kullanılır.
Kontrast matrisi: `node scripts/wcag_tokens.js --scope admin --strict` (çıkış 0 olmalı).

### Kalıcılık

- `localStorage` anahtarı: **`app_theme`** (salon_app ile aynı), değerler `light` / `dark` / `system`.
- Tercih **sunucuya kaydedilmez** (client-side kullanıcı tercihi).

### Dosyalar

| Dosya | Rol |
|---|---|
| `src/app/globals.css` | Token katmanı, `@custom-variant dark`, `badge-*` utility'leri |
| `src/providers/ThemeProvider.tsx` | `useSyncExternalStore` tabanlı 3 durumlu tema context'i |
| `src/components/ThemeToggle.tsx` | Segment kontrol (Açık / Koyu / Sistem) |
| `src/lib/chartTheme.ts` | Recharts için tema farkındalı renkler |
| `src/app/layout.tsx` | FOUC önleyen inline script + `suppressHydrationWarning` |

Tema seçici: **Sidebar alt kısmı**, **Ayarlar › Görünüm** ve **giriş ekranı**.

### Yeni badge eklerken

Tekrar eden rozet stilleri `globals.css` içinde utility olarak tanımlıdır:

```tsx
<span className="badge-success">Tamamlandı</span>
<span className="badge-info">Müştéri</span>
<span className="badge-error">Admin</span>
<span className="badge-warning">Bekliyor</span>
<span className="badge-purple">Salon Sahibi</span>
<span className="badge-neutral">—</span>
```

---

## Admin Endpoint'ler

| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Dashboard (stats, recent appointments, reviews) |
| GET | `/admin/salons` | ADMIN | Tüm salonlar (verified filter, sayfalı) |
| GET | `/admin/appointments` | ADMIN | Tüm randevular (status filter, sayfalı) |
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı; `search`/`rating`/`visibility`/`replied`/`salonId`/`dateFrom`/`dateTo`/`sort`/`order` + `meta.counts`/`ratings`/`salons`) |
| PATCH | `/admin/reviews/:id/reply` | ADMIN | Admin yanıtı yazar (`salonReply` + `salonReplyAt`) |
| DELETE | `/admin/reviews/:id` | ADMIN | Yorumu siler + salonun `ratingAvg`/`reviewCount` değerini yeniden hesaplar |
| POST | `/upload/video` | ADMIN | Video yükleme (mp4/webm/ogg/quicktime, ≤50 MB) |

---

## Salon Yönetimi — filtre çubuğu (AP-007)

`apps/admin_panel/src/app/salons/page.tsx` + `components/ui/{FilterBar,FilterChips}.tsx`.

### Yerleşim sözleşmesi

| Genişlik | Kural |
|---|---|
| ≥1024px | Çubuk `lg:flex-nowrap`: tüm kontroller **tek satır** (tek dikey merkez), çubuk yüksekliği ≤ 56px |
| <1024px | `flex-wrap`: çubuk sarar (kabul istisnası); yatay **taşma yok** (`scrollWidth <= clientWidth`) |

Görünüm seçimi (Tablo/Kartlar) filtre değil sunum kontrolü olduğu için **başlık aksiyonlarına** taşındı; 1280px'te filtre çubuğuna sığmıyordu.

### Ölçülen kök nedenler (2026-10-27, production build)

1. **`w-full` ezmesi:** `Field.tsx` içindeki `CONTROL` taban sınıfı `w-full` taşıyor; `cx` sınıf birleştirmediği için `Select`'e verilen `w-40` **eziliyordu**. Select'ler satırı 1105px genişliğe şişirip 1440px'te bile 2773px yatay taşma üretiyordu. Çözüm: genişlik sınıfları **sarmalayıcıda** (`<div className="min-w-28 max-w-40 flex-1">`), kontrol `w-full` ile doluyor.
2. **`min-w-0` ezmesi:** `FilterBar`'ın `[&>*]:min-w-0` kuralı `leading` yuvasının `min-w-[12rem]`'ini eziyor, arama 65px'e çöküp input komşu sekmelerin **üzerine biniyordu** (ölçüm: `inputRight 448` > `firstTabLeft 365`, 83px örtüşme). Çözüm: kural **bileşenin kendisinde** çözüldü — `FilterBar` yuvası `!min-w-[12rem]` (`!` özgüllük yarışını bitirir), sayfa yalnız `min-w-[10rem] flex-1 overflow-hidden` sarmalayıcı verir.
3. **2px dikey kayma:** `Tabs` kökü `pb-1` ayırıyor; sekme düğmeleri 112px'te, input/select 114px'te başlayıp "tek satır" ölçütünü (`benzersiz dikey merkez = 1`) düşürüyordu. Çözüm: `Tabs`'a `-mb-1`.
4. **Chip satırı örtüşmesi (390px):** `FilterChips` kökü `flex` (nowrap) + liste `-mx-1` negatif margin'liydi; liste daralınca son chip kırpılıyor ve "3 filtre etkin" özeti chip'in **üzerine biniyordu**. Çözüm: kök `flex flex-wrap`, liste `flex-1 min-w-[12rem] overflow-x-auto` (kendi içinde kayar, negatif margin yok), özet + Temizle **ayrı flex öğesinde** (`shrink-0`) — dar ekranda alt satıra iner.

### Kanıt (harness)

`CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-salons-filters.js`
(production `next start`, API :3000 canlı; ekran görüntüsü **veri geldikten sonra**: `table tbody tr > 0` ya da boş durum, en fazla 20 sn).

| Genişlik | `scrollWidth/clientWidth` | Tek satır | Çubuk | Kontrol | Chip satırı |
|---|---|---|---|---|---|
| 1440 | 1440/1440 → taşma **0** | evet (merkez 1) | 44px | 8 (arama + 4 durum sekmesi + 3 select) | tek satır, örtüşme **0** |
| 1280 | 1280/1280 → taşma **0** | evet (merkez 1) | 44px | 8 | tek satır, örtüşme **0** |
| 390 | 390/390 → taşma **0** | hayır (3 satır, istisna §5.3) | 148px | 8 | liste kendi içinde kayar (`440/343`), özet **alt satırda**, örtüşme **0** |

Arama input'u ile ilk sekme arasındaki yatay boşluk 1440/1280'de **12px** (kesişim yok; eski durumda 83-94px örtüşme vardı).

Kanıt görselleri: `screenshots/admin-salons-filters-{1440,1280,390}.png` (tablo satırı görünür).

---

## Kategori Yönetimi — tablo, filtre çubuğu ve medya (AP-009)

`apps/admin_panel/src/app/categories/page.tsx` (kart ızgarası → `DataTable`) + `src/lib/categoriesQuery.ts` (saf mantık) + `components/categories/VideoField.tsx`. Plan: `plans/admin/AP-009-categories-table-filters-media.md`.

### Tablo kolonları

| Kolon | İçerik | Mobil |
|---|---|---|
| Kategori | dairesel ikon çipi + kategori adı | `mobile: "primary"` |
| Açıklama | blok metin, `line-clamp-2` | — |
| Medya | 40×40 görsel + varsa **Video** badge'i | — |
| Hizmet | sağ hizalı sayı, `tnum` | — |
| Durum | Aktif / Pasif badge | — |
| İşlemler | **Düzenle** + **Sil** | `mobile: false` |

Kart ızgarası **korundu**; görünüm seçimi (Tablo / Kartlar) AP-007'deki aynı kararla **başlık aksiyonlarındadır** (filtre değil sunum kontrolü).

### Filtre kontrolleri (tek satır, ≥1024px)

1. **Arama** — `Input` (`leading`, `flex-1`); kategori adı veya açıklama (`q` ≤100 karakter)
2. **Durum** — `Tabs` segment şeridi: tümü / aktif / pasif, **global** sayaçlı
3. **Medya** — `Select`: Tümü / Görselli / Videolu / Medyasız
4. **İkon** — `Select`: Tüm ikonlar + ikon seçenekleri
5. **Sıralama** — `Select`: tek parametre `sirala=<sort>:<order>`

### Chip satırı

`FilterChips` filtre çubuğunun **içinde değil**, ondan **ayrı ve tek satır blokta** yer alır; böylece çubuğun "tek satır" ölçütü chip sayısından bağımsız kalır. Genişlik kuralları (≥1024px tek satır, <1024px `flex-wrap`, yatay taşma yok) yukarıdaki **AP-007 "Yerleşim sözleşmesi"** ile birebir aynıdır. Chip sırası: **Durum → Medya → İkon → Arama → Sıralama**; **Temizle** tümünü sıfırlar.

### Sayfalama ve URL parametreleri

Sayfa boyutu **20 / 50 / 100**, varsayılan **20**; tercih `localStorage` anahtarı **`categories_page_size`**'te saklanır. Filtre + sayfa + sıralama + görünüm URL'de taşınır (derin bağlantı çalışır); varsayılanlar URL'e yazılmaz, geçersiz değer `normalizeQuery` ile varsayılana döner.

| Parametre | Anlamı | Değer kümesi / varsayılan |
|---|---|---|
| `q` | arama metni | boş = filtre yok |
| `durum` | durum filtresi | `tümü` (var.) · `aktif` · `pasif` |
| `medya` | medya filtresi | `tümü` (var.) · `görselli` · `videolu` · `medyasız` |
| `ikon` | ikon anahtarı | boş = tüm ikonlar |
| `sayfa` | sayfa numarası | `1` (var.), `<1` → `1` |
| `limit` | sayfa boyutu | `20` (var.) · `50` · `100` |
| `sirala` | `<sort>:<order>` | `sortOrder:asc` (var.) · `name:asc` · `name:desc` · `serviceCount:desc` · `createdAt:desc` |
| `gorunum` | görünüm | `tablo` (var.) · `kartlar` |

### Medya alanları

| Katman | Detay |
|---|---|
| Model | `ServiceCategory.imageUrl` → kolon `image_url`, `ServiceCategory.videoUrl` → kolon `video_url` (ikisi de nullable) |
| API | `createCategory` / `updateCategory` bu alanları kabul eder: `undefined` = **dokunma**, `null` = **temizle** |
| Dialog | `ImageField` (**Kategori görseli**) + `VideoField` (**Kategori videosu**); `POST`/`PATCH` gövdesinde `imageUrl` / `videoUrl`, boşsa `null`; dialog içeriği kaydırılabilir |
| Yeni uç | `POST /api/v1/upload/video` — form alanı `file`, izinli tipler `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`, sınır `MAX_VIDEO_SIZE` env yoksa **50 MB**, yanıt `{ url, originalName, size }` |
| Görsel yükleme | `ALLOWED_TYPES`, `MAX_SIZE`, `POST /upload/single`, `POST /upload/multiple` **değişmedi** |
| Migration | `apps/api/src/database/migrations/20240101000013-add-media-to-service-categories.js` — `describeTable` ile **idempotent**; **henüz çalıştırılmadı** (`cd apps/api && npm run migrate`) |

### Neden filtreleme istemci tarafında?

Panel listeyi tek `GET /categories` çağrısıyla çeker; sıralama/filtreleme/dilimleme `categoriesQuery.ts` içindeki saf fonksiyonlarla yapılır (**19** ağsız `node:test` testi). Gerekçe: `GET /categories` sözleşmesi **`apps/customer_app` tarafından da kullanılıyor** — API'yi genişletmek o istemciyi kırma riski taşırdı, kategori listesi ise küçük. AP-007/AP-008'in sunucu tarafı kararından **bilinçli sapmadır** ve yalnız bu sayfaya aittir.

### Kapı / kanıt (2026-10-28)

| Katman | Komut | Sonuç |
|---|---|---|
| API test | `cd apps/api && npm test` | **329 passing / 0 failing** (baseline 320 + 9 yeni) |
| Panel tip / lint / build | `npm run typecheck` · `npm run lint` · `npm run build` | temiz |
| Panel test | `npm test` | **84 `node:test` + 218 vitest** (düşüş yok) |
| Görsel (headless Chromium) | 1280 ve 390px ölçümü | 1280px'te filtre çubuğu **tek satır**; 390px'te **4 satıra sarar**; iki genişlikte yatay taşma **0** (`scrollWidth == clientWidth`); chip bloğu **ayrı satırda** |

### Kalan risk

- Seed verisinde `imageUrl` / `videoUrl` olmadığı için **Medya hücresinin görsel doğrulaması gerçek veriyle yapılmadı** (içerik doğrulaması **ölçülmedi**).
- Dev veritabanında kolonlar için **migration çalıştırılmalı**: `cd apps/api && npm run migrate`.

---

## Yorum Yönetimi — filtre çubuğu, chip'ler ve kart işlemleri (AP-010)

`apps/admin_panel/src/app/reviews/page.tsx` + `src/lib/reviewsQuery.ts` (saf mantık) + `components/reviews/{Stars,ReviewActions,ReviewDetailDialog}.tsx`. Plan: `plans/admin/AP-010-reviews-filter-actions.md`.

Kart ızgarası (`grid-cols-1 lg:grid-cols-2`) **korundu**, tabloya çevrilmedi. Filtreleme **sunucu tarafında**: istemci filtresi (`reviews.filter(...)`) kaldırıldı, çünkü yalnız o anki sayfa dilimini süzüyor ve başlıktaki global toplamla çelişiyordu.

### Filtre kontrolleri (tek satır, ≥1024px)

| Sıra | Kontrol | Tür | Seçenekler / kural |
|---|---|---|---|
| 1 | Arama | `Input` (`leading`, `flex-1`) | müşteri adı, salon adı veya yorum metni (`q` ≤100) |
| 2 | Görünüm | `Select` | `Tümü (9)` · `Görünür (7)` · `Gizli (2)` — sayaçlar `meta.counts`'tan, **global** |
| 3 | Puan | `Select` | `Tüm puanlar` · `5..1 yıldız (n)` — sayaçlar `meta.ratings["n"]`'ten |
| 4 | Yanıt | `Select` | `Tümü` · `Yanıtlı (n)` · `Yanıtsız (n)` — `meta.counts` |
| 5 | Salon | `Select` | `Tüm salonlar` + `meta.salons` (yorumu olan salonlar, ada göre artan) |
| 6 | Tarih | `Select` | `Tüm tarihler` · bugün · yarın · bu hafta · bu ay · geçmiş · gelecek |

Sıralama **UI'da yok** (sabit `createdAt:desc`; `sirala=rating:desc` gibi derin bağlantı lib tarafından desteklenir) — 7. select 1280px'te tek satır ölçütünü riske atıyordu (AP-008 R1 ölçümü).

Sarmalayıcı sınıfları AP-007/AP-008 ile aynı: genişlik **sarmalayıcıda**, select'ler `!min-w-[8.5rem] max-w-48 flex-1` (`!` şart — `FilterBar` kökündeki `[&>*]:min-w-0` tabanı eziyor), arama yuvası `min-w-[10rem] flex-1 overflow-hidden`.

### Chip satırı

`FilterChips` filtre çubuğundan **ayrı blokta**. Sıra sabit: **Görünüm → Puan → Yanıt → Salon → Tarih → Arama**; her chip **yalnız kendi** filtresini sıfırlar + `page=1`, **Temizle** hepsini sıfırlar. `aria-live` bölgesi "N filtre etkin" der ve **0 filtrede de DOM'da kalır**.

### Sayfalama ve URL parametreleri

Sayfa boyutu **20 / 50 / 100**, varsayılan **20**; tercih `localStorage` anahtarı **`reviews_page_size`**'te, boyut değişince `page=1`. Varsayılanlar URL'e yazılmaz, geçersiz değer `normalizeQuery` ile varsayılana döner (hata atılmaz).

| Parametre | Anlamı | Değer kümesi / varsayılan |
|---|---|---|
| `q` | arama metni | boş = filtre yok |
| `gorunum` | görünürlük | `tümü` (var.) · `görünür` · `gizli`; eski `?filter=visible\|hidden` alias |
| `puan` | puan | `tümü` (var.) · `1`..`5` |
| `yanit` | yanıt durumu | `tümü` (var.) · `yanıtlı` · `yanıtsız` |
| `salon` | salon kimliği | boş = tüm salonlar |
| `tarih` | tarih önceli | `tümü` (var.) · `bugün` · `yarın` · `bu-hafta` · `bu-ay` · `geçmiş` · `gelecek` |
| `sayfa` | sayfa numarası | `1` (var.), `<1` → `1` |
| `limit` | sayfa boyutu | `20` (var.) · `50` · `100` |
| `sirala` | `<sort>:<order>` | `createdAt:desc` (var.) · `rating:desc` · `rating:asc` |

### Kart işlemleri

Kart alt satırı (`border-t`) sağa hizalı `ReviewActions` ile dolar — boş işlem alanı **yok**. Sıra sabit:

| Sıra | Buton | Görsel | Akış |
|---|---|---|---|
| 1 | **Detay** | `outline`, `Eye` | `ReviewDetailDialog` — **ağ isteği yok** |
| 2 | **Yanıtla** / **Yanıtı düzenle** | `outline`, `MessageSquare` | `Dialog` + `Textarea` (1..2000) → `PATCH /admin/reviews/:id/reply` |
| 3 | **Görünür yap** / **Gizle** | `outline`, `Eye`/`EyeOff` | `PATCH /reviews/:id/toggle-visibility` (mevcut uç), optimistik |
| 4 | **Sil** | `danger`, `Trash2` | onay `Dialog`'u → `DELETE /admin/reviews/:id` → `fetchReviews()` |

Onay yalnız **Sil**'de (geri dönüşü yok). Uçuşta buton metni değişmez; `Loader2` + `disabled`. Başarı/hata `<p role="status" aria-live="polite">` ile duyurulur (`alert()` kullanılmaz).

### API sözleşmesi (özet)

`GET /api/v1/admin/reviews` parametreleri: `page`, `limit`, `search` (müşteri adı / salon adı / yorum metni, büyük-küçük harf duyarsız), `rating` (1..5), `visibility` (`all|visible|hidden`), `replied` (`all|replied|unreplied`), `salonId`, `dateFrom`, `dateTo`, `sort` (`createdAt|rating`), `order` (`asc|desc`). Geçersiz değer **400**; `limit>100` kırpılır (hata değil).

```json
"meta": {
  "total": 9, "page": 1, "limit": 20, "totalPages": 1,
  "counts": { "all": 9, "visible": 7, "hidden": 2, "replied": 4, "unreplied": 5 },
  "ratings": { "1": 0, "2": 0, "3": 0, "4": 4, "5": 5 },
  "salons": [ { "id": "uuid", "name": "Zen SPA & Masaj" } ]
}
```

`counts` / `ratings` / `salons` **filtrelerden bağımsız (global)**: select seçenekleri filtre uygulanınca daralmaz. `ratings` anahtarları **string**, eksik puan `0`. `salons` tekil ve ada göre artan.

| Uç | Gövde | Yanıt |
|---|---|---|
| `PATCH /admin/reviews/:id/reply` | `{ "reply": "..." }` (trim, 1..2000) | `200 { id, salonReply, salonReplyAt }` · `400` validator · `404 "Yorum bulunamadı"` |
| `DELETE /admin/reviews/:id` | — | `200 { id, salonId, ratingAvg, reviewCount }` · `404` |

`DELETE` tek transaction'da siler ve salonun `ratingAvg`/`reviewCount` değerini **yalnız `isVisible:true` yorumlar** üzerinden yeniden hesaplar (`ratingAvg` 1 ondalık; yorum kalmadıysa `0/0`). Admin yanıtı salon yanıtının **üzerine yazar** (`salonReply` + `salonReplyAt`); ayrı `adminReply` alanı yok.

### Kanıt (harness, 2026-10-28)

`ADMIN_BASE=http://127.0.0.1:3011 API_BASE=http://127.0.0.1:3000 CDP_PORT=9456 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-reviews-filters.js`
(production `next start -p 3011`, API :3000 canlı; hedef `/reviews?puan=5&yanit=yanıtlı&tarih=bu-ay`, ekran görüntüsü **kart geldikten sonra**).

| Genişlik | `scrollWidth/clientWidth` | Tek satır | Çubuk | Kontrol | `minSelectWidth` | Chip satırı |
|---|---|---|---|---|---|---|
| 1440 | 1440/1440 → taşma **0** | evet (merkez 1) | 44px | 6 (arama + 5 select) | **178** | 3 chip, örtüşme **0** |
| 1280 | 1265/1265 → taşma **0** | evet (merkez 1) | 44px | 6 | **143** | 3 chip, örtüşme **0** |
| 390 | 375/375 → taşma **0** | hayır (3 satır, 148px — kabul istisnası) | 148px | 6 | 143 | liste kendi içinde kayar (`403/343`), özet **alt satırda**, örtüşme **0** |

Ek: 1440/1280'de `selectsClipped false`, `selectsTextFits true` (select metinleri kırpılmıyor); arama input'u ile ilk select arasında **8px** boşluk (kesişim yok). Her kartta **4** işlem butonu (`Detay`, `Yanıtı düzenle`, `Gizle`, `Sil`), boş işlem alanı **0**. Konsol hatası / JS hatası **0**, başarısız ağ isteği **0**.

Kanıt görselleri: `screenshots/admin-reviews-filters-{1440,1280,390}.png`.

### Kapı / kalan risk

| Kapı | Sonuç |
|---|---|
| `npm run typecheck` | temiz (exit 0) |
| `npm run lint` | exit 0, **0 uyarı** |
| `npm test` | **110 `node:test` + 260 vitest** (30 dosya) |
| `cd apps/api && npm test` | **354 passing / 0 failing** |

- **Tarih sınırı (düzeltildi):** API `dateFrom`/`dateTo` değerlerini artık offset'siz (**sunucu yerel takvimi**) parse eder; panelin yerel takvim tarihiyle aynı gün sınırı kullanılır (önceki UTC sınırı UTC+3'te 3 saat kayıyordu). Sınır davranışı `apps/api/tests/admin.test.js` içindeki gün sınırı testiyle kilitli.
- **Seed'de gizli yorum yok** (`counts.hidden = 0`): `Gizli` filtresi ve `Gizli` rozeti **gerçek veriyle doğrulanmadı**.

---

## Test kapısı

| Adım | Komut | Beklenen sonuç |
|---|---|---|
| Tip kontrolü | `npm run typecheck` | hatasız (`tsc --noEmit`) |
| Lint | `npm run lint` | hatasız (`eslint`) |
| Test | `npm test` | **370 test** yeşil (110 `node:test` + 260 vitest) |
| Build | `npm run build` | T1 ölçümü: 11 statik route, build **exit 0** |

`npm test` sırasıyla `npm run test:node` (`node --test`, 110 test) ve `npm run test:unit` (vitest, 260 test) çalıştırır; toplam **370 test**.

---

## Dil sistemi (i18n)

Panel iki dilde çalışır: **`tr`** ve **`en`**. Dış bir i18n paketi (next-intl / react-i18next) **kurulmadı** — çekirdek kendi içinde, bağımlılıksızdır. Ayrıntı ve ölçülmüş kapsam tablosu: `plans/admin/AP-011-i18n-language.md`.

**Dosyalar**

| Yol | İçerik |
|---|---|
| `apps/admin_panel/src/lib/i18n/index.ts` (122 satır) | Saf TS çekirdek: `Locale`, `LocaleMode`, `LOCALE_STORAGE_KEY = 'app_locale_mode'`, `MESSAGES` (11 namespace), `detectSystemLocale`, `parseLocaleMode`, `resolveLocale`, `translate`. Eksik anahtar hata atmaz, anahtarın kendisi döner; `{ad}` yer tutucuları `vars` ile dolar |
| `apps/admin_panel/src/lib/i18n/messages/*.ts` (11 dosya, 1838 satır) | `common, nav, shell, settings, dashboard, pages, salons, appointments, categories, reviews, ui`. Her dosya `{ tr, en }` export eder; `tr` mevcut arayüz kopyasının birebir aynısıdır |
| `apps/admin_panel/src/providers/LocaleProvider.tsx` (126 satır) | `useI18n()` → `{ locale, mode, setMode, t, systemLocale }`. `<html lang>` günceller, `languagechange` olayını izler, `localStorage` kapalıysa state ile devam eder |
| `apps/admin_panel/src/app/layout.tsx` | `localeInitScript`: ilk boyamadan önce `localStorage`/tarayıcı dilinden `<html lang>` yazar (tema script'iyle aynı desen); `LocaleProvider` kabukta `ThemeProvider`'ın üstünde sarar |

**Davranış**

- Dil modu üç değerli: **`system` (varsayılan) / `tr` / `en`**; `system` tarayıcı dilini izler (`tr` veya `tr-*` → `tr`, diğer/boş → `en`).
- Öncelik sırası: **`localStorage['app_locale_mode']` > sunucu `language` (yalnız yerel tercih yokken) > sistem dili.** Mod değişimi anında etkilidir, sayfa yenileme gerektirmez.
- Sayfalar `t('ns.anahtar')` ile basar; filtre/etiket üreten saf modüller (`src/lib/*Query.ts`, `src/lib/nav.ts`, `components/ui/Badge.tsx`) çeviri **anahtarı** taşır, metni sayfa çözer.
- Paylaşılan taşıyıcı bileşen `components/salons/ImageField.tsx` hem salon hem kategori diyaloğunda kullanıldığı için metinleri `salons.*` namespace'inden gelir.

**Ayarlar > Dil kartı:** `settings.sections.language` kartındaki `Select` (`system` / `tr` / `en`) seçimi anında uygulanır ve kaydetmede `PUT /settings` gövdesine `language` olarak yazılır. API tarafı `apps/api/src/controllers/settings.controller.js`: `language` varsayılanı `system`, izinli değerler `tr` / `en` / `system`, geçersiz değer `400` döner ve hiçbir ayar yazılmaz (`apps/api/tests/settings.test.js`).

**Bilinen sınırlar:** `Intl` / `toLocaleDateString` çağrıları hâlâ `tr-TR` sabittir (tarih/para `en` modunda da Türkçe biçimlenir); ilk boyama cookie okumadığı için `system` + `en` tarayıcıda dil ikinci render'da oturur; API'den gelen rol/durum enum adları sayfa içi haritalarla lokalize edilir (yeni enum eklenince harita güncellenmeli).
