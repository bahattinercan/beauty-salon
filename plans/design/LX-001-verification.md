# LX-001 — Doğrulama Raporu (V1)
Tarih: 2026-10-21 · Kapsam: LX-001 Luxury Editorial palet + tipografi işinin üç uygulamadaki kapı
sonuçları, palet eşleşmesi ve kapsam denetimi. **Bu rapor salt okunur bir turun çıktısıdır: hiçbir
düzeltme yapılmadı**, yalnızca bu dosya oluşturuldu.

## (a) Kapılar
| # | Uygulama | Komut | Sonuç | Çıktının son satırı | İlk hata satırı |
|---|---|---|---|---|---|
| 1 | customer_app | `flutter analyze` | **YEŞİL** (exit 0) | `No issues found! (ran in 1.2s)` | — |
| 2 | customer_app | `flutter test` | **YEŞİL** (exit 0) | `00:09 +274: All tests passed!` | — |
| 3 | salon_app | `flutter analyze` | **YEŞİL** (exit 0) | `No issues found! (ran in 0.8s)` | — |
| 4 | salon_app | `flutter test` | **YEŞİL** (exit 0) | `00:03 +86: All tests passed!` | — |
| 5 | admin_panel | `npm run typecheck` | **YEŞİL** (exit 0) | `tsc --noEmit` uyarı/hata üretmedi (çıktı boş) | — |
| 6 | admin_panel | `npm run lint` | **YEŞİL** (exit 0) | `eslint` çıktı üretmedi (0 bulgu) | — |
| 7 | admin_panel | `npm run test` | **YEŞİL** (exit 0) | `Test Files 33 passed (33)` · `Tests 283 passed (283)` | — |
| 8 | kök | `node scripts/wcag_tokens.js --scope admin --strict` | **YEŞİL** | `Eşik altı çift (metin 4.5:1 + yüzey ayrımı hedefleri): 0` → `EXIT_ADMIN=0` | — |
| 9 | kök | `node scripts/wcag_tokens.js --scope mobile --strict` | **YEŞİL** | `Eşik altı çift (metin 4.5:1 + yüzey ayrımı hedefleri): 0` → `EXIT_MOBILE=0` | — |

Notlar:
- salon_app `flutter analyze` çıktısının başında pub bilgi notu var (`Downloading packages...`,
  `44 packages have newer versions incompatible with dependency constraints.` /
  `Try flutter pub outdated`). **Hata değil**, kapı yeşil.
- Her iki `--strict` çalıştırmasında tek `FAIL` satırı `accent-lime on surface (lime METİN)`
  (light 2.29:1) ve mobil `accentLime on surface (YASAK metin)` (2.29:1); ikisi de
  `EXPECTED_FAIL` kümesinde olduğu için sayaca girmiyor — sözleşme gereği bilinçli.
- Ölçüm sırasında bir ara koşuda `head` ile boru kapatıldığı için SIGPIPE kaynaklı exit 255
  görüldü; komut boru olmadan tekrarlandı → exit 0, `No issues found!`. Tablodaki değerler
  tekrarlanan temiz koşulara aittir.

## (b) Palet eşleşme matrisi
8 sözleşme rengi × 3 kaynak (case-insensitive; eşleşen token adları parantezde).
Kaynaklar: `apps/customer_app/lib/app/theme/app_colors.dart`,
`apps/salon_app/lib/app/theme/app_colors.dart`, `apps/admin_panel/src/app/globals.css`.

| Hex | Rol | customer_app | salon_app | admin_panel |
|---|---|---|---|---|
| `F4EEE3` | background | ✅ var (`background`, `onNavPill`) | ✅ var (`background`, `onNavPill`) | ✅ var (`--background`, `--on-nav-pill`) |
| `FFFDF8` | surface | ✅ var (`surface`) | ✅ var (`surface`) | ✅ var (`--surface`) |
| `1A1815` | fg / navPill | ✅ var (`textPrimary`, `navPill`, `onAccentLime`) | ✅ var (`textPrimary`, `navPill`, `onAccentLime`) | ✅ var (`--fg`, `--nav-pill`, `--on-accent-lime`) |
| `4E3893` | primary fill | ✅ var (`primary`) | ✅ var (`primary`) | ✅ var (`--primary-solid`, `--banner-from`) |
| `6B4FB8` | primary link | ✅ var (`primaryLight`) | ✅ var (`primaryLight`) | ✅ var (`--primary`) |
| `C6A664` | accent / gold | ✅ var (`accentLime` — şampanya) | ✅ var (`accentLime` — şampanya) | ✅ var (`--accent-lime`) |
| `EFE6D8` | hero yüzeyi | ✅ var (`heroSurface`, `secondary`) | ✅ var (`heroSurface`, `secondary`) | ✅ var (`--hero-surface`, `--secondary`) |
| `E3D9C7` | divider | ✅ var (`divider`) | ✅ var (`divider`) | ❌ **yok** |

