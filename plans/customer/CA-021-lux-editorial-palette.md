# CA-021 — customer_app: Luxury Editorial paleti (LX-001)
Durum: **UYGULANDI** (2026-10-21). Bu iş yalnızca **renk** işidir: widget, ekran, router,
`pubspec.yaml` ve Flutter sürümü değişmedi; `google_fonts` eklenmedi.

## Hedef
`AppColors` token **adlarını ve yapısını bozmadan** hex değerlerini LX-001 Lux Editorial
paletine taşımak; `accentLime`'ı (tarihsel ad korunur) limon yeşilinden **şampanya altınına**
çevirmek; iki temada da WCAG AA kapılarını `--strict` ile yeşile almak. Gradyan
`begin`/`end` değerleri ve gölge kuralları (gölge yalnızca light, dark'ta opaklık 0) aynen
korunur; `coverScrimButton`/`coverScrimFade` değişmez.

## Palet
### Light
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `background` | `#F4EEE3` | | `primary` | `#4E3893` |
| `surface` | `#FFFDF8` | | `primaryDark` | `#43307F` |
| `surfaceVariant` | `#F1E9DC` | | `primaryLight` | `#6B4FB8` |
| `divider` | `#E3D9C7` | | `onPrimary` | `#FFFFFF` |
| `textPrimary` | `#1A1815` | | `secondary` | `#EFE6D8` |
| `textSecondary` | `#5C5449` | | `secondaryDark` | `#E0D3BE` |
| `textHint` | `#736959` | | `accent` | `#7C5CBF` |
| `success` | `#2F6B4F` | | `accentLight` | `#A98FD8` |
| `error` | `#A8323C` | | `accentLime` (şampanya) | `#C6A664` |
| `warning` | `#7A5200` | | `onAccentLime` | `#1A1815` |
| `info` | `#2A5A8C` | | `navPill` / `onNavPill` | `#1A1815` / `#F4EEE3` |
| `starFilled` | `#A87B1F` | | `heroSurface` / `onBanner` | `#EFE6D8` / `#FFFFFF` |
| `starEmpty` | `#DDD3C2` | | | |

Gölgeler (light): `shadowCard #0D1A1815` (%5) · `shadowRaised #121A1815` (%7) ·
`shadowFloat #1A1A1815` (%10) · `shadowPill #381A1815` (%22).

### Dark
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `background` | `#14110D` | | `primary` | `#9C82DC` |
| `surface` | `#221C16` | | `primaryDark` | `#8F72D8` |
| `surfaceVariant` | `#2C241C` | | `primaryLight` | `#B29AE8` |
| `divider` | `#332B22` | | `onPrimary` | `#14110D` |
| `textPrimary` | `#F4EDE1` | | `secondary` | `#2C241C` |
| `textSecondary` | `#BDB2A0` | | `secondaryDark` | `#3D3327` |
| `textHint` | `#9A8F7C` | | `accent` | `#B29AE8` |
| `success` | `#6FC08F` | | `accentLight` | `#C9B6F0` |
| `error` | `#F08A8A` | | `accentLime` (şampanya) | `#D8B872` |
| `warning` | `#E0B060` | | `onAccentLime` | `#14110D` |
| `info` | `#8AB4E8` | | `navPill` / `onNavPill` | `#0E0B08` / `#F4EDE1` |
| `starFilled` | `#D8B872` | | `heroSurface` / `onBanner` | `#2C241C` / `#FFFFFF` |
| `starEmpty` | `#3D3327` | | | |

Gölgeler (dark): dördü de `#00000000` (mevcut AP-001/SA-001 kuralı korunur).

### Gradyan durakları (begin/end DEĞİŞMEDİ)
| Gradyan | light | dark |
|---|---|---|
| `primaryGradient` | `#6B4FB8 → #4E3893` | `#B29AE8 → #8F72D8` |
| `bannerGradient` | `#4E3893 → #2A1F52` | `#3A2A6E → #1E1440` |
| `softGradient` | `#F1E9DC → #F4EEE3` | `#2C241C → #14110D` |
| `goldGradient` | `#C6A664 → #E4D3A3` | `#D8B872 → #8F6F3A` |
| `darkBannerGradient` | `#3A2A6E → #1E1440` | `#3A2A6E → #1E1440` |
| `ctaGradient` | `#4E3893 → #43307F` | `#8F72D8 → #9C82DC` |

## Kural
Şampanya (`#C6A664` / `#D8B872`) **asla metin rengi olmaz**; yalnızca dolgu, kenarlık,
hairline ve ikon. Metin gerekiyorsa daima `onAccentLime` ile çift kullanılır.
`accentLime` adı tarihsel olduğu için **korundu**, yeniden adlandırma yapılmadı.

## Önce / sonra — kontrast (ölçüm: `node scripts/wcag_tokens.js --scope mobile`)
| Çift | Önce | Sonra |
|---|---:|---:|
| `textHint on surface` (light) | **1.98** | **5.31** |
| banner üstü beyaz metin — gradyanın en açık durağı (light) | **3.23** (`#FFFFFF` on `#9B7FE0`) | **9.09** (`#FFFFFF` on `#4E3893`) |
| `textHint on surface` (dark) | 2.44 | **5.29** |
| `surface vs background (kart ayrımı)` (light) | 1.04 (ZAYIF) | **1.14** |
| `textSecondary on surface` (light) | 5.53 | **7.33** |
| `onPrimary on primary` (light) | 5.07 | **9.09** |
| `onPrimary on primary` (dark) | 5.43 | **5.95** |
| `onAccentLime on accentLime` (light) | 14.10 | **7.63** |
| `onAccentLime on accentLime` (dark) | 14.10 | **9.88** |
| `onNavPill on navPill` (light) | 18.44 | **15.34** |
| `textPrimary on heroSurface` (light) | 13.60 | **14.32** |
| `divider vs surface` (light) | 1.17 | **1.38** |
| `textPrimary on surface` (light) | 16.78 | **17.43** |

Eşik altı çift sayısı: **4 → 0** (`--strict` EXIT=0). Tek "FAIL" satırı bilinçlidir:
`accentLime on surface (YASAK metin)` light'ta 2.29:1 — `scripts/wcag_tokens.js`
`EXPECTED_FAIL` kümesine eklendi; kural ihlali değil, kuralın kendisi.

## Kapsam dışı bırakılanlar
- Widget, ekran, router, provider, `pubspec.yaml`, `app_theme.dart`: dokunulmadı (bu task renk işi).
- `google_fonts` / tipografi: eklenmedi.
- `accentLime` yeniden adlandırması: yapılmadı (tarihsel ad).
- `coverScrimButton` / `coverScrimFade`: değişmedi (fotoğraf üstü karartma, gölge değil).
- Gradyan `begin`/`end`, gölge opaklık kuralları, yarıçap (kart 2px · buton 4px · input 2px ·
  sheet 8px · alt gezinme hapı 999): değişmedi.
- `apps/admin_panel`, `apps/salon_app`, `scripts/wcag_tokens.js` içindeki `ADMIN_PAIRS`
  matrisi ve başka scope: dokunulmadı (yalnızca `EXPECTED_FAIL`'e mobil satır eklendi).
- Repoda başka ajanların commit edilmemiş işi: sahiplenilmedi, "düzeltilmeye" çalışılmadı.

## Doğrulama
```sh
cd apps/customer_app && flutter analyze      # No issues found!
cd apps/customer_app && flutter test         # All tests passed!
cd /home/baris/orca/beauty-salon && node scripts/wcag_tokens.js --scope mobile --strict; echo EXIT=$?   # EXIT=0

# yalnız bu dosyalar değişmeli (plan md yeni olduğu için stat'ta görünmez):
cd /home/baris/orca/beauty-salon && git diff --stat -- \
  apps/customer_app/lib/app/theme/app_colors.dart \
  apps/customer_app/test/app/theme/app_colors_test.dart \
  scripts/wcag_tokens.js
```

Kontrast eşikleri testte **düşürülmedi**: `>= 4.5`, `>= 3.0`, şampanya `< 3:1` kilidi ve
gölge/scrim kuralları aynen duruyor; üstüne `LX-001 Lux Editorial paleti kilitli` group'u
eklendi (token hexleri + gradyan durakları + `begin`/`end` sabitliği).
