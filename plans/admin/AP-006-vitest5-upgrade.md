# AP-006 — Admin Panel: `vitest@5` Yükseltmesi ve Audit Borcunun Sıfırlanması

**Uygulama hedefi:** `apps/admin_panel` — `package.json`, `package-lock.json` (başka dosya değişmedi)
**Tarih:** 2026-10-24 · **Durum:** UYGULANDI · **Önceki kayıt:** AP-005 (`npm audit` borcu: 21 → 3), AP-004 (unit kapısı 127 test), AP-003 (vitest 3.2.7 kapısı), AP-002 (`node:test` paketi)
**Ölçüm ortamı:** Node `v22.23.4`, npm `10.9.9`, `apps/admin_panel` çalışma ağacı (registry erişimi var)

> Bu kayıt **AP-005 §Kalanlar ve gerekçe** bölümünde bilinçli olarak açık bırakılan son üç kaydı
> (`vitest` critical, `tinypool` critical, `@vitest/mocker` moderate) **kapatır**. AP-005'in
> *"Gerçek çözüm bir sonraki dilimde: `@types/node` `^22`/`^24`'e çekilip `vitest@5` +
> `@vitejs/plugin-react` uyumlu majörü birlikte kurulması"* cümlesiyle tarif ettiği dilim **bu
> kayıttır**; o borç **kapandı**, `npm audit --json` artık `total: 0` veriyor. `src/**`,
> `tests/lib/**`, `tests/unit/**` bu iş kapsamında **hiç değişmedi**; `vitest.config.ts` ve
> `tsconfig.json` da **değişmedi** (vitest 5 API farkı bu paket için düzeltme gerektirmedi).

---

## Karar

1. **Kapsam yalnız audit'in işaret ettiği tek kök nedene indirildi:** kalan üç kayıt (`vitest`,
   `tinypool`, `@vitest/mocker`) tek bir araç zincirinin — vitest 3 test araç zinciri — ürünüydü.
   Bu yüzden iş "üç ayrı paketi yamala" değil, **"vitest'i major'a çıkar"** olarak kurgulandı; alt
   paketler kendiliğinden düzeldi.
2. **Semver-major serbest bırakıldı, ama yalnız `devDependencies`/test yolunda.** `vitest`
   `^3.2.7 → ^5.0.5` çıktı; üretim bağımlılıkları (`next`, `react`, `react-dom`, `axios`, `recharts`,
   `lucide-react`, `date-fns`) **hiç değişmedi** (`next` `16.4.3` pininde kaldı).
3. **`--force` / `--legacy-peer-deps` / `npm audit fix --major` kullanılmadı.** Peer çakışması
   (`@types/node`) **gerçek çözümle** kapatıldı: `@types/node` `^20 → ^22` (vitest 5.0.5'in istediği
   `^22.0.0 || >=24.0.0` aralığının alt ucu), sonra düz `npm install`. `^24`'e çıkmak da serbestti;
   `^22` seçildi çünkü çakışmayı kapatmaya yeter ve daha küçük bir sıçrama. **`^26` tercih edilmedi.**
4. **Neden `@vitejs/plugin-react` yükseltilmedi:** vite 8'e çıkmak plugin-react tarafında ayrı bir
   major kararı demek; bu iş bir *güvenlik* dilimi, vite major'ı değil. Bu yüzden `plugin-react`
   `5.2.0`'da, `jsdom` `30.1.3`'te, `vite` **7.3.7**'de sabit tutuldu.
5. **`vite` neden artık açık bir `devDependency`:** `vitest@5.0.5` peer'i `vite: ^6.4 || ^7 || ^8`
   olduğu için, `vite` doğrudan bağımlılık değilken npm aralığın **tepesini** seçiyor. Ölçüldü:
   `vite` pini olmadan `npm install --dry-run` **`vite 8.3.5`** kuruyor (scratch probe `/tmp/ap006probe`,
   gerçek ağaç değil). Bu yüzden `vite: ^7.3.7` **açıkça** yazıldı ve 7.x hattı korundu
   (kurulu: `vite/7.3.7 linux-x64 node-v22.23.4`).

