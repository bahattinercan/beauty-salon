# AP-002 — Admin Panel: Ağ Erişimi Gerektirmeyen Test Stratejisi (karar kaydı)

**Uygulama hedefi:** `apps/admin_panel` (salt okuma — bu kayıt hiçbir uygulama dosyasını değiştirmedi)
**Tarih:** 2026-10-23 · **Durum:** KARAR ÖNERİSİ (uygulama yok, sadece strateji)
**Ölçüm ortamı:** Node `v22.23.4`, npm `10.9.9`, pnpm `12.15.0` (`node -v && npm -v && pnpm -v`)

> **Bu kayıt ne iddia etmiyor:** Yeni bir test altyapısı kurulduğunu iddia etmiyor. Bu kayıt,
> `node_modules` **kurulmadan** ve **ağ beklemeden** hangi testlerin bugün yazılıp çalıştırılabileceğini
> ölçülmüş komutlarla sınırlıyor. Doğrulama amaçlı tüm probe'lar repoya **dokunmadan** `/tmp/ap002probe/`
> scratch dizininde çalıştırıldı (repo çalışma ağacında üretilen tek dosya bu `.md`'dir).

---

## 0. Karar

`apps/admin_panel` için test altyapısı **Node'un yerleşik `node:test` runner'ı + Node 22'nin yerleşik
TypeScript tip-silme (type-stripping)** üzerine kurulur; testler yalnızca `src/lib/*.ts` gibi
**dış bağımlılık import etmeyen saf modüllere** yazılır, `lucide-react` gibi tek bir UI bağımlılığı ve
`@/` yol takma adı ise 20 satırlık bir `node:module` `registerHooks` stub'ıyla çözülür. Böylece
**kurulum, ağ ve registry gerekmeden** `node --test` exit 0 ile gerçek bir kapı elde edilir;
`.tsx`/JSX ve DOM'a dokunan modüller bu kapsamın **dışındadır** (nedeni §4'te ölçüldü). Gerçek bir
runner (vitest) kararı, ancak bağımlılık kurulumu serbest olduğunda ayrıca verilir (§9).

---

## 1. Kanıt — bugünkü durum (envanter)

| İddia | Kanıt komutu | Ölçülen sonuç |
|---|---|---|
| `apps/admin_panel/node_modules` **yok** | `ls -d apps/admin_panel/node_modules` | `ls: ... ögesine erişilemedi: Böyle bir dosya ya da dizin yok`, **exit 2** |
| `package.json`'da `test` scripti **yok** | `cat apps/admin_panel/package.json` → `scripts` | yalnızca `dev`, `build`, `start`, `lint` (`lint` = `eslint`, argsız) |
| `devDependencies`'te test runner **yok** | `node -e` ile deps filtreleme (regex: vitest\|jest\|mocha\|chai\|playwright\|puppeteer\|@testing-library\|jsdom\|cypress) | admin_panel → **`YOK`**; karşılaştırma: `apps/api` → `chai,chai-http,mocha` |
| Monorepo'da test yazılmış tek uygulama backend | `find apps -name "*.test.*" -not -path "*/node_modules/*"` | 14 dosya, hepsi `apps/api/tests/*.test.js` (`api/tests` dizininde 15 öge: 14 test + `setup.js`) |
| `node:test` yerleşik ve kullanılabilir | `node -e "require('node:test')"` | `skip,todo,only,after,afterEach,before,beforeEach,describe,it,run,suite,test,mock,snapshot,assert` |
| Test edilebilir yüzeyin büyüklüğü | `find src -name "*.tsx" \| wc -l` / `find src -name "*.ts" \| wc -l` | **28 `.tsx`** + **5 `.ts`** (`src/lib/`: `api.ts`, `chartTheme.ts`, `cx.ts`, `nav.ts`, `session.ts`) |
| Repo zaten sıfır-bağımlılık doğrulama scriptleri taşıyor | `grep -o "require('[^']*')" scripts/wcag_tokens.js \| sort -u` | yalnızca `require('fs')`, `require('path')` (satır 13–14) — `--scope admin --strict` desteği satır 11/168/175–177 |
| CDP harness'ı da sıfır-bağımlılık | `head -1 screenshots/_harness/cdp.js` | `// Minimal zero-dep CDP driver (Node >= 22 global WebSocket).` (`_harness`'ta 53 dosya) |

