# SA-002 — salon_app · Luxury Editorial operasyonel varyant (LX-001 tokenları)

Durum: **UYGULANDI** (2026-10-29). Ölçüm kapısı: `apps/salon_app/test/app/theme/app_colors_test.dart`
(30 test) + `flutter analyze` (0 issue) + `flutter test` (86/86).

## 1. Hedef

`customer_app` (CA-021) ve `admin_panel` (AP-001) LX-001 paletine geçti; salon_app aynı
sözleşmenin **operasyonel** varyantını alıyordu: mor-beyaz "kontrast" paleti yerine sıcak
kemik zemin + koyu mor marka + şampanya altını vurgu. Bu plan yalnız **değerleri** değiştirir
(token adları, sınıf yapısı, widget ağacı, layout ve fontlar sabit).

Üç iş:
1. `AppColors.light` / `AppColors.dark` değerlerini LX-001 tablosuna çekmek.
2. `app_theme.dart` radius ölçeğini sertleştirmek: kart 2 · buton 4 · input 2 (chip 20 ve alt
   gezinme hapı 999 korunur), ayraç 1 px hairline.
3. Dokümanı (`docs/salon-app/08-design-system.md` §8.1 + radius satırı) yeni değerlerle eşitlemek.

## 2. Kapsam kararları (koordinatör onayı, 2026-10-29)

Görev tablosu `customer_app` token setine göre yazılmıştı; salon_app sözlüğü farklı.
Karar: **yeni token eklenmez, yapı değişmez.**

| Madde | Karar |
|---|---|
| `shadowFloat`, `shadowPill`, `goldGradient`, `darkBannerGradient`, `coverScrimButton`, `coverScrimFade` | salon_app'de YOK → atlandı, eklenmedi (yalnızca `shadowCard`/`shadowRaised` var) |
| `onBanner` | iki temada da `#FFFFFF` (customer_app ile birebir) |
| `onNavPillMuted` | light `#B7AC99`, dark `#A79C88` (koyu hap üstünde 7.91 / 7.25:1) |

## 3. Token tablosu — eski → yeni

### 3.1 light

| Token | Eski | Yeni | Not |
|---|---|---|---|
| `background` | `#FAFAFC` | `#F4EEE3` | sıcak kemik zemin |
| `surface` | `#FFFFFF` | `#FFFDF8` | kırık beyaz kart yüzeyi |
| `surfaceVariant` | `#F5F3FA` | `#F1E9DC` | input fill / chip zemin |
| `divider` | `#EEEBF8` | `#E3D9C7` | 1 px hairline |
| `textPrimary` | `#1E1B2E` | `#1A1815` | nötr siyah-kahve |
| `textSecondary` | `#5A5370` | `#5C5449` | hero üstü 6.02:1 |
| `textHint` | `#6E6785` | `#736959` | yüzeyde 5.31:1 |
| `primary` | `#7C5CBF` | `#4E3893` | koyu mor marka (beyaz üstü 8.94:1) |
| `primaryDark` | `#5A42A0` | `#43307F` | cta bitişi |
| `primaryLight` | `#9D82D4` | `#6B4FB8` | primaryGradient başlangıcı (beyaz üstü 6.11:1) |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` | değişmedi |
| `secondary` | `#F0EBF8` | `#EFE6D8` | sıcak kum rozet zemini |
| `secondaryDark` | `#D9CEEE` | `#E0D3BE` | kart kenarlığı |
| `accent` | `#5B8DEF` (mavi) | `#7C5CBF` | ad korunur, mor geri döner (ikon 4.99:1) |
| `accentLight` | `#93B8F7` | `#A98FD8` | |
| `accentLime` | `#C9F04F` (limon) | `#C6A664` | **ad korunur, değer şampanya altını**; yalnızca dolgu |
| `onAccentLime` | `#12131F` | `#1A1815` | şampanya üstü metin 7.63:1 |
| `navPill` | `#12131F` | `#1A1815` | alt gezinme hapı |
| `onNavPill` | `#FFFFFF` | `#F4EEE3` | 15.34:1 |
| `onNavPillMuted` | `#A9A3B8` | `#B7AC99` | 7.91:1 |
| `heroSurface` | `#E8E5FA` | `#EFE6D8` | |
| `onBanner` | `#FFFFFF` | `#FFFFFF` | değişmedi |
| `starFilled` | `#BF7B00` | `#A87B1F` | yüzeyde 3.74:1, hero üstü 3.08:1 (eşik 3) |
| `starEmpty` | `#E0E0E0` | `#DDD3C2` | |
| `success` | `#2F7D57` | `#2F6B4F` | yüzeyde 6.19:1 |
| `error` | `#B32B38` | `#A8323C` | 6.48:1 |
| `warning` | `#8A5A00` | `#7A5200` | 6.81:1 |
| `info` | `#1F5FA8` | `#2A5A8C` | 7.03:1 |
| `shadowCard` | `#0A000000` (%4 saf siyah) | `#0D1A1815` (%5 sıcak siyah) | |
| `shadowRaised` | `#0F000000` (%6) | `#121A1815` (%7) | |

