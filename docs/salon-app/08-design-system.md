# 08 · Tasarım Sistemi

Kaynak: `lib/app/theme/app_colors.dart`, `app_theme.dart`, `app_theme_colors.dart`

## 8.1 Renk Paleti

Değerlerin tek kaynağı `AppColors.light` / `AppColors.dark`. LX-001 ("Luxury Editorial")
operasyonel varyantı 2026-10-29'da uygulandı — gerekçeler ve eski→yeni dökümü:
`plans/saloon/SA-002-lux-editorial-tokens.md`. Kontrast kapıları:
`test/app/theme/app_colors_test.dart` (değerler de testte birebir kilitli).

| Token | Hex (light) | Hex (dark) | Kullanım |
|---|---|---|---|
| `primary` | `#4E3893` | `#9C82DC` | Ana mor (buton, vurgu, seçili chip) |
| `primaryDark` | `#43307F` | `#8F72D8` | `ctaGradient` bitişi, koyu mor vurgu |
| `primaryLight` | `#6B4FB8` | `#B29AE8` | `primaryGradient` başlangıcı / dark primary-link tonu |
| `onPrimary` | `#FFFFFF` | `#14110D` | primary ve istatistik dolgularının üstündeki metin |
| `secondary` | `#EFE6D8` | `#2C241C` | Rozet/ikincil zemin (sıcak kum) |
| `secondaryDark` | `#E0D3BE` | `#3D3327` | Kart kenarlığı (hairline), ikincil zemin koyusu |
| `accent` / `accentLight` | `#7C5CBF` / `#A98FD8` | `#B29AE8` / `#C9B6F0` | İkincil vurgular (mor adlandırma korunur) |
| `accentLime` | `#C6A664` | `#D8B872` | **Şampanya altını — yalnızca dolgu/kenarlık/hairline/ikon**, asla metin (light yüzeyde 2.29:1) |
| `onAccentLime` | `#1A1815` | `#14110D` | Şampanya dolgunun üstündeki metin (7.63:1 / 9.88:1) |
| `background` | `#F4EEE3` | `#14110D` | Scaffold zemin |
| `surface` | `#FFFDF8` | `#221C16` | Kartlar, AppBar |
| `surfaceVariant` | `#F1E9DC` | `#2C241C` | Input fill, chip zemin |
| `divider` | `#E3D9C7` | `#332B22` | 1px hairline ayraç ve kart kenarlığı |
| `textPrimary` | `#1A1815` | `#F4EDE1` | Ana metin |
| `textSecondary` | `#5C5449` | `#BDB2A0` | İkincil metin (hero üstü 6.02:1 / 7.30:1) |
| `textHint` | `#736959` | `#9A8F7C` | Pasif/hint metin (yüzeyde 5.31:1 / 5.29:1 — eski 1.98/2.44 değildi) |
| `navPill` | `#1A1815` | `#0E0B08` | Alt gezinme hapı (radius 999 korunur) |
| `onNavPill` | `#F4EEE3` | `#F4EDE1` | Aktif hap etiketi |
| `onNavPillMuted` | `#B7AC99` | `#A79C88` | Pasif hap etiketi (hap üstünde 7.91:1 / 7.25:1) |
| `heroSurface` | `#EFE6D8` | `#2C241C` | Hero/özet yüzey |
| `onBanner` | `#FFFFFF` | `#FFFFFF` | Banner/header gradyanının üstündeki metin |
| `success` | `#2F6B4F` | `#6FC08F` | Onaylı/tamamlandı (yüzeyde 6.19:1 / 7.72:1) |
| `error` | `#A8323C` | `#F08A8A` | İptal, silme, hata SnackBar |
| `warning` | `#7A5200` | `#E0B060` | Bekleyen, yanıtsız yorum |
| `info` | `#2A5A8C` | `#8AB4E8` | Tamamlandı rozeti |
| `starFilled` / `starEmpty` | `#A87B1F` / `#DDD3C2` | `#D8B872` / `#3D3327` | Yıldızlar (ikon eşiği 3:1; light yüzeyde 3.74:1) |
| `shadowCard` / `shadowRaised` | `#0D1A1815` (%5) / `#121A1815` (%7) | `#00000000` / `#00000000` | Kart / yükseltilmiş yüzey gölgesi (koyuda gölge yok, ayrım hairline ile) |

