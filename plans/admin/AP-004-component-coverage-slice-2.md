# AP-004 — Admin Panel: Bileşen Test Kapsamı, 2. Dilim (11/11 bileşen)

**Uygulama hedefi:** `apps/admin_panel` — `tests/unit/components/**` (11 yeni dosya)
**Tarih:** 2026-10-24 · **Durum:** UYGULANDI · **Önceki kayıt:** AP-003 (ilk dilim: 6 bileşen / 35 test)
**Ölçüm ortamı:** Node `v22.23.4`, npm `10.9.9`, `vitest 3.2.7` + `@testing-library/react 16.3.3` + jsdom 30

> Bu kayıt AP-003'ün **"Kapsam dışı bırakılan bileşenler (bilinçli, ilk dilim)"** listesini
> kapatır. AP-003'te `DataTable`, `SalonCard`, `Dialog`, `Field`, `StatCard`, `Card` ve kabuk
> bileşenleri (`AppShell`, `SideRail`, `MobileDrawer`, `BottomPillNav`, `PageHeader`) "sonraki bir
> dilimde (AP-004 adayı) veri/fixture gerektiren bu bileşenler eklenebilir" diye bırakılmıştı;
> bu dilim **11 bileşenin tamamını** kapsıyor. AP-003'ün `src/**` değişmez kuralı ve AP-002'nin
> `node:test` paketi (29 test) aynen korundu.

---

## Karar

1. **Tek dilimde 11/11 bileşen, dosya başına bir test dosyası.** Kalan hiçbir aday "test edilemez"
   diye atlanmadı; her bileşen jsdom + Testing Library ile gerçekten render edildi. Toplam **92 yeni
   test** yazıldı (AP-003'ün 35'i ile birlikte **127 unit test**).
2. **`src/**` hiç değişmedi.** Test edilebilirlik için prop eklenmedi, export değiştirilmedi,
   `data-testid` gibi test kancası konmadı. Davranışlar **erişilebilirlik yüzeyinden** kanıtlandı:
   `role`/`aria-*`, erişilebilir ad, metin, token sınıfı (`badge-success`, `text-right`,
   `bg-on-nav-pill` …) ve callback çağrısı. **Snapshot-only test yok.**
3. **Bağımlılık eklenmedi/değiştirilmedi.** `package.json` ve `package-lock.json`'a bu görevde
   dokunulmadı; `npm install` / `npm audit fix` çalıştırılmadı. Kurulu yığın (`vitest`, RTL, jsdom,
   `@testing-library/user-event`) yeterliydi — yeni paket gerekmedi.
