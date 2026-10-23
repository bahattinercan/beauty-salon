# AP-005 — Admin Panel: `npm audit` Borcunun Kapatılması (güvenli yükseltmeler)

**Uygulama hedefi:** `apps/admin_panel` — `package.json`, `package-lock.json`
**Tarih:** 2026-10-24 · **Durum:** UYGULANDI · **Önceki kayıt:** AP-003 (bileşen test kapısı), AP-002 (`node:test` paketi)
**Ölçüm ortamı:** Node `v22.23.4`, npm `10.9.9`, `apps/admin_panel` çalışma ağacı

> Bu kayıt AP-003'ün **"Bilinen risk"** notunu (bkz. AP-003 §Kapsam dışı — *"`npm audit` 21 zafiyet
> (1 low, 5 moderate, 12 high, 3 critical) … `npm audit fix` çalıştırılmadı. Ayrı bir bakım task'ı
> olarak ele alınmalı."*) **kapatan** kayıttır. O not artık **geçersizdir**: borç ertelenmedi,
> güvenli (semver-major olmayan) yükseltmelerle kapatıldı; yalnız semver-major ve peer çakışması
> nedeniyle uygulanamayan vitest ailesi bilinçli olarak kaldı (§Kalanlar ve gerekçe). `src/**`,
> `tests/lib/**`, `tests/unit/**` bu iş kapsamında **hiç değişmedi**.

---

## Karar

1. **Bütçe:** `npm audit --json` çıktısı 21 zafiyet (3 critical + 12 high + 5 moderate + 1 low)
   veriyordu. Kullanıcı bu borcun kapatılmasını **onayladı**; iş iki adıma bölündü: (a) `npm audit fix`
   ile güvenli transitif yükseltmeler, (b) yalnız *audit*'in işaret ettiği ve semver-major **olmayan**
   tek doğrudan bağımlılık olan `next` pininin açılması.
2. **`--force` ve `--legacy-peer-deps` kullanılmadı** (kural gereği yasak). Bu yüzden `npm audit fix`
   bazı zafiyetleri "breaking change" olarak işaretleyip **uygulamadı**; bunlar zorlanmadı, gerekçesiyle
   listelendi (§Kalanlar ve gerekçe). `npm audit fix --major` de hiç çağrılmadı.
3. **`next` neden elle yükseltildi:** `npm audit fix` `next`'i *"Will install next@16.4.3, which is
   outside the stated dependency range"* diyerek atladı, çünkü `package.json` `next`'i **tam pin**
   (`"16.1.6"`) tutuyordu; `audit fix` manifest sürüm aralığını kendi değiştirmez, `--force` ise yasak.
   Çözüm: `next` pinini **major atlamadan** `16.4.3`'e çekmek (`16.1.6 → 16.4.3`, `isSemVerMajor:false`)
   ve normal `npm install` koşmak. `next`'in audit kaydındaki 4 **critical** advisory'sinin tamamı bu
   aralıkta kapanıyor; ayrıca `next`'in `postcss` ve `sharp`'ı da temizleniyor.
4. **`react` / `react-dom` / `eslint-config-next` pinlerine dokunulmadı:** `react`/`react-dom` `19.2.3`
   aynen kaldı (audit bunları işaretlemiyor, major atlama yasak). `eslint-config-next` `16.1.6`'da
   kaldı — audit'te zafiyet olarak **görünmüyor**, yükseltmesi bu işin kapsamı değil; `next` ile sürüm
   hizası istendiğinde ayrı bir bakım diliminde ele alınmalı (aşağıda not).
5. **Kapı disiplini:** `next` sürümü değiştiği için altı kapının **tamamı** (test:node, test:unit,
   `npm test`, typecheck, lint, build) yükseltme sonrası yeniden koşuldu; AP-002/AP-003 paketleri ve
   test sayıları **birebir korundu** (29 + 35 = 64). Test dosyaları ve `src/**` kırmızıya dönerse
   düzeltme yapılmayacağı, durumun raporlanacağı kuralı uygulandı — kırmızı çıkmadı.

---

## Önce–Sonra envanteri

`npm audit --json` → `metadata.vulnerabilities` (aynı çalışma ağacı, aynı ortam):

| Şiddet | Önce (2026-10-24 başlangıç) | Sonra | Fark |
|---|---|---|---|
| critical | 3 | **2** | −1 |
| high | 12 | **0** | −12 |
| moderate | 5 | **1** | −4 |
| low | 1 | **0** | −1 |
| **toplam** | **21** | **3** | **−18 (%86 azalma)** |

Etkilenen paket adedi: **21 → 3**. Kapanan 18 paket:
`@babel/core` (low), `ajv`, `baseline-browser-mapping`, `follow-redirects`, `@humanfs/node` (moderate),
`axios`, `brace-expansion`, `browserslist`, `flatted`, `form-data`, `js-yaml`, `minimatch`, `nanoid`,
`picomatch`, `postcss`, `sharp`, `source-map-js` (high), `next` (critical).

