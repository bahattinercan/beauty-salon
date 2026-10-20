# CA-020 — customer_app: gölge + puan tokenları (SA-001 kapılarının paritesi)

Durum: **UYGULANDI** (2026-10-21). `salon_app`'te kapatılan renk borcunun aynıları burada da duruyordu;
üç uygulamanın (admin_panel, salon_app, customer_app) aynı kontrast/gölge kurallarına tabi olması için
kapılar customer_app'e de taşındı.

## Neden

`AppColors` token sözleşmesi CA-019'da gelmişti ama iki şey sözleşme dışında kalmıştı:

- **20 adet `Colors.black.withValues(alpha: …)`**: kart gölgeleri, sabit alt çubuk gölgesi, alt gezinme
  hapının gölgesi ve kapak fotoğrafı üstündeki karartmalar. Koyu temada bu gölgeler işe yaramıyor
  (koyu zeminde görünmüyor), ayrım kenarlıkla yapılıyor — yani koyu temada gereksiz/yanlış bir katman
  üretilmeye devam ediyordu.
- **`starFilled` = `#FFB547`**: puan yıldızı yüzey üzerinde **1.76:1** — WCAG non-text eşiği 3:1.
  Salon kartlarında ve puan özetinde yıldız şekli seçilemiyordu.

## Yapılan

`AppColors`'a altı token eklendi (light/dark çift):

| Token | light | dark | Nerede |
|---|---|---|---|
| `shadowCard` | `#0A000000` (%4) | `#00000000` | kartlar |
| `shadowRaised` | `#0D000000` (%5) | `#00000000` | bölüm/öne çıkan kart, yorum listesi |
| `shadowFloat` | `#14000000` (%8) | `#00000000` | sabit alta çubuk, yüzen butonlar |
| `shadowPill` | `#38000000` (%22) | `#00000000` | alt gezinme hapı (`pill_bottom_nav`) |
| `coverScrimButton` | `#6B000000` (%42) | aynı | kapak üstü dairesel buton |
| `coverScrimFade` | `#80000000` (%50) | aynı | kapak altı degrade karartma |

Kural (testte kilitli): **gölge yalnızca açık temada**; koyuda opaklık 0. Karartma (scrim) ise gölge
değildir, fotoğraf üstünde olduğu için iki temada da kalır — bu ayrım token adlarında da görünür.

`starFilled` light: `#FFB547` → `#BF7B00` (yüzey üstü 3.47:1; `surfaceVariant`/`background` üstünde de
≥3:1). Dark `#FFBF5A` kaldı (10.62:1).

## Kapı sonuçları

| Ölçüm | Önce | Sonra |
|---|---:|---:|
| Widget kodunda `Colors.black` | 20 | **0** |
| Token kullanım noktası (gölge/karartma) | 0 | **20** |
| `flutter analyze` | temiz | **No issues found** |
| `flutter test` | 272 | **275** (yeni 3 test: gölge opaklığı, scrim korunumu, yıldız 3:1) |

## Dosyalar

`lib/app/theme/app_colors.dart` (tokenlar), 14 widget/ekran dosyası (gölge çağrıları),
`lib/features/salon_detail/presentation/widgets/cover_header.dart` (eksik `AppColors.of(context)`
bağlamı eklendi), `test/app/theme/app_colors_test.dart` (yeni `group`).

## Not

`CircleIconButton` içinde `this.iconColor = Colors.white` varsayılan parametresi duruyor; kapak
fotoğrafı üstünde kullanıldığı için sözleşme dışı bırakıldı (çağıranlar token rengi geçiyor).