4. **Mock politikası ölçümle sınırlandı:** yalnız *çerçeve* bağımlılıkları mock'landı.
   - `next/navigation` (`usePathname`/`useRouter`): App Router dışında gerçek hook `invariant` atıyor
     → 4 dosyada (`SideRail`, `MobileDrawer`, `BottomPillNav`, `AppShell`) `vi.mock` + `vi.hoisted`
     ile sabit `pathname` ve sahte `push` verildi.
   - `@/providers/DashboardProvider`: gerçek provider mount'ta `/admin/dashboard` çağırıyor (ağ yok
     kuralı) → yalnız `AppShell` testinde `children`'ı geçiren sahte provider.
   - **`next/link` mock'lanmadı:** ölçüldü — headless olarak `<a href>` basıyor (probe: `TAG=A
     HREF=/salons`), bu yüzden gerçek `Link` kullanıldı; `href` ve `aria-current` doğrudan okundu.
   - `ThemeProvider` **gerçek** kullanıldı (mock değil): `ThemeToggle` içeren kabuk testleri gerçek
     sağlayıcıyla sarıldı, AP-003'te olduğu gibi yalnız `matchMedia` `tests/unit/setup.ts`'te stub.
5. **Kapı disiplini:** kırmızıya dönen kapı olursa düzeltme yapılmayacağı, durumun raporlanacağı
   kuralı uygulandı — kırmızı çıkmadı. `npm run lint` ilk koşuda **1 uyarı** verdi
   (`SalonCard.test.tsx` içinde kullanılmayan bir `const`); uyarı test dosyasının kendi içinde
   giderildi (üretim kodu ve `src/**` değil), sonra lint **0 uyarı / 0 hata** verdi.

---

## Kapsanan bileşenler ve test sayıları

| # | Bileşen | Test dosyası | Test | Kanıtlanan davranışlar |
|---|---|---|---|---|
| 1 | `components/ui/Card.tsx` | `Card.test.tsx` | **8** | `Card` taban sınıfları (`bg-surface`/`shadow-card`/`rounded-card`), `as` prop semantiği (`article` → `role=article`), `className` sona eklenir + rest prop geçişi; `CardHeader` başlığı **h2** (sayfada tek `h1` kuralı), `description` opsiyonel, `action` yuvası; `CardBody`/`CardFooter` sınıf ve prop aktarımı |
| 2 | `components/ui/Field.tsx` | `Field.test.tsx` | **11** | `Field`: `label`→`htmlFor` bağı (`getByLabelText`), `required` yıldızı, **hata varken ipucunun gizlenmesi**, `error={null}` davranışı. `Input`: ikonsuz/ikonlu iki mod, `pl-9`, `aria-hidden` ikon, `min-h-11` dokunma hedefi. `Select`: `appearance-none`, seçenek sayısı, kontrollü değer. `Textarea`: `min-h-24`. `Toggle`: `role=switch` + `aria-checked`, tıklamada **ters değer** isteği (true→false / false→true) |
| 3 | `components/ui/StatCard.tsx` | `StatCard.test.tsx` | **8** | etiket/sayı/metin değeri, `tnum` hizası, `hint` opsiyonelliği, **pozitif delta** `+12%` + `text-success`, **negatif delta** `-4%` + `text-error` (renk + ikon birlikte), `delta` yokken satırın hiç çizilmemesi, ton→token eşlemesi (`bg-warning/16`), ikonsuz varyant |
| 4 | `components/ui/Dialog.tsx` | `Dialog.test.tsx` | **11** | `open=false` → hiç düğüm yok + gövde kilidi kurulmaz; `role=dialog` + `aria-modal="true"` + başlığın erişilebilir ad olması; `children`/`footer` yuvaları; açılışta odağın panele taşınması; **Esc** ile kapanma; **scrim** ve **X** tıklaması; `body.overflow` kilidinin unmount'ta **geri bırakılması**; `size` sm/md/lg → `max-w-*`; **Tab tuzağı** (son→ilk, Shift+Tab ile ilk→son) |
| 5 | `components/ui/DataTable.tsx` | `DataTable.test.tsx` | **12** | `loading` → yükleme bloğu (**tablo yok**); boş satır → `EmptyState` (varsayılan + özelleştirilmiş başlık/açıklama); `th[scope=col]` sayısı/başlıkları ve satır sayısı; `align="right"` → başlık **ve** hücrede `text-right`; `minWidthClass` aktarımı (yatay kaydırma sözleşmesi); mobil kart modunda satır başına `listitem`, `primary` kolonun kart başlığına taşınması, `dt` etiket sırası, **`mobile:false` kolonunun kartta hiç görünmemesi**, `block` kolonunun tam satır olması, `actions`'ın satır başına bir kez çizilmesi ve yoksa alt bölgenin hiç çizilmemesi |
| 6 | `components/ui/SalonCard.tsx` | `SalonCard.test.tsx` | **11** | `SalonMedia`: kapak yokken `role=img` + `"… — görsel yok"` etiketi + token gradyanı, **deterministik renk** (aynı id → aynı stil, farklı id → farklı), `src` varken gerçek `<img loading="lazy" object-cover>`. `SalonCard`: `article` semantiği + h3 başlık, durum rozetinin `SALON_STATUS` sözlüğünden etiket/ton üretmesi (`Onaylı`→`badge-success`, `Pasif`→`badge-error`), ilçe+il chip'i (`Kadıköy, İstanbul`) ve yokluğu, puan `4.5` + `(12)`, `rating=0` geçerli / `null` rozetsiz, `isNew` → `badge-lime` "Yeni", sahip adı, `actions` yuvası, kapak > logo > gradyan önceliği |
| 7 | `components/shell/PageHeader.tsx` | `PageHeader.test.tsx` | **4** | **tek `h1`** (`getAllByRole('heading')` uzunluğu 1), alt başlık opsiyonelliği, `actions` yuvası, `className` köke eklenir, eylem yokken fazladan sarmalayıcı üretilmemesi |
| 8 | `components/shell/BottomPillNav.tsx` | `BottomPillNav.test.tsx` | **6** | `nav` adı "Hızlı gezinme"; **yalnız `primary:true`** öğeler (4 link) + "Daha fazla" = 5 hücre, `primary` olmayanların (Yorumlar/Kategoriler) bulunmaması; aktif öğede `aria-current="page"` tekilliği; alt yol eşleşmesi (`/salons/123` → Salonlar); "Daha fazla" → `onMore` **bir kez**; aktif/pasif ikon yuvası token sınıfları |
| 9 | `components/shell/SideRail.tsx` | `SideRail.test.tsx` | **7** | `nav` adı "Ana gezinme" + `NAV_ITEMS`'ın **7 öğesinin sırayla** basılması; aktif öğede `aria-current` + `bg-accent-lime` işareti, pasiflerde ikisinin de olmaması; ray içinde `Tema` radiogroup'u; oturum yokken "Admin" varsayılanı; `localStorage` kullanıcısından ad/e-posta/**baş harfler** (`ayşe yılmaz` → `AY`); çıkışta `access_token`/`refresh_token`/`user` silinmesi + `router.push('/login')` |
| 10 | `components/shell/MobileDrawer.tsx` | `MobileDrawer.test.tsx` | **9** | `open=false` → diyalog yok, gövde kilidi yok; `role=dialog` + `aria-modal` + "Gezinme menüsü"; `NAV_ITEMS` tamamı + aktif `aria-current` ve vurgu işareti; **X** ve **scrim** tıklaması; **Esc**; **yol değişiminde otomatik kapanma** (rerender ile ölçüldü); unmount'ta gövde kilidinin geri bırakılması; e-postanın `localStorage`'dan okunması; çıkışta oturum temizliği + `/login` |
| 11 | `components/shell/AppShell.tsx` | `AppShell.test.tsx` | **5** | `/login` **yalın mod**: yalnız `main` (nav/complementary/menü düğmesi/dialog **yok**), çocuklar `main` içinde; panel modunda `SideRail` (`complementary`) + "Ana gezinme" + "Hızlı gezinme" birlikte; `children` `main` içinde; "Menüyü aç" → çekmece açılır ve `aria-expanded` `false`→`true`; X ile kapanınca `aria-expanded` geri `false` |
| | **Toplam (yeni)** | 11 dosya | **92** | |

**Genel toplam:** AP-003'ün 35 testi + 92 yeni = **127 unit test**. `npm test` = 29 (`node:test`,
AP-002) + 127 (vitest) = **156 test**.

Dosya bazlı çalışma çıktısı (`npm run test:unit`):

```
✓ tests/unit/components/Badge.test.tsx          (9)   ← AP-003
✓ tests/unit/components/Pagination.test.tsx     (5)   ← AP-003
✓ tests/unit/components/Button.test.tsx         (6)   ← AP-003
✓ tests/unit/components/ThemeToggle.test.tsx    (4)   ← AP-003
✓ tests/unit/components/States.test.tsx         (7)   ← AP-003
✓ tests/unit/components/Tabs.test.tsx           (4)   ← AP-003
✓ tests/unit/components/Card.test.tsx           (8)   ← AP-004
✓ tests/unit/components/StatCard.test.tsx       (8)   ← AP-004
✓ tests/unit/components/Field.test.tsx         (11)   ← AP-004
✓ tests/unit/components/SalonCard.test.tsx     (11)   ← AP-004
✓ tests/unit/components/DataTable.test.tsx     (12)   ← AP-004
✓ tests/unit/components/Dialog.test.tsx        (11)   ← AP-004
✓ tests/unit/components/BottomPillNav.test.tsx  (6)   ← AP-004
✓ tests/unit/components/SideRail.test.tsx       (7)   ← AP-004
✓ tests/unit/components/AppShell.test.tsx       (5)   ← AP-004
✓ tests/unit/components/MobileDrawer.test.tsx   (9)   ← AP-004
✓ tests/unit/components/PageHeader.test.tsx     (4)   ← AP-004
Test Files  17 passed (17) · Tests  127 passed (127)
```

---

## Atlananlar ve gerekçe

**Bu dilimde hiçbir bileşen atlanmadı: 11/11 kapsandı.** Ne `src` değişikliği ne de yeni paket
gerekti; bu yüzden "atlandı" kaydı yok. Yine de kapsam dışı bırakılan **davranışlar** şeffaflık için
listeleniyor (bileşen değil, ölçüm sınırı):

| Ölçülmeyen şey | Neden |
|---|---|
| CSS medya sorguları / gerçek yerleşim (`md:hidden`, `min-w-0` taşma düzeltmesi) | jsdom yerleşim hesaplamaz (`getBoundingClientRect` sıfır döner); bu davranış AP-001'de gerçek tarayıcı harness'ı (`screenshots/_harness/plan-admin-*`) ile ölçüldü. Burada yalnız sınıfın **varlığı** kanıtlandı. |
| Gerçek görsel yükleme / `next/image` | `SalonMedia` bilinçli olarak `<img>` kullanıyor; ağ ve görsel decode jsdom'da yok. `src`/`alt`/`loading` nitelikleri kanıtlandı. |
| Gerçek yönlendirme (`router.push` sonrası sayfa) | App Router dışında gerçek router yok; `push` çağrısının argümanı kanıtlandı, hedef sayfanın render'ı E2E kapsamı. |
| `DashboardProvider`'ın veri akışı (`/admin/dashboard`) | AP-002 paketi `src/lib/api.ts`'i zaten kapsıyor; burada ağ çağrısı yasak olduğu için provider mock'landı. |
| `ThemeToggle` seçenekleri | AP-003'te kapsandı; burada yalnız kabuk içinde **var olduğu** (radiogroup) doğrulandı, tekrar edilmedi. |
| `Field`'ın `children` olarak aldığı her kontrol tipi | `Input`/`Select`/`Textarea`/`Toggle` kapsandı; sayfa düzeyindeki form doğrulama mantığı bileşen değil, sayfa kapsamı. |

---

## Kapılar

`apps/admin_panel` içinde, temiz `.next/` ile (2026-10-24):

| # | Komut | Exit | Sonuç |
|---|---|---|---|
| 1 | `npm run test:node` | **0** | `# tests 29 / # pass 29 / # fail 0` (AP-002 paketi, değişmedi) |
| 2 | `npm run test:unit` | **0** | `Test Files 17 passed (17)` · `Tests 127 passed (127)` |
| 3 | `npm test` | **0** | node 29 + unit 127 = **156 test**, 0 fail |
| 4 | `npm run typecheck` | **0** | `tsc --noEmit`, hata yok (test dosyaları da tiplenir) |
| 5 | `npm run lint` | **0** | `eslint` (flat config, `tests/unit` dahil) — 0 hata, **0 uyarı** |
| 6 | `npm run build` | **0** | `▲ Next.js 16.4.3 (Turbopack)`, `✓ Compiled successfully in 3.9s`, **11 statik sayfa**, hata yok |

Kapı öncesi/sonrası test sayısı: **35 → 127** (unit), **64 → 156** (`npm test`).
`git status --short -- apps/admin_panel/src` **boş** — üretim kodu değişmedi.

---

## Kapsam sınırları

- **`src/**` değişmez:** bu dilim yalnız `tests/unit/components/**` altına 11 yeni dosya ekledi.
  Hiçbir bileşende prop/export/`data-testid` değişikliği yok; testler bileşenleri **olduğu gibi**
  render ediyor. Bir davranış jsdom'la kanıtlanamıyorsa test yazılmadı (§Atlananlar).
- **Bağımlılık yüzeyi sabit:** `package.json`/`package-lock.json`'a dokunulmadı; `npm install`,
  `npm audit fix`, yeni devDependency **yok**. jsdom boşluğu yalnız mevcut `tests/unit/setup.ts`
  (`window.matchMedia` stub'ı) ile kapatıldı — bu dosya AP-003'ten beri değişmedi.
- **Mock yalnız çerçeve katmanında:** `next/navigation` (4 dosya) ve `@/providers/DashboardProvider`
  (1 dosya). Uygulama mantığı (`@/lib/nav`, `@/lib/session`, `@/lib/cx`, `ThemeProvider`,
  `Badge`/`Card`/`States`) gerçek hâliyle çalıştı.
- **Test sayısı ≠ kapsam yüzdesi:** coverage aracı (`@vitest/coverage-v8`) hâlâ eklenmedi (AP-003
  kararı); yüzde eşiği ayrı bir dilim. Bu dilim "davranış kanıtı" üzerine kurulu.
- **Kapsam dışı bırakılan alanlar:** `src/app/**` sayfaları, `src/lib/**` (AP-002'de kapsandı),
  `apps/salon_app`, `apps/customer_app`, `apps/api`, `README`, `docs/`, `plans/backend`,
  `plans/customer` — bu görevde hiç dokunulmadı.
- **Snapshot-only test yok**, `@testing-library/jest-dom` eklenmedi: düz `expect` matcher'ları ve
  DOM API'leri (`className`, `getAttribute`, `querySelector`) kullanıldı.
- **Commit yok:** `git add`/`commit`/`push` bu görevde çalıştırılmadı (ayrı task).