Kalan 3 paket: `vitest` (critical), `tinypool` (critical), `@vitest/mocker` (moderate) — hepsi tek bir
kök nedene bağlı, bkz. §Kalanlar ve gerekçe.

---

## Uygulanan yükseltmeler

### Adım 1 — `npm audit fix` (güvenli, transitif)

```
added 3 packages, changed 41 packages, and audited 516 packages in 13s
→ 6 vulnerabilities (1 moderate, 2 high, 3 critical)   # exit 1 (zafiyet kaldığı için)
```

`package.json` **değişmedi**; yalnız `package-lock.json` yenilendi. Kurulu (top-level) sürümler:

| Paket | Önce | Sonra | Getiren |
|---|---|---|---|
| `axios` | 1.13.5 | **1.20.0** | doğrudan bağımlılık (`^1.13.5`) |
| `postcss` | 8.5.6 | **8.5.31** | `@tailwindcss/postcss` / `next` zinciri |
| `brace-expansion` | 1.1.12 | **1.1.21** | `eslint` zinciri |
| `minimatch` | 3.1.2 | **3.1.5** | `eslint` zinciri |
| `picomatch` | 2.3.1 | **2.3.2** | `tailwindcss` / `vite` zinciri |
| `nanoid` | 3.3.11 | **3.3.20** | `postcss` zinciri |
| `js-yaml` | 4.1.1 | **4.3.2** | `eslint` zinciri |
| `flatted` | 3.3.3 | **3.4.4** | `eslint` zinciri |
| `form-data` | 4.0.5 | **4.0.6** | `axios` zinciri |
| `browserslist` | 4.28.1 | **4.29.4** | `next` / `tailwindcss` |
| `baseline-browser-mapping` | 2.9.19 | **2.11.31** | `browserslist` |
| `source-map-js` | 1.2.1 | **1.2.2** | `postcss` zinciri |
| `ajv` | 6.12.6 | **6.15.0** | `eslint` zinciri |
| `follow-redirects` | 1.15.11 | **1.16.1** | `axios` zinciri |
| `@humanfs/node` | 0.16.7 | **0.16.8** | `eslint` zinciri |
| `@babel/core` | 7.29.0 | **7.29.7** | `next` zinciri |

### Adım 2 — `next` pini `16.1.6 → 16.4.3` + `npm install`

```diff
--- a/apps/admin_panel/package.json
+++ b/apps/admin_panel/package.json
@@ -16,7 +16,7 @@
     "axios": "^1.13.5",
     "date-fns": "^4.1.0",
     "lucide-react": "^0.564.0",
-    "next": "16.1.6",
+    "next": "16.4.3",
     "react": "19.2.3",
     "react-dom": "19.2.3",
```

```
added 4 packages, changed 11 packages, and audited 517 packages in 19s
→ 3 vulnerabilities (1 moderate, 2 critical)
```

| Paket | Önce | Sonra | Not |
|---|---|---|---|
| `next` | 16.1.6 | **16.4.3** | major değil (16 → 16); `peerDependencies.react` `^19.0.0` → kurulu `19.2.3` karşılıyor, ERESOLVE yok |
| `postcss` (next içi, `node_modules/next/node_modules/postcss`) | 8.5.6 | **8.5.23** | 8.5.22 üstü → advisory kapandı |
| `sharp` | kurulu değildi | **0.35.5** | `next`'in optionalDependency'si; 0.35.5-rc.1 üstü → advisory kapandı |

**Değişmeyen pinler (bilinçli):** `react` 19.2.3, `react-dom` 19.2.3, `eslint-config-next` 16.1.6,
`vitest` 3.2.7, `@vitejs/plugin-react` 5.2.0, `jsdom` 30.1.3, `typescript` ^5, `@types/node` ^20,
`scripts` bloğunun tamamı. `package-lock.json` diff'i: **463 ekleme / 366 silme** (tek dosya, 829 satır).