---

## Kök neden

Üç zafiyetin ortak kökü **tek**: `vitest@3.2.7`'nin sabitlediği alt bileşenler.

| Paket | Şiddet | Neden vitest 3'te kapanmıyordu |
|---|---|---|
| `vitest` | critical | Advisory'ler `@vitest/mocker` + `tinypool` üzerinden geliyor; `vitest@3.2.7` bu ikisini **tam pin** tutuyor → düzeltilmiş sürümler vitest 3 aralığının dışında |
| `tinypool` | critical | `vitest@3.2.7 → tinypool ^1.1.1` (kurulu `1.1.1`); düzeltilmiş `tinypool` **major** (2.x) ve vitest 3'ün aralığı dışında |
| `@vitest/mocker` | moderate | `vitest@3.2.7 → @vitest/mocker 3.2.7` (tam pin); düzeltilmiş sürüm 4.1.12+ → vitest 4/5 major'ı gerekir |

Bunun üstüne binmiş **ikinci ve gerçek engel** peer çakışmasıydı:

```
vitest@5.0.5  peer  @types/node: ^22.0.0 || >=24.0.0
proje                @types/node: ^20          →  ERESOLVE (AP-003 §Kanıt, AP-005 §Kalanlar)
```

AP-005'in doğru teşhisi buydu; AP-005 bunu `--legacy-peer-deps`/`--force` (yasak) olmadan
çözemiyordu. Çözüm peer'ı **majör atlayarak gerçekten karşılamak**: `@types/node ^22`.

Yükseltme öncesi **ölçülen** peer/engines uyumu (tahmin değil, `npm view`):

```
vitest@5.0.5  peer     vite: ^6.4.0 || ^7.0.0 || ^8.0.0      → kurulu 7.3.7  ✓
vitest@5.0.5  engines  node: ^22.12.0 || ^24.0.0 || >=26.0.0  → kurulu 22.23.4 ✓
vitest@5.0.5  peer     @types/node: ^22.0.0 || >=24.0.0       → ^22'ye çekildi ✓
```

---

## Uygulanan yükseltmeler

`apps/admin_panel/package.json` — **tek `devDependencies` bloğunda üç satır** (başka hiçbir alan değişmedi):

| Bağımlılık | Önce | Sonra | Gerekçe |
|---|---|---|---|
| `vitest` | `^3.2.7` | **`^5.0.5`** | Audit'in işaret ettiği tek gerçek düzeltme; `tinypool`'u tamamen düşürüyor |
| `@types/node` | `^20` | **`^22`** | `vitest@5` peer'i `^22.0.0 \|\| >=24.0.0`; ERESOLVE'u `--force` olmadan kapatır |
| `vite` | *(doğrudan yok)* | **`^7.3.7`** *(yeni, açık pin)* | `vitest@5` peer'i `^8`'e de izin veriyor; npm'in `vite 8.3.5`'e hoist etmesini engeller |

**Sabit kalanlar (bilinçli):** `@vitejs/plugin-react` `^5.2.0` (kurulu **5.2.0**), `jsdom` `^30.1.3`
(kurulu **30.1.3**), `vite` **7.3.7**, `next` **16.4.3**, `react`/`react-dom` **19.2.3**,
`eslint-config-next` `16.1.6`, `typescript` **5.9.3**.

### Kurulum

```
$ npm install
added 6 packages, removed 19 packages, changed 12 packages, and audited 504 packages in 8s
found 0 vulnerabilities
```

`--force`, `--legacy-peer-deps`, `--omit=optional`, `audit fix --major` **hiç çağrılmadı**; komut
düz `npm install` ve ERESOLVE vermedi. Öncesinde `npm install --dry-run` ile plan doğrulandı
(aynı çözüm ağacı, 0 hata).

