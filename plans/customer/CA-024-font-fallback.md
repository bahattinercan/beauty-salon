# CA-024 — customer_app: font fallback zinciri (LX-002)

Durum: **UYGULANDI** (2026-10-29). Kapsam **LX-002**: yalnızca `apps/customer_app/lib/app/theme/app_theme.dart`
ve yeni test dosyası. Asset/font dosyası eklenmedi, `google_fonts` sürümü değişmedi; **commit yok**
(işlem çalışma ağacında).

## Sorun

CA-022 tipografiyi `google_fonts` (^6.2.1) üzerinden kurdu: `GoogleFonts.fraunces` + `GoogleFonts.nunito`.
Paket fontu **ilk kullanımda runtime'da** indirir. Cevrimdışı ilk açılışta (veya ağ izni/kısıtı olan
ortamda) `fontFamily` çözülemez ve Flutter son çare çizimine düşer → **tofu / boş kutu**. Uygulama
açılışta ağa bağımlı olmamalı; Fraunces/Nunito "varsa güzellik", yoksa okunur metin olmalı.

## Çözüm

İki sabit tek noktadan tanımlandı (`app/theme/app_theme.dart:15-16`):

```dart
static const List<String> serifFallback = ['Georgia', 'Times New Roman', 'serif'];
static const List<String> sansFallback  = ['Roboto', 'Helvetica', 'sans-serif'];
```

Zincir stillere iki yoldan yayılır:

1. **Gövde/etiket (toplu):** `_luxTextTheme` içinde `nunito.apply(fontFamilyFallback: sansFallback)`
   (`:58`) — `TextTheme.apply` tüm stillere yedek zinciri basar.
2. **Serif başlıklar + tema içi `const TextStyle`'ler (tek tek):** `serif()` helper'ı
   `GoogleFonts.fraunces(...).copyWith(fontFamilyFallback: serifFallback)` (`:73`), AppBar başlığı
   (`:129` light, `:302` dark) ve buton metinleri `elevatedButton` / `filledButton` / `outlinedButton` /
   `textButton` (`:164,181,196,207` light, `:337,353,368,379` dark). Buton stilleri
   `const TextStyle` ile tema içinde elle yazıldığı için `apply` oradan sızmaz — oralara açıkça eklendi.

> **Tuzak:** google_fonts 6.x imzasında `GoogleFonts.fraunces(...)` için fallback **parametresi yok**;
> dönen stilin kendi `fontFamilyFallback`'i `['Fraunces']`. Parametre geçmeye çalışmak sessizce yok
> sayılırdı — bu yüzden `copyWith` şart (kodda `:63-67` yorumunda).

### Kullanım sayımı (gerçek)

`app_theme.dart` içinde `serifFallback` / `sansFallback` **14 satırda** geçiyor: 2 tanım + **12 gerçek
kullanım** (9 × `sansFallback`, 3 × `serifFallback`). `fontFamilyFallback` ifadesinin kendisi 13 satırda
geçer (12 kullanım + 1 yorum satırı `:65`). Görev metnindeki "13 kullanım" bu iki sayıdan hangisi
olduğu net değil; yukarıdaki sayılar kaynaktan okundu.

## Test

`apps/customer_app/test/app/theme/app_theme_typography_test.dart` — **3 test**, **ağa çıkmaz**:

| Test | Ölçtüğü |
|---|---|
| `serif zinciri Georgia → Times New Roman → serif, serif son çare` | `AppTheme.serifFallback` içeriği, son eleman `serif` |
| `sans zinciri sans-serif jenerik ailesini taşır` | `AppTheme.sansFallback` son eleman `sans-serif` |
| `serif ve sans zincirleri birbirine karışmaz` | kesişim boş; serif'te `sans-serif`, sans'ta `serif` yok |

Test **tema kurucularını (`AppTheme.lightTheme` / `darkTheme`) çağırmaz** — tema kurulumu Google Fonts
indirmesini tetiklediği için ağ kapalıyken tüm suite kırılıyordu. Yalnızca sabit liste okunur, hiçbir
font yükleme sınıfı çalışmaz.

## Sınır

Asset bundle'a font gömülmedi (paket boyutu + CA-022 kararı). Davranış: **ağ varsa** Fraunces/Nunito
yüksek sadakatle indirilir; **yoksa** platformun hazır fontları (Georgia / Roboto ve jenerik
`serif` / `sans-serif`) kullanılır. Yani cevrimdışı ilk açılışta tofu yerine okunur metin garanti,
birebir tipografik eşleşme garanti değil.

## Doğrulama

```sh
cd /home/baris/orca/beauty-salon/apps/customer_app
flutter analyze                       # No issues found! (ran in 1.1s)
flutter test                          # 00:08 +277: All tests passed!
flutter test test/app/theme/app_theme_typography_test.dart   # 3 test geçiyor
grep -cE 'fontFamilyFallback:' lib/app/theme/app_theme.dart  # -> 12
grep -nE 'static const List<String> (serif|sans)Fallback' lib/app/theme/app_theme.dart  # -> 15,16
```

## Kapsam dışı

Görünüm boyutu / padding / renk değişikliği yok; **commit yok** (işlem çalışma ağacında).
Font dosyası/asset, `pubspec.yaml` değişikliği, `google_fonts` sürüm yükseltmesi, başka app'ler ve
`app_colors.dart` kapsam dışı.
