# AP-009 — Kategori Yönetimi: kart ızgarasından tabloya, tek satır filtre çubuğu, chip'ler, sayfalama (20/50/100) ve medya alanları (görsel + video)

**Durum:** UYGULANDI (2026-10-28) · **Tarih:** 2026-10-28 · **Hedef uygulamalar:** `apps/admin_panel`, `apps/api`
**Kanıt (özet):** Headless Chromium ölçümü: **1280px'te filtre çubuğu tek satır**, **390px'te sarar (4 satır)**; her iki genişlikte yatay taşma **0** (`scrollWidth == clientWidth`), chip bloğu **ayrı satırda**. Kapılar: `apps/api` `npm test` **329 passing / 0 failing** (baseline 320 + 9 yeni) · `apps/admin_panel` `typecheck` + `lint` + `next build` temiz, `npm test` **84 node:test + 218 vitest** (düşüş yok). Bu plan **uygulamadan sonra yazıldı**: tüm sayılar upstream worker'in raporundan alındı, bu oturumda yeniden ölçüm yapılmadı.
**Konu (talebin özü):** Kategori Yönetimi kart ızgarası yerine tablo kullansın, filtreler tek satıra sığsın, etkin filtreler chip olarak görünsün, sayfalama 20/50/100 olsun ve kategoriye görsel + video eklenebilsin.

Bu plan AP-007 (`plans/admin/AP-007-salons-filter-pagination.md`) ve AP-008 (`plans/admin/AP-008-appointments-filter-actions.md`) ile **aynı yapıdadır**: aynı filtre çubuğu / chip / sayfalama deseni kategori sayfasına taşınır. İki bilinçli fark: (1) filtreleme + sayfalama **istemci tarafında** (API sözleşmesi değişmez — §3), (2) `İşlemler` kolonunda Durum/Salon yerine **Düzenle + Sil**.

---

## 1. Amaç ve kapsam

| # | Kazanç |
|---|---|
| K1 | Kategori listesi kart ızgarasından `DataTable` tablosuna taşındı; kart görünümü **korundu** ve başlık aksiyonlarından seçiliyor (Tablo / Kartlar) |
| K2 | Filtre kontrolleri **tek satırda** (≥1024px), etkin filtreler **ayrı chip satırında** + Temizle |
| K3 | Filtre + sayfa + sıralama + görünüm **URL'de** (derin bağlantı çalışıyor) |
| K4 | Sayfalama **20/50/100** (varsayılan 20), seçim `localStorage`'da hatırlanıyor |
| K5 | Kategoriye **görsel** (`imageUrl`) ve **video** (`videoUrl`) eklendi: dialog alanları, API alanları, yeni video yükleme ucu, migration |

### Kapsam dışı (bilinçli)

- `GET /categories` API sözleşmesini değiştirmek (bkz. §3 — `apps/customer_app` bağımlılığı).
- Görsel yükleme akışında değişiklik: `ALLOWED_TYPES`, `MAX_SIZE`, `POST /upload/single`, `POST /upload/multiple` **olduğu gibi kaldı**.
- Toplu (bulk) işlem, CSV dışa aktarma, kategori sıralama sürükle-bırak.
- Başka liste sayfalarının filtre çubukları (users/reviews).

---

## 2. UI sözleşmesi (`apps/admin_panel`)

### 2.1 Tablo kolonları (`src/app/categories/page.tsx`)

| Kolon | İçerik | Mobil |
|---|---|---|
| **Kategori** | dairesel ikon çipi + kategori adı | `mobile: "primary"` |
| **Açıklama** | blok metin, `line-clamp-2` | — |
| **Medya** | 40×40 görsel + varsa **Video** badge'i | — |
| **Hizmet** | sağ hizalı sayı, `tnum` | — |
| **Durum** | Aktif / Pasif badge | — |
| **İşlemler** | **Düzenle** + **Sil** | `mobile: false` |

### 2.2 Filtre kontrolleri (tek satır, ≥1024px)

| Sıra | Kontrol | Tür | Seçenekler / kural |
|---|---|---|---|
| 1 | Arama | `Input` (`leading`, `flex-1`) | kategori adı veya açıklama; `q` ≤100 karakter |
| 2 | Durum | `Tabs` (segment, sayaçlı) | tümü / aktif / pasif — sayaçlar **global** sayımlardan |
| 3 | Medya | `Select` | Tümü / Görselli / Videolu / Medyasız |
| 4 | İkon | `Select` | Tüm ikonlar + ikon seçenekleri |
| 5 | Sıralama | `Select` | tek parametre: `<sort>:<order>` |

