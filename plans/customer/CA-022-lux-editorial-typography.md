# CA-022 — customer_app: Luxury Editorial tipografi + radius (LX-001)
Durum: **UYGULANDI** (2026-10-21). Kapsam **yalnızca** `app_theme.dart`: yeni font dosyası/asset
eklenmedi, `google_fonts` (^6.2.1) üzerinden `GoogleFonts.fraunces` + `GoogleFonts.nunito`
kullanıldı. Renk tarafı C1/CA-021'de bitti; `app_colors.dart`'a dokunulmadı.

## Hedef
Luxury Editorial dilini iki eksende kurmak: (1) **display + başlık ailesi Fraunces**, gövde/etiket
**Nunito**'da kalacak şekilde rol ayrımı; (2) **keskin köşe + hairline** radius ölçeği (kart 2px,
buton 4px, input 2px, sheet 8px). Okunurluk kuralı: serif yalnızca başlıkta — uzun gövde metni
Nunito'da kalır (1.55 satır yüksekliği, etikette 0.16em tracking).

## Tip ölçeği
`_luxTextTheme(TextTheme)` tek noktadan uygular (light + dark aynı kuralla).

| Stil | Aile | Punto | Ağırlık | Tracking | Satır yük. |
|---|---|---:|---|---:|---:|
| `displayLarge` | Fraunces | 57 | 400 | -0.01em (-0.57) | 1.15 |
| `displayMedium` | Fraunces | 45 | 400 | -0.01em (-0.45) | 1.15 |
| `displaySmall` | Fraunces | 36 | 500 | -0.01em (-0.36) | 1.15 |
| `headlineLarge` | Fraunces | 32 | 600 | -0.01em (-0.32) | 1.15 |
| `headlineMedium` | Fraunces | 28 | 600 | -0.01em (-0.28) | 1.15 |
| `headlineSmall` | Fraunces | 24 | 500 | -0.01em (-0.24) | 1.15 |
| `titleLarge` | Fraunces | 22 | 600 | -0.01em (-0.22) | 1.15 |
| `titleMedium` | Nunito | 16 | 500 (mevcut) | 0.15 | — |
| `titleSmall` | Nunito | 14 | 500 (mevcut) | 0.10 | — |
| `bodyLarge` | Nunito | 16 | 400 (mevcut) | 0.50 | **1.55** |
| `bodyMedium` | Nunito | 14 | 400 (mevcut) | 0.25 | **1.55** |
| `bodySmall` | Nunito | 12 | 400 (mevcut) | 0.40 | **1.55** |
| `labelLarge` | Nunito | 14 | 500 (mevcut) | 0.10 | — |
| `labelMedium` | Nunito | 12 | 500 (mevcut) | 0.50 | — |
| `labelSmall` | Nunito | 11 | **600** | **0.16em (1.76)** | — |

`-0.01em` / `0.16em` em cinsindendir; Flutter `letterSpacing` punto beklediği için kodda
`-0.01 * fontSize` / `0.16 * fontSize` olarak hesaplanır (tablodaki parantez değerleri).

Ek stiller: **AppBar başlığı** = Fraunces 20 / w600 / tracking -0.01 (eskiden Nunito 18 / w700 /
-0.3). **Buton metni** (`elevatedButton`, `filledButton`, `outlinedButton`) = 15 / **w700** /
0.02 (eskiden 16 / w600; `filledButton` w800'di — kaldırıldı). `textButton` değişmedi (14 / w600).

## Radius (eski → yeni)
| Bileşen | Eski | Yeni |
|---|---:|---:|
| kart (`cardTheme`) | 16 | **2** |
| `elevatedButton` | 14 | **4** |
| `filledButton` | 999 | **4** |
| `outlinedButton` | 14 | **4** |
| input (`inputDecorationTheme`, 4 kenar) | 14 | **2** |
| `dialogTheme` | 20 | **4** |
| `chipTheme` | 20 | **6** |
| `bottomSheetTheme` | tanımsız (M3 ~28) | **8** (yeni tema) |

`dividerTheme` 1px + `c.divider` **korundu** (zaten sözleşmeye uygundu; hairline artık radius
dilinin taşıyıcısı). **Alt gezinme hapı (999, widget tarafında) ve `navPill` tokenı değişmedi** —
hap formu bilinçli istisna. Gölge tokenlarına dokunulmadı (C1 halletti).

## Regresyon notu (tipografi → kart yüksekliği)
`body*` satır yüksekliği **1.55** olduğu için, `Text(style: TextStyle(fontSize: …))` yazan her
widget satır yüksekliğini `DefaultTextStyle` üzerinden devralır (stil birleşmesi). Sonuç: iki kartın
*doğal* yüksekliği **+4px** arttı ve `salon_card_test.dart` içindeki "grid/şerit hücresi kartın
doğal yüksekliğini karşılasın" testleri kırmızıya döndü (doğal 238.0 > `preferredHeight` 236.0;
`extentFor` farkı tam 4px). Kök neden `height: 1.55`; çözüm yükseklik tahmin sabitlerinde:
`core/widgets/salon_card.dart` ve `.../discover_salon_card.dart` içinde `contentHeight 96 → 100`
(+4px). Test/eşik değişmedi, `height: 1.55` kaldı (editorial ritim korunur). Sahiplik koordinatör
kararıyla bu iki sabitle sınırlı genişletildi; başka satıra dokunulmadı.

## Kapsam dışı bırakılanlar
- `app_colors.dart` (C1/CA-021), widget/ekran dosyaları (yalnızca iki `contentHeight` sabiti,
  yukarıdaki not), `pubspec.yaml` (google_fonts zaten bağımlı), başka app'ler.
- Font dosyası/asset: eklenmedi; GoogleFonts paketi üzerinden çalışılır.
- Testler: değiştirilmedi, eşik düşürülmedi.
- `navPill` / alt gezinme hapı radiusu, gölge tokenları, renk kararları.

## Doğrulama
```sh
cd apps/customer_app && flutter analyze    # No issues found! (ran in 2.1s)
cd apps/customer_app && flutter test       # All tests passed! (274 test)
cd /home/baris/orca/beauty-salon && git diff --stat -- \
  apps/customer_app/lib/app/theme/app_theme.dart \
  apps/customer_app/lib/core/widgets/salon_card.dart \
  apps/customer_app/lib/features/salon_discovery/presentation/widgets/discover_salon_card.dart
```
