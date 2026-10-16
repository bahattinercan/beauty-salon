# 08 · Tasarım Sistemi

Kaynak: `lib/app/theme/app_colors.dart`, `app_theme.dart`, `app_theme_colors.dart`

## 8.1 Renk Paleti

| Token | Hex | Kullanım |
|---|---|---|
| `primary` | `#7C5CBF` | Ana mor (buton, vurgu, seçili chip) |
| `primaryDark` | `#5A42A0` | Chip metni vb. |
| `primaryLight` | `#9D82D4` | Dark mode primary |
| `secondary` | `#F0EBF8` | Lavender rozet zeminleri |
| `secondaryDark` | `#D9CEEE` | — |
| `accent` / `accentLight` | `#B39DDB` / `#CFC2E8` | İkincil vurgular |
| `background` | `#FAFAFC` | Scaffold zemin (light) |
| `surface` | `#FFFFFF` | Kartlar, AppBar |
| `surfaceVariant` | `#F5F3FA` | Input fill, divider |
| `textPrimary` | `#1E1B2E` | Ana metin |
| `textSecondary` | `#6B6580` | İkincil metin |
| `textHint` | `#BBB5CC` | Pasif/hint metin |
| `success` | `#4CAF7D` | Onaylı/tamamlandı |
| `error` | `#E05C6C` | İptal, silme, hata SnackBar |
| `warning` | `#FFB547` | Bekleyen, yanıtsız yorum |
| `info` | `#5B8DEF` | Tamamlandı rozeti |
| `starFilled` / `starEmpty` | `#FFB547` / `#E0E0E0` | Yıldızlar |

**Dark mode sabitleri:** background `#0F0D17`, surface `#1C1828`, surfaceVariant `#2A2440`, secondaryBg `#241D38`, secondaryBorder `#3D3360`, textSecondary `#9E97B4`, textHint `#5A5473`.

### Gradient'ler
| Ad | Renkler | Yön | Kullanım |
|---|---|---|---|
| `primaryGradient` | `#9B7FE0 → #6644B8` | topLeft → bottomRight | Staff avatar, genel |
| `headerGradient` | `#8B6DD1 → #5A3FA8` | topLeft → bottomCenter | Login/Register/Dashboard/Profil header |
| (inline) | `#9B7FE0 → #6644B8` | centerLeft → centerRight | Login/Register CTA butonu sarmalı |
| Stat kartları | mor / mavi `#5B8DEF→#3D6FD4` / yeşil `#4CAF7D→#2E8A5A` / altın `#FFB547→#E8900A` | diagonal | Dashboard `_StatCard` |
| Chart bar | `#9B7FE0 → #6644B8` | bottomCenter → topCenter | Haftalık grafik |

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
| AppBar | elevation 0, centerTitle, surface zemin, 18px w600, letterSpacing -0.3 | aynı, `#1C1828` zemin |
| Card | elevation 0, transparent shadow, 16px radius | surface `#1C1828` |
| ElevatedButton | primary, min size ∞×52, 14px radius, w600 | primary (mor) |
| OutlinedButton | primary kenarlık 1.5 | primaryLight |
| Input | filled, surfaceVariant, 12px radius, border yok; focus'ta primary 1.5 | fill `#2A2440` |
| Divider | `#EEEBF5` | `#2A2440` |
| Chip | surfaceVariant, 20px radius | `#2A2440` |
| BottomNav | fixed type, elevation 12, selected primary | selected primaryLight |

**Tipografi:** Poppins (Regular 400, Medium 500, SemiBold 600, Bold 700). Başlıklar genelde w600–w800; stat değerleri 26px w800.

**Radius ölçeği:** 6 (rozet) → 8 (chip) → 10 → 12 (input) → 14 (buton) → 16 (kart) → 18–24 (header/sheet) → 28–36 (gradient header).

**Gölge:** `BoxShadow(color: primary.withValues(alpha: .06–.35), blurRadius: 8–20, offset: (0, 2–6))`. Kartlar Material elevation kullanmaz; gölge elle verilir.

---

## 8.4 WCAG Karşıtlık Ölçümleri (hesaplanmış)

| Çift | Oran | Yorum |
|---|---|---|
| `#1E1B2E` on `#FAFAFC` | **16.10** | ✅ AAA |
| `#FFFFFF` on `#0F0D17` | **19.26** | ✅ AAA |
| `#6B6580` on `#FFFFFF` | **5.53** | ✅ AA |
| `#7C5CBF` on `#FFFFFF` | **5.07** | ✅ AA |
| `#9E97B4` on `#1C1828` | **6.23** | ✅ AA |
| `#FFFFFF` on `#7C5CBF` | 5.07 | ✅ AA (buton metni) |
| `#FFFFFF` on `#9B7FE0` (gradient başlangıcı) | 3.23 | ⚠️ AA değil — büyük/bold metin için sınırda |
| `#BBB5CC` on `#FFFFFF` (hint) | 1.98 | ❌ düşük — hint/placeholder metinleri erişilebilirlik riski |
| `#5A5473` on `#1C1828` (dark hint) | 2.44 | ❌ düşük |
| `#FFB547` on `#FFFFFF` (yıldız/uyarı) | 1.76 | ❌ ikon/rozet için sorunlu |

**Öneri:** `textHint` ve warning rozet metinleri için `textSecondary` tonuna geçmek veya rozet zeminini koyulaştırmak gerekir.

---

## 8.5 Durum Renk Semantiği

| Durum | Renk | Rozet zemini |
|---|---|---|
| CONFIRMED | success / primary (dashboard) | `%12` opak |
| PENDING | warning | `%15` opak |
| COMPLETED | info | `%15` opak |
| CANCELLED | error | `%15` opak |
| NO_SHOW | gri `#757575` | — |