**`eslint-config-next` hizası hakkında not:** `next` 16.4.3 iken `eslint-config-next` 16.1.6'da kaldı.
Bu bir *zafiyet* değil (audit'te görünmüyor) ve lint kapısı yeşil; ancak Next.js dokümanı iki paketi
birlikte yükseltmeyi önerir. Ayrı bir küçük bakım diliminde `eslint-config-next@16.4.3`'e çekilip
`npm run lint` yeniden ölçülmelidir. Bu kayıt kapsamında **yapılmadı** (audit kaynaklı olmayan
değişiklik yüzeyi büyütülmedi).

---

## Kalanlar ve gerekçe

`npm audit --json` (yükseltme sonrası) kalan 3 kayıt:

| Paket | Şiddet | Advisory | Fix | Neden uygulanmadı |
|---|---|---|---|---|
| `vitest` | critical | GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8, GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr (via `@vitest/mocker` + `tinypool`) | `vitest@5.0.5` — **`isSemVerMajor: true`** | Semver-major. `vitest@5.0.5` `peerOptional @types/node@^22 \|\| >=24` ister, proje `@types/node@^20` kullanıyor → **ERESOLVE** (AP-003 §Kanıt'te ölçüldü). `--legacy-peer-deps`/`--force` yasak. |
| `tinypool` | critical | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr | `vitest@5.0.5` (`isSemVerMajor: true`) | `vitest@3.2.7` `tinypool`'u `^1.1.1` ile sabitliyor (kurulu 1.1.1); düzeltilmiş `tinypool` 2.1.2+ **major** ve vitest 3'ün aralığı dışında → override yolu da semver-major demek. |
| `@vitest/mocker` | moderate | GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8 | `vitest@5.0.5` (`isSemVerMajor: true`) | `vitest@3.2.7` `@vitest/mocker`'ı **tam pin** (`3.2.7`) tutuyor; düzeltilmiş sürüm 4.1.12+ → `vitest` 4 major'ı gerekir. `vitest@^4.1.12` denemesi npm `10.9.9` arborist çökmesi veriyor (AP-003 §Kanıt). |

**Ortak kök neden:** üç kaydın tamamı **vitest 3 test araç zinciri** ve yalnız vitest'in major
yükseltmesiyle kapanıyor. Bu üç paket **yalnızca `devDependencies`/test zamanı** yolunda;
üretim çıktısına (`next build` çıktısı, `.next/`) girmiyorlar, dolayısıyla çalışma zamanı yüzeyi yok.
Gerçek çözüm bir sonraki dilimde: `@types/node` `^22`/`^24`'e çekilip `vitest@5` + `@vitejs/plugin-react`
uyumlu majörü birlikte kurulması (ya da `--force`/`--legacy-peer-deps` yerine gerçek peer çözümü).

**Kural kanıtı:** `--force`, `--legacy-peer-deps`, `audit fix --major` bu iş boyunca **hiç
çalıştırılmadı**. `next`/`react`/`react-dom` hiçbir major atlamadı (`16.1.6 → 16.4.3`, react tarafı
sabit). Kalan 3 kayıt "düzeltilemez" diye işaretlenmedi; yalnız **bu görevde yasak olan araçlarla**
düzeltilebilir oldukları için bırakıldı.

---

## Kapılar

Yükseltme sonrası, `apps/admin_panel` içinde, temiz `.next/` ile (2026-10-24). Karşılaştırma için
AP-003'ün yükseltme öncesi değerleri de aynı tabloda:

| # | Komut | Exit | Önce (AP-003) | Sonra (AP-005) |
|---|---|---|---|---|
| 1 | `npm run test:node` | **0** | 29 test / 29 pass / 0 fail | `# tests 29 / # pass 29 / # fail 0` |
| 2 | `npm run test:unit` | **0** | 6 dosya / 35 test | `Test Files 6 passed (6)` · `Tests 35 passed (35)` |
| 3 | `npm test` | **0** | 64 test | node 29 + unit 35 = **64 test**, 0 fail |
| 4 | `npm run typecheck` | **0** | temiz | `tsc --noEmit`, hata yok |
| 5 | `npm run lint` | **0** | temiz | `eslint` (flat config) temiz |
| 6 | `npm run build` | **0** | Next 16.1.6, 11 statik sayfa | **`▲ Next.js 16.4.3 (Turbopack)`**, `✓ Compiled successfully in 3.5s`, **11 statik sayfa** (9 route + `/_not-found`), hata/uyarı yok |

Yükseltme **öncesi** aynı altı kapı da koşuldu ve yeşildi (29 / 35 / 64 / typecheck / lint /
build 11 sayfa) — yani sonraki yeşil sonuç bir regresyon gizlemiyor. `src/**`, `tests/lib/**`,
`tests/unit/**` `git status`'ta **görünmüyor**; `node_modules/` ve `.next/` de görünmüyor
(`.gitignore` değiştirilmedi).

---

## Geri alma yolu

Tek komutluk tam geri dönüş (bu iş **yalnız iki dosyaya** dokunduğu için temiz):

```sh
cd apps/admin_panel
git checkout -- package.json package-lock.json
rm -rf node_modules .next
npm ci                      # lock'tan deterministik kurulum (16.1.6 zinciri geri gelir)
```

Doğrulama: `node -e 'console.log(require("./node_modules/next/package.json").version)'` → `16.1.6`
ve `npm audit` → tekrar **21 zafiyet** (3 critical / 12 high / 5 moderate / 1 low). Bu, geri almanın
tam olduğunun kanıtıdır; beklendiği gibi zararsız ama güvenlik açısından borç geri gelir.

Kısmi geri alma gerekirse: yalnız `next` pinini `16.1.6`'ya döndürmek `next`+`postcss`+`sharp`
kayıtlarını geri getirir (6 zafiyet), çünkü `audit fix`'in transitif yükseltmeleri lock'ta kalır.
`git checkout` + `npm ci` bu yüzden tercih edilen yoldur.

**Gerçekten geri alınması gereken tek şey** ileride `eslint-config-next`/`vitest` dilimi olursa o
zaman o dilimin kendi commit'idir; bu kayıt `src/**` ve test dosyalarına dokunmadığı için kod
düzeyinde geri alınacak bir değişiklik bırakmıyor.
