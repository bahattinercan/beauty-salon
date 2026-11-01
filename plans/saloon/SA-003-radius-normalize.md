# SA-003 · salon_app widget radius normalizasyonu (LX-002 / R2)

Durum: **UYGULANDI** (çalışma ağacında, commit yok · worker `task_f360b5bff4cc`)

Kapsam: `apps/salon_app/lib/**/*.dart` — widget dosyaları. Tema dosyalarında **yalnızca**
`app/theme/app_theme.dart:129` `chipTheme` satırı (koordinatörün ek yetkisi, tek satır).
Başka hiçbir görsel niteliğe (renk, gölge, padding, fontSize, widget yapısı) dokunulmadı.

## 1. Radius haritası (değer bazlı, tek kural)

| Kaynak değer | Hedef | Not |
|---|---|---|
| `circular(1)`, `circular(2)`, `circular(4)` | **dokunma** | hairline / drag handle / küçük rozet |
| `circular(6)`, `circular(8)`, `circular(10)`, `circular(12)`, `circular(14)` | `circular(4)` | kart, buton, sheet, dialog içi öğeler |
| `circular(16)`, `circular(18)`, `circular(20)`, `circular(22)`, `circular(24)` | `circular(2)` | büyük yüzeyler: dialog, kart, header bloğu, sheet üstü |
| `circular(28)`, `circular(32)`, `circular(36)` | `circular(8)` | gradyan header'ların alt kavisi |
| **İSTİSNA** chip / rozet (yüksekliği ≤ 32px olan tek satırlık küçük kutu) | `circular(6)` | hangi kullanımın chip sayıldığı §4'te tek tek listeli |
| `circular(999)`, `StadiumBorder` | **dokunma** | bu repoda hiç yok (grep: 0) |
| Daire (`CircleAvatar`, `BoxShape.circle`, radius == genişlik/2) | **dokunma** | §5 |

**Chip/rozet testi (uygulamada kullanılan işletim):** kutu tek satırlık kısa bir metin/ikon
içeriyor VE `dikey padding × 2 + satır yüksekliği ≤ 32px` VE kart/dialog/sheet/buton gibi
yapısal bir yüzey **değil** → `circular(6)`. Sınırda kalan iki kullanım §4'te işaretli.

## 2. Uygulanan sayılar

| Hedef | Değişiklik sayısı |
|---|---|
| → `circular(2)` | **31** |
| → `circular(4)` | **18** |
| → `circular(6)` (chip istisnası) | **13** (12 widget + 1 `chipTheme`) |
| → `circular(8)` | **4** |
| **TOPLAM** | **66 satır** (65 widget + 1 tema chip satırı) |

Dokunulmayan `circular()` çağrıları: 9 (`circular(1)`×1, `circular(2)`×6, `circular(4)`×2)
+ 1 zaten `circular(6)` olan rozet + 1 dinamik parametre (§5). Toplam literal çağrı: 75.

Uygulama sonrası değer dağılımı (widget dosyaları): `2`→37 · `4`→20 · `6`→13 · `8`→4 · `1`→1.

## 3. Dosya listesi ve satır sayıları

| Dosya (`apps/salon_app/lib/…`) | Değişen satır |
|---|---|
| `features/profile/presentation/screens/salon_profile_screen.dart` | 24 |
| `features/dashboard/presentation/screens/dashboard_screen.dart` | 12 |
| `features/auth/presentation/screens/login_screen.dart` | 6 |
| `features/staff/presentation/screens/staff_management_screen.dart` | 6 |
| `features/auth/presentation/screens/register_screen.dart` | 5 |
| `features/appointments/presentation/screens/salon_appointments_screen.dart` | 4 |
| `features/reviews/presentation/screens/salon_reviews_screen.dart` | 4 |
| `features/services/presentation/screens/service_management_screen.dart` | 4 |
| `app/theme/app_theme.dart` (yalnızca `chipTheme`, satır 129) | 1 |
| **TOPLAM** | **66** |

Değişen satırlar (satır:no, eski→yeni):