- **Görünüm seçimi (Tablo / Kartlar) filtre değildir** ve AP-007'deki aynı kararla **başlık aksiyonlarındadır**; `Yenile` ve `Yeni kategori` de orada.
- Sarmalayıcı sınıfları AP-007/AP-008 dersleriyle aynı: genişlik **sarmalayıcıda** (`Field`/`Input` taban sınıfı `w-full` genişliği ezer), select sarmalayıcıları `!min-w-[8.5rem] max-w-48 flex-1` (`!` şart — `FilterBar` kökündeki `[&>*]:min-w-0` aynı özgüllükte `min-w-*` tabanını eziyor).

### 2.3 Chip satırı (ayrı blok)

`FilterChips` filtrenin **içinde değil**, filtre çubuğundan **ayrı ve tek satır blokta** durur — böylece çubuğun tek satır ölçütü chip sayısından bağımsız kalır. Yerleşim sözleşmesi AP-007 §"Yerleşim sözleşmesi" ile **birebir aynıdır** (≥1024px tek satır / <1024px `flex-wrap`, yatay taşma yok).

Chip sırası ve etiketleri (`categoriesQuery.ts` içinde tek yerde tanımlı): **Durum → Medya → İkon → Arama → Sıralama**; `patch` o alanı varsayılana çeker. `Temizle` tümünü sıfırlar.

### 2.4 Sayfalama ve URL parametreleri

Sayfa boyutu **20/50/100**, varsayılan **20**; tercih `localStorage` anahtarı **`categories_page_size`**'te saklanır. Saf modül: `src/lib/categoriesQuery.ts` (`parseCategoriesQuery`, `buildCategoriesQuery`, `activeChips`, `hasActiveFilters`, `normalizeQuery`, `sortCategories`) — React/`window`/ağ yok, ağsız `node:test` ile sınanır (**19 test**).

| Parametre | Anlamı | Değer kümesi / varsayılan |
|---|---|---|
| `q` | arama metni | boş = filtre yok |
| `durum` | durum filtresi | `tümü` (var.) · `aktif` · `pasif` |
| `medya` | medya filtresi | `tümü` (var.) · `görselli` · `videolu` · `medyasız` |
| `ikon` | ikon anahtarı | boş = tüm ikonlar |
| `sayfa` | sayfa numarası | `1` (var.), `<1` → `1` |
| `limit` | sayfa boyutu | `20` (var.) · `50` · `100` |
| `sirala` | `<sort>:<order>` | `sortOrder:asc` (var.) · `name:asc` · `name:desc` · `serviceCount:desc` · `createdAt:desc` |
| `gorunum` | görünüm | `tablo` (var.) · `kartlar` |

Varsayılanlar URL'e **yazılmaz** (temiz derin bağlantı); okuma tarafı eksik/geçersiz değeri `normalizeQuery` ile varsayılana çeker.

### 2.5 Kategori dialogu — medya alanları

