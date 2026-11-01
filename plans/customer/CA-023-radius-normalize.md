# CA-023 — customer_app: radius normalizasyonu (LX-002)

Durum: **UYGULANDI** (2026-10-29). Kapsam **LX-002**: `apps/customer_app/lib` içindeki
**sayısal literal** `BorderRadius.circular(N)` çağrıları tek ölçeğe indirildi. Görünüm boyutu,
padding ve renk değişmedi; `analysis_options.yaml` değişmedi; **commit yok** (işlem çalışma
ağacında).

## Neden

CA-022 tema tarafında radius ölçeğini kurdu (kart 2 / buton 4 / input 2 / sheet 8), ama widget
dosyalarında hâlâ dokuz farklı değer yaşıyordu (10, 12, 14, 16, 18, 20, 22, 24, 28). Aynı kart
bileşeni ekranda 2px, yerde 12px köşe alıyordu; Luxury Editorial "keskin köşe + hairline" dili
widget tarafında bozuluyordu.

## Harita (uygulanan kural)

| Eski değer | Yeni |
|---|---:|
| 6, 8, 10, 12, 14 | **4** — istisna: chip/rozet → **6** |
| 16, 18, 20, 22, 24 | **2** |
| 28, 32, 36 | **8** |
| 1, 2, 4 | **dokunulmadı** (zaten ölçekte) |
| 999 ve hap formu | **korundu** (bilinçli istisna) |

## İstisnalar

| İstisna | Yer | Not |
|---|---|---|
| Yumuşak yüzey / sheet → 8 (4 çağrı kaldı) | `app/theme/app_theme.dart:265,436` (`bottomSheetTheme`, light/dark), `pill_bottom_nav.dart:59` (navPill kabı, 28→8), `banner_header.dart:24` (banner altı, 28→8) | "28/32/36 → 8" hedefi + CA-022 sheet tokenı; rozet değil, büyük yüzey |
| Chip/rozet/etiket kutuları → 6 | `app/theme/app_theme.dart:240` (`chipTheme` light), `:412` (`chipTheme` dark) + 11 widget çağrısı (`category_chips.dart:31`, `salon_card_content.dart:19,73`, `salon_card_image.dart:27,181`, `appointment_card.dart:159`, `profile_screen.dart:172`, `menu_section.dart:137`, `salon_info_section.dart:110,128`, `staff_list_widget.dart:86`) | Hepsi küçük dolgulu kutu (padding 8-14 × 2-8); rozet 4px köşede okunurluğunu yitiriyor. Toplam 13 çağrı = 2 tema + 11 widget |
| Tam yuvarlak pill | `app/widgets/pill_bottom_nav.dart:119` — `circular(18)` → `circular(999)` | 44×36 kutu (`:113-114`); 18 zaten yarı yüksekliğin (22) altında kaldığı için daireyi tamamlamıyordu, 999 ile görsel aynı + kasıttan bağımsız |
| Dairesel öğeler | `CircleAvatar` 2 kullanım (`staff_step.dart`, `review_card.dart`) | `CircleBorder`/`CircleAvatar` radius taşımaz, dokunulmadı |
| Dinamik radius parametreleri | `core/widgets/state_view.dart:61` (`circular(widget.borderRadius)`), `salon_discovery/.../chip_selector.dart:46` (`circular(pill ? 20 : 10)`) | Çağrı sahibi/bileşen kuralı; literal olmadığı için harita dışı |
| Hap 999 | `banner_header.dart:84`, `hero_promo_card.dart:102`, `page_dots.dart:34` | CA-022'de de istisnaydı, korundu |

## Ölçüm (aynı grep kapısı, taban → sonra)

Kapı = `Radius.circular(` + haritada yeri kalmaması gereken değerler
(3, 5, 7, 9, 10, 12, 14, 16, 18, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36).

| Ölçüm | Taban (HEAD, değişiklik öncesi) | Sonra (çalışma ağacı) |
|---|---:|---:|
| Sayısal literal çağrı | 141 çağrı / 59 dosya | 143 çağrı / 59 dosya |
| Haritadaki eski değerler (6,8,10,12,14,16,18,20,22,24,28) | **130 çağrı / 58 dosya** | 17 çağrı / 11 dosya (yalnızca 6 ve 8 — istisnalar) |
| Kapı grep'i (aynı regex, 6 ve 8 hariç) | 124 çağrı | **0** |

Taban değer dağılımı: 2×3, 4×3, 6×2, 8×4, 10×11, **12×55**, 14×17, 16×15, 18×4, 20×16, 22×2, 24×2, 28×2, 999×5.
Sonra: **4×81**, **2×41**, 6×13, 8×4, 999×4.

> **Sayım notu (spec ile fark):** görev metnindeki "önce 116 çağrı / 60 dosya" bu kapıyla
> yeniden üretilemedi. Aynı komut seti tabanda **130 çağrı / 58 dosya** (haritadaki değerler) veya
> **141 çağrı / 59 dosya** (tüm sayısal literaller) veriyor; 116/60 hiçbir kapıda çıkmıyor.
> Dokümandaki sayılar kaynaktan (`git grep`) okunan gerçek değerlerdir.

## Doğrulama

```sh
cd /home/baris/orca/beauty-salon/apps/customer_app
flutter analyze     # No issues found! (ran in 1.1s)
flutter test        # 00:08 +277: All tests passed!

cd /home/baris/orca/beauty-salon
# kapı: haritada yeri kalmayan değerler -> 0 beklenir
grep -rhoE 'Radius\.circular\([0-9]+\)' apps/customer_app/lib --include='*.dart' \
  | grep -cE 'circular\((3|5|7|9|1[0-9]|2[0-9]|3[0-6])\)'      # -> 0
# kalan değer kümesi
grep -rhoE 'Radius\.circular\([0-9]+\)' apps/customer_app/lib --include='*.dart' \
  | sort | uniq -c | sort -n                                   # -> 2,4,6,8,999
git status --porcelain -- apps/customer_app/analysis_options.yaml  # boş = değişmedi
```

## Kapsam dışı

Görünüm boyutu / padding / renk değişikliği yok; **commit yok** (işlem çalışma ağacında).
`analysis_options.yaml`, test eşikleri, başka app'ler (`admin_panel`, `salon_app`) ve dinamik
radius parametreleri kapsam dışı.
