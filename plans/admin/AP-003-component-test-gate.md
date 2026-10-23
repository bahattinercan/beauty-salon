# AP-003 — Admin Panel: React Bileşen Test Kapısı (vitest + Testing Library)

**Uygulama hedefi:** `apps/admin_panel` — `package.json`, `package-lock.json`, `vitest.config.ts` (yeni), `tests/unit/**` (yeni)
**Tarih:** 2026-10-23 · **Durum:** UYGULANDI · **Önceki kayıt:** AP-002 (ağsız `node:test` stratejisi)
**Ölçüm ortamı:** Node `v22.23.4`, npm `10.9.9`, kurulu `vite 7.3.7`

> Bu kayıt, AP-002'nin "ağsız kapı" kararını **iptal etmez, üstüne ekler**. AP-002'nin 29 testlik
> `tests/lib/**` paketi olduğu gibi korunur ve `npm run test:node` ile çalışmaya devam eder; yeni
> vitest kapısı yalnız `tests/unit/**` altındaki React bileşen testlerini kapsar. `src/**` bu iş
> kapsamında **hiç değişmedi** (test edilebilirlik için refactor yapılmadı).

---

## Karar

1. **İki kapı, tek `npm test`:** `node:test` paketi (offline, `node_modules` gerektirmez) ve vitest
   bileşen paketi (jsdom + Testing Library) ayrı script'ler olarak kalır, `npm test` ikisini sırayla
   koşar (`npm run test:node && npm run test:unit`).
2. **Kapsam ayrımı dosya düzeyinde zorlanır:** `vitest.config.ts` `include: tests/unit/**/*.test.tsx`,
   `exclude: tests/lib/**`. Böylece AP-002 paketi yanlışlıkla vitest'e alınmaz (o paket `.ts` uzantılı
   import ve `node:module` hook'larına dayanır; vitest'in bundler çözümlemesiyle uyumlu değildir).
3. **`src/**` değişmez kuralı korundu:** bileşenler olduğu gibi, gerçek `ThemeProvider` ile sarılarak
   test edildi. jsdom'un sağlamadığı tek global (`window.matchMedia`) `tests/unit/setup.ts` içinde
   stub'landı; uygulama kodunda test kancası (`data-testid`, prop, export) eklenmedi.
4. **Snapshot-only test yok:** her test sınıf adı, `role`/`aria-*` veya metin üzerinden anlamlı bir
   davranışı kanıtlar (ton→token eşlemesi, devre dışı tıklama, `onPage` hedefi, `aria-selected`
   tekilliği, `localStorage` yazımı). `@testing-library/jest-dom` **eklenmedi** — düz `expect`
   matcher'ları kullanıldı, bağımlılık yüzeyi küçük tutuldu.
5. **Sürüm seçimi kilitli gerekçeyle:** `next@16.1.6`, `react@19.2.3`, `react-dom@19.2.3` **aynen
   korundu** (yükseltme/düşürme yok, `npm audit fix` çalıştırılmadı). vitest **3.2.7**'de sabitlendi;
   nedeni §Kanıt'ta ölçülen iki kurulum engeli.

---

## Kanıt

### Eklenen devDependencies (kurulu sürümler)

| Paket | `package.json` aralığı | Kurulu |
|---|---|---|
| `vitest` | `^3.2.7` | 3.2.7 |
| `@vitejs/plugin-react` | `^5.2.0` | 5.2.0 |
| `jsdom` | `^30.1.3` | 30.1.3 |
| `@testing-library/react` | `^16.3.3` | 16.3.3 |
| `@testing-library/dom` | `^10.4.2` | 10.4.2 |
| `@testing-library/user-event` | `^14.6.8` | 14.6.8 |

`vitest` 3.2.7 transitif olarak `vite@7.3.7` getirir; `@vitejs/plugin-react` bu vite sürümüyle
uyumlu aralıkta (`^4.2 || ^5 || ^6 || ^7`) seçildi.

### Neden vitest 5 / plugin-react 6 değil (ölçülen, tahmin değil)

| Deneme | Sonuç |
|---|---|
| `npm i -D vitest @vitejs/plugin-react ...` (vitest `*` → 5.0.5) | **ERESOLVE**: `vitest@5.0.5` `peerOptional @types/node@^22 \|\| >=24`, projede `@types/node@^20` var |
| `npm i -D vitest@^4.1.12 ...` | npm `10.9.9` arborist çökmesi: `Cannot read properties of null (reading 'edgesOut')` (`build-ideal-tree.js:1289`) |
| `npm i -D vitest@^3.2.7` | **temiz kurulum** (exit 0) |
| `npm i -D @vitejs/plugin-react` (→ 6.1.2) | **ERESOLVE**: `peer vite@^8`, kurulu vite 7.3.7 |
| `npm i -D @vitejs/plugin-react@^5.2.0` | **temiz kurulum** (exit 0) |