Gradyan durakları (light): `primaryGradient` `#7C5CBF→#6644B8` → `#6B4FB8→#4E3893` ·
`headerGradient` `#7C5CBF→#5A42A0` → `#4E3893→#2A1F52` · `bannerGradient` `#7C5CBF→#4A3298` →
`#4E3893→#2A1F52` · `softGradient` `#F0EBF8→#FAFAFC` → `#F1E9DC→#F4EEE3` ·
`ctaGradient` `#7C5CBF→#5A42A0` → `#4E3893→#43307F` · `infoGradient` `#3D6FD4→#1F5FA8` →
`#3A6EA5→#2A5A8C` · `successGradient` `#2F7D57→#1F6B44` → `#2F6B4F→#24573E` ·
`warningGradient` `#996100→#7F5000` → `#7A5200→#5E3F00`. `begin/end` çiftleri değişmedi.

### 3.2 dark

| Token | Eski | Yeni |
|---|---|---|
| `background` | `#0F0D17` | `#14110D` |
| `surface` | `#1C1828` | `#221C16` |
| `surfaceVariant` | `#2A2440` | `#2C241C` |
| `divider` | `#2D2B47` | `#332B22` |
| `textPrimary` | `#F0ECFF` | `#F4EDE1` |
| `textSecondary` | `#9E97B4` | `#BDB2A0` |
| `textHint` | `#8B84A8` | `#9A8F7C` |
| `primary` | `#9D82D4` | `#9C82DC` |
| `primaryDark` | `#7C5CBF` | `#8F72D8` |
| `primaryLight` | `#BBA8E5` | `#B29AE8` |
| `onPrimary` | `#1C1828` | `#14110D` (primary üstü 5.95:1) |
| `secondary` | `#241D38` | `#2C241C` |
| `secondaryDark` | `#3D3360` | `#3D3327` |
| `accent` | `#7AAEF5` | `#B29AE8` |
| `accentLight` | `#A3C4FA` | `#C9B6F0` |
| `accentLime` | `#C9F04F` | `#D8B872` (yalnızca dolgu) |
| `onAccentLime` | `#12131F` | `#14110D` (9.88:1) |
| `navPill` | `#1C1828` | `#0E0B08` |
| `onNavPill` | `#F0ECFF` | `#F4EDE1` (16.87:1) |
| `onNavPillMuted` | `#A9A3B8` | `#A79C88` (7.25:1) |
| `heroSurface` | `#2A2440` | `#2C241C` |
| `onBanner` | `#F0ECFF` | `#FFFFFF` |
| `starFilled` | `#FFBF5A` | `#D8B872` |
| `starEmpty` | `#3D3360` | `#3D3327` |
| `success` | `#5CC98A` | `#6FC08F` |
| `error` | `#F07080` | `#F08A8A` |
| `warning` | `#FFBF5A` | `#E0B060` |
| `info` | `#7AAEF5` | `#8AB4E8` |
| `shadowCard` / `shadowRaised` | `#00000000` | `#00000000` (kural: koyuda gölge yok) |

Gradyan durakları (dark): `primaryGradient` `#B29AE8→#8F72D8` · `headerGradient` ve
`bannerGradient` `#5A3FA8→#6A4CB4` → `#3A2A6E→#1E1440` · `softGradient` `#2C241C→#14110D` ·
`ctaGradient` `#BBA8E5→#9D82D4` → `#8F72D8→#9C82DC` · `infoGradient` `#8AB4E8→#6E9BD8` ·
`successGradient` `#6FC08F→#55A876` · `warningGradient` `#E0B060→#C0913F`.