**Önlem (stop koşulu):** Görev metni `node_modules`'in olmamasını bekliyordu; beklenti **doğrulandı**
(exit 2). Yalnız `apps/api/node_modules` kurulu ve **385 üst düzey girdi** içeriyor — bu, §2'deki
"ağ yok" iddiasının bugüne ait olmadığını gösteren ilk işaret.

---

## 2. Kanıt — ortam: registry erişimi (ölçülen güncel durum, 2026-10-23)

Görev metnindeki "bu makinede paket registry erişimi yok" iddiası, `plans/admin/INDEX.md`'nin son
satırındaki `ERR_PNPM_FETCH_401` notasına dayanıyor. **Bugünkü ölçüm bu iddiayı desteklemiyor:**

| Ölçüm | Komut | Sonuç |
|---|---|---|
| npm registry ping | `timeout 25 npm ping` | `PONG 264ms` |
| Paket ucu erişimi | `curl -sS -m 10 -o /dev/null -w '%{http_code}' https://registry.npmjs.org/next` | **`200`** (gövde 31.460.265 bayt; 10 sn'lik `-m` sınırında 13.032.907 bayt alındı, transfer yavaş) |
| Yerel npm önbelleği | `du -sh ~/.npm/_cacache` + index taraması | **1,4G**, **3589** cached key; `next`, `react-dom`, `typescript` anahtarları mevcut |
| pnpm store | `du -sh ~/.local/share/pnpm/store` | **541M** |
| `npx` önbelleğinde TypeScript | `ls ~/.npm/_npx/*/node_modules/typescript` | iki ayrı önbellek dizininde **typescript 5.9.3** |
| Kurulum fiilen yapılmış | `stat -c '%y' apps/api/node_modules` | `2026-10-23 04:25:26 +0300` — yani INDEX'teki 401 notasından **sonra** |
| Özel registry / proxy ayarı yok | `npm config get registry`, `pnpm config get registry`, `ls ~/.npmrc`, `env \| grep -i proxy` | `https://registry.npmjs.org/`; `.npmrc` yok; proxy değişkeni yok |

**Dipnot (dosya değiştirilmedi):** `plans/admin/INDEX.md` son satırındaki `ERR_PNPM_FETCH_401` bir
**kimlik doğrulama (401)** hatasıdır, ağsızlık (ENOTFOUND/ECONNREFUSED) değil; özel registry ayarı da
bulunamadı. Bu not **bugün ölçülen durumla çelişiyor**. INDEX.md sahibi ayrı görev olduğu için
**burada değiştirilmedi** — düzeltilmesi INDEX.md'nin owner'ına bırakıldı (§8 kapı K5).

**Strateji sonucu:** Ağ yarın tekrar kesilebilir (401 bir kez yaşandı). Bu yüzden **ana karar ağsız
kalmalı**: kapılar kurulumdan bağımsız çalışabilmeli. Ağ/cache erişimi ise §9'da ayrı bir **kapı**
olarak ele alınır — karar, kurulumun yapılabilir olmasına değil, testin kurulumu gerektirmemesine
bağlı olmalı.

---

## 3. Ağsız çalışabilecek üç seçenek (artı / eksi)

### Seçenek A — `node:test` + Node 22 yerleşik TypeScript tip-silme (**önerilen**)

`node --test "tests/**/*.test.ts"`: Node 22.18+ `.ts` dosyalarını flag'siz yükler (tip anotasyonlarını
siler), `node:test` + `node:assert/strict` yerleşiktir. **Kurulum: sıfır. Ağ: sıfır.**