| Alan | Bileşen | Etiket | Payload |
|---|---|---|---|
| `imageUrl` | `ImageField` (AP-007'den yeniden kullanım) | **Kategori görseli** | `POST`/`PATCH` gövdesinde `imageUrl`; boşsa `null` |
| `videoUrl` | `VideoField` (**yeni**, `components/categories/VideoField.tsx`) | **Kategori videosu** | `POST`/`PATCH` gövdesinde `videoUrl`; boşsa `null` |

Dialog içeriği kaydırılabilir; yüklenen yol göredir (`/uploads/…`) ve panel ayrı origin'de çalıştığı için API origin'ine tamamlanır.

---

## 3. API sözleşmesi (`apps/api`)

### 3.1 Model — `ServiceCategory`

| Alan | Kolon | Kural |
|---|---|---|
| `imageUrl` | `image_url` | nullable string |
| `videoUrl` | `video_url` | nullable string |

`createCategory` / `updateCategory` bu alanları kabul eder: `undefined` = **dokunma**, `null` = **temizle**.

### 3.2 Yeni uç — `POST /api/v1/upload/video`

| Öğe | Değer |
|---|---|
| Form alanı | `file` |
| İzinli tipler | `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime` |
| Boyut sınırı | `MAX_VIDEO_SIZE` env, yoksa **50 MB** |
| Yanıt | `{ url, originalName, size }` |

**Görsel yükleme akışı değişmedi:** `ALLOWED_TYPES`, `MAX_SIZE`, `POST /upload/single`, `POST /upload/multiple` olduğu gibi duruyor.

### 3.3 Migration

`apps/api/src/database/migrations/20240101000013-add-media-to-service-categories.js` — `describeTable` ile **idempotent** (kolon varsa bir şey yapmaz).

### 3.4 `GET /categories` — değişmedi (istemci tarafı filtreleme gerekçesi)

Filtreleme ve sayfalama **istemci tarafında** yapılır: panel tüm listeyi tek `GET /categories` ile çeker, `categoriesQuery.ts` içindeki saf fonksiyonlar sıralar → filtreler → dilimler.

Gerekçe: `GET /categories` sözleşmesi **`apps/customer_app` tarafından da kullanılıyor**; sunucu tarafı filtre/sayaç eklemek bu istemciyi etkileme riski taşırdı. Kategori listesi küçük (onlarca satır) olduğu için tam liste + istemci tarafı dilimleme pratik bir maliyettir. Bu, AP-007/AP-008'in **sunucu tarafı** kararından bilinçli bir sapmadır ve yalnız bu sayfaya aittir.

---

## 4. Dosya sahipliği

| Uygulama | Dosya | Değişiklik |
|---|---|---|
| `apps/admin_panel` | `src/app/categories/page.tsx` | kart ızgarası → tablo + filtre çubuğu + chip + sayfalama + medya dialog alanları (**840 satır**) |
| `apps/admin_panel` | `src/lib/categoriesQuery.ts` | **yeni** — saf filtre/URL/sıralama/sayfalama modülü |
| `apps/admin_panel` | `src/components/categories/VideoField.tsx` | **yeni** — video yükleme alanı (`POST /upload/video`) |
| `apps/admin_panel` | `tests/lib/categoriesQuery.test.ts` | **yeni** — 19 ağsız `node:test` testi |
| `apps/api` | `src/models/ServiceCategory.js` | `imageUrl` / `videoUrl` kolonları |
| `apps/api` | `src/controllers/category.controller.js` | create/update bu alanları işler (`undefined` = dokunma, `null` = temizle) |
| `apps/api` | `src/middlewares/upload.js` | `uploadVideo` (tip filtresi + `MAX_VIDEO_SIZE`) |
| `apps/api` | `src/controllers/upload.controller.js` | `uploadVideo` yanıtı `{ url, originalName, size }` |
| `apps/api` | `src/routes/upload.routes.js` | `POST /upload/video` (authenticate) |
| `apps/api` | `src/database/migrations/20240101000013-add-media-to-service-categories.js` | **yeni** migration (idempotent) |
| `apps/api` | `tests/category.test.js`, `tests/upload.test.js` | 9 yeni test |
| dokümantasyon | `docs/ADMIN-PANEL.md`, `plans/admin/INDEX.md`, bu dosya | AP-009 kaydı |

---

## 5. Kapılar ve kanıt (2026-10-28, upstream worker çıktısı)

| Katman | Komut | Sonuç |
|---|---|---|
| API test | `cd apps/api && npm test` | **329 passing / 0 failing** (baseline 320 + 9 yeni) |
| Panel tip | `cd apps/admin_panel && npm run typecheck` | temiz |
| Panel lint | `cd apps/admin_panel && npm run lint` | temiz |
| Panel build | `cd apps/admin_panel && npm run build` | temiz |
| Panel test | `cd apps/admin_panel && npm test` | **84 `node:test` + 218 vitest** (düşüş yok) |
| Görsel | headless Chromium ölçümü | **1280px: filtre çubuğu tek satır**; **390px: sarar (4 satır)**; iki genişlikte yatay taşma **0** (`scrollWidth == clientWidth`); chip bloğu **ayrı satırda** |

Not: segment durum sayaçları, chip sayıları ve hücresel piksel ölçümleri bu belge için **yeniden ölçülmedi** — yalnız yukarıdaki satırlar raporlanmış gerçek kapı/görsel sonuçlarıdır.

---

## 6. Kalan risk

| # | Risk | Durum |
|---|---|---|
| R1 | **Seed verisinde `imageUrl`/`videoUrl` yok** → Medya hücresinin görsel doğrulaması **gerçek veriyle yapılmadı** (hücre içeriği **ölçülmedi**) | açık — kullanıcı elle bir kategoriye görsel/video yükleyip doğrulamalı |
| R2 | **Migration çalıştırılmadı** → dev veritabanında `image_url` / `video_url` kolonları yok; bu alanlara dokunan her istek migration sonrası doğru davranır | açık — `cd apps/api && npm run migrate` kullanıcı tarafından çalıştırılacak |
| R3 | Filtreleme istemci tarafında olduğu için liste **çok büyürse** (binlerce kategori) tam liste çekme maliyeti artar | bilinçli kabul (§3.4); eşik aşılırsa AP-007/008 desenine (sunucu tarafı) geçilir |
| R4 | Video boyut sınırı env'e bağlı; sunucuda `MAX_VIDEO_SIZE` yükseltilirse web sunucusu (nginx/`client_max_body_size`) ayrı sınırla kesebilir | ölçülmedi — deploy notu |

---

## 7. Geri dönüş

- Migration **idempotent**; geri alma için ayrı bir `remove-column` migration'ı gerekir (şema destructive olduğu için planlanmadı) — migration henüz çalıştırılmadığı için bugün geri dönüş **maliyetsiz**.
- API değişiklikleri **additive**: yeni kolonlar nullable, yeni uç bağımsız; `GET /categories` değişmediği için eski istemciler (customer_app) etkilenmez.
- Panel tarafı: `categoriesQuery.ts` ve `VideoField.tsx` yeni dosyalar (silinmesi zararsız); yoğun değişiklik tek dosyada (`categories/page.tsx`) toplanır → tek `git revert` yeterli.
- Commit disiplini: shared worktree — commit/`git add` yok, değişiklikler çalışma ağacında bırakılır.

---

## 8. İndeks kaydı (`plans/admin/INDEX.md`)

Tabloya tek satır eklendi (diğer satırlar değişmedi):

```
| **AP-009-categories-table-filters-media.md** | `apps/admin_panel` Kategori Yönetimi: kart ızgarası → **DataTable** (Kategori/Açıklama/Medya/Hizmet/Durum/İşlemler), filtrelerin **tek satırda** toplanması (arama, durum sekmeleri, medya, ikon, sıralama), etkin filtre **chip'leri + Temizle** (ayrı satır bloğu), sayfalama **20/50/100** (varsayılan 20, `categories_page_size`), URL senkronizasyonu (`q`/`durum`/`medya`/`ikon`/`sayfa`/`limit`/`sirala`/`gorunum`), kategori dialoguna **Kategori görseli** + **Kategori videosu**; `apps/api`'de `ServiceCategory.imageUrl`/`videoUrl` + `POST /upload/video` + idempotent migration; filtreleme/sayfalama **istemci tarafında** (`GET /categories` sözleşmesi değişmez) | **UYGULANDI** (2026-10-28) — tablo kolonları + tek satır filtre çubuğu + ayrı chip satırı + İşlemler kolonunda **Düzenle + Sil**; Media hücresi 40×40 görsel + **Video** badge'i; saf mantık `src/lib/categoriesQuery.ts` (**19 node testi**), `categories/page.tsx` **840 satır**; headless Chromium: **1280px'te çubuk tek satır**, **390px'te 4 satıra sarar**, her iki genişlikte **yatay taşma 0**, chip bloğu ayrı satırda. Kapılar: api **329 passing / 0 failing** (baseline 320 + 9 yeni), admin_panel typecheck + lint + `next build` temiz, `npm test` **84 node:test + 218 vitest** (düşüş yok). **Kalan risk:** seed'de `imageUrl`/`videoUrl` olmadığı için medya hücresi gerçek veriyle doğrulanmadı ve dev veritabanında `npm run migrate` çalıştırılmalı |
```

Kanıt komutu: `git diff --numstat -- plans/admin/INDEX.md` → **1 ekleme, 0 silme** (AP-009 satırı `HEAD`'de yok; satır bu oturumda eklendi).