**Tek uyuşmazlık `E3D9C7` (divider) — admin_panel:** `globals.css` içinde `--divider` tokenı
**hiç tanımlı değil** (0 eşleşme). Admin ayraç/hairline işini `--border: #DFD5C4` ile yapıyor
(wcag: `border vs surface` 1.43:1 ≥ 1.3 hedefi, geçiyor). Yani renk *rolü* karşılanıyor ama
sözleşmedeki `divider` hexi admin'de yok; üç kaynak arasında **tek eksik hücre budur**.
Diğer 7 hex üç kaynakta birebir aynı.

## (c) Kapsam denetimi
`git status --porcelain` → **101 kirli girdi** (bu rapor yazılmadan önce). Bu run yalnızca
**okuma** komutları çalıştırdı; tek yazma `plans/design/LX-001-verification.md`.

### LX-001 kapsamında olan (15)
| Durum | Dosya |
|---|---|
| M | `apps/customer_app/lib/app/theme/app_colors.dart` |
| M | `apps/customer_app/lib/app/theme/app_theme.dart` |
| M | `apps/customer_app/test/app/theme/app_colors_test.dart` |
| M | `apps/customer_app/lib/core/widgets/salon_card.dart` *(CA-022 regresyon sabiti, koordinatör onaylı)* |
| M | `apps/customer_app/lib/features/salon_discovery/presentation/widgets/discover_salon_card.dart` *(aynı)* |
| M | `apps/salon_app/lib/app/theme/app_colors.dart` |
| M | `apps/salon_app/lib/app/theme/app_theme.dart` |
| M | `apps/salon_app/test/app/theme/app_colors_test.dart` |
| M | `docs/salon-app/08-design-system.md` |
| M | `apps/admin_panel/src/app/globals.css` |
| M | `docs/ADMIN-PANEL.md` |
| ?? | `plans/customer/CA-021-lux-editorial-palette.md` |
| ?? | `plans/customer/CA-022-lux-editorial-typography.md` |
| ?? | `plans/saloon/SA-002-lux-editorial-tokens.md` |
| ?? | `plans/admin/AP-012-lux-editorial-tokens.md` |