Kalıcı sonuç (kurulu sürümler, `node_modules/*/package.json`):

```
vitest 5.0.5 · @vitest/mocker 5.0.5 · vite 7.3.7 · @vitejs/plugin-react 5.2.0
jsdom 30.1.3 · @types/node 22.20.5 · next 16.4.3 · react 19.2.3 · react-dom 19.2.3
tinypool → KURULU DEĞİL (ağaçtan tamamen çıktı)
```

`package-lock.json`: `lockfileVersion 3` korundu; `node_modules/tinypool` kaydı silindi,
`vite-node` (vitest 3'e özgü) kaldırıldı, `@vitest/mocker` `3.2.7 → 5.0.5` yenilendi, `chai`
`5.3.3 → 6.3.0` (vitest 5 kendi chai 6'sını getiriyor). Diff: **+126 / −303 satır**.

### `vitest.config.ts` / `tsconfig.json` değişikliği

**Yok.** Mevcut config (`environment: 'jsdom'`, `include: ['tests/unit/**/*.test.tsx']`,
`setupFiles`, `globals: false`, `restoreMocks`, `clearMocks`, `@` alias, `@vitejs/plugin-react`)
vitest 5'te **olduğu gibi** çalıştı; 17 dosya / 127 test hiçbir uyarlama olmadan geçti. Vitest 5'in
kaldırdığı/değiştirdiği API'ler bu paketin kullandığı yüzeyde değil (`describe/it/expect`,
`@testing-library/react`, `vi.fn`, snapshot yok). `tsconfig.json` de `@types/node ^22` ile
uyumlu — `tsc --noEmit` temiz.

### Audit önce → sonra

`npm audit --json` → `metadata.vulnerabilities`:

| Şiddet | Önce (AP-005 sonu) | Sonra (AP-006) | Fark |
|---|---|---|---|
| critical | 2 | **0** | −2 |
| high | 0 | **0** | 0 |
| moderate | 1 | **0** | −1 |
| low | 0 | **0** | 0 |
| **toplam** | **3** | **0** | **−3** |

Kapanan kayıtlar: `vitest` (critical), `tinypool` (critical, ağaçtan çıktı), `@vitest/mocker`
(moderate). **Kalan kayıt yok** — `--force`/`--legacy-peer-deps` ile gizlenmiş bir kayıt da yok,
çünkü o araçlar hiç kullanılmadı ve `npm audit` gerçek ağaç üzerinde koşuyor (`packages.total: 615`).

---

## Kapılar

`apps/admin_panel` içinde, temiz `.next/` ile (2026-10-24, vitest 5 kurulumundan **sonra**).
Altı kapının **tamamı exit 0**; test sayıları AP-004/AP-005 ile **birebir aynı** (hiçbir test
zayıflatılmadı, `skip`/`only`/`todo` eklenmedi, test silinmedi, assertion gevşetilmedi):

| # | Komut | Exit | Sonuç |
|---|---|---|---|
| 1 | `npm run test:node` | **0** | `# tests 29 / # pass 29 / # fail 0` (AP-002 offline paketi, `node:test`) |
| 2 | `npm run test:unit` | **0** | `Test Files 17 passed (17)` · `Tests 127 passed (127)` — vitest **5.0.5** |
| 3 | `npm test` | **0** | node 29 + unit 127 = **156 test**, 0 fail |
| 4 | `npm run typecheck` | **0** | `tsc --noEmit`, hata yok |
| 5 | `npm run lint` | **0** | `eslint` (flat config), 0 hata / 0 uyarı |
| 6 | `npm run build` | **0** | `✓ Compiled successfully in 2.5s`, TypeScript temiz, **11 statik sayfa** (9 route + `/_not-found`), `next 16.4.3` |

Karşılaştırma: AP-005 sonu 29 / 127 / 156 / typecheck / lint / build 11 sayfa → AP-006 aynı
sayılar. **Test sayısı düşmedi** (unit 127, toplam 156 — acceptance alt sınırlarının üzerinde).

`npm run build` çıktısındaki tek satır uyarı bu işten bağımsız ve önceden var olan bir ortam
notudur: *"Next.js ignored pnpm-lock.yaml in /home/baris because it is outside the current Git
repository"* (üst dizindeki `pnpm-lock.yaml`, `turbopack.root` önerisi). Exit 0'ı etkilemez,
`apps/admin_panel`'in kendi bağımlılık ağacıyla ilgisi yoktur.

---

## Geri alma yolu

Tek dosya çifti değişti; geri alma **tam ve tek adımlı**:

```sh
cd /home/baris/orca/beauty-salon
git checkout -- apps/admin_panel/package.json apps/admin_panel/package-lock.json
rm -rf apps/admin_panel/node_modules apps/admin_panel/.next
cd apps/admin_panel && npm ci          # lockfile'a birebir döner: vitest 3.2.7, @types/node 20.19.33
```

Bu, `vitest@3.2.7` + `@types/node@20` durumuna döner ve **AP-005'in 3 zafiyetli hâlini geri
getirir** (kabul edilebilir bir geri alma değil, yalnız acil durum çıkışıdır). Kısmi geri alma
anlamsızdır: `@types/node`'u `^20`'ye döndürmek tek başına `vitest@5` ile ERESOLVE üretir;
`vitest`'i tek başına `^3.2.7`'ye döndürmek audit'i 3'e geri çıkarır.
Belge geri alımı: `git checkout -- plans/admin/AP-006-vitest5-upgrade.md plans/admin/INDEX.md`
(veya yeni dosyayı sil + INDEX satırını çıkar). `src/**`, `tests/**`, `vitest.config.ts`,
`tsconfig.json` bu işte hiç değişmediği için geri alınacak bir şey yoktur.
Bu iş **commit edilmedi** (`git add` da çalıştırılmadı) — commit ayrı task.

---

## Kalan risk

1. **`@types/node` major'ı `^22`:** üretim kodunun tip yüzeyini etkiler (yalnız `@types`, runtime
   değil). `tsc --noEmit` temiz ve `node --test` yeşil olduğu için ölçülen bir kırılma yok; yine de
   Node 20 API'lerine yaslanan bir kod parçası ileride `@types/node@22`'de daraltılmış olabilir —
   bu, tip hatası olarak **derleme zamanında** görünür, sessiz kalmaz.