**Sözleşmede olan bu uygulamada OLMAYAN tokenlar** (`customer_app`'e özgü kalmaya devam eder,
salon_app'de eklenmedi): `shadowFloat`, `shadowPill`, `goldGradient`, `darkBannerGradient`,
`coverScrimButton`, `coverScrimFade`.

**Dark mode sabitleri:** background `#14110D`, surface `#221C16`, surfaceVariant `#2C241C`,
secondary `#2C241C`, secondaryDark `#3D3327`, divider `#332B22`, textSecondary `#BDB2A0`,
textHint `#9A8F7C`, onPrimary `#14110D`, navPill `#0E0B08`, onNavPill `#F4EDE1`,
onNavPillMuted `#A79C88`, heroSurface `#2C241C`, accentLime `#D8B872`, starFilled `#D8B872`,
starEmpty `#3D3327`, success `#6FC08F`, error `#F08A8A`, warning `#E0B060`, info `#8AB4E8`.
Koyu temada her iki gölge tokenı da opaklık 0 (LX-001/AP-001 kuralı).

### Gradient'ler
| Ad | Renkler (light / dark) | Yön | Kullanım |
|---|---|---|---|
| `primaryGradient` | `#6B4FB8 → #4E3893` / `#B29AE8 → #8F72D8` | topLeft → bottomRight | Staff avatar, dashboard, login/register CTA sarmalı (`centerLeft → centerRight` durakları aynı gradyandan türer) |
| `headerGradient` | `#4E3893 → #2A1F52` / `#3A2A6E → #1E1440` | topLeft → bottomCenter | Login/Register/Dashboard/Profil header |
| `bannerGradient` | `#4E3893 → #2A1F52` / `#3A2A6E → #1E1440` | topLeft → bottomRight | Sözleşme tokenu; salon ekranlarında henüz kullanım yok |
| `softGradient` | `#F1E9DC → #F4EEE3` / `#2C241C → #14110D` | topCenter → bottomCenter | Dashboard yumuşak zemin geçişi (`textPrimary` ile okunur) |
| `ctaGradient` | `#4E3893 → #43307F` / `#8F72D8 → #9C82DC` | topLeft → bottomRight | Sözleşme tokenu; salon ekranlarında henüz kullanım yok |
| `infoGradient` / `successGradient` / `warningGradient` | `#3A6EA5→#2A5A8C` / `#2F6B4F→#24573E` / `#7A5200→#5E3F00` — dark: `#8AB4E8→#6E9BD8` / `#6FC08F→#55A876` / `#E0B060→#C0913F` | diagonal | Dashboard `_StatCard` kartları (metin `onPrimary`) |
| Chart bar | `primaryGradient` durakları | bottomCenter → topCenter | Haftalık grafik |

Her gradyanın **iki ucu da** üstündeki metne karşı AA verir (test denetler): en zayıf
uçlar light `primaryGradient` 6.11:1, dark `primaryGradient`/`ctaGradient` 4.99:1,
header/banner `onBanner` ile 9.09–17.08:1.

---

## 8.2 Tema Extension (`AppThemeColors`)

```dart
@immutable
class AppThemeColors extends ThemeExtension<AppThemeColors> {
  final Color background, surface, surfaceVariant, secondaryBg, secondaryBorder, textSecondary, textHint;
  static const light = AppThemeColors(...);
  static const dark  = AppThemeColors(...);
}

extension AppThemeColorsX on BuildContext {
  AppThemeColors get colors => Theme.of(this).extension<AppThemeColors>()!;
}
```

**Kullanım:** ekranlarda `final c = context.colors;` → `c.surface`, `c.textSecondary`, `c.secondaryBorder`. Bu, hard-coded `Colors.white/gray` yerine tema-duyarlı erişim sağlar.

**Fallback:** `state_view.dart` içinde `_colors()` extension yoksa `AppThemeColors.light`'a düşer (testlerde düz `MaterialApp` kurulabildiği için gerekli).

---

## 8.3 Tema Kuralları (Material3)

| Bileşen | Light | Dark |
|---|---|---|
| AppBar | elevation 0, centerTitle, surface zemin, 18px w600, letterSpacing -0.3 | aynı, `#221C16` zemin |
| Card | elevation 0, transparent shadow, 2px radius | surface `#221C16` |
| ElevatedButton | primary, min size ∞×52, 4px radius, w600 | primary (mor) |
| OutlinedButton | primary kenarlık 1.5 | primaryLight |
| Input | filled, surfaceVariant, 2px radius, border yok; focus'ta primary 1.5 | fill `#2C241C` |
| Divider | `#E3D9C7` | `#332B22` |
| Chip | surfaceVariant, 6px radius (alt gezinme hapı ayrı: 999) | `#2C241C` |
| BottomNav | fixed type, elevation 12, selected primary | selected primaryLight |

**Tipografi:** Poppins (Regular 400, Medium 500, SemiBold 600, Bold 700). Başlıklar genelde w600–w800; stat değerleri 26px w800.

**Radius ölçeği (SA-002 / LX-001):** kart 2 px · buton 4 px · input 2 px · sheet 8 px
(sheet radius'u `app_theme.dart`'te tanımlı değil, 8 px kararı widget tarafında uygulanır);
chip 6 px, alt gezinme hapı 999 **korunur**; ayraç 1 px hairline, daima `divider` tokenu.
Kod senkronu: `app_theme.dart` içindeki chip `circular(20)` değeri SA-003 (radius normalize)
ile 6'ya çekildi (`app_theme.dart:129`); tablo güncel ölçeği yazar.

**Gölge:** `BoxShadow(color: primary.withValues(alpha: .06–.35), blurRadius: 8–20, offset: (0, 2–6))`. Kartlar Material elevation kullanmaz; gölge elle verilir.

---

## 8.4 WCAG Karşıtlık Ölçümleri (hesaplanmış)

Değerler LX-001 paletinden (`app_colors.dart`) hesaplanmıştır; eşikler WCAG 2.1 AA
(metin 4.5:1, büyük metin/ikon 3:1).

| Çift | Oran | Yorum |
|---|---|---|
| `#1A1815` on `#F4EEE3` (`textPrimary` / `background`) | **15.34** | ✅ AAA |
| `#FFFFFF` on `#14110D` (`onPrimary` / dark `background`) | **18.82** | ✅ AAA |
| `#5C5449` on `#FFFDF8` (`textSecondary` / `surface`) | **7.33** | ✅ AAA |
| `#4E3893` on `#FFFDF8` (`primary` / `surface`) | **8.94** | ✅ AAA |
| `#BDB2A0` on `#221C16` (dark `textSecondary` / dark `surface`) | **8.06** | ✅ AAA |
| `#FFFFFF` on `#4E3893` (`onPrimary` / `primary`) | 9.09 | ✅ AAA (buton metni) |
| `#FFFFFF` on `#6B4FB8` (`onPrimary` / `primaryGradient` başlangıcı) | 6.11 | ✅ AA |
| `#736959` on `#FFFDF8` (light hint / `surface`) | 5.31 | ✅ AA |
| `#9A8F7C` on `#221C16` (dark hint / dark `surface`) | 5.29 | ✅ AA |
| `#A87B1F` on `#FFFDF8` (`starFilled` / `surface`) | 3.74 | ✅ ikon eşiği (3:1); metin olarak kullanılmaz |
| `#C6A664` on `#FFFDF8` (`accentLime` / `surface`) | 2.29 | ⚠️ metin olamaz — şampanya yalnızca dolgu/kenarlık/ikon |
| `#B7AC99` on `#1A1815` (`onNavPillMuted` / `navPill`) | 7.91 | ✅ AA |

**Sonuç:** eski tablodaki düşük çiftler (hint 1.98, dark hint 2.44, gradient başlangıcı 3.23,
yıldız/uyarı 1.76) LX-001 sonrası eşik üstüne çıktı. Tek bilinçli kısıt şampanya `accentLime`
(2.29:1): dolgu olarak kalır, metin/ikon olarak kullanılmaz; yanında daima `onAccentLime`
(`#1A1815`, 7.63:1) taşınır.

---

## 8.5 Durum Renk Semantiği

| Durum | Renk | Rozet zemini |
|---|---|---|
| CONFIRMED | success / primary (dashboard) | `%12` opak |
| PENDING | warning | `%15` opak |
| COMPLETED | info | `%15` opak |
| CANCELLED | error | `%15` opak |
| NO_SHOW | gri `#757575` | — |
