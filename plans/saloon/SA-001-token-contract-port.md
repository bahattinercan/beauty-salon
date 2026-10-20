# SA-001 — salon_app renk sözleşmesi (token portu)

Durum: **UYGULANDI** (2026-10-21). Ölçüm kapısı: `test/app/theme/app_colors_test.dart` (25 test) + `flutter analyze`.

## 1. Neden

`AP-001` admin panelini token sözleşmesine taşıdığında kalan borç maddelerinden biri şuydu:
"`salon_app` hâlâ token'sız (`AppColors` tek `static const`)". Üç ayrı renk kaynağı vardı ve koyu tema
fiilen bozuktu:

| Kaynak | Durum (önce) |
|---|---|
| `lib/app/theme/app_colors.dart` | 21 `static const Color` — **tek tema, light'a gömülü**; dark diye bir set yok |
| `lib/app/theme/app_theme_colors.dart` | `AppThemeColors extends ThemeExtension` — sadece 8 alan, 6 yerde kullanılıyor |
| `app_theme.dart` içindeki dark TemaData | ham `Color(0xFF..)` + `Colors.white` — token değil, elle yazılmış |
| widget kodu | 72 ham `Color(0x…)`, 82 `Colors.white/black/grey` |

Sonuç: `AppColors.error` = `#E05C6C` (yüzey üstü 3.0:1), `textHint` = `#BBB5CC` (**2.2:1**),
koyu temada buton üstü yazı `Colors.white` + açılan marka = **3.2:1**. Kontrast, tema değişince
kendiliğinden bozuluyordu çünkü "dolgu üstündeki yazı" kavramı yoktu.

## 2. Taşınan sözleşme (customer_app ile birebir aynı desen)

`AppColors` artık instance bir sınıf: `static const light` + `static const dark` +
`static AppColors of(BuildContext context)` ve `context.colors` kısayolu. Widget tarafında
tek kullanım biçimi: `final c = AppColors.of(context);` → `c.primary`, `c.onPrimary`, …

Kural maddeleri (dosyanın başında yazılı, testte kilitli):

1. Widget içinde ham `Color(0xFF…)` yazılmaz; daima rol adı.
2. Her **dolgunun** bir `on*` eşi vardır (`onPrimary`, `onAccentLime`, `onNavPill`, `onBanner`).
   Koyu temada marka açıldığı için dolgu üstüne beyaz yazmak AA'yı kırar.