| Artı | Eksi |
|---|---|
| `package.json`'a dokunmadan bugün çalışır (kapı `exit 0`) | `.tsx` **yüklenemez**: `ERR_UNKNOWN_FILE_EXTENSION ".tsx"` — `--experimental-transform-types` ile de ölçüldü, yine başarısız (§4/Ölçüm 4) |
| Runner sürüm kilitleri, lockfile diffi, registry riski yok | JSX render / hook testi yapılamaz → bileşen davranışı bu kapsamda **kanıtlanamaz** |
| `node:test`'te `mock` var: `globalThis.fetch` gerçekçi sahteyle test edilebiliyor (Ölçüm 5: 3/3 geçiyor) | `tsconfig.json` `paths` (`@/*`) Node tarafından okunmaz → ekstra `registerHooks` dosyası gerekir |
| type-stripping hata mesajı üretmez; tip kontrolü ayrı kapıdır (§3/C) ve ayrı kalması avantajdır | `package.json`'da `"type": "module"` olmadığı için `MODULE_TYPELESS_PACKAGE_JSON` uyarısı basılıyor (zararsız, ama kapı logunu kirletiyor) |

### Seçenek B — mevcut bağımlılıksız modüllerin saf testleri (`src/lib/*.ts`) + ince stub

Aynı runner; kapsam bilinçli olarak **dış importu olmayan 5 dosyayla** sınırlı. UI bağımlılığı olan
`nav.ts` için `node:module` `registerHooks` ile `lucide-react` → 7 satırlık sabit stub, `@/x` →
`src/x` eşlemesi.

| Artı | Eksi |
|---|---|
| Ölçüldü: `cx.ts`, `api.ts` flag'siz; `nav.ts` hook'la **geçiyor** (§5) | Yüzey dar: 35 dosyanın yalnız 5 `.ts`'i (`src/lib`), 28 `.tsx` dışarıda |
| Stub dosyası ~20 satır, test altyapısı değil; sökülebilir | Stub, gerçek `lucide-react` sürüm sürüklenmesini gizler (ikon adı değişse test geçebilir) |
| Dış runtime bağımlılığı sıfır → CI'da `install` adımı atlanabilir | `session.ts`/`chartTheme.ts` `react` import ediyor ve DOM bekliyor: `localStorage/window/document/getComputedStyle` Node'da **`undefined`** (`node -e` ile ölçüldü) → bu ikisi şu an test edilemez |

### Seçenek C — kapı üçlüsü + repo'nun mevcut sıfır-bağımlılık scriptleri