2. **`vite` artık doğrudan pin:** `^7.3.7` kilitli. `vitest@5` peer'i `^8`'e de izin veriyor, yani
   vite 8'e geçiş artık **bilinçli bir major kararı** olacak (plugin-react tarafı da gözden
   geçirilmeli). Bu istenen davranış: sürpriz hoist yok, ama vite 8 güvenlik düzeltmesi gelirse
   elle müdahale gerekir.
3. **`vitest@5` davranış değişiklikleri:** bu paket için ölçülen fark yok (127/127 aynı, süre
   ~3.5s → ~2.8s). Yine de ileride eklenecek testlerde vitest 5'in yeni varsayılanları
   (ör. `spy`/`mocker` semantiği, `chai 6` assertion mesajları) sürpriz üretebilir; `globals: false`
   ve açık import'lar bu riski düşük tutuyor.
4. **`tinypool` ağaçtan tamamen çıktı:** vitest 5 onu kullanmıyor; başka bir araç `tinypool`'a
   bağlanırsa (ör. yeni bir test runner) zafiyet geri gelebilir — audit kapısının CI'da kalması
   bunu yakalar.
5. **`eslint-config-next` `16.1.6` hâlâ `next` `16.4.3` ile hizasız** (AP-005'ten devreden, bu işin
   kapsamı dışı, audit'te görünmüyor). Ayrı bir bakım dilimi.
6. **Uyarı:** `npm audit` 0 olsa da bu bir *bilinen zafiyet yok* beyanıdır, *zafiyet yok* değil.
   CI'da `npm audit --audit-level=moderate` kapısı önerilir.