3. `accentLime` **yalnızca dolgudur**; açık zeminde metin olarak kullanılamaz (1.3:1) — daima `onAccentLime`.
4. Durum renkleri **metin olarak** AA geçer (eski `#4CAF7D` 2.3:1'di → `#2F7D57` 5.0:1).
5. Gradyanların **her iki ucu** da üstüne yazılacak renkle AA verir (test bunu denetler).

`AppThemeColors` **silindi**; iki özel alanı sözleşmeye taşındı: `secondaryBg → secondary`,
`secondaryBorder → secondaryDark`. Tema iskeleti (`app_theme.dart`) tek `_build(AppColors c)`den
geçer; light ve dark yapısal olarak sapamaz.

Yeni tokenlar (customer_app + AP-001'den): `onPrimary`, `accentLime`, `onAccentLime`, `navPill`,
`onNavPill`, `onNavPillMuted`, `heroSurface`, `onBanner`, `divider`, `primaryGradient`,
`bannerGradient`, `softGradient`, `ctaGradient`, `headerGradient`, ve salon'un istatistik
kartları için `infoGradient`, `successGradient`, `warningGradient`.

## 3. Ölçülen önce → sonra

| Kapı | Önce | Sonra | Nasıl |
|---|---:|---:|---|
| Widget kodunda ham `Color(0x…)` | **72** | **0** | grep kapısı |
| Widget kodunda `Colors.white/black/grey` | **82** | **26** (6 gölge alfası + `Colors.of/transparent`) | grep |
| `AppColors.<sabit>` statik erişimi | **131** | **0** (kalan 4'ü `app_theme.dart` içindeki yasal `AppColors.light/dark`) | grep |
| Renk kaynağı sayısı | 3 (AppColors + AppThemeColors + TemaData içi ham hex) | **1** (`AppColors`) | dosya listesi; `app_theme_colors.dart` silindi |
| `context`-bağlı token bağlama noktası | 0 | **58** (`AppColors.of(context)`) | grep |
| Kontrat testi | yok | **25 test / 0 kırık** (`flutter test` toplam 73 geçiyor) | `test/app/theme/app_colors_test.dart` |
| `flutter analyze` | — | **0 hata, 0 uyarı** | doğrudan |
| Koyu tema görsel doğruluğu | koyu TemaData elle yazılmış, yazılar `Colors.white` | karelerde tüm yüzeyler/yazılar token'dan | `screenshots/salon_app/tk_dashboard_{light,dark}.png`, `tk_profile_*`, `tk_login_light.png`; `__diag` boş |

Kontrast oranları (testte kilitli, WCAG 2.1 formülü Dart'ta yazıldı):

| Çift | light | dark |
|---|---:|---:|
| `onPrimary` / `primary` | 5.07 | 5.43 |
| `onAccentLime` / `accentLime` | 14.10 | 14.10 |
| `onNavPill` / `navPill` | 18.44 | 14.99 |
| `textPrimary` / `heroSurface` | 13.60 | 12.74 |
| `success` / `surface` | 5.01 | 8.41 |
| `error` / `surface` | 6.33 | 6.06 |
| `warning` / `surface` | 5.93 | 10.62 |
| `info` / `surface` | 6.44 | 7.60 |
| `headerGradient` uçları, `onBanner` ile | 5.07 / 7.72 | 6.69 / 5.49 |
| `primaryGradient` uçları, `onPrimary` ile | 5.07 / 6.81 | 8.13 / 5.43 |

Testin ilk çalıştırmada **kırdığı** iki gerçek kusur (kod yazılmadan yakalandı):
- `headerGradient` light ilk durağı `#8B6DD1` beyaz üstünde **4.03:1**, `primaryGradient` `#9B7FE0` **3.23:1**;
  koyuda `#7C5CBF` koyu lacivert yazıyla **4.38:1** → duraklar sıkılaştırıldı.
- `textSecondary` light `#6B6580`, `heroSurface` üstünde **4.48:1** (eşiğin hemen altında) →
  AP-001'in `--fg-muted` değeriyle aynı `#5A5370`e çekildi (hero üstü 5.86:1).

## 4. Bulunup düzeltilen ikincil kusurlar

- `dashboard_screen.dart`: tema algısı `c.background == Color(0xFFFAFAFC)` kıyasıyla yapılıyordu
  (kırılgan, token'ı karşılaştıran mantık) → banner yazısı doğrudan `c.onBanner`.
- `state_view.dart`: `_colors()` yardımcı fonksiyonu `extension<AppColors>()` arıyordu; artık `AppColors.of`.
- `_statusBadge`, `_filterChip`, `_buildStat` gibi yardımcılar rengi ya hiç almıyor ya da
  sabit okuyordu → hepsi `AppColors` parametresi/bağlamı alıyor.
- Silinen `const`lar: token çalışma zamanında seçildiği için `const BoxDecoration(gradient: …)`,
  `const TextStyle(color: Colors.white)` gibi 20+ yer `const` dışına çıktı (doğal sonuç).

## 5. Kalan borç — KAPATILDI (aynı gün)

| Madde | Ne yapıldı | Ölçüm |
|---|---|---|
| 6 adet `Colors.black.withValues(alpha: …)` gölgesi | İki gölge tokenu eklendi: `shadowCard` (`#0A000000`, %4) ve `shadowRaised` (`#0F000000`, %6); **koyu temada ikisi de `#00000000`** (AP-001 kuralı: koyuda yüzey ayrımı kenarlıkla, gölgeyle değil) | `flutter analyze` 0; grep: widget tarafında `Colors.black` **0**; test: `shadowCard.a ∈ [0.01, 0.25]` light, `a == 0` dark |
| ~10 `Colors.of(context)` iddiası | Yanlış ölçümdü: grep `Colors.of(` alt dizesi `AppColors.of(` ile eşleşiyordu. Gerçek Materyal `Colors.of` kullanımı **0** | `grep -c '[^A-Za-z]Colors\.of('` → 0 |
| `starFilled` yüzey üstü 1.76:1 | Light değeri `#FFB547` → `#BF7B00`; artık ikon eşiğinin (3:1) üstünde. Koyu `#FFBF5A` kaldı | test: `starFilled` vs `surface` ve vs `surfaceVariant` ≥ 3.0 iki temada (light 3.47 / dark 10.62) |
| `Poppins` gerçekten yükleniyor mu doğrulanamadı | Web buildinde `assets/FontManifest.json` + `document.fonts` ölçüldü | `poppinsFacesInManifest: 4` (Regular 400, Medium 500, SemiBold 600, Bold 700), `fontsStatus: "loaded"`, `document.fonts.check` 400/600/700 için **true** |

Kontrat testi **28** teste çıktı (`flutter test` toplamı **76**, hepsi geçiyor).

Bilinçli bırakılan: `_StatCard` etrafındaki renkli parlama `BoxShadow(color: gradient.colors.first.withValues(alpha: .3))`
— renk ham değil, gradyan token'ından türüyor; koyu karede de görünüyor (kasıtlı tasarım, kayıp değil).

## 6. Dosyalar

Değişen: `lib/app/theme/app_colors.dart` (yeniden yazıldı), `lib/app/theme/app_theme.dart` (tek `_build`),
8 ekran + `core/widgets/state_view.dart`, `shared/widgets/salon_main_scaffold.dart`.
Silinen: `lib/app/theme/app_theme_colors.dart`.
Yeni test: `test/app/theme/app_colors_test.dart` (28 test).
Kareler: `screenshots/salon_app/tk_*.png` + `tk2_*.png` (PNG'ler `.gitignore`'da; `tk2_dashboard_dark.png` gölge tokenları sonrası, `__diag` boş).