`npx tsc --noEmit` + `npx eslint src` + `npx next build` (INDEX'te geçen üçlü) + `node scripts/wcag_tokens.js --scope admin --strict` + `screenshots/_harness/*.js`.

| Artı | Eksi |
|---|---|
| Davranış testi yazmadan tip/lint/build ihlallerini yakalar; repo'da fiilen kullanılmış (`INDEX.md`: "üçü de temiz") | `tsc`, `eslint`, `next` **`node_modules` ister** → `apps/admin_panel/node_modules` yokken bu üçlü bugün **çalıştırılamaz**; `npx` önbelleğinde typescript 5.9.3 olsa da `@types/react`/`next` olmadığı için `src` tip kontrolü modül-bulma hatalarıyla kirlenir (**doğrulanmadı — kısıt gereği `tsc` çalıştırılmadı**) |
| `wcag_tokens.js` gerçek bir kapı ve **zaten ağsız** (yalnız `fs`/`path`) | Tip/lint/build, yanlış davranışı yakalamaz — test yerine geçmez, tamamlayıcıdır |
| Ek bağımlılık eklemez, mevcut alışkanlığı sürdürür | `lint` scripti argsız (`"lint": "eslint"`); INDEX'te `npx eslint src` kullanılmış — iki çağrı biçimi farklı, kapı sabitlenmeli |

**Seçenek karşılaştırma özeti:** A + B aynı altyapının iki katmanıdır (A = runner, B = kapsam), C ise
A/B'nin yerine değil yanına konur. Ağsız tek çalışan kapı bugün **A/B**; C ancak kurulum varken anlam taşır.

---

## 4. Test edilebilirlik sınırları (ölçümle, tahminle değil)

Scratch probe sonuçları (`/tmp/ap002probe/`, repoya yazılmadı):

| # | Ölçüm | Sonuç |
|---|---|---|
| 1 | `node --test cx.probe.test.ts` (gerçek `src/lib/cx.ts` import ediliyor) | **1 pass, exit 0** (+ `MODULE_TYPELESS_PACKAGE_JSON` uyarısı) |
| 2 | `node --test nav.probe.test.ts` (hook'suz) | **exit 1** — `ERR_MODULE_NOT_FOUND: Cannot find package 'lucide-react' imported from .../src/lib/nav.ts` |
| 3 | Aynı test + `node --import ./hooks.mjs` (`registerHooks`: `lucide-react` → stub, `@/` → `src/`) | **1 pass, exit 0** |
| 3b | `NAV_ITEMS` href'leri ↔ `src/app/**/page.tsx` (hook'lu) | **1 pass, exit 0** (`NAV_ITEMS.length=7`, `primary=4`) |
| 4 | `src/components/ui/Badge.tsx` importu (JSX'li `.tsx`) — flag'siz **ve** `--experimental-transform-types` ile | **exit 1** — `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".tsx"` (her iki koşullarda) |
| 5 | `node --test api.probe.test.ts` (`globalThis.fetch` `mock.method` ile sahte) | **3 pass, exit 0** |

**Kural:** Test dosyası `src/lib/*.ts` (veya §6'daki gibi saf bir `*.ts`e taşınmış mantık) import eder;
`.tsx` import etmez. Bir davranış `.tsx` içinde hapsolduysa, test etmek için önce **taşı** (§5 Y1).

---

## 5. İlk test hedefleri (3 hedef + 2 yedek)

Aşağıdaki **dosya yolları repoda gerçekten var** (`find src -type f` çıktısı ve satır numaraları
`cat -n` ile doğrulandı). Komutlar scratch'te doğrulandı; `tests/...` yolları henüz **öneri** — bu
görevde `apps/` altına dosya yazılmadı (kısıt).

### H1 — `apps/admin_panel/src/lib/cx.ts` (satır 2–4)

- **Davranış:** `cx()` sahte değerleri (`false`, `null`, `undefined`, `''`) düşürür ve kalanları tek boşlukla birleştirir; argümansız `''` döner. Bütün UI primitifleri (`Badge`, `Button`, `DataTable`, `Pagination`, `States`) sınıf birleştirmede buna dayanıyor — tek satırlık bir regresyon 28 bileşende sessiz bozulma üretir.
- **Komut:** `cd apps/admin_panel && node --test tests/lib/`
- **Beklenen sonuç:** `# pass 1 / # fail 0`, **exit 0**. *(Doğrulandı: exit 0, 1 pass.)* Negatif kontrol: `cx('a','a')` için `''` bekleyen bir assert → `# fail 1`, exit 1 (kapının gerçekten kapı olduğunu kanıtlamak için bir kez çalıştırılmalı).

### H2 — `apps/admin_panel/src/lib/nav.ts` (satır 25–33 `NAV_ITEMS`, satır 36–38 `isNavActive`)

- **Davranış:** (a) `isNavActive('/salons/123','/salons') === true`, `isNavActive('/users','/salons') === false`, `isNavActive('/','/') === true`, `isNavActive('/salons','/') === false` — alt yol eşleşmesi SideRail/BottomPillNav/MobileDrawer üçünün tek kaynağı; (b) `NAV_ITEMS.length === 7` ve `primary === 4`; (c) her `href` için `src/app/<href>/page.tsx` dosyası **var** (`/` → `src/app/page.tsx`). (c) gerçek bir regresyonu yakalar: gezinmeye eklenen ama sayfası açılmayan route'lar üretime 404 olarak sızar.
- **Komut:** `cd apps/admin_panel && node --import ./tests/helpers/node-hooks.mjs --test tests/lib/`
- **Beklenen sonuç:** **exit 0** *(hook'lu doğrulandı: 1 pass + route eşleme 1 pass)*. Hook'suz beklenen sonuç bilinçli olarak **exit 1 / `ERR_MODULE_NOT_FOUND: 'lucide-react'`** — yani stub'ı unutmak sessiz geçmez, gürültülü patlar.

### H3 — `apps/admin_panel/src/lib/api.ts` (satır 1 `API_BASE`, 13–16 hata yolu)

- **Davranış:** (a) `res.ok === false` ve gövdede `message` varsa atılan `Error.message` sunucunun mesajıdır; (b) gövde JSON değilse `API error <status>`; (c) `access_token` yoksa `Authorization` başlığı **gönderilmez**, `Content-Type: application/json` gönderilir ve URL `…/api/v1<path>` ile biter. Panelin tüm veri yolu bundan geçiyor; (c) yanlışsa korumalı uçlar sessiz 401 alır.
- **Komut:** `cd apps/admin_panel && node --test tests/lib/` (Node'un yerleşik `fetch` + `mock.method(globalThis,'fetch',…)`; ek ağ gerekmez — sahte yanıt yerel)
- **Beklenen sonuç:** **exit 0, 3 pass** *(doğrulandı)*.

### Y1 (yedek, engelli — kanıtlı) — `apps/admin_panel/src/components/ui/Badge.tsx` (satır 31–49 durum sözlükleri)

- **Amaç:** `APPOINTMENT_STATUS` anahtar kümesinin backend enum'unu eksiksiz kapsadığını sabitlemek — enum kanıtı: `apps/api/src/models/Appointment.js:45` `DataTypes.ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')`; `apps/api/src/models/User.js:43` `ENUM('CUSTOMER','SALON_OWNER','ADMIN')`. Sözlükler `.tsx` içinde durduğu için §4/Ölçüm 4 gereği **bugün test edilemez** (`ERR_UNKNOWN_FILE_EXTENSION .tsx`).
- **Öneri:** sözlükler `src/lib/status-maps.ts` gibi saf bir `.ts`e taşınır (davranış değişmez, `Badge.tsx` re-export eder) → aynı komutla test edilir. Ölçülen: `apps/api/src/models/Salon.js`'de `status` kolonu **yok** (yalnız satır 82 `isActive`), hâlâ `salons/page.tsx:65` client-side türetiyor (`isActive && isVerified → "onaylı"`); bu türetme de `.tsx` içinde hapsolmuş ikinci bir taşıma adayıdır.
- **Not (uydurma değil, gözlem):** `apps/api/src/controllers/admin.controller.js:83-89` aynı durumları `BEKLEMEDE / ONAYLANDI / GEÇ_KALDI` gibi **başka etiketlerle** üretiyor (panelde `NO_SHOW → "Gelmedi"`). Test kapsamı **anahtar kümesiyle** sınırlı tutulmalı; etiket eşitliği kapısı mevcut durumda kırmızı verir ve bu kayıt o kapıyı önermiyor.

### Y2 (yedek) — `apps/admin_panel/tsconfig.json` + `src` bütünlüğü için ağsız muhafız

`scripts/wcag_tokens.js --scope admin --strict` (exit 0 beklenir) gibi repo içi bir Node script'i ile
`eslint`/`tsc` olmadan yakalanabilen ihlaller (ör. `dark:` varyantı sayacı, token dışı renk literali).
Kapının mevcut hâli `INDEX.md`'de "UYGULANDI" olarak kayıtlı; AP-002 bunu **test kapısı olarak kalıcılaştırmayı** önerir, yeniden ölçmeyi değil.

---

## 6. Dosya yerleşimi ve çalışma kuralı (öneri — bu görevde uygulanmadı)

```
apps/admin_panel/tests/
  helpers/node-hooks.mjs     # ~20 satır: registerHooks → lucide-react stub + '@/ → src/'
  lib/cx.test.ts             # H1
  lib/nav.test.ts            # H2 (isNavActive + NAV_ITEMS↔route)
  lib/api.test.ts            # H3 (fetch mock)
```

- Script önerisi: `"test": "node --import ./tests/helpers/node-hooks.mjs --test tests/"` — `devDependencies`'e hiçbir şey eklemez.
- Uyarı gürültüsünü kesmek için `"type": "module"` önerisi ayrıca değerlendirilmeli; bu kayıt **yapmıyor** (Next.js/PostCSS config'lerine etkisi bu kayıttaki komutlarla doğrulanmadı).
- Kural (PR'da tartışmasız): test dosyası `.tsx` import edemez; ediyorsa ya mantık `.ts`e taşınır ya da §9'a gidilir.

---

## 7. Karar önerisi

**AP-002 = Seçenek A + B (tek altyapı: `node:test` + yerleşik type-stripping, kapsam `src/lib/*.ts` +
hook stub'ı), yanına Seçenek C kapı üçlüsü ancak `node_modules` varken; vitest gibi gerçek bir runner
kararı, `apps/admin_panel` bağımlılıklarının kurulabildiği bir anda ayrı olarak verilir (§9).**
Gerekçe: bugün ağ beklemeden exit 0 üreten **tek** yol bu (ölçüm 1, 3, 3b, 5), repo zaten sıfır-
bağımlılık Node scriptleriyle doğrulama yapıyor (`wcag_tokens.js` yalnız `fs`/`path`; `_harness/cdp.js`
"zero-dep CDP driver"), ve backend'de test geleneği var (`apps/api/tests`, mocha+chai) — admin panelin
test geleneği ise yok: `scripts` içinde `test` yok, `devDependencies`'te runner yok.

---

## 8. Kabul kapıları

| # | Kapı | Komut | Kabul |
|---|---|---|---|
| K1 | Ağsız test kapısı var | `cd apps/admin_panel && node --test tests/` | **exit 0** ve `# fail 0`; kurulum **öncesinde ve sonrasında** aynı sonucu vermeli |
| K2 | Kapı gerçekten kapı | kasıtlı bozuk assert (ör. `cx()` için yanlış beklenti) bir kez çalıştırılır | **exit ≠ 0** ve `# fail 1` — yeşil kapının anlamsız olmadığı kanıtlanır |
| K3 | Kural ihlali yok | `grep -rn "\.tsx'" apps/admin_panel/tests` | **0 sonuç** (testler `.tsx` import etmez) |
| K4 | Kapsama tabanı | `grep -c "test(" apps/admin_panel/tests/lib/*.test.ts` | H1+H2+H3 için en az **5** test çağrısı (cx 1, nav 2, api 3 → 6 hedef; alt sınır 5) |
| K5 | Belge tutarlılığı | `plans/admin/INDEX.md` son satırındaki `ERR_PNPM_FETCH_401` notası + AP-002 satırı | INDEX.md owner'ı tarafından güncellenir (bu kayıt **değiştirmedi**); AP-002'nin INDEX'te listelenmesi ayrı iş |
| K6 | Derleme/lint kapısı (yalnız kurulum varsa) | `npx tsc --noEmit && npx eslint src && npx next build` | `apps/admin_panel/node_modules` varken üçü de exit 0; **node_modules yokken bu kapı "N/A (kurulum yok)" olarak işaretlenir, kırmızıya boyanmaz** |

---

## 9. İkinci senaryo — ağ/yerel cache kullanılabilirken (ayrı kapı)

Koordinatör kararı gereği bu bölüm **belgedir, uygulanmış değildir**; bu görevde hiçbir `install`,
`next build` veya `tsc` çalıştırılmadı.

- **Neden mümkün görünüyor:** registry yanıt veriyor (`npm ping` PONG 264ms) ve yerel önbellek dolu
  (`~/.npm/_cacache` 1,4G / 3589 key; pnpm store 541M); `apps/admin_panel/package-lock.json` repoda
  mevcut (246.979 bayt) → `npm ci --prefer-offline` denenebilir bir yoldur.
- **Önerilen sıra:** (1) `npm ci --prefer-offline` → (2) `devDependencies`'e tek ekleme: `vitest`
  (`jsdom` yalnızca DOM testi gerektiğinde) → (3) `npm run test` K1'in yerini alır → (4) `.tsx`
  bileşen testleri (`@testing-library/react`) **yalnızca** bu kapı açıldığında.
- **Kabul:** `npm run test` exit 0; `package-lock.json` diff'i **tek paket** ekliyor; `node_modules`
  `.gitignore`'da (`grep node_modules apps/admin_panel/.gitignore`).
- **Riskler:** (a) 401 bir kez yaşandı → CI kurulumu kırılgan sayılır; bu yüzden K1 ağsız kalır ve
  vitest K1'in **üstüne** eklenir, yerine değil. (b) `package-lock.json` npm, INDEX notu pnpm kullanmış
  — iki paket yöneticisi aynı ağaçta karışırsa kilit dosyaları tutarsızlaşır; kurulum yapılacaksa
  **tek** yönetici seçilmeli (lockfile var: `npm`). (c) 31 MB'lık metadata transferi yavaş ölçüldü →
  `--prefer-offline` kullanılmayan bir kurulum dakikalar sürebilir.

---

## 10. Riskler ve tuzaklar

1. **Yanlış yeşil:** type-stripping tip hatalarını **yutmaz, hiç görmez** — `tsc` çalışmazsa tip
   ihlali testten geçmez ama kapı da onu yakalamaz. A/B ile C birlikte yürümeden "testler geçiyor"
   cümlesi eksik bir cümledir.
2. **Stub sürüklenmesi:** `lucide-react` stub'ı, ikon adı/enum'u değişse bile geçer. Stub yalnız
   `nav.ts` testinin yüklenebilmesi içindir; UI doğrulaması yerine kullanılmaz (UI için `_harness` var).
3. **`.tsx` tuzağı:** `--experimental-transform-types` umudu bu Node sürümünde ölçümlü olarak yok
   (exit 1, `ERR_UNKNOWN_FILE_EXTENSION`). JSDOM/CSR bileşen testi isteyen §9'a gider.
4. **DOM yanılsaması:** `localStorage/window/document/getComputedStyle` Node'da `undefined` (ölçüldü)
   → `session.ts` ve `chartTheme.ts` "saf" değildir; test edilebilir hâle getirmenin yolu önce
   türetmeyi saf `.ts`e taşımaktır, Node'a DOM taklit etmeye çalışmak değil.
5. **Kapı enflasyonu:** üç ayrı kapı (A/B test, C build, wcag/`_harness` görsel) tek komutta
   zincirlenmeli; aksi halde "test var ama çalışan yok" durumuna geri dönülür.
6. **Ağ iddiasının yayılması:** §2'deki ölçüm, INDEX'teki 401 notasını olduğu gibi aktarmayı
   tehlikeli kılıyor — bir dahaki sefer biri `pnpm install`'ı tekrar denediğinde başarısız olursa
   sebebi 401 (auth) olabilir, ağsızlık değil. Hata sınıfı doğru yazılmalı.

---

## 11. Bu kaydın kanıt komutları (tekrar çalıştırılabilir)

```sh
# 1. envanter
ls -d apps/admin_panel/node_modules          # exit 2 (yok)
node -e "const p=require('./apps/admin_panel/package.json');console.log(Object.keys(p.scripts))"   # dev,build,start,lint
find apps/admin_panel/src -name '*.tsx' | wc -l   # 28
find apps/admin_panel/src -name '*.ts'  | wc -l   # 5

# 2. ortam
timeout 25 npm ping                                   # PONG 264ms
curl -sS -m 10 -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/next   # 200 (-m 10'da gövde yarıda kesilir)
du -sh ~/.npm/_cacache ~/.local/share/pnpm/store      # 1,4G / 541M
stat -c '%y' apps/api/node_modules                    # 2026-10-23 04:25:26 +0300

# 3. test probe'ları (scratch — repoya dosya yazılmadı)
node --version                                        # v22.23.4
node --test tests/lib/                                # önerilen kapı; scratch karşılığı exit 0
node --import ./tests/helpers/node-hooks.mjs --test tests/lib/   # nav.ts; scratch karşılığı exit 0
node -e "console.log(typeof localStorage, typeof window, typeof document, typeof getComputedStyle)"  # undefined ×4
node --import ./hooks.mjs --experimental-transform-types --test badge.probe.test.ts  # exit 1, ERR_UNKNOWN_FILE_EXTENSION .tsx
```

**Ölçülen probe özetleri:** cx → exit 0 (1 pass) · nav hook'suz → exit 1 (`ERR_MODULE_NOT_FOUND: lucide-react`) ·
nav hook'lu → exit 0 (1 pass) · NAV↔route → exit 0 (1 pass) · api.ts → exit 0 (3 pass, `fetch` mock) ·
Badge `.tsx` → exit 1 (flag'li/flag'siz aynı hata).