## 4. Radius kararı

`app_theme.dart` içinde yalnız radius değerleri değişti:

| Öğe | Eski | Yeni |
|---|---:|---:|
| `CardShape` | 16 | **2** |
| `ElevatedButton` / `OutlinedButton` | 14 | **4** |
| `InputDecoration` (5 border) | 12 | **2** |
| `Divider` | 1 px | 1 px hairline + kart kenarlığında `width: 1` açıkça yazıldı |
| Chip (20) | 20 | **korundu** (koordinatör kararı) |
| Alt gezinme hapı | 999 | **korundu** (widget tarafı, bu dosyada değil) |

`sheet 8 px` kararı `app_theme.dart`'te karşılıksız: dosyada `bottomSheetTheme` yok, yeni bir
bölüm eklenmedi (kural: yapı/düzen değişikliği yok). 8 px, sheet üreten widget'larda uygulanır.
`fontFamily: 'Poppins'` satırlarına hiç dokunulmadı — salon_app serif/font değişimi almıyor.

## 5. Kapsam dışı (bilinçli)

- **Font**: Poppins kalmaya devam eder (bu görev font sözleşmesi taşımıyor).
- **Layout / yapı**: ekran dosyalarındaki sabit radius'lar (ör. `login_screen.dart` 22/16/14,
  `salon_appointments_screen.dart` 16/14/12, `register_screen.dart` 12) ve inline
  `LinearGradient` (`register_screen.dart:166`, `primaryGradient` duraklarından türüyor)
  bu görevde değişmedi. Ekran radius'ları ayrı bir iş.
- **Yeni token yok**: §2'deki altı `customer_app` tokeni eklenmedi; `goldGradient` gibi
  şampanya dolgulu gradyanlar salon ekranlarında kullanılmıyor.
- **`accentLime` adı korundu**; değer şampanya altını. Kural: şampanya asla metin rengi
  olmaz (light yüzeyde 2.29:1, zeminde 2.01:1, variantta 1.93:1 — ikon eşiği 3:1'in altında),
  yalnızca dolgu/kenarlık/hairline/ikon. Bugün salon widget kodunda `accentLime` kullanımı
  yok: `grep -rn "accentLime" apps/salon_app/lib | grep -v app/theme` → 0 satır.

## 6. Test

`test/app/theme/app_colors_test.dart` eski hex'leri kilitlemiyordu (rol + eşik testleri), bu
yüzden eşik düşürülmedi, test silinmedi. Katılanlar:

1. `LX-001 palet kilitleri` grubu (+2 test): light ve dark setlerinin 30 değeri birebir
   kilitlenir — palet dışına çıkan bir token "AA geçen başka bir renk" olarak sızamaz.
2. Gradyan kontrast halkasına `infoGradient`/`successGradient`/`warningGradient` eklendi
   (stat kartları `onPrimary` taşır; sınıf sözleşmesi bu kapıyı vaat ediyordu ama test
   yalnızca primary/cta'yı denetliyordu).
3. Şampanya "metin olamaz" kapısına `surfaceVariant` vakası eklendi.

En dar kalan oranlar (test kapıları değil, ölçüm): `starFilled`/`heroSurface` light **3.08:1**
(ikon eşiği 3), `primaryGradient`/`ctaGradient` dark ucu `onPrimary` ile **4.99:1**,
`accent`/`surface` light **4.99:1**.

## 7. Doğrulama

```sh
cd apps/salon_app && flutter analyze          # No issues found!
cd apps/salon_app && flutter test             # 86 test, All tests passed!
cd apps/salon_app && flutter test test/app/theme/app_colors_test.dart   # 30 test
git diff --stat -- apps/salon_app/lib/app/theme apps/salon_app/test/app/theme \
                  docs/salon-app/08-design-system.md
```

Dosyalar: `apps/salon_app/lib/app/theme/app_colors.dart`,
`apps/salon_app/lib/app/theme/app_theme.dart`,
`apps/salon_app/test/app/theme/app_colors_test.dart`,
`docs/salon-app/08-design-system.md` (§8.1 + §8.3 radius satırı), bu plan.
`plans/saloon/INDEX.md` bu görevin sahiplik listesinde değil — SA-002 satırını ekleme işi açık.
Görsel kare alınmadı (doğrulanmadı: ekran görüntüsü akışı bu görevin kapılarında yok).
