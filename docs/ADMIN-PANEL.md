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
| `background` | `#FAFAFA` | `#131013` |
| `surface` | `#FFFFFF` | `#1C181B` |
| `surface-variant` | `#F5F5F5` | `#262023` |
| `border` | `#E5E7EB` | `#332B2F` |
| `fg` | `#2D2D2D` | `#F0ECEE` |
| `fg-muted` | `#6B7280` | `#B0A6AB` |
| `fg-subtle` | `#9CA3AF` | `#7C7276` |
| `primary` | `#B76E79` | `#D9959F` |
| `on-primary` | `#FFFFFF` | `#1C181B` |
| `secondary` | `#F5E6E8` | `#2B2226` |
| `success` / `error` / `warning` / `info` | `#7CB69D` / `#E57373` / `#FFB74D` / `#64B5F6` | `#7CCBA2` / `#F28B82` / `#FDD663` / `#8AB4F8` |

`fg-subtle` yalnızca ikon/ipucu içindir; gövde metni `fg-muted` kullanır.
`on-primary`, `bg-primary` üzerindeki metin/ikon içindir (dark'ta beyaz okunmaz).

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
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı) |
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

## Test kapısı

| Adım | Komut | Beklenen sonuç |
|---|---|---|
| Tip kontrolü | `npm run typecheck` | hatasız (`tsc --noEmit`) |
| Lint | `npm run lint` | hatasız (`eslint`) |
| Test | `npm test` | **302 test** yeşil (84 `node:test` + 218 vitest) |
| Build | `npm run build` | T1 ölçümü: 11 statik route, build **exit 0** |

`npm test` sırasıyla `npm run test:node` (`node --test`, 84 test) ve `npm run test:unit` (vitest, 218 test) çalıştırır; toplam **302 test**.
