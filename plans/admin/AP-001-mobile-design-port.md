# AP-001 — Admin Panel: Mobil Tasarım Dilinin Uyarlanması (CA-019 portu)

> **DURUM:** UYGULANDI (2026-10-21, commit `cc5162d`; ölçüm tablosu §11).
> **KAPSAM DÜZELTMESİ (kullanıcı, uygulama sonrası):** admin panelinin mobil uyumlu
> **olmasına gerek yoktu**. Token sözleşmesi, WCAG AA düzeltmeleri ve masaüstü düzen
> (SideRail, PageHeader, kart primitifleri, `next/font`) korunacak şeyler; mobil kabuk
> (`BottomPillNav`, `MobileDrawer`, tablonun kart modu, breakpoint'ler) ise istenmeden
> yapılmış fazlalık — ileride admin işlerinde mobil varsayılan olarak ele alınmayacak,
> gerekirse bu parçalar geri alınabilir (mobil kapılar §6 WP2/§7 bu yüzden ölçüm olarak kaldı). Ölçüm/kanıt altyapısı bu planla birlikte repoya
> Ölçüm/kanıt altyapısı bu planla birlikte repoya eklendi ve çalıştırıldı (aşağıdaki tüm sayılar üretilmiş çıktıdır, tahmin değildir):
> `scripts/wcag_tokens.js`, `screenshots/_harness/plan-admin-mobile-audit.js`,
> `screenshots/_harness/plan-admin-mobile-bisect.js`, `screenshots/_harness/plan-admin-before-contrast.js`,
> `plans/admin/proposed-tokens.json`.
> Kanıt kareleri: `screenshots/admin_panel/{before_light,before_dark}_{dashboard,salons}_1440.png`,
> `before_light_mobile390_*.png`, `audit_mobile_390_*.png`.
> **Not:** `.gitignore` `screenshots/**/*.png` tutar (repo paylaşımı hafif tutuyor) → kareler **yerel**
> kanıttır; paylaşılan şey CDP plan dosyalarıdır (`screenshots/_harness/*.js` ignore dışı). Kareleri
> yeniden üretmek için tek komut: §6 WP0.

**Öncelik:** 🟠 Orta-yüksek (yönetim paneli telefonda **kullanılamıyor**: 7/8 yol yatay taşıyor)
**Tahmini Efor:** 37–49 saat ≈ **5–6.5 iş günü**
**Kapsam:** Yalnızca `apps/admin_panel/` (Next.js 16 · React 19 · Tailwind v4). Backend **değişmez**
(ihtiyaç duyulan tüm alanlar API'de zaten dönüyor — §2.7). `customer_app` / `salon_app` **değişmez**.
**Kaynak tasarım:** `plans/customer/CA-019-visual-redesign.md` + kanıt kareleri `screenshots/customer_app/rd01..rd13`.

---

## 0. Bu plan ne diyor

Mobilde kurulan şey bir renk paleti değil, bir **token + desen sözleşmesi**: tek merkezden tanımlı
renk rolleri, `on-*` kontrast çiftleri, tek bir accent'in (lime) yalnızca aksiyon rengi olması,
yumuşak köşe + gölge ile kurulmuş yüzey hiyerarşisi ve büyük tipografi ölçeği. Admin panelde bu
sözleşmenin **hiçbir yerine sahip değiliz**: panelde hâlâ 382 ham renk utility'si var, yan menü ve
dashboard token katmanına hiç taşınmamış, ve panel 390px'te 785px yataya taşıyor.

Plan üç işi sırayla yapar: **(1) kabuğu taşmadan kurtar** (responsive iskelet + tek gezinme),
**(2) token Sözleşmesini admin'e kur** (ölçülmüş WCAG kapısıyla), **(3) sayfaları mobil desene
uyarla** (ortak primitifler + hero kartı + kart/tablo çift modu). Sıra bu: 1 ve 2 olmadan 3 yapılırken
aynı ham sınıfları 382 yerde tekrar yazarız.

---

## 1. Mobilde taşınacak olan ne (envanter), ne değil

CA-019'un kurduğu dil, dosya dosya:

| Mobil desen (kanıt) | Dosya | Admin'e karşılığı |
|---|---|---|
| Tek sınıfta light+dark renk rolleri + 7 semantik token (`onPrimary`, `accentLime`, `onAccentLime`, `navPill`, `onNavPill`, `heroSurface`, `onBanner`) ve **kontrast testiyle kilitli** olması | `customer_app/lib/app/theme/app_colors.dart`, `test/app/theme/app_colors_test.dart` | `globals.css` token katmanı + `scripts/wcag_tokens.js` kapısı (bu plan WP1) |
| Koyu **pill** gezinme: `navPill` zemin, aktif öğe beyaz daire, pasif `onNavPill` %55 | `app/widgets/pill_bottom_nav.dart` (kanıt `rd13_nav_active_*.png`) | ≥1024px: koyu sol ray (`bg-nav-pill`); <1024px: alt pill + drawer (WP2) |
| `heroSurface` promo kartı + **lime** pill CTA (üstünde koyu metin) | `home/.../hero_promo_card.dart` (kanıt `rd01_home_light.png`) | Dashboard hero bandı (WP4) |
| Kart: 4:5 medya, radius 20, rozetler medyanın **üstünde**, puan çipi nötr koyu, "Yeni" lime | `core/widgets/salon_card.dart`, `discover_salon_card.dart` (kanıt `rd02/rd03`) | Salonlar listesi kart modu (WP5) |
| Dairesel kategori chip'i (64px, seçili = lime halka) | `home/.../category_circle_chip.dart` (kanıt `rd01`) | Kategoriler sayfası + dashboard hızlı filtre (WP7) |
| Başlık ölçeği: ekran başlığı ~24–30px `w700–800`, gövde 14–16 | `rd01`, `rd06–rd08` | `PageHeader` primitive (WP3) |
| Deterministik **tasarlanmış** placeholder (foto yokken "yüklenmedi" gibi durmaz) | `core/widgets/salon_placeholder.dart` | Salon kartı placeholder'ı (WP5 — seed'de `coverImageUrl = null`, §2.7) |

**Bilinçli olarak taşınmayanlar:**

| Taşınmayan | Gerekçe (ölçülü) |
|---|---|
| Mobil nötr hairline'ın **birebir** kopyası (`divider #EEEBF8`) | Beyaz üstü ayrımı **1.17:1**. Mobilde kartlar gölge+radius+boşlukla ayrılıyor; admin panelde tablolar hairline'a yaslanıyor. Bu yüzden admin'de `--border: #DDD8EA` → **1.39** (§4 tablosu). |
| Lime'ın metin/ikon olarak kullanımı | `#C9F04F` beyaz üstü **1.31:1** — CA-019'un kendi yasağı; admin'de de testle kilitleniyor (§4). |
| Onboarding ekranı | Admin panel tek kullanıcılı, ilk açılış akışı dönüşüm üretmiyor. Kapsam dışı (§10). |
| Dalga (`CustomClipper`) kenarlar | Web'de `clip-path` ile taşınabilir ama yoğun veri ekranında gürültü; yalnızca login'de değerlendirilir (WP7, opsiyonel). |
| Tipografi aynen (`GoogleFonts.nunito`) | Admin panel yoğun tablo kullanıyor; mobil ölçekte 20px gövde satır yüksekliğini şişirir. Ölçek+ağırlık **zıtlığı** alınır, gövde 14–15px kalır (§6 WP3). |

---

## 2. Ölçülmüş mevcut durum (admin panel)

Kosher olmayan tek cümlelik özet değil, tekrar çalıştırılabilir ölçüm. Ortam: API `:3200`,
`next dev :3001`, headless Chrome 155 CDP (`--headless=new`, `Emulation.setDeviceMetricsOverride`
`mobile:false` → `innerWidth == emulated width`, doğrulandı).

### 2.1 Yatay taşma (390×844 · `documentElement.scrollWidth − 390`)

| Yol | scrollWidth | **Taşma** | Ayrıca |
|---|---:|---:|---|
| `/appointments` | 1320 | **+930px** | tablo 952px, 7 kolon |
| `/users` | 1175 | **+785px** | tablo 807px, 6 kolon |
| `/salons` | 968 | **+578px** | tablo 646px, 6 kolon |
| `/reviews` | 705 | **+315px** | |
| `/` (dashboard) | 590 | **+200px** | |
| `/settings` | 560 | **+170px** | |
| `/categories` | 472 | **+82px** | `text-4xl` başlık kırılamıyor |
| `/login` | 390 | 0 | sidebar yok → tek sağlam ekran |

Aynı sweep'in diğer genişliklerdeki sonuçları: **768px** → `/users` +407, `/salons` +200;
**1024px** → `/users` +151; **1440px** → 0. Yani sorun "mobilde" başlamıyor, **1024px'te başlıyor**.

Gezinme sabit: `aside` `w-64` (256px) `position: fixed`, `main` `ml-64`. 390px'te ölçülen
`mainLeft=256`, `mainWidth=334` → yan menü ekranın **%66**'sını işgal ediyor ve içerik onun sağına
taşarak çiziliyor (kanıt: `audit_mobile_390_salons.png`).

### 2.2 Taşmanın kökü (tahmin değil, bisect)

`plan-admin-mobile-bisect.js` her alt ağacı `display:none` yapıp `scrollWidth`'i yeniden okuyor:

```
/users  L0  <div class="space-y-6">            düşüş 785   w=855
        L1  <div class="bg-white rounded-lg shadow-sm p-6">  522   w=855
        L2  <div class="overflow-x-auto">      522   w=807
        L3  <table class="w-full">             522   w=807
```

`overflow-x-auto` **var** ama genişliği 807px — yani sarmalayıcı içeriği kesmiyor, kendisi içeriğe
göre büyüyor. Nedeni klasik: flex item `main.flex-1` `min-width:auto` ile geliyor, tablonun
min-content'ini (807px) emiyor ve `documentElement`'e taşıyor. Düzeltme tek satır: `main`'e
`min-w-0` (WP2). Bunu bilmeden tabloya `w-full`/`max-w` eklemek işe yaramaz.

### 2.3 Kontrast — çalışma zamanında, boyanmış pikselden (sınıf adı tahmini değil)

`plan-admin-before-contrast.js`: her öğenin **efektif zemini** atasız boyama ile kompozitleniyor,
metin alpha'sı üstüne boyanıp WCAG oranı hesaplanıyor.

| Öğe | Light | **Dark** | Not |
|---|---:|---:|---|
| Yan menü metni (pasif) | 13.77 | **1.17** | dark'ta menü zemini hardcoded `bg-white`, metin `--fg` (#F0ECEE) → **okunmuyor** |
| Yan menü marka başlığı (`h1`) | 13.77 | **1.17** | aynı neden |
| Yan menü e-posta (12px) | 13.77 | **1.17** | aynı neden |
| Yan menü **aktif** öğesi (`bg-primary text-white`) | **3.80** | **2.40** | CA-019'un yakaladığı hata sınıfının aynısı: dark'ta marka açılıyor, beyaz metin çöküyor |
| Tablo başlığı / hücresi (`/salons`) | 12.63 / 13.77 | 13.66 / **1.17** | dark'ta hücre metni açık, zemin hardcoded `bg-white` |
| Dashboard `main h1` | 16.98 | 16.98 | ama zemin `bg-gray-50` (ham) → dark modda sayfa **açık gri kalıyor** |
| `/salons` sayfa başlığı `text-primary` | **3.64** (36px) | 7.87 | light'ta AA-large sınırında |

Token matematiği (`node scripts/wcag_tokens.js`, hexler `globals.css`'ten okunuyor):

| Çift | Light | Dark | Eşik |
|---|---:|---:|---|
| `--fg-subtle` yüzey üstü | **2.54** | 3.78 | 4.5 → **ikisi de geçmiyor** |
| `--error` yüzey üstü | **2.99** | — | 4.5 → **FAIL** (bu yüzden sayfalar `text-red-700` gibi ham Tailwind'e kaçmış) |
| `--success` yüzey üstü | **2.32** | — | 4.5 → **FAIL** |
| `--surface` vs `--background` | **1.04** | **1.08** | ≥1.1 → "kartlar sayfadan ayrılmıyor" şikâyetinin **sayısal** cevabı |
| `--border` vs `--surface` | **1.24** | **1.28** | ≥1.3 → hairline'lar görünmüyor |

### 2.4 Token hijyeni: üretilmeyen CSS ve ölü sınıflar

Derlenmiş CSS (`/_next/static/chunks/src_app_globals_*.css`, 48.258 B) içinde grep:

| İfade | Kaynakta kullanım | CSS'te kural | Sonuç |
|---|---:|---:|---|
| `text-text-primary` / `-secondary` / `-hint` | **43** (`salons` 25, `categories` 12, `Sidebar` 6) | **0** | sınıf hiçbir şey yapmıyor → metin `body` renginden miras alıyor (dark'ta 1.17:1'in kökü bu) |
| `bg-primary-solid` | 0 | 0 | `plans/admin/dark-mode.md` §16 "sidebar `bg-primary-solid`, 7.32:1" diyor; **kodda hiç yok** |
| `badge-success` (+ 5 `@utility badge-*`) | 0 | 0 | `globals.css`'te tanımlı, hiçbir sayfada kullanılmıyor; rozetler hâlâ satır içi `bg-red-100 text-red-800 dark:bg-red-500/15 …` |

Genel sayım (`src/**/*.tsx`):

| Ölçüm | Değer |
|---|---:|
| Ham renk utility'si (`bg-white`, `text-gray-*`, `border-gray-*`, `bg-red-100` …) | **382** |
| Token utility'si (`bg-surface`, `text-fg-muted` …) | 188 |
| `dark:` varyantı | 42 |
| En tepedeki ham sınıflar | `text-gray-700` 40 · `border-gray-200` 40 · `text-gray-900` 30 · `bg-white` 30 · `text-gray-600` 25 · `border-gray-300` 23 · `bg-gray-50` 21 · `text-gray-500` 19 · `text-gray-400` 11 |

**Sonuç:** `plans/admin/dark-mode.md` "F1–F7 tamam" diyor ama gerçek kapsama kısmi: `Sidebar` ve
`page.tsx` (dashboard) token katmanına hiç girmemiş. AP-001 bu borcu **kendi kapsamına alır**.

### 2.5 Tipografi ve dokunma hedefleri

Dashboard tip sayımı (kendi metni olan öğeler, 1440px): `12px×24 · 14px×36 · 16px×11 · 18px×4 ·
20px×3 · 24px×4 · 30px×1` → **82 metin öğesinin 60'ı ≤14px**. Sayfada **iki `h1`** var: ilki yan
menünün marka yazısı (18px), ikincisi sayfa başlığı (30px) — ekran okuyucu başlığı yanlış yerden okuyor.

Dokunma hedefleri sweep'i (her genişlikte `min(w,h)`, 35 kontrol): **en küçük 28×28px**
(çıkış butonu `p-1.5`), 1440/1024/390 üçünde de aynı. Mobildesende hedef 44×44.

Köşe ölçeği: `rounded-lg` 78 · `rounded-full` 21 · `rounded-xl` 7 · `rounded-md` 4 · `rounded-2xl` 2.
Mobil dilin imzası 16–24 radius + gölge; admin şu an 8px'e sıkışmış.

Yazı tipi: `globals.css` `font-family: 'Inter', 'Poppins', sans-serif` diyor; projede **`next/font`
yok, `@font-face` yok, `public/`'te font dosyası yok** → bildirilen font hiç yüklenmiyor, panel
Windows'da **Segoe UI** ile çiziliyor. Mobilde ise `GoogleFonts.nunito` gerçekten yükleniyor.

### 2.6 Tekrar eden kod (primitif eksikliğinin ölçüsü)

Aynı sınıf yığını satır içi kopyalanmış: `p-2 rounded-lg border border-gray-300 text-gray-600
hover:bg-gray-50 …` **6** kez (sayfa sayaç butonları), `rounded-lg border border-gray-200 bg-white
p-6 shadow-sm` **5** kez, `bg-white border border-gray-200 rounded-lg p-6` **5** kez, girdi stili
**4+2+2** kez, `<table>` 3 sayfada (9–10 `<th>`), `<h1>` + "Yenile" başlık bloğu 8 sayfada.

### 2.7 Veri tarafı: kart modu için backend **gerekmiyor**, ama iki gerçek hata var

`GET /admin/salons` yanıtı ölçüldü; alanlar arasında `logoUrl`, `coverImageUrl`, `galleryImages`,
`ratingAvg` **zaten var** (`apps/api/src/controllers/admin.controller.js:135` `findAndCountAll`
`attributes` kısıtlamıyor). Seed'de değerler `null` → placeholder zorunlu (mobil WP0'la aynı gerekçe).

| Hata | Kanıt | Etki |
|---|---|---|
| `salons/page.tsx:75` `rating: s.averageRating ?? 0` | API `ratingAvg` döndürüyor | "Puan" kolonu **hep 0** |
| `salons/page.tsx:77` `Array.isArray(s.staff) ? s.staff.length : 0` | `include`'da `staff` yok (yalnızca `owner`) | "Ekip" daima 0 — ama kolon tablodaki 6 kolondan biri olarak yer kaplıyor |

---

## 3. Karar noktaları (uygulamadan önce yanıt gerekli)

Marka rengi **tek gerçek tasarım kararı**; geri kalanı onun etrafına diziliyor. İki aday da
`plans/admin/proposed-tokens.json` içinde tanımlandı ve **ikisi de aynı kontrast kapısını geçiyor**
(`node scripts/wcag_tokens.js --tokens plans/admin/proposed-tokens.json`), yani karar ertelenebilir
değil ama tek satırlık bir değişim kadar ucuz.

| | **A — rose marka korunur** | **B — mor marka (mobil ile birebir)** |
|---|---|---|
| `primary` light / dark | `#B76E79` / `#D9959F` | `#7C5CBF` / `#A88BDD` |
| `primary-solid` üstü beyaz/koyu metin | 4.62 AA (light) · 7.32 AAA (dark) | **6.35 AA** (light) · 5.43 AA (dark) |
| Lime CTA (`on-accent-lime` / `#C9F04F`) | 14.10 AAA | 14.10 AAA |
| Koyu ray (`on-nav-pill` / `#17131F`) | 18.27 AAA | 18.27 AAA |
| Kimlik etkisi | Admin "kardeş ürün", ayrı marka | Üç uygulama **tek** marka; ama platform ekibinin paneli mobil uygulama markasıyla eşleşmiş olur |

**Karar 1 — marka:** A mı B mi? *(Öneri: B. Ürünün üç yüzü de aynı markayı konuşuyor; `#B76E79`
yalnızca panelde yaşıyor ve `primary-solid` olmadan metin kontrastını geçiremiyor.)*

**Karar 2 — gezinme:** Koyu kalıcı ray (mobil pill'in imzası, `bg-nav-pill`, ≥1024px) mi, açık
yüzey + lime aktif işareti mi? *(Öneri: koyu ray. 1.17:1'lik mevcut menü krizini de tek hamlede
kapatıyor: `on-nav-pill` ray üstünde 18.27:1.)*

**Karar 3 — mobil hedefi:** Paneli gerçekten telefonda kullanacak mısın?
- **Evet** → WP2 tam drawer + alt pill, WP5/6'da kart modu `<768px` varsayılan (plan bunu varsayar).
- **Hayır, sadece tablet/masaüstü** → WP2 yalnızca `min-w-0` + kırılım düzeltmeleri ile kalır, efor ~1.5 gün düşer.

**Karar 4 — ara onay:** WP2 bitince (kabuk + gezinme + token'lar) durup ekran görüntüsüyle onay
verilecek mi, yoksa tek seferde mi bitsin? *(Öneri: dur. ~18–20 saatte yön yanlışsa geri kalan
~20 saat harcanmaz — CA-019'da bu ara teslim işe yaradı.)*

---

## 4. Hedef token sözleşmesi (WP1'in çıktısı)

Tek kaynak `src/app/globals.css`; `@theme inline` ile Tailwind'e aktarım deseni **değişmez**
(mevcut kurulum doğru). Eklenen roller: `accent-lime`, `on-accent-lime`, `nav-pill`, `on-nav-pill`,
`hero-surface`, radius ve gölge ölçekleri. Değişenler: `--fg-subtle`, `--border`, `--background`,
status renkleri (metin olarak okunabilir hale).

`plans/admin/proposed-tokens.json` ölçülen sonucu (B paleti, eşik altı çift = **0**, lime-metin
satırı hariç — o satır yasağı belgelemek için matriste tutulur):

| Çift | Light | Dark |
|---|---:|---:|
| `fg` / `background` · `fg` / `surface` | 15.47 · 16.78 | 16.64 · 14.99 |
| `fg-muted` / `surface` | 7.23 | 6.91 |
| `fg-subtle` / `surface` (`#6E6785`, `#8B84A8`) | **5.33** | **4.93** |
| `fg-muted` / `surface-variant` | 6.24 | 5.87 |
| `on-primary` / `primary-solid` | 6.35 | 5.43 |
| `primary` / `surface` (link, ikon) | 5.07 | 6.11 |
| `on-accent-lime` / `accent-lime` | 14.10 | 14.10 |
| `accent-lime` / `surface` | **1.31** → *metin olarak kullanılamaz* | 13.27 (dark'ta geçerli, yine de metin için kullanılmıyor) |
| `on-nav-pill` / `nav-pill` | 18.27 | 17.11 |
| `fg` / `hero-surface` | 13.60 | 12.74 |
| `error` / `surface` · `success` / `surface` | 6.33 · 5.01 | 7.26 · 9.02 |
| `border` / `surface` · `border-strong` / `surface` | 1.39 · 1.82 | 1.35 · 1.89 |
| `surface` / `background` | 1.13 | 1.11 |

Ölçüm kapısı (repoya eklendi, tekrar çalıştırılabilir):

```bash
node scripts/wcag_tokens.js                                              # mevcut admin + mevcut mobil (bugün: 12 eşik altı)
node scripts/wcag_tokens.js --scope admin --strict                       # WP1 sonrası 0 beklenir (exit code kapısı)
node scripts/wcag_tokens.js --tokens plans/admin/proposed-tokens.json    # öneri paletleri, uygulamaya dokunmadan
```

Kural seti (CA-019'dan devralınan):
1. Marka dolgusu üstüne metin **her zaman** `on-primary`'dir; `text-white` yazılmaz.
2. Lime **yalnızca** dolgudur (CTA, "Yeni" rozeti, aktif gezinme işareti); metin/ikon olarak kullanılmaz.
3. Yüzey hiyerarşisi üç basamak: `background` < `surface` < `surface-variant`; ayrım **≥1.1**, hairline **≥1.3**.
4. Ham renk utility'si (`gray-*`, `white`, `red-100` …) kaynakta **0** olacak; durum renkleri token'dan.

---

## 5. Bileşen mimarisi (yeni dosyalar)

```
apps/admin_panel/src/
├── app/globals.css                  # token katmanı (tek kaynak) + radius/gölge token'ları
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx             # AdminLayoutShell'in yerine; min-w-0 + kırılımlar
│   │   ├── SideRail.tsx             # ≥1024px koyu ray (eski Sidebar'ın token'lı hâli)
│   │   ├── BottomPillNav.tsx        # <1024px mobil pill (navPill deseni)
│   │   ├── MobileDrawer.tsx         # <1024px tam liste: scrim + role=dialog + Esc + focus trap
│   │   └── PageHeader.tsx           # başlık + aksiyonlar; sayfadaki 8 kopya bloğun tek hâli
│   └── ui/
│       ├── Button.tsx               # variant: primary | lime-cta | outline | ghost | danger | icon(≥44px)
│       ├── Card.tsx                 # rounded-card + shadow-card; CardHeader/CardBody
│       ├── Badge.tsx                # globals.css'teki badge-* utility'lerini GERÇEKTEN kullanır
│       ├── Field.tsx                # label + ikon slot + hata; girdi/textarea/select
│       ├── DataTable.tsx            # kolon config'i; <768px'te satır→kart; doğru overflow sarmalayıcı
│       ├── Pagination.tsx           # 6 kopya buton bloğunun tek hâli; dokunma ≥44px
│       ├── StatCard.tsx             # dashboard + ayarlar'ın ortak kartı
│       ├── Dialog.tsx               # categories'teki satır içi modalin erişilebilir hâli
│       ├── Tabs.tsx                 # appointments filtre sekmeleri (mobil pill sekmeler)
│       ├── EmptyState.tsx / Skeleton.tsx / ErrorState.tsx
│       └── SalonCard.tsx            # mobil kartın web uyarlaması + deterministik placeholder
└── lib/designTokens.ts              # chartTheme: CSS var'larını çözer (hex kopyası kalmaz)
```

**Neden primitif, neden önce:** 382 ham utility'nin ~%70'i 10 desenin kopyası. Primitifsiz bir
"yenileme" aynı sınıfları yeni renklerle tekrar yazar ve bir sonraki turda yine 382 olur.

---

## 6. İş paketleri

### WP0 — Kapıları kalıcılaştır · 2 sa
- Bu planla eklenen `scripts/wcag_tokens.js` + üç CDP plan dosyasını `apps/admin_panel/package.json`
  script'lerine bağla: `verify:tokens`, `verify:layout` (audit+bisect), `verify:contrast`.
- Sınıf kapısı (grep, tekrar üretilebilir). `apps/admin_panel/` içinden **bugünkü ölçülen baseline:**

  ```bash
  cd src
  grep -rhoE '\b(bg|text|border|from|to|ring|fill|stroke|divide|placeholder)-(white|black|gray|red|green|blue|amber|yellow|purple)-[0-9]{2,3}|\b(bg|text|border|divide|placeholder)-(white|black)\b' --include='*.tsx' . | wc -l   # 382  (hedef 0)
  grep -rhoE '\b(bg|text|border)-(fg|fg-muted|fg-subtle|surface|surface-variant|background|primary|primary-solid|on-primary|secondary|accent|success|error|warning|info|border|border-strong)\b' --include='*.tsx' . | wc -l   # 188
  grep -rho 'dark:' --include='*.tsx' . | wc -l                                   # 42  (hedef ≤ 42)
  grep -rho 'text-text-[a-z]*' --include='*.tsx' . | wc -l                        # 43  (hedef 0)
  ```
- Kontrast kapısının **bugünkü** çıkışı: `node scripts/wcag_tokens.js` → 12 eşik altı çift
  (`--scope admin` → 8, `--scope mobile` → 4: `textHint` light/dark + `divider` light/dark).
  WP1 sonrası admin tarafı **0** olmalı; mobil `textHint`/`divider` satırları kapsam dışı olduğundan
  kapı `--scope admin` ile koşulur: `node scripts/wcag_tokens.js --scope admin --strict`.
- `baseline.md` yerine: bu planın §2 tablosu baseline'dır (yeniden üretilir).
- **Kabul:** `npm run verify:tokens` ve `npm run verify:layout` repo kökünden tek komutla çalışıyor.

### WP1 — Token katmanı + chart tema borcu · 4–5 sa
- `globals.css`: §4 paletini uygula (seçilen marka), radius/gölge token'ları ekle
  (`--radius-card: 16px` → `rounded-card`, `--radius-pill: 999px` → `rounded-pill`, `shadow-card`),
  `@theme inline`'e kaydet, kullanılmayan `@utility badge-*`'leri **kullanılır hâle** getir.
- `lib/chartTheme.ts`: `LIGHT/DARK` hex kopyalarını sil; tema çözüldüğünde
  `getComputedStyle(document.documentElement).getPropertyValue('--primary-solid')` ile oku
  (recharts SVG'sinde `fill="var(--x)"` güvenilmez — dosyadaki mevcut yorum doğru, hex gerekli).
- `--fg-subtle`, `--border`, `--background`, `--error`, `--success` düzeltmeleri **aynı commit'te**:
  kapı bunları ölçüyor.
- **Kabul:** `node scripts/wcag_tokens.js --strict` → **0 eşik altı**; `npx tsc --noEmit`,
  `npx eslint`, `next build` temiz; `before_*` kareleriyle side-by-side fark sadece beklenen.

### WP2 — Kabuk: taşmayı kapat + gezinmeyi ikiye ayır · 6–8 sa *(en yüksek etki/risk)*
- `AdminLayoutShell` → `shell/AppShell`: `main`'e **`min-w-0`** (§2.2'nin tek satırlık cevabı),
  padding'i `p-4 sm:p-6 lg:p-8` yap ve **sayfalardaki ikinci `min-h-screen … p-8` katmanını kaldır**
  (dashboard ve settings'te çift dolgu ölçüldü: iç wrapper'ın kendisi `p-8`, `main` de `p-8`).
- `Sidebar` → `SideRail`: `bg-nav-pill`, `text-on-nav-pill`, aktif öğe `bg-surface`+`text-fg`
  daire + lime işaret; tüm sınıflar token; logo/çıkış bloğu ≥44px; `aside` artık `fixed` değil
  `sticky top-0 h-screen` (390px'te sabit 256px'in yarattığı tuzak böyle kapanır).
- `<1024px`: `BottomPillNav` (4 birincil + "Daha fazla") ve `MobileDrawer` (tüm liste).
  Drawer erişilebilirliği: `role="dialog"`, `aria-modal`, odak tuzağı, `Esc`, scrim tıklaması,
  yol değişince kapanır. `html`'de kilit: açıkken `overflow:hidden`.
- `ThemeToggle` üst bara taşınır (şu an **yalnızca** `/settings`'te — ölçüldü), login'de de görünür.
- **Kabul:** `verify:layout` tüm yollarda **360/390/768/1024/1440 → taşma 0**; drawer klavyeyle
  açılıp kapanıyor; sweep'te `min tap ≥ 44`; `__diag` boş.

### WP3 — UI primitifleri + ham sınıf temizliği · 6–8 sa
- §5 dosyaları yaz; `DataTable` kart modu: `<768px` her satır `Card` (etiket:değer satırları),
  `≥768px` tablo; tablo sarmalayıcısı `min-w-0`'lı ebeveynin içinde gerçek `overflow-x-auto`.
- Implicit grid tuzağı (geçmişte yaşanmış): kırılımlı grid'lerde temel ray **açık** tanımlanır
  (`grid-cols-1` / `minmax(0,1fr)`), `truncate` çocuk rayı metnin tamamıyla şişirir.
- Codemod + elle geçiş: 382 ham utility → **0**; 43 `text-text-*` → **0**; `text-white` → `on-primary`.
  (Codemod geçici, commit edilmez; `plans/admin/dark-mode.md` F3'te de aynı yöntem kullanılmıştı.)
- İki `h1` → `SideRail` marka yazısı `div`, sayfa başlığı tek `h1`.
- Font gerçeği: `next/font` yok. Ya `next/font/google` ile Nunito **başlıklara** + Inter **gövdeye**
  yüklenir, ya da bilinçli olarak system stack'te kalınır ve `globals.css`'teki yanıltıcı
  `'Inter','Poppins'` bildirimi temizlenir. *(Öneri: başlık Nunito 700–800, gövde Inter 400/500.)*
- **Kabul:** WP0'daki grep kapıları: ham renk utility **0**, `text-text-` **0**; primitif dışı
  `className` renk sınıfları 0.

### WP4 — Dashboard: hero dili + ölçülü tipografi · 5–6 sa
- `heroSurface` hero bandı (başlık + kısa özet + **lime CTA**), dört stat kartı `StatCard` ile,
  grafik kartları `Card` + token'lı recharts, "Son Yorumlar" mobil yorum kartına dönüşür.
- Sahte veri temizliği: `percentage={12|8|5|15}` **hardcoded** — API'de growth yok. Ya kaldırılır
  ya "veri yok" durumu gösterilir (yanlış bilgi tasarımı kapatır).
- Ölçek: ekran başlığı 28–30, bölüm başlığı 18, gövde 14–15, sayı 32 (`tabular-nums`).
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` + `minmax(0,1fr)` ( implicit ray tuzağı).
- **Kabul:** `/` 390px'te taşma 0; tip sayımında ≤12px öğe yok; kontrast probe'ları ≥4.5.

### WP5 — Salonlar: kart ↔ tablo çift modu · 5–6 sa
- `SalonCard` (mobil desen): medya 4:3, radius `card`, rozetler medyanın **üstünde**
  (`Yeni` = lime, şehir çipi = nötr koyu), puan çipi `nav-pill`. `DataTable` ile segment toggle.
- API `logoUrl/coverImageUrl` **zaten dönüyor** (§2.7) → frontend-only; seed `null` olduğu için
  deterministik placeholder (id hash'i → marka tonu + kategori ikonu) zorunlu.
- `ratingAvg` hatası düzeltilir; kullanılmayan "Ekip" kolonu kaldırılır (7→6 kolon → 1024px'teki
  +151px taşmanın bir kısmı da böyle iner).
- **Kabul:** kart modunda foto null/geçerli/bozuk üç durumu karelenir; `Puan` kolonu gerçek değeri
  gösteriyor (`/api` çıktısıyla karşılaştırmalı); 390px'te taşma 0.

### WP6 — Kullanıcılar / Randevular / Yorumlar · 4–5 sa
- `DataTable` + `Tabs` (mobil pill sekme) + `Field` arama/filtre; filtre çubuğu 390px'te sarar,
  `flex-wrap` + `min-w-0`. Rozetler `Badge` primitive'i (token'lı) — satır içi `red-100` deseni biter.
- **Kabul:** üç yol 390px'te taşma 0; kart modunda her satırın tüm alanı okunuyor (kolon kaybı yok).

### WP7 — Kategoriler / Ayarlar / Giriş · 3–4 sa
- Kategoriler: dairesel chip gridi (mobil desen), `Dialog` primitive'i ile erişilebilir modal.
- Ayarlar: `Field` + bölüm kartları; `Görünüm` bölümü kalır ama toggle üst bara da eklenir.
- Giriş: marka yüzeyi (gradient bant + `heroSurface` kart + tek CTA), `min-h-dvh`, 390px'te
  zaten 0 taşma — korunmalı. Demo ön-doldurma `IS_PRODUCTION` dalı **dokunulmaz** (güvenlik kararı).
- **Kabul:** `login` light+dark kareleri; modal klavyeyle açılıp kapanıyor.

### WP8 — Görsel doğrulama (iddia değil, ölçüm) · 4–5 sa
- Yeni plan dosyaları: `plan-admin-redesign-light.js`, `-dark.js`, `-390.js`, `-drawer.js`
  (tek CDP oturumu kuralı — harness kuralı). Kare adları: `rd_a{01..}..`, eşleşme için `before_*`
  kareleriyle çift hâlinde.
- **Kabul (tam liste):**
  - [ ] taşma sweep'i 360/390/768/1024/1440 → **0** (8 yolun tamamında)
  - [ ] kontrast probe'ları: yan menü, aktif öğe, tablo başlık/hücre, rozetler, butonlar → **≥4.5**
  - [ ] `min tap ≥ 44` her genişlikte
  - [ ] ham renk utility **0**, `text-text-` **0**, `dark:` sayısı düşmüş (token katmanı sayesinde)
  - [ ] `node scripts/wcag_tokens.js --scope admin --strict` → 0
  - [ ] `npx tsc --noEmit`, `npx eslint`, `next build` temiz
  - [ ] `__diag`: konsol hatası 0, başarısız istek 0, hydration uyarısı 0
  - [ ] dark modda okunmayan metin yok (`audit_mobile_390_salons.png`'teki beyaz-menü-kara-zemin manzarası tekrar üretilemez)

---

## 7. Sıra, efor ve ara teslim

| # | Paket | Efor | Bağımlılık |
|---|---|---|---|
| WP0 | Kapılar | 2 sa | — |
| WP1 | Token katmanı + chart tema | 4–5 sa | Karar 1 (marka) |
| WP2 | Kabuk + gezinme | 6–8 sa | WP1 |
| WP3 | UI primitifleri + sınıf temizliği | 6–8 sa | WP1, WP2 |
| WP4 | Dashboard | 5–6 sa | WP3 |
| WP5 | Salonlar kart/tablo | 5–6 sa | WP3 |
| WP6 | Kullanıcı/Randevu/Yorum | 4–5 sa | WP3 |
| WP7 | Kategori/Ayarlar/Giriş | 3–4 sa | WP3 |
| WP8 | Görsel doğrulama | 4–5 sa | hepsi |
| | **Toplam** | **37–49 sa** | |

**Sıra gerekçesi:** WP2 en yüksek etki/risk ve WP3'ün sınıf temizliğiyle aynı dosyalara dokunuyor —
önce iskelet (`min-w-0`, çift dolgu, gezinme) olmadan primitifler yanlış yere yazılır. Karar 3
"mobil kullanılmayacak" derse WP2'nin drawer/pill kısmı düşer (~10–12 sa) ve WP5/WP6 kart modları
opsiyonel olur → toplam ~25–30 sa.

**Ara teslim önerisi:** WP1+WP2 bitince dur: token kapısı geçilmiş + 390px'te taşma 0 + koyu ray
karelenmiş olur (~12–15 sa). Bu noktada yön yanlışsa WP3–WP8'in ~22 saati harcanmaz.

---

## 8. Riskler ve önlemler

| Risk | Etki | Önlem |
|---|---|---|
| `min-w-0` tek başına yetmez, tablo hâlâ taşar | 390px'te kaydırma devam eder | WP2'de `DataTable` kart modu; `verify:layout` bisect çıktısı ile kolon sayısını da azalt (WP5'te 7→6) |
| Implicit grid rayı `truncate` metinle şişer (geçmişte yaşandı) | Yeni kırılımlarda yeniden taşma | Tüm grid'lerde `grid-cols-1` / `minmax(0,1fr)` açık ray; sweep'te offender listesi |
| Koyu ray light temada marka ile çarpışır | Panel "iki farklı ürün" gibi görünür | Ray nötr (`nav-pill`), marka yalnızca aktif öğede; kontrast kapısı 18.27:1'i garantiyor |
| 382 sınıfın codemod ile dönüşmesi gözden kaçırır | Karışık palet, yarım görünüm | Kapı grep'e bağlandı (0 bekleniyor); kod review'da `git diff --stat` + dosya dosya kontrol |
| `badge-*` utility'leri hâlâ kullanılmıyor olur | Rozetler yine satır içi kalır | WP3 kabul kriteri: `grep -c 'badge-'` **>0** ve satır içi durum sınıfları 0 |
| Status renklerini token'a çekince rozetler soluk kalır | Okunabilirlik düşer | Rozet = `renk/12` zemin + koyu token metin; kontrast probe'u rozetleri de ölçüyor |
| Fotoğraf yok (seed `null`) | Kart modu "boş" görünür | Deterministik placeholder tasarlanmış olmalı (mobil WP0 dersi: foto yokken tasarım bitmiş görünmeli) |
| `dark:` varyantı sayısının artması | Tema borcunun büyümesi | Yeni desende `dark:` **yazılmaz**; tema yalnızca token'ı değiştirir. `grep -c 'dark:'` hedefi ≤ mevcut 42 (sadece rozet/şeffaflık istisnaları) |
| FOUC回归 | Tema sınıfı geç uygulanır | Mevcut inline script + `useSyncExternalStore` korunur; `verify:contrast` 400ms'de `htmlClass` okuyor |
| Efor optimizmi | 2–3 gün diye söz vermek | 382 ham sınıf + 3 tablo + 8 sayfa + kabuk = gerçekçi 5–6.5 gün (CA-019'da da ilk tahmin yarısıydı) |

---

## 9. Kapsam dışı (bilinçli)

- ❌ `salon_app` — `AppColors` hâlâ `static const` tek sınıf, light/dark çifti yok; kendi port planı
  ayrıca yazılmalı (AP-001'in token sözlüğü hazır olduğunda kopyalanabilir).
- ❌ Backend değişiklikleri — kart modu için gereken alanlar zaten dönüyor (§2.7).
- ❌ Onboarding, kampanya/indirim API'si, harita ekranı.
- ❌ Yeni `UI kit` paketi kurmak (shadcn/radix/MUI) — bağımlılık eklemeden 10 primitif yazılır
  (`globals.css` + `components/ui`); `components/ui` zaten `react-architecture`-vari yerel desen.
- ❌ `customer_app` / `admin_panel` dışında dosya; `plans/admin/dark-mode.md` geçmiş bir kaydın
  düzeltilmesi hariç.
- ❌ i18n (panelde çeviri altyapısı yok; metinler Türkçe kalıyor).

---

## 10. Açık sorular (uygulamaya başlamadan yanıt gerekli)

1. **Marka:** A (rose `#B76E79`) mı B (mor `#7C5CBF`, mobil ile birebir) mı? İki palet de hazır ve kapıyı geçiyor.
2. **Gezinme:** koyu kalıcı ray mı, açık yüzey + lime işaret mi?
3. **Mobil gerçekliği:** panel telefonda kullanılacak mı? (Kart modları ve drawer'ın varlık sebebi bu.)
4. **Lime CTA:** admin'de de "lime yalnızca aksiyon dolgusu" kuralı onaylı mı? (Birincil CTA: "Randevuları gör", "Yeni" rozeti, aktif gezinme.)
5. **Salon kart modu:** varsayılan mı (salonlar için görsel zenginliği) yoksa tablo varsayılan, kart toggle mı?
6. **Ara onay:** WP2 sonunda durup karelerle onay mı, tek seferde mi?
7. **Font:** başlıklara Nunito yüklenip gövde Inter'da kalsın mı, yoksa system stack mi (yanıltıcı `Inter` bildirimi silinsin mi)?

---

## 11. Uygulama Sonucu (2026-10-21) — AP-001 UYGULANDI

Kararlar (kullanıcı): **marka B = mor, mobil ile birebir**; gezinme **koyu kalıcı ray** (benim seçimim);
**panel gerçekten mobilde kullanılacak** → kart modları + drawer; **tek seferde** (ara onay yok).
Font kararı da bende: **Inter gövde + Nunito başlık** `next/font` ile yüklendi (`next build` ağdan çekiyor, doğrulandı).

### Ölçülen önce → sonra

| Kapı | Önce | Sonra | Nasıl ölçüldü |
|---|---:|---:|---|
| Yatay taşma, 390px (`scrollWidth − 390`) | `/appointments` +930, `/users` +785, `/salons` +578, `/reviews` +315, `/` +200, `/settings` +170, `/categories` +82 | **8 yolun tamamında 0** | `plan-admin-taps-only` + `plan-admin-redesign-verify` sweep |
| Yatay taşma, 1024 / 768 / 360 | 1024'te `+151`, 768'de `+407/+200`, 360'da `+230` | **0** (tablo artık kendi sarmalayıcısında kayıyor) | aynı sweep |
| Kontrast — yan menü metni (dark) | **1.17** | pasif ray `on-nav-pill-muted`, aktif **5.62** | `plan-admin-redesign-taps` boyanmış piksel probu |
| Kontrast — gezinme aktif öğesi (light) | **3.80** | **13.06** | aynı |
| Kontrast — tablo hücresi (dark) | **1.17** | **14.99** | aynı |
| Kontrast — rozet / buton / başlık (dark) | rozet satır içi ham palet | rozet **6.86**, buton **14.99**, h1 **16.64** | aynı |
| Token kapısı | `--scope admin` → **8 eşik altı çift** | **0** (`node scripts/wcag_tokens.js --scope admin --strict` exit 0) | `scripts/wcag_tokens.js` |
| Ham renk utility'si (tsx) | **382** | **0** (kalan 1 eşleşme yorum satırı) | grep kapısı (WP0) |
| `text-text-*` (CSS üretmeyen ölü sınıf) | **43** | **0** | grep |
| `dark:` varyantı | 42 | **0** (kalan 1 eşleşme yorum satırı) — tema yalnızca token'ı değiştiriyor | grep |
| Token utility'si | 188 | **238** | grep |
| `rounded-lg` / `shadow-sm` | 78 / çok sayıda | `rounded-card` 5, `rounded-field` 15, `rounded-pill` 26, `shadow-card` 3 | grep |
| `badge-*` utility'leri | tanımlı ama **0 kullanım** | **7 kullanım** (`badge-lime` eklendi) | grep |
| `h1` sayısı (aynı sayfada) | 2 | **1** | `plan-admin-redesign-*` `h1Count` |
| Min dokunma hedefi | 28px (her genişlikte) | **390px'te 0 hedef 44'ün altında** (min 44); 1440'ta min 32 (fare için ≥24 eşiği) | `plan-admin-taps-only` |
| Font | `font-family: 'Inter'` bildiriliyordu, **hiç yüklenmiyordu** (Segoe UI) | `next/font`: Inter (gövde) + Nunito 600/700/800 (başlık) | `next build` + kareler |
| Konsol / istek / hydration | — | `__diag = {errors:[],warns:[],net:[],pageErrors:[]}` | `drive.js diag` |
| `tsc --noEmit` / `eslint` / `next build` | — | **0 hata / 0 uyarı / 11 statik rota temiz** | doğrudan |

### Plandan sapmalar (gerekçeli)

| Konu | Planda | Uygulananda | Neden |
|---|---|---|---|
| `AppShell` padding | `p-4 sm:p-6 lg:p-8` | aynı + `pb-28 lg:pb-0` | Yüzen alt pill içeriyi örtmesin |
| `SideRail` konumu | `fixed` yerine `sticky` | `sticky top-0 h-dvh w-64` | 390px'te sabit 256px ray içeriği eziyordu; `sticky` dar ekranda zaten `hidden` |
| `useSearchParams` | `?filter=` için planlanmıştı | `location.search` (effect) | Statik prerender'da `Suspense` sınırı zorunlu oluyordu; `next build` bunu hata yapardı |
| Kullanıcı okuma | `localStorage` render'da | `useSyncExternalStore` (`lib/session.ts`) | Hydration uyuşmazı + `react-hooks/set-state-in-effect` kuralı |
| Chart tema | MutationObserver + `setState` | `useSyncExternalStore` ile token snapshot'ı | Aynı lint kuralı; hex kopyası hâlâ yok |
| `SalonCard.isNew` | `createdAt`'tan render'da hesap | Sayfada (fetch anında) hesaplanıp prop | Render içinde `Date.now()` saf değil (lint kuralı) |
| Pie etiketleri | dış etiketler | Halka + **altında liste legenda** | Dış etiketler dar ekranda taşma kaynağıydı (`/` ölçülmüştü) |
| `salons` "Ekip" kolonu | kaldırılacaktı | **kaldırıldı** (6→5 kolon) | API `staff` döndürmüyor, daima 0 |
| Dashboard `%` rozetleri | kaldırılacaktı | **kaldırıldı** (`StatCard.delta` API verisi olan yer için boş) | Sahte `%12/%8/%5/%15` yanıltıcı bilgiydi |
| `DataTable` kart modu | `mobile:'meta'` işaretli kolonlar | **varsayılan: her kolon kartta görünür**, `mobile:false` opt-out | Doğrulama sırasında bulunan gerçek kusur: kart modunda Müşteri/Tutar/Durum kayboluyordu (`plan-admin-cardmode-check` → `missing: []`) |

### Doğrulama sırasında bulunup düzeltilen kusurlar

1. `DataTable` kart modunda alan kaybı (yukarıda) — 390px'te kart kareleriyle kanıtlandı.
2. Dokunma hedefleri: `Button size="sm"` 36px'ti → `h-11 md:h-10`; `Toggle` 28px'ti → 44px'lik buton + iç görsel ray; `ThemeToggle` segmentleri `min-w-11 min-h-11`.
3. Satır içi metin linki ("Tümünü gör") 82×20px'ti → `inline-flex min-h-11` (20px hedefi 24 eşiğinin altındaydı).

### Yeni dosyalar

- `src/lib/nav.ts`, `src/lib/cx.ts`, `src/lib/session.ts`
- `src/components/shell/`: `AppShell`, `SideRail`, `BottomPillNav`, `MobileDrawer`, `PageHeader`
- `src/components/ui/`: `Button`, `Card(+Header/Body/Footer)`, `Badge(+durum sözlükleri)`, `Field(+Input/Select/Textarea/Toggle)`, `Tabs`, `Pagination`, `StatCard`, `States(Skeleton/LoadingBlock/EmptyState/ErrorState)`, `Dialog`, `DataTable`, `SalonCard(+SalonMedia)`
- Silinen: `components/Sidebar.tsx`, `components/AdminLayoutShell.tsx`
- Doğrulama: `screenshots/_harness/plan-admin-{redesign-verify,redesign-taps,taps-only,cardmode-check}.js`; kareler `screenshots/admin_panel/{rd,rd2,rd3}_*.png` (PNG'ler `.gitignore`'da — yerel kanıt)

### Bilinen sınırlar / sonraki borç

- **Fotoğraf yok:** seed'de `coverImageUrl/logoUrl = null`; kart modu deterministik placeholder ile dolu görünüyor, ama gerçek görsel akışı panelde **yükleme arayüzü** gerektirir (ayrı iş).
- ~~`salon_app` hâlâ token'siz~~ **kapatıldı** → aynı token sözleşmesi salon_app'e taşındı: [`plans/saloon/SA-001-token-contract-port.md`](../saloon/SA-001-token-contract-port.md) (2026-10-21).
- Tablo kolon sıralaması (sort) yok; `DataTable` kolon model buna hazır ama uygulanmadı.
- `appointmentsByStatus[].color` API'den geliyor ve **bilinçli olarak yok sayılıyor** (tema kazanır).
- `Dialog` odak tuzağı minimum uygulama; odak iadesi (kapanınca tetikleyen öğeye dönme) yok.