- `salon_appointments_screen.dart`: 166 12→6 · 199 16→2 · 251 14→4 · 328 8→6
- `login_screen.dart`: 57 36→8 · 71 22→2 · 149 14→4 · 158 14→4 · 193 16→2 · 254 16→2
- `register_screen.dart`: 50 12→4 · 66 36→8 · 80 22→2 · 171 14→4 · 186 14→4
- `dashboard_screen.dart`: 61 20→2 · 68 20→2 · 151 8→4 · 177 28→8 · 201 14→4 · 226 20→2 · 255 16→2 · 264 10→6 · 284 8→6 · 306 16→2 · 323 16→2 · 345 10→6
- `salon_profile_screen.dart`: 56 32→8 · 70 24→2 · 75 24→2 · 97 20→6 · 109 20→6 · 133 18→2 · 190 12→4 · 206 12→4 · 244 16→2 · 256 10→4 · 359 16→2 · 390 16→2 · 422 16→2 · 446 16→2 · 493 18→2 · 526 12→4 · 530 12→4 · 613 24→2 · 747 24→2 · 898 24→2 · 993 8→6 · 1083 16→2 · 1147 24→2 · 1250 8→4
- `salon_reviews_screen.dart`: 136 20→6 · 149 16→2 · 192 14→4 · 248 8→4
- `service_management_screen.dart`: 48 10→6 · 85 16→2 · 133 14→4 · 243 24→2
- `staff_management_screen.dart`: 64 16→2 · 112 16→2 · 125 14→4 · 181 8→6 · 247 24→2 · 302 20→6
- `app/theme/app_theme.dart`: 129 20→6 (chipTheme — ek yetki)

Eşleşme kuralı: bir Container'ın radius'u ile içindeki `ClipRRect` / buton `shape`'ı aynı değere
gitti (profile 70↔75, profile 526↔530, login 149↔158, register 171↔186) — görsel maskeleme
uyumsuzluğu oluşmasın diye.

## 4. Chip / rozet istisnaları (→ 6)

| Yer | Kullanım | Ölçü kanıtı (tahmini yükseklik) |
|---|---|---|
| `salon_appointments_screen.dart:166` | `_filterChip` (durum filtresi) | padding v4 + font 11 → ~24px |
| `salon_appointments_screen.dart:328` | `_actionBtn` (Onayla/Tamamla/Git satır içi pill) | padding v6 + ikon 14 → ~29px |
| `dashboard_screen.dart:264` | randevu saati hapı | padding v8 + font 13 → ~31px **(sınırda)** |
| `dashboard_screen.dart:284` | durum hapı | padding v5 + font 11 → ~25px |
| `dashboard_screen.dart:345` | `_StatCard` 32×32 ikon rozeti | yükseklik 32px (tam sınır) |
| `salon_profile_screen.dart:97` | "Doğrulanmış" rozeti (ikon+metin) | padding v4 + ikon 14 → ~25px |
| `salon_profile_screen.dart:109` | puan rozeti (ikon+metin) | padding v4 + ikon 14 → ~25px |
| `salon_profile_screen.dart:993` | `_TimeChip` (saat seçici chip) | padding v6 + font 13 → ~30px |
| `salon_reviews_screen.dart:136` | `_filterChip` (filtre) | padding v6 + font 12 → ~29px |
| `service_management_screen.dart:48` | kategori sayaç rozeti | padding v2 + font 12 → ~21px |
| `staff_management_screen.dart:181` | `Wrap` içi servis etiketi | padding v3 + font 11 → ~22px |
| `staff_management_screen.dart:302` | seçilebilir servis chip'i | padding v6 + font 12 → ~29px |
| `app/theme/app_theme.dart:129` | `chipTheme.shape` (koordinatör ek yetkisi) | padding v6 + font 13 → ~29px |

Zaten 6 olan (değişmedi): `salon_appointments_screen.dart:316` `_statusBadge` (padding v3, font 10).

Chip **sayılmayıp** haritaya göre inenler (yapısal yüzey): `login/register` gradyan header'ları,
tüm `AlertDialog.shape`, `OutlinedButton.icon` (profile 190/206, ~48px), `InkWell.borderRadius`
(profile 1250, sadece ripple maskesi), sheet üst kavileri, `CircleAvatar` dışı 38–52px ikon kutuları.

