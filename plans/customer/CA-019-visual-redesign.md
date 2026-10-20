# CA-019 — Görsel Yenileme (Booksy referansı, "Seçenek A")

> **DURUM (uygulama günlükleri):** WP0 ✅, WP1 ✅, WP2 ✅, WP3 ✅, WP4 ✅, WP5 ✅, WP6 ✅ (kısmen
> manuel), WP7 ✅ — ekran görüntüleriyle doğrulandı
> (`screenshots/customer_app/rd01..rd13`, plan dosyaları `screenshots/_harness/plan-customer-redesign-{light,dark,onboarding,360,nav}.js`).
> `flutter test` **265 test** (seans öncesi 197), `flutter analyze` temiz.
> 360px: yatay taşma yok (`scrollW == clientW`), `__diag` tüm akışlarda boş.
>
> **Plan sapmaları (bilinçli):**
> 1. `onBanner` token'ı eklendi + `bannerGradient` light açık durağı `#8B6DD1 → #7C5CBF` yapıldı
>    (beyaz metin eskiden 4.05:1, alpha'lı karşılama satırı 3.35:1 → AA ihlali). Test ile kilitli.
> 2. WP5.1 "aktif öğe lime ikon" uygulanmadı: aktif öğe **beyaz daire + koyu ikon**. Lime ikon
>    açık daire üzerinde ~1.3:1 olurdu (planın kendi koyduğu "lime metin/ikon olarak yasak" kuralı).
> 3. WP4 grid: `childAspectRatio: 0.75` → `mainAxisExtent: DiscoverSalonCard.extentFor(kolonGenişliği)`
>    (kart medya+gövde toplamını kendisi bildiriyor; hücre/kart eşit, zıplama-taşma yok).
> 4. WP4 rozetler görselin ALTINA değil ÜSTÜNE taşındı: keşif kartında isim rozetlerle aynı satırda
>    olduğu için "Rose…"/"Bella…" diye kısalıyordu (`rd03` öncesi kanıt). Şimdi isim tam genişlikte,
>    `Yeni` (lime) + puan çipi (nötr `navPill`) medyada.
> 5. WP5 temizliği erken yapıldı: kullanılmayan `home/.../category_chip.dart` **silindi**.
>
> Uygulama sırasında bulunan ek gerçek: `discover_salon_card.dart` görseli **hiç** yüklemiyordu
> (sabit gradient) — WP0 ile `cover_image_url`/`logo_url` okunur hale getirildi.
> WP1 kapsamı büyüdü: primary üstünde hardcoded `Colors.white` **9 çağrı sitesinde** daha bulundu
> ve `colors.onPrimary` ile değiştirildi; auth CTA'sı `ctaGradient` token'ına geçti.
> WP2 düzen notu: slayt görseli `LayoutBuilder` ile hem yüksekliğe hem genişliğe bağlandı
> (salt `Expanded` dalga-metin boşluğu, salt `AspectRatio` geniş ekranda RenderFlex overflow verdi).

> 6. **Tur 2 cilaları:** (a) şerit kart yüksekliği artık `SalonCard.preferredHeight`
>    (medya 140 + gövde 96 = 236; ölçülen doğal yükseklik 233) — eski sabit 260 tahmini
>    kartın içinde ~27px boşluk bırakıyordu; iskelet de aynı yüksekliğe çekildi (zıplama yok).
>    (b) `PillBottomNav.pillHeight = 72` (alt sınır) + `bottomGap = 12` → `reservedHeight = 84`
>    (eski kör tahmin 92 → ~8px gereksiz boşluk).
>    (c) Veri temizliği: `Elegance Beauty Studio` satırındaki `/uploads/22ffd656….jpg`
>    (bir önceki oturumdan kalmа bozuk/pikselli test yüklemesi) NULL'landı; 12 salonun da
>    `cover_image_url`/`logo_url` boş → deterministik placeholder tutarlı.
>    Not: `apps/api/src/database.sqlite` ve `apps/api/uploads/` git-ignore'da; değişiklik
>    yalnızca yerel geliştirme verisi (geri almak için admin panelinden tekrar görsel yükle).

**Öncelik:** 🟡 Orta (görsel algı → dönüşüm)
**Tahmini Efor:** 36-46 saat ≈ **5-6 iş günü**
**Kapsam:** Yalnızca `apps/customer_app/` (Flutter). Backend, `salon_app`, `admin_panel` **etkilenmez**.

**Referans:** [Booksy — Beauty & Salon Booking App UI](https://dribbble.com/shots/27159248-Booksy-Beauty-Salon-Booking-App-UI) (Habibur Rahman)
**Yerel referans ekran görüntüsü:** `C:\Users\bahat\AppData\Local\Temp\orca-paste-...png`
**Mevcut durum kanıtı:** `screenshots/customer_app/fix01_home.png`, `fix18_discover_final.png`

---

## 1. Karar Özeti

Referans **olduğu gibi kopyalanmaz**. Üç parçası alınır, ana renk kimliği ve harita akışı korunur.

| Referanstan alınan | Referanstan **alınmayan** |
|---|---|
| Onboarding ekranı (tam ekran sahne + nokta göstergesi + dairesel CTA + organik dalga alt kenar) | Lime'ın **ana marka rengi** olması (mor `#7C5CBF` kalır) |
| Home hero promo kartı (yumuşak lavanta yüzey + lime pill CTA) + foto-daire kategori şeridi | Pastel harita / "3. slide" rezervasyon akışı (mevcut `BookingScreen` + `google_maps_flutter` yeterli) |
| Koyu pill bottom nav (siyah zemin, aktif öğe beyaz daire) + lime'ın **yalnızca aksiyon** rengi olması | Rengi beyaz zemin üstünde metin/ikon olarak kullanmak (kontrast 1.31:1 — WCAG ihlali) |

**Marka rengi:** mor `#7C5CBF` (light) korunur → beyaz metinle **5.07:1, AA geçer**.
**Lime:** yalnızca CTA dolgusu, "Yeni" badge'i ve aktif nav ikonu. Dolgu üzerinde **koyu** metin.

---

## 2. Doğrulanmış Mevcut Durum (kod okuması)

| Konu | Bulgu | Dosya |
|---|---|---|
| Tema merkezî mi? | ✅ Renklerin tamamı tek sınıfta; light+dark çift tanım | `lib/app/theme/app_colors.dart` (152 satır) |
| Tema kurulumu | `ThemeData` + `GoogleFonts.nunito`, light 141 satır / dark 138 satır tekrar | `lib/app/theme/app_theme.dart` (279 satır) |
| Bottom nav | `BottomNavigationBar` + `Container` gölge; pill değil | `lib/app/widgets/main_scaffold.dart` (60 satır) |
| Home | `CustomScrollView` + `BannerHeader` (gradient) + `CategoryChip` (60x60 kutu) + 2 carousel | `lib/features/home/presentation/screens/home_screen.dart` (205 satır) |
| Carousel yeri | `SalonCarousel` yanlışlıkla `banner_header.dart` içinde tanımlı | `.../widgets/banner_header.dart` (139 satır) |
| Kart ikilemi | Home `core/widgets/salon_card.dart`, Discover kendi `discover_salon_card.dart` (214 satır) — **iki ayrı uygulama**, gradient/placeholder mantığı kopyalanmış | `core/widgets/salon_card_image.dart` (137) vs `features/salon_discovery/.../discover_salon_card.dart` (214) |
| Onboarding | ❌ **Yok.** `initialLocation: '/login'`, redirect sadece 4 auth yolunu tanıyor | `lib/app/router.dart` |
| Test altyapısı | 49 test dosyası, 197 test geçiyor, `flutter analyze` temiz | `test/` |
| Screenshot altyapısı | Tek oturumluk CDP harness hazır (`serve.js` + `drive.js`, `plan-customer-*.js` şablonları) | `screenshots/_harness/` |
| `shared_preferences` | ❌ Yok. `flutter_secure_storage` var ve harness bunu tohumlayabiliyor | `pubspec.yaml:52`, `pubspec.yaml` assets bölümü **boş** |

### 🔴 Kritik bulgu — fotoğraf boru hattı yok

```
apps/api/src/seeders/seed.js  →  salon kaydında logoUrl / coverImageUrl HİÇ set edilmiyor
apps/api/uploads/             →  yalnızca 2 dosya (test artefaktı)
apps/customer_app/assets/     →  dizin yok, pubspec assets bölümü boş
```

Sonuç: her salon kartı `CachedNetworkImage` hatasına düşüp **mor gradient + `Icons.spa_outlined`** gösteriyor (bkz. `fix18_discover_final.png` — 6 kartın hepsi aynı mor blok).

Referans tasarımın algısal gücünün ~%70'i **fotoğraftan** geliyor. Bu boru hattı kurulmadan WP3-WP5 uygulanırsa uygulama **bugünkünden daha kötü** görünür. Bu yüzden WP0 zorunlu ve ilk sırada.

### 🔴 İkinci bulgu — dark temada `onPrimary` hatası (mevcut hata)

`app_theme.dart` iki temada da `onPrimary: Colors.white` kullanıyor. Ölçüm:

| Kombinasyon | Kontrast | WCAG AA (normal metin 4.5:1) |
|---|---|---|
| `#FFFFFF` on `#7C5CBF` (light primary) | 5.07:1 | ✅ |
| `#FFFFFF` on `#9D82D4` (dark primary) | **3.19:1** | ❌ **geçmiyor** |
| `#1C1828` on `#9D82D4` | 5.44:1 | ✅ |

Bu, hafızadaki `admin_panel` kontrast dersiyle aynı hata sınıfı: marka rengi dark temada açılınca beyaz metin okunmaz oluyor. WP1'de token ile düzeltilir.

---

## 3. Hedef Palet ve Token Sözleşmesi

### 3.1 Ölçülmüş kontrast tablosu (uygulanacak hedef)

| Kullanım | Kombinasyon | Kontrast | Karar |
|---|---|---|---|
| Light primary CTA | beyaz `onPrimary` `#FFFFFF` / `#7C5CBF` | 5.07:1 | ✅ AA |
| Dark primary CTA | `onPrimary` **`#1C1828`** / `#9D82D4` | 5.44:1 | ✅ AA (düzeltme) |
| Lime CTA (light+dark) | `onAccentLime` **`#12131F`** / `accentLime` `#C9F04F` | 14.1:1 | ✅ AAA |
| Lime **metin** olarak beyaz zeminde | `#C9F04F` / `#FFFFFF` | **1.31:1** | ❌ **yasak** |
| Pill nav zemini | `#FFFFFF` / `navPill` `#12131F` | 18.5:1 | ✅ AAA |
| Hero promo yüzeyi | `textPrimary` `#1E1B2E` / `heroSurface` `#E8E5FA` | 13.6:1 | ✅ AAA |
| Aktif nav ikonu (dark pill üstü) | `#C9F04F` / `#12131F` | 14.1:1 | ✅ AAA |

### 3.2 `app_colors.dart` — eklenecek alanlar

Mevcut 24 alan + gradient alanları korunur; **6 yeni alan** eklenir (hiçbiri kaldırılmaz → mevcut çağrı siteleri kırılmaz):

```dart
final Color onPrimary;        // light: #FFFFFF  | dark: #1C1828
final Color accentLime;       // light: #C9F04F  | dark: #C9F04F
final Color onAccentLime;     // light: #12131F  | dark: #12131F
final Color navPill;          // light: #12131F  | dark: #1C1828
final Color onNavPill;        // light: #FFFFFF  | dark: #F0ECFF
final Color heroSurface;      // light: #E8E5FA  | dark: #2A2440
```

### 3.3 `app_theme.dart` — düzeltilecek/değişecek yerler

| Satır civarı | Şimdi | Sonra |
|---|---|---|
| light `colorScheme.onPrimary` | `Colors.white` | `c.onPrimary` |
| dark `colorScheme.onPrimary` | `Colors.white` | `c.onPrimary` |
| light+dark `elevatedButtonTheme.foregroundColor` | `Colors.white` | `c.onPrimary` |
| `bottomNavigationBarTheme` (ikisi) | `selectedItemColor: c.primary` | Kullanılmıyor olacak (WP5 custom nav) — **tema bloğu silinmez**, `salon_app` benzeri fallback için bırakılır |
| Yeni: `filledButtonTheme` | — | `backgroundColor: c.accentLime, foregroundColor: c.onAccentLime` (lime CTA tek noktadan) |

**Kural:** hardcoded `Colors.white` bir daha `bg-primary` üzerine gelmez. Tüm birincil butonlar `c.onPrimary` kullanır.

---

## 4. İş Paketleri

### WP0 — Görsel boru hattı (zorunlu ön koşul) · 3-4 sa

**Amaç:** fotoğraf yokken de tasarımın "bitmiş" görünmesi; fotoğraf gelince otomatik yükselmesi.

1. `lib/core/widgets/salon_placeholder.dart` (yeni, ~70 satır):
   - Deterministik renk: `salon.id.hashCode` → `primary`/`primaryDark`/`accent` arasından sabit seçim (her rebuild'de renk değişmesin).
   - Üstte büyük kategori ikonu (`categoryIcon()` mevcut), altta hafif marka deseni, `heroSurface` overlay.
   - `Semantics(label: salon.name)` → ekran okuyucuda kart adı duyulur.
2. `salon_card_image.dart` + `discover_salon_card.dart` **aynı** placeholder'ı kullanır (kopya gradient kodu silinir).
3. `const bool kUseRemotePhotos` → demo için: bot görsel URL'i veren opsiyonel `SALON_IMAGE_BASE_URL` dart-define'ı (varsayılan boş → WP0 fallback'i aktif). Yeni paket yok.
4. Seed'e görsel ekleme **bu plana dahil değil** (bkz. §7 Kapsam dışı) — admin panelden yükleme zaten çalışıyor.

**Doğrulama:** 12 salonun hepsi `fix18`'deki gibi özdeş mor blok değil; her biri ayırt edilebilir ikon+renk gösteriyor.

---

### WP1 — Token katmanı + `onPrimary` düzeltmesi · 4-5 sa

1. `app_colors.dart`: 6 yeni alan (light+dark), `copyWith` yok — `const` yapıcıya eklenir (dosya deseni bu).
2. `app_theme.dart`: §3.3 tablosundaki 5 değişiklik + `filledButtonTheme`.
3. `dividerTheme` sabitleri (`0xFFEEEBF8` / `0xFF2D2B47`) hardcoded — token'a taşınır (`divider` alanı).
4. Yeni birim testi: `test/app/theme/app_colors_test.dart`
   - light/dark'ta 6 yeni alanın `null` olmadığı,
   - `contrastRatio()` yardımcı fonksiyonuyla §3.1 tablosundaki 5 kritik eşiğin programatik doğrulanması (saf Dart, WCAG formülü).
   > Bu test, ileride birinin lime'ı metin yapmasını veya dark primary'yi açmasını **otomatik yakalar**.

**Doğrulama:** `flutter test test/app/theme/app_colors_test.dart` yeşil; `flutter analyze` temiz.

---

### WP2 — Onboarding ekranı · 8-10 sa

**Yeni feature:** `lib/features/onboarding/` (CLAUDE.md §2 dizin yapısına uygun)

```
features/onboarding/
├── domain/
│   ├── entities/onboarding_slide.dart        (id, titleKey, bodyKey, art)  ← saf Dart
│   └── repositories/onboarding_repository.dart   (isSeen(), markSeen())
├── data/
│   ├── datasources/onboarding_local_datasource.dart   (flutter_secure_storage)
│   └── repositories/onboarding_repository_impl.dart   (Either<Failure, T>)
└── presentation/
    ├── providers/onboarding_provider.dart
    ├── screens/onboarding_screen.dart        (~150 satır)
    └── widgets/
        ├── onboarding_slide_view.dart        (~90)
        ├── wave_bottom_clipper.dart          (~60)  ← CustomClipper, organik dalga
        └── page_dots.dart                    (~40)
```

**Kararlar:**
- **Slayt görseli:** gerçek fotoğraf yok (WP0 bulgusu) → `heroSurface` gradient zemini + mevcut `lottie` paketiyle animasyon **veya** büyük `categoryIcon`. Dalga kenar + büyük başlık + lime daire CTA referansın hissini fotoğrafsız da verir.
- **3 slayt içeriği (l10n'e eklenecek):**
  1. "Güzelliğini Keşfet" — yakındaki salonlar
  2. "Saniyeler İçinde Randevu" — canlı müsaitlik
  3. "Favorine Kaydet, Tekrar Gel" — favoriler + geçmiş
- **"Bir kez göster" bayrağı:** mevcut `flutter_secure_storage` (`@module` içinde zaten DI'da) → **yeni paket yok**, harness'ta tohumlamak mümkün (bkz. `screenshot-flutter-web-app-with-cdp` skill'i secure storage web key formatını belgeliyor). Alternatif `shared_preferences` **önerilmiyor** (CLAUDE.md §14: mevcut bağımlılığı tekrarlayan paket ekleme).
- **Router değişikliği (`lib/app/router.dart`):** bu dosya hassas, 3 dokunuş gerekir:
  1. `initialLocation` → `/onboarding` (redirect karar verir)
  2. `isAuthRoute` listesine `/onboarding` eklenir
  3. `redirect` içinde: `isSeen == false && !onboardingRoute → '/onboarding'`; `isSeen == true && onboardingRoute → isLoggedIn ? '/home' : '/login'`
  > `redirect` zaten `async` ve `getIt` kullanıyor → desen bozulmuyor.
- `RouteNames.onboarding = 'onboarding'` eklenir (`route_names.dart`); çağrı siteleri named route kullanır (CLAUDE.md §9).

**Testler:** `test/features/onboarding/`
- `onboarding_repository_impl_test.dart` — `isSeen` true/false, storage hatası → `CacheFailure`
- `onboarding_screen_test.dart` — 3 sayfa render, ileri/geri, "Atla" CTA, son sayfada "Başla" → `/login`
- `wave_bottom_clipper_test.dart` — clipper path boş değil, `shouldReclip` doğru

**Doğrulama:** temiz kurulumda `/onboarding` açılır; "Başla" sonrası `/login`; uygulama yeniden başlatılınca onboarding atlanır.

---

### WP3 — Home: hero promo kartı + foto-daire kategoriler · 6-8 sa

| Dosya | Değişiklik |
|---|---|
| `features/home/presentation/widgets/banner_header.dart` | Gradient header **korunur** ama 52px üst dolgu → `SafeArea` + `MediaQuery.paddingOf` (şu an sabit 52, çentikli cihazda sapıyor). Arama çubuğu pill'e (`borderRadius: 999`) döner. |
| **yeni** `.../widgets/hero_promo_card.dart` (~110) | `heroSurface` yüzey, sol metin ("%60'a varan indirim"), `accentLime` pill CTA ("Fırsatları Gör"), sağda ürün/salon görseli. **Statik l10n metni** — kampanya API'si yok (§7). `Semantics(button: true)`. |
| **yeni** `.../widgets/category_circle_chip.dart` (~80) | 60x60 **kutu** → 64x64 **daire** + seçili durumda `accentLime` halka. `CategoryChip` silinmez, bu onun yerini alır ve WP5'te temizlenir. |
| `.../widgets/section_header.dart` | Başlık `w700`, "Tümünü Gör" → daha küçük, `primary`. |
| `home_screen.dart` (205 satır) | `SectionHeader` + `HeroPromoCard` + kategori şeridi sıralaması: hero → kategoriler → yakındaki → en beğenilen. Dosya 200 satır limitine yakın → carousel ayrı dosyaya taşınır. |
| **yeni** `.../widgets/salon_carousel.dart` | `SalonCarousel`'i `banner_header.dart`'tan buraya **taşı** (yanlış yerleşim düzeltmesi). |

**Satır limiti (CLAUDE.md §10):** WP3 sonunda `home_screen.dart` ≤ 180 satır olmalı.

---

### WP4 — Kart birleştirmesi + 4:5 oran · 5-6 sa

**Sorun:** iki ayrı kart implementasyonu (`core/widgets/salon_card.dart` + `features/salon_discovery/.../discover_salon_card.dart`), aynı işi farklı kodla yapıyor.

1. `discover_salon_card.dart` (214 satır) → `core/widgets/salon_card.dart` içindeki ortak bileşenleri kullanacak şekilde **yeniden yazılır**; yalnızca yerleşim farkı kalır (dikey kart vs grid kart).
2. Görsel oranı: `height: 160` sabit → **`AspectRatio(aspectRatio: 4/5)`** + `ClipRRect(borderRadius: 20)`.
3. Badge okunurluğu **korunur** (mevcut `right: 56` + ellipsis kararı bozulmaz — `discover_salon_card.dart` içindeki yorum satırı bunun geçmiş bir regresyon olduğunu söylüyor).
4. `SalonCardShimmer` (59 satır) yeni orana uyarlanır — shimmer ile gerçek kart **aynı yükseklikte** olmalı (yoksa liste zıplar).
5. Puan chip'i rengi: `accent` mavi → **nötr koyu** (`navPill`) + beyaz metin; "Yeni" badge'i → `accentLime` + `onAccentLime`. Böylece 4 renk (mor/mavi/lime/lavanta) yerine 3 kalır.

**Testler:** `test/core/widgets/salon_card_test.dart` — görsel yok/URL bozuk/URL geçerli 3 durum, favori toggle, `reviewCount == 0` iken puan chip'i **yok**.

---

### WP5 — Koyu pill bottom nav · 4-5 sa

1. **yeni** `lib/app/widgets/pill_bottom_nav.dart` (~130):
   - `navPill` zemin, `borderRadius: 28`, yatay `16` margin + `SafeArea(bottom)`.
   - Aktif öğe: beyaz daire (`navPillActive`) içinde `accentLime` ikon + `w700` etiket; pasif: `onNavPill.withValues(alpha: .55)`.
   - `AnimatedContainer` 200ms geçiş; `Semantics(selected:)` doğru set edilir (erişilebilirlik).
2. `main_scaffold.dart`: `BottomNavigationBar` → `PillBottomNav`. `_getCurrentIndex` korunur; `context.goNamed` kullanımı aynı kalır.
3. **Kritik:** body içeriği nav altında kalmamalı → `Scaffold(extendBody: true)` + alt boşluk `MediaQuery.paddingOf(context).bottom + 88`. `home_screen.dart` sonundaki `SizedBox(height: 24)` → dinamik alt boşluk.
4. `bottomNavigationBarTheme` tema blokları **silinmez** (fallback + dark uyumu).

**Test:** `test/app/widgets/pill_bottom_nav_test.dart` — 4 öğe render, tıklama doğru rotaya gidiyor, aktif index vurgusu, 390x844'te taşma yok (`tester.takeException()` null).

---

### WP6 — Dark mode + kontrast doğrulaması · 2-3 sa

1. WP1'deki `app_colors_test.dart` zaten eşikleri koruyor.
2. Referans **yalnızca light**; bizde dark mod var → her yeni yüzey için dark karşılığı tanımlı olmalı. Kontrol listesi:
   - `heroSurface` dark `#2A2440` üstünde `textPrimary` `#F0ECFF` → ~11:1 ✅
   - `navPill` dark `#1C1828` üstünde `onNavPill` `#F0ECFF` → ~15:1 ✅
   - Lime dark'ta aynı kalır (koyu metinle) — **dark'ta lime'ı açma**, kontrastı düşürür.
3. Manjset: `switchTheme`, `chipTheme`, `cardTheme` dark blokları yeni token'ları kullanacak şekilde güncellenir.

---

### WP7 — Görsel doğrulama (iddia değil, ölçüm) · 3-4 sa

`flutter analyze` + `flutter test` **yeterli değil** — bu iş görsel. Mevcut harness kullanılır:

```bash
# 1) Statik kontroller
cd apps/customer_app
flutter analyze          # hedef: No issues found
flutter test             # hedef: 197 + ~18 yeni test, hepsi yeşil

# 2) Web release build + CDP ekran görüntüsü
flutter build web --release --dart-define=API_BASE_URL=http://127.0.0.1:3200/api/v1
node screenshots/_harness/serve.js          # 8901
node screenshots/_harness/drive.js screenshots/_harness/plan-customer-redesign.js
```

Yeni plan dosyası `screenshots/_harness/plan-customer-redesign.js` şu kareleri üretir (tek CDP oturumu — harness kuralı):

| Kare | Ne kanıtlıyor |
|---|---|
| `rd01_onboarding_1/2/3.png` | 3 slayt, dalga kenar, lime CTA |
| `rd02_home_light.png` | hero promo + daire kategoriler + yeni kartlar |
| `rd03_home_dark.png` | dark modda hiçbir metin kaybolmuyor |
| `rd04_discover_grid.png` | 4:5 kart, badge'ler kesilmiyor |
| `rd05_nav_active_{0..3}.png` | pill nav aktif durumu, içerik nav altında kalmıyor |
| `rd06_mobile_360.png` | 360px genişlikte taşma yok (viewport sweep) |
| `rd07_contrast_diag.png` | `type:'diag'` çıktısı: konsol hatası/4xx-5xx istek yok |

Ayrıca `drive.js`'in `diag` çıktısı doğrulanır: **konsol hatası 0, başarısız istek 0**.
Kabul: `rd06`'da yatay kaydırma yok; `rd03`'te okunmayan metin yok.

---

## 5. Efor ve Sıra

| # | Paket | Efor | Bağımlılık |
|---|---|---|---|
| WP0 | Görsel boru hattı / placeholder | 3-4 sa | ✅ Bitti |
| WP1 | Token katmanı + `onPrimary` düzeltmesi | 4-5 sa | ✅ Bitti |
| WP2 | Onboarding (+router) | 8-10 sa | ✅ Bitti |
| WP3 | Home hero + kategoriler | 6-8 sa | ✅ Bitti (`rd01`, `rd04`) |
| WP4 | Kart birleştirme + 4:5 | 5-6 sa | ✅ Bitti (`rd03`, `rd05`) |
| WP5 | Pill bottom nav | 4-5 sa | ✅ Bitti (`rd12`, `rd13_nav_active_*`) |
| WP6 | Dark mode + kontrast | 2-3 sa | ✅ Bitti (`rd04`, `rd05` + token testleri) |
| WP7 | Görsel doğrulama | 3-4 sa | ✅ Bitti (`rd01..rd13`, 360 sweep, `__diag` boş) |
| WP8 | Cihaz (Android) polisajı | 2-3 sa | ✅ Bitti (`screenshots/emulator/m*`, `n01..n03`) |
| | **Toplam** | **35-45 sa** | |

**Sıra gerekçesi:** WP0 ve WP1 bağımsız ve her şeyin ön koşulu. WP2 (onboarding) referansın en görünür parçası ve **mevcut ekranlara dokunmadığı için riski en düşük** → önce o. WP3-WP5 aynı dosyalara dokunuyor (home_screen, salon_card) → sırayla. WP7 en sonda ama WP2 sonrası bir ara doğrulama yapılabilir.

**Ara teslim önerisi:** WP0+WP1+WP2 bittiğinde ekran görüntüsüyle ara onay → tasarım yönü yanlışsa WP3-WP5'e hiç girilmez (toplam ~15-19 sa harcanmış olur, yarısından erken dönüş).

> Not: İlk sohbette "2-3 gün" dedim; kodu satır satır okuyunca (ikili kart implementasyonu, `home_screen` satır limiti, router redirect, nav alt boşluğu, onboarding persistence) gerçekçi rakam **5-6 iş günü**. Fotoğraf boru hattı hariç.

---

## 6. Riskler ve Önlemler

| Risk | Etki | Önlem |
|---|---|---|
| **Fotoğraf yok** (seed'de görsel yok, assets boş) | Tasarım "bitmemiş" görünür | WP0 zorunlu ilk adım; placeholder **kasten tasarlanmış** olur, "yüklenmemiş" gibi durmaz |
| Lime'ın metin olarak kullanılması | Erişilebilirlik ihlali (1.31:1) | WP1'deki `contrastRatio` testi bunu **derleme/test aşamasında** yakalar |
| Dark modda `onPrimary` unutulması | Zaten var olan 3.19:1 hatası büyür | WP1 düzeltir + test kilitler |
| Router redirect regresyonu | Uygulama açılışta kilitlenir / login'e atar | `/onboarding` `isAuthRoute` listesine girer; 3 router senaryosu widget testi |
| Pill nav içeriği kapatır | Randevu butonları erişilemez (geçmişte benzer hata yaşandı — `fix03_home_location_notice.png`) | `extendBody: true` + dinamik alt boşluk + `rd05`/`rd06` kareleriyle doğrulama |
| Kart birleştirmesi badge regresyonu | Konum chip'i kalp butonunun altında kesilir (daha önce düzeltilmişti) | WP4.3: `right: 56` + ellipsis korunur; mevcut `fix12_discover_badge_fixed.png` ile karşılaştırma |
| `home_screen.dart` 200 satırı aşar | CLAUDE.md §10 ihlali | WP3'te carousel ayrı dosyaya çıkar |
| `app_colors.dart` +6 alan const yapıcı | Derleme hatası (tüm alanlar `required`) | Tek dosyada 2 yerde (light/dark) eklenir; `flutter analyze` anında yakalar |

---

## 7. Kapsam Dışı (bilinçli)

- ❌ **Salon fotoğraflarının seed'e eklenmesi** — ayrı backend işi; admin panelden yükleme akışı çalışıyor.
- ❌ **Kampanya/indirim API'si** — hero promo statik l10n metni. Gerçek kampanya modeli gerekirse ayrı plan (`CA-020`).
- ❌ **Harita tabanlı rezervasyon ekranı** (referans 3. slide) — mevcut `BookingScreen` + `google_maps_flutter` korunur.
- ❌ **Marka kimliği / logo değişimi** — mor `#7C5CBF` marka rengi sabit.
- ❌ `salon_app` ve `admin_panel` — bu plan onlara dokunmaz (`admin_panel`'de ayrı bir kontrast borcu var, bkz. hafıza kaydı).
- ❌ Yeni paket ekleme — `shared_preferences` dahil hiçbiri gerekmiyor (WP2 kararı).
- ❌ Tipografi değişimi — `GoogleFonts.nunito` korunur (referans fontu taklit edilmez).

---

## 8. Açık Sorular (uygulamaya başlamadan yanıt gerekli)

1. **Lime accent onayı:** Mor marka + lime **yalnızca CTA/badge/aktif ikon** olarak kabul mü? Yoksa sadece mor tonlarında mı kalalım (o zaman referansın enerjisi kaybolur)?
2. **Onboarding görseli:** fotoğraf yok. (a) `lottie` animasyon mu, (b) büyük kategori ikonu + gradient mi, (c) demo amaçlı geçici stok fotoğraf mı? → **Önerim: (b)**, çünkü yeni varlık bağımlılığı yok ve fotoğraf geldiğinde tek dosyada değişir.
3. **Onboarding sıklığı:** yalnızca ilk açılışta mı, yoksa Profil > Ayarlar'dan tekrar izlenebilir mi? → **Önerim:** ikisi de (bayrak `flutter_secure_storage`'da, `Settings`'ten "Tekrar göster").
4. **Ara onay noktası:** WP2 sonunda durup ekran görüntüsüyle onay ister misin, yoksa WP0-WP7 tek seferde mi bitsin?

---

## 9. Genel Doğrulama (kabul kriteri)

```bash
cd apps/customer_app
flutter analyze   # No issues found
flutter test      # 197 mevcut + ~18 yeni test, hepsi yeşil
```

- [ ] `domain/` katmanında Flutter/3. parti import **yok** (onboarding entity saf Dart)
- [ ] Yeni use case/repository'ler `Either<Failure, T>` döndürüyor
- [ ] `getIt` dışında elle `SomeClass()` üretimi yok
- [ ] Named route kullanılıyor (string path yok)
- [ ] 200+ satır widget yok (`app_strings.dart` ve `app_theme.dart` istisna — veri/tema dosyaları)
- [ ] `app_colors_test.dart` kontrast eşikleri geçiyor
- [ ] CDP sweep: konsol hatası 0, başarısız istek 0, yatay taşma 0
- [ ] Dark modda okunmayan metin yok
- [ ] `flutter build web --release` başarılı

---

## WP8 — Cihaz (Android) polisajı

Web karesi dört kusuru göstermiyordu. 1080×2400 AVD (`Medium_Phone_API_36.1`),
debug APK, API `10.0.2.2:3200` üzerinden ölçülenler ve yapılanlar:

1. **Sistem çubukları tema dışıydı.** Tema yalnızca `appBarTheme.systemOverlayStyle`
   içinde `statusBarColor: transparent` veriyordu; o stil sadece AppBar'ı olan
   ekranlarda uygulanıyor. Login/home `CustomScrollView` kullandığı için hiçbir
   stil uygulanmıyordu → mor hero üstünde **koyu** durum ikonları (~3:1) ve
   altta **siyah** gezinme çubuğu (`m08_login`).
   → `AppTheme.overlayFor(brightness)` tam stil veriyor (barlar şeffaf + ikon
   parlaklığı tema bazında), `main.dart` içindeki `_SystemUiChrome` tema
   değiştikçe uyguluyor; marka yüzeyleri (login, kayıt, `AuthHeader`, home
   `BannerHeader`) `BrandSurface` ile sarıldı → o bölgede ikonlar beyaz
   (`n01_home_after`). Test: `test/app/theme/app_theme_overlay_test.dart`.
2. **Konum akışı Google Play ayar dialogunu tetikliyordu**
   (`LocationSettingsCheckerActivity` uygulamayı arka plana atıp dokunuşları
   yutuyor; emülatörde tekrar tekrar ölçüldü). → `AndroidSettings(
   forceLocationManager: true, timeLimit: 8sn)`: Android'in kendi
   LocationManager'ı kullanılır, konum kapalıysa kendi `LocationNotice`
   yolumuza düşeriz. Soğuk açılışta artık o dialog yok (logcat izi: tek satır
   `freezing … permissioncontroller`, dialog yok).
3. **Bildirim + tam alarm izinleri uygulama açılır açılmaz soruluyordu**
   (`NotificationService.init()` içinde, daha ürün görünmeden iki sistem
   dialogu). → `init()` yalnızca eklentiyi hazırlar; `ensurePermissions()`
   hatırlatma gerçekten planlanırken çağrılır (`scheduleAppointmentReminder`).
4. **Launcher ikonu Flutter varsayılanıydı.** → `scripts/make_app_icon.py`
   (bağımlılıksız PNG üretici: marka gradyanı + beyaz disk + üç yaprak) ve
   `flutter_launcher_icons`; Android legacy + adaptive + monochrome ve iOS
   ikonları üretildi (`n03_icon_crop`).
   Not: `image 4.11` + `archive 4.x` uyumsuzluğu (`ZLibDecoder.decodeLazy`
   kaldırılmış) `dependency_overrides` ile aşıldı (image 4.1.7, archive 3.6.1) —
   yalnızca dev zinciri, çalışma zamanını etkilemez.

Ayrıca emülatörde gözlenen ama uygulama hatası olmayan: debug APK bir kez
`lowmemorykiller` ile öldürüldü (~430 MB RSS; Gradle daemon + qemu yükü) —
`./gradlew --stop` + emülatör yeniden başlatma çözdü.

**Doğrulama:** `flutter analyze` temiz; `flutter test` 272 yeşil (yeni overlay
testleri dahil); debug APK kurulup soğuk açılış yapıldı: RenderFlex satırı 0,
izin/GMS dialogu yok, durum ikonları beyaz, gezinme çubuğu şeffaf, launcher
ikonu yeni marka işareti.