Beklenen kümede **olmayan ama LX-001 işi olan** tek dosya: `M scripts/wcag_tokens.js`
(C1'de `EXPECTED_FAIL` kümesine mobil etiketi eklendi). Aşağıdaki "kapsam dışı" listesine
mekanik olarak düştü; LX-001'in parçası olduğu için burada ayrıca işaretlendi.

### Kapsam dışı — önceden kirli (86)
Bu dosyalar **bu run'da değiştirilmedi**; başka ajanların/işlerin commit edilmemiş çalışması.

**`apps/admin_panel/src/**` — 36** (admin i18n + reviews işi):
`app/appointments/page.tsx`, `app/categories/page.tsx`, `app/layout.tsx`, `app/login/page.tsx`,
`app/page.tsx`, `app/reviews/page.tsx`, `app/salons/page.tsx`, `app/settings/page.tsx`,
`app/users/page.tsx`, `components/appointments/AppointmentActions.tsx`,
`components/appointments/AppointmentDetailDialog.tsx`, `components/categories/VideoField.tsx`,
`components/salons/ImageField.tsx`, `components/salons/SalonActions.tsx`,
`components/salons/SalonEditDialog.tsx`, `components/salons/WorkingHoursEditor.tsx`,
`components/shell/AppShell.tsx`, `components/shell/BottomPillNav.tsx`,
`components/shell/MobileDrawer.tsx`, `components/shell/SideRail.tsx`, `components/ui/Badge.tsx`,
`components/ui/DataTable.tsx`, `components/ui/Dialog.tsx`, `components/ui/FilterBar.tsx`,
`components/ui/FilterChips.tsx`, `components/ui/Pagination.tsx`, `components/ui/SalonCard.tsx`,
`components/ui/States.tsx`, `lib/appointmentsQuery.ts`, `lib/categoriesQuery.ts`, `lib/nav.ts`,
`lib/salonsQuery.ts`, `?? components/reviews/`, `?? lib/i18n/`, `?? lib/reviewsQuery.ts`,
`?? providers/LocaleProvider.tsx`

**`apps/admin_panel/tests/**` — 38** (aynı iş):
`lib/appointmentsQuery.test.ts`, `lib/categoriesQuery.test.ts`, `lib/nav.test.ts`,
`lib/salonsQuery.test.ts`, `unit/components/{AppShell,AppointmentActions,AppointmentDetailDialog,
Badge,BottomPillNav,DataTable,Dialog,FilterBar,FilterChips,ImageField,MobileDrawer,
Pagination.pageSize,Pagination,SalonCard,SalonEditDialog,SideRail,States,WorkingHoursEditor}.test.tsx`,
`unit/pages/{appointments,salons}.test.tsx`, `unit/setup.ts`,
`?? lib/{appointmentsMessages,categoriesMessages,i18n,pagesMessages,reviewsMessages,reviewsQuery,uiMessages}.test.ts`,
`?? unit/components/{ReviewActions,ReviewDetailDialog}.test.tsx`,
`?? unit/pages/{login,reviews,settings}.test.tsx`, `?? unit/providers/`

**`apps/api/**` — 6** (backend işi): `src/controllers/admin.controller.js`,
`src/controllers/settings.controller.js`, `src/routes/admin.routes.js`,
`src/validators/admin.validator.js`, `tests/admin.test.js`, `tests/settings.test.js`

**Tekil — 6:** `M apps/customer_app/pubspec.lock` (oturum öncesi; implicit pub bump'ları —
intl 0.20.2→0.20.3, matcher 0.12.19→0.12.20 vb.), `M plans/admin/INDEX.md`,
`M scripts/wcag_tokens.js` *(LX-001/C1 işi)*, `?? plans/admin/AP-010-reviews-filter-actions.md`,
`?? plans/admin/AP-011-i18n-language.md`, `?? screenshots/_harness/plan-admin-reviews-filters.js`

## (d) Kalan işler
1. **Widget seviyesinde radius (customer_app).** Tema `app_theme.dart` 2/4/2/4/6/8'e çekildi ama
   widget'larda ham `BorderRadius.circular(...)` çağrıları duruyor — tema dışı sayım:
   `12` ×55 · `20` ×11 · `10` ×11 · `16` ×10 · `14` ×5 · `8` ×4 · `18` ×4 · `999` ×3 · `4` ×3 ·
   `2` ×3 · `6` ×2 · `22` ×2 · `28` ×1 (toplam ~118). Öne çıkanlar:
   - **login**: `login_screen.dart:87` 12 · `auth/presentation/widgets/gradient_button.dart:27,44` 12 ·
     `auth_footer_links.dart:19` 22 · `email_display_card.dart:20` 12 · `otp_input_field.dart:122-130` 12
     (task metnindeki "login 22/16/14" ≈ 22 + yaygın 12; ölçülen: 12/22)
   - **appointments**: `appointments_screen.dart:145` 16 · `appointment_card.dart:41` 16,
     `:60` 12, `:159` 8 (task metnindeki "16/14/12" ≈ 16/12/8)
   - **register**: `register_screen.dart` kendi radiusunu yazmıyor, `gradient_button.dart` üzerinden 12.
2. **`plans/saloon/INDEX.md`:** SA-002 satırı **yok** (dosyada yalnız SA-001 satırı var); SA-002
   plan dosyası (`plans/saloon/SA-002-lux-editorial-tokens.md`) mevcut ama indekse işlenmemiş.
3. **`docs/salon-app/08-design-system.md` tutarsızlığı:** §8.1 radius ölçeği satırı güncel
   ("kart 2 · buton 4 · input 2 · sheet 8") ama aynı bölümün bileşen tablosu hâlâ eski değerleri
   yazıyor: `Card … 16px radius` (satır 96), `ElevatedButton … 14px` (97), `Input … 12px` (99),
   `Chip … 20px` (101). Kod tarafı (salon_app `app_theme.dart`) yeni ölçekte; doküman satırları
   bekliyor.
4. **google_fonts çevrimdışı fallback notu:** `GoogleFonts.config.allowRuntimeFetching`,
   `fontFamilyFallback` veya gömülü font asset'i **hiçbir yerde tanımlı değil** (customer_app +
   salon_app taraması temiz, `pubspec.yaml`'da `fonts:` bölümü yok). Sonuç: Fraunces/Nunito ilk
   çalıştırmada ağdan indirilir; çevrimdışı cihazda sistem fontuna düşer (tipografi sessizce
   değişir) ve testlerde font yüklenemediği için **golden/pixel testi yazılamaz**. Karar gerekli:
   font asset olarak gömülsün mü, yoksa çevrimdışı fallback bilinçli kabul mü?
5. **admin_panel `divider` tokenı:** (b)'deki tek eksik hücre — `--divider: #E3D9C7` eklenmeli mi,
   yoksa admin'de ayraç rolü `--border` ile mi kalacak? Karar bekliyor.

## (e) Sonuç
Dokuz kapının **dokuzu da yeşil** (customer_app analyze+test 274, salon_app analyze+test 86,
admin_panel typecheck+lint+test 283/33, wcag admin `EXIT_ADMIN=0`, wcag mobile `EXIT_MOBILE=0`);
palet sözleşmesinin 8 renginden **7'si üç kaynakta birebir aynı**, tek sapma admin_panel'de
tanımsız olan `divider` (`#E3D9C7`) ve bu bir kapı hatası değil, karar bekleyen bir eksik.
LX-001'in "renk + tipografi" ayağı üç uygulamada da tamam ve doğrulandı; kalan işler widget
seviyesinde radius temizliği, `plans/saloon/INDEX.md` SA-002 satırı, `docs/salon-app` radius
tablo satırları ve çevrimdışı font stratejisidir.