## 5. Kural dışı / dokunulmayan kullanımlar (liste — karar bekliyor olabilir)

1. `core/widgets/state_view.dart:64` — `BorderRadius.circular(widget.borderRadius)` **dinamik**.
   Sayısal literal olmadığı için harita uygulanmadı. Kaynağı da literal değil:
   `Skeleton.borderRadius = 8` (satır 26) ve `SkeletonList → Skeleton(borderRadius: 16)` (satır 85).
   Bunlar `circular()` çağrısı olmadığından grep kapısını tetiklemiyor; **bilinçli olarak dokunulmadı**.
   (Amaç skeleton'ları da normalleştirmekse ayrıca bir iş gerekir.)
2. `features/reviews/…/salon_reviews_screen.dart:201-202` — `CircleAvatar(radius: 18)` → tam daire, dokunulmadı.
3. `features/profile/…/salon_profile_screen.dart:1255-1258` — `BoxShape.circle` 20×20 radyo işareti, dokunulmadı.
4. `features/appointments/…/salon_appointments_screen.dart:266` — `Container(width:2, height:40)` içinde `circular(1)` → 1 kuralı gereği dokunulmadı.
5. Drag handle'lar `circular(2)` (profile 621/755/906/1155, services 251, staff 255) → dokunulmadı.
6. Pasif rozetler `circular(4)` (services 150, staff 146) → dokunulmadı.
7. Repoda hiç bulunmayan desenler (grep 0): `StadiumBorder`, `BorderRadius.all`, `BorderRadius.only`,
   `BorderRadius.horizontal`, `CircleBorder`, `ClipOval`, `circular(999)`.
8. Tema klasörlerinde **başka** radius'lar duruyor (harita uygulanmadı): `app_theme.dart` satır 65 (`2`),
   77/89 (`4`), 106-118 (`2`×5) — bunlar **başka bir ajanın commit edilmemiş LX-001 işi**, bana
   yalnızca chip satırı (129) verildiği için onlara dokunulmadı. `lib/core/theme/` içinde radius yok.

## 6. Doğrulama (çalıştırılan komutlar ve son satırlar)

```
$ cd apps/salon_app && flutter analyze
No issues found! (ran in 1.3s)

$ cd apps/salon_app && flutter test
00:02 +86: All tests passed!

$ cd /home/baris/orca/beauty-salon && grep -rE "circular\((10|12|14|16|18|20|22|24|28|32|36)\)" \
    apps/salon_app/lib --include=*.dart | grep -vE "/(app|core)/theme/" | wc -l
0
```

Diff hijyeni: `git diff -U0 -- apps/salon_app/lib` içinde widget dosyalarında `circular(` içermeyen
tek bir artı/eksi satır yok (değer dışında değişiklik yok). `analysis_options.yaml` değişmedi
(flutter analyze sonrası diff alındı, fark yok).

## 7. Notlar / kalan iş

- Commit atılmadı; değişiklikler çalışma ağacında. Repoda başka ajanların kirliliği var
  (`apps/salon_app/lib/app/theme/app_colors.dart` LX-001 renk işi bu diff'e karışmış durumda).
- `plans/saloon/INDEX.md` (bu görevin sahiplik alanında değil, başka ajan güncelledi) SA-003 satırını
  durum **PLAN** ile eklemiş; satırın tarifi uygulanan kapsamla farklı: "alt gezinme hapı 999
  istisnası" salon_app kodunda **yok** — `grep -rn "999" lib` ve `grep -rn StadiumBorder lib` 0 sonuç,
  `lib/shared/widgets/salon_main_scaffold.dart` içinde hiçbir radius kullanımı yok (varsayılan
  `NavigationBar` teması). Durum satırının **UYGULANDI** olarak güncellenmesi koordinatöre bırakıldı.
- `Skeleton` / `SkeletonList` radius parametreleri (8 ve 16) harita dışında kaldı — normalize
  edilecekse ayrı bir karar gerek (§5/1).