`--force` / `--legacy-peer-deps` **kullanılmadı**; sürüm aralığı daraltılarak gerçek çakışma çözüldü.
`@types/node` sürümü değiştirilmedi (projede `^20` kaldı), yani mevcut tip yüzeyi bozulmadı.

### `tsconfig.json` — tek satır (koordinatör onaylı istisna)

`tsc --noEmit` ilk koşuda 6 hata verdi; **hepsi AP-002'nin mevcut `tests/lib/**` paketinden**
geldi, yeni bileşen testlerinden değil:

- 5 × `TS5097` — `import { cx } from '../../src/lib/cx.ts'` gibi `.ts` uzantılı import'lar;
  Node'un tip-silme ile çalışması için **zorunlu** (AP-002 §10).
- 1 × `TS18046` — `tests/lib/api.test.ts` içinde `apiFetch` dönüşü `unknown`.

Çözüm (koordinatör kararı "A"): `compilerOptions` içine yalnız `"allowImportingTsExtensions": true`
eklendi (koşulu olan `noEmit: true` zaten vardı; `include`/`exclude`'a dokunulmadı) ve
`tests/lib/api.test.ts` içindeki tek satıra **tip-only** cast eklendi:

```diff
-    const body = await apiFetch('/salons?page=2');
+    const body = (await apiFetch('/salons?page=2')) as { items: unknown[] };
```

Cast çalışma zamanında **silinir** (type-stripping/derleme çıktısı etkilenmez): `tests/lib` paketi bu
değişiklikten sonra da `29 pass / 0 fail` veriyor ve hiçbir assertion değişmedi (§Ölçüm).

### `.gitignore` doğrulaması

Değişiklik **gerekmedi**; her iki desen zaten kapsanıyor:

```
$ git check-ignore -v apps/admin_panel/node_modules apps/admin_panel/.next
apps/admin_panel/.gitignore:4:/node_modules	apps/admin_panel/node_modules
apps/admin_panel/.gitignore:17:/.next/	apps/admin_panel/.next
```

Kök `.gitignore` ayrıca `node_modules/` içeriyor. `git status --short` çıktısında `node_modules/`,
`.next/`, `next-env.d.ts` **görünmüyor**.

---

## Kapılar

Hepsi `apps/admin_panel` içinde, temiz `.next/` ile koşuldu (2026-10-23):

| # | Komut | Exit | Sonuç |
|---|---|---|---|
| 1 | `npm run test:node` | **0** | `# tests 29 / pass 29 / fail 0` (AP-002 paketi, değişmedi) |
| 2 | `npm run test:unit` | **0** | `Test Files 6 passed (6)` · `Tests 35 passed (35)` |
| 3 | `npm test` | **0** | node 29 + unit 35 = **64 test**, 0 fail |
| 4 | `npm run typecheck` | **0** | `tsc --noEmit`, hata yok |
| 5 | `npm run lint` | **0** | `eslint` (flat config, `tests/unit` dahil) temiz |
| 6 | `npm run build` | **0** | Next 16.1.6 (Turbopack) derledi, 11 statik sayfa üretildi; kırmızı yok |

`package.json` scripts sonucu (mevcut `dev`/`build`/`start`/`lint` korundu):

```json
"test:node": "node --test \"tests/**/*.test.ts\"",
"test:unit": "vitest run",
"test": "npm run test:node && npm run test:unit",
"typecheck": "tsc --noEmit"
```

`npm run build` çıktısındaki tek uyarı Next'in çalışma alanı kökü tahminidir
(`/home/baris/pnpm-lock.yaml` üst dizinde) ve **bu işten önce de vardı**; hata değil, build exit 0.

---

## Kapsam sınırları

**Kapsanan bileşenler (6 dosya / 35 test):**

| Bileşen | Test dosyası | Test | Kanıtlanan davranış |
|---|---|---|---|
| `components/ui/Badge.tsx` | `Badge.test.tsx` | 9 | ton→`badge-*` eşlemesi, `dark:` yokluğu, `StatusBadge` fallback, `SALON_STATUS`/`APPOINTMENT_STATUS`/`USER_ROLE` sözlükleri |
| `components/ui/Button.tsx` | `Button.test.tsx` | 6 | varyant sınıfları (`text-on-primary`, `text-on-accent-lime`…), boyutlar, `type` varsayılanı, devre dışı tıklamama |
| `components/ui/Pagination.tsx` | `Pagination.test.tsx` | 5 | `totalPages <= 1` iken render yok, sınır sayfalarda ok devre dışı, `onPage(page±1)` |
| `components/ui/Tabs.tsx` | `Tabs.test.tsx` | 4 | `tablist`/`tab` rolleri, `aria-selected` tekilliği, sayaç rozeti koşulu |
| `components/ui/States.tsx` | `States.test.tsx` | 7 | `sr-only` yükleme etiketi, `Skeleton`, `EmptyState` action yuvası, `ErrorState` yeniden dene |
| `components/ThemeToggle.tsx` | `ThemeToggle.test.tsx` | 4 | `radiogroup` sözleşmesi, `localStorage`'dan başlangıç teması, `app_theme` yazımı, `documentElement.dark` |

**Sınırlar:**

- **Ağ yok:** bileşenlerin hiçbiri `fetch`/`axios` çağırmaz; `src/lib/api.ts` bu kapının dışındadır
  (AP-002'de `tests/lib/api.test.ts` içinde `fetch` stub'ıyla zaten kapsanıyor). Testlerde canlı API
  çağrısı veya MSW benzeri bir katman yok.
- **`@/` takma adı** vitest `resolve.alias` ile `./src`'ye bağlanır; `tsconfig` `paths` ile tek kaynak
  değildir (vite kendi çözümlemesini yapar, ikisi aynı hedefi gösterir).
- **jsdom boşlukları:** `window.matchMedia` yok → `tests/unit/setup.ts` stub'ı. Bu stub yalnız test
  ortamındadır; `ThemeProvider` üretimde gerçek `matchMedia`'yı kullanır.
- **Kapsam dışı bırakılan bileşenler (bilinçli, ilk dilim):** `DataTable`, `SalonCard`, `Dialog`,
  `Field`, `StatCard`, `Card`, kabuk bileşenleri (`AppShell`, `SideRail`, `MobileDrawer`,
  `BottomPillNav`, `PageHeader`). **Hiçbiri "jsdom'da test edilemiyor" diye atlanmadı** — sadece bu
  kapının ilk dilimine alınmadı; sonraki bir dilimde (AP-004 adayı) veri/fixture gerektiren bu
  bileşenler eklenebilir. `src/**` refactor yasağı nedeniyle hiçbir bileşen test için değiştirilmedi.
- **Snapshot / coverage eşiği yok:** `@vitest/coverage-v8` eklenmedi; kapı "davranış kanıtı" üzerine
  kurulu, yüzde eşiği sonraki adım.
- **Commit yok:** `git add`/`commit`/`push` bu görevde çalıştırılmadı (ayrı task).
- **Dokunulmayan alanlar:** `src/**` (git status temiz), `apps/salon_app/pubspec.lock` (paralel
  worker'ın dosyası), `README`/docs/`plans/backend`/`plans/customer`.

**Bilinen risk:** `npm install` sonrası `npm audit` **21 zafiyet** (1 low, 5 moderate, 12 high,
3 critical) raporluyor; bunlar `next@16.1.6` zinciri dahil **mevcut** bağımlılıklardan geliyor ve
talimat gereği `npm audit fix` **çalıştırılmadı**. Ayrı bir bakım task'ı olarak ele alınmalı.

---

## Ölçüm

Tekrar çalıştırılabilir kapı komutları (sırayla, `apps/admin_panel` içinde):

```sh
cd apps/admin_panel

# 1) AP-002 offline paketi — 29 test, node_modules'a bağımlı değil
npm run test:node    # exit 0 · # tests 29 · # pass 29 · # fail 0

# 2) Yeni bileşen paketi — 6 dosya, 35 test
npm run test:unit    # exit 0 · Test Files 6 passed · Tests 35 passed

# 3) Toplam kapı
npm test             # exit 0 · 64 test (29 node + 35 unit)

# 4–6) Statik ve üretim kapıları
npm run typecheck    # exit 0
npm run lint         # exit 0
npm run build        # exit 0 (11 statik sayfa)
```

Bileşen paketinin dosya bazlı dağılımı (vitest özeti):

```
✓ tests/unit/components/Badge.test.tsx        (9 tests)
✓ tests/unit/components/Tabs.test.tsx         (4 tests)
✓ tests/unit/components/Button.test.tsx       (6 tests)
✓ tests/unit/components/States.test.tsx       (7 tests)
✓ tests/unit/components/ThemeToggle.test.tsx  (4 tests)
✓ tests/unit/components/Pagination.test.tsx   (5 tests)
Test Files  6 passed (6) · Tests  35 passed (35)
```

Toplam test sayısı: **29 (AP-002, offline) + 35 (AP-003, jsdom) = 64**, hepsi geçiyor.
`npm run test:unit` duvar saati ~2 s (setup 1,0 s, testler 1,7 s); `npm run build` ~6 s
(Turbopack derleme 3,6 s + 11 statik sayfa 0,5 s). Ölçüm makinesi: Node `v22.23.4`.
