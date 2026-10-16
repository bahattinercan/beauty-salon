# Admin Panel — Dark Mode Sistemi (Detaylı Plan)

> Oluşturulma: 2026-02
> Kapsam: `apps/admin_panel/` (Next.js 16 · React 19 · Tailwind CSS 4.1.18)
> Durum: **UYGULANDI (F1–F7 tamam)** — bkz. §16 Uygulama Sonucu
> Referans uygulamalar: `apps/salon_app` (ThemeProvider + light/dark ThemeData hazır), `apps/customer_app`

---

## 1. Amaç ve Kapsam

### Amaç
Admin paneline **kalıcı (persistent), sistem tercihini destekleyen, flash'sız (FOUC yok)** ve **WCAG AA kontrastlı** bir dark mode kazandırmak. Light tema **piksel düzeyinde değişmemeli**.

### Kapsam içi
- `apps/admin_panel` içindeki tüm sayfalar: `/` (dashboard), `/salons`, `/users`, `/appointments`, `/reviews`, `/categories`, `/settings`, `/login`
- `Sidebar`, `AdminLayoutShell`, `DashboardProvider` (sadece stillendirme)
- Recharts grafikleri (eksen, grid, tooltip, bar/pie renkleri)
- Tema seçici (Light / Dark / System) + `localStorage` kalıcılığı
- Sistem teması değişimini canlı takip (`prefers-color-scheme`)

### Kapsam dışı
- Flutter app'ler (`salon_app`, `customer_app`) — kendi ThemeProvider'ları zaten var.
- Backend `/settings` API'si (tema kullanıcı-bazlı client tercihidir, sunucuya yazılmaz).
- Light temanın görsel yeniden tasarımı (regresyon riski nedeniyle dokunulmaz).

---

## 2. Mevcut Durum Analizi (ölçülmüş)

`apps/admin_panel/src` üzerinde yapılan tarama:

| Ölçüm | Değer |
|---|---|
| Renk sınıfı içeren dosya | 10 (`7 sayfa` + `login` + `Sidebar` + `AdminLayoutShell`) |
| Hardcoded renk utility kullanımı (`bg-white`, `text-gray-*`, `border-gray-*`, `*-red-*` vb.) | **351** |
| Tema-token kullanımı (`text-primary`, `text-text-primary`, `bg-secondary` …) | **506** |
| `dark:` varyantı kullanımı | **0** |
| Tema sağlayıcısı / `color-scheme` / `prefers-color-scheme` | **yok** |
| `next-themes` bağımlılığı | **yok** |
| `globals.css` | 25 satır; `@theme inline` ile 15 sabit hex token |

### Kritik envanter (migrasyon hedefleri)

| Sınıf | Adet | | Sınıf | Adet |
|---|---:|---|---|---:|
| `text-gray-700` | 40 | | `text-gray-500` | 19 |
| `border-gray-200` | 40 | | `hover:bg-gray-50` | 14 |
| `text-gray-900` | 30 | | `text-white` | 12 |
| `bg-white` | 30 | | `text-gray-400` | 11 |
| `text-gray-600` | 25 | | `bg-gray-50` (düz) | 9 |
| `border-gray-300` | 23 | | `border-gray-100` | 7 |
| `text-text-primary` | 24 | | `bg-gray-100` | 6 |
| `text-text-secondary` | 18 | | `shadow-sm` | 17 |

### Mevcut mimarinin iki sorunu (dark mode'u etkileyen)
1. **Anlamsal katman eksik.** Aynı `gray-*` tonu hem sayfa zemini hem hover hem badge olarak kullanılıyor; tek bir `dark:` eşlemesi bunları ayırt edemez.
2. **Renk adı çakışması.** `--color-primary` (marka #B76E79) → `text-primary`; `--color-text-primary` (ön plan) → `text-text-primary`. Aynı isim iki farklı şeyi anlatıyor. Dark mode'a geçerken bunu ayırmak zorunlu.

### Grafik durumu
`src/app/page.tsx` içinde renkler sabit: `<Bar fill="#B76E79">`, `<Pie fill="#8884d8">`, `CartesianGrid`/`Tooltip` default (açık tema) renkleri. Dark modda grafik zemini koyu kalır, eksen yazıları okunmaz → ayrı ele alınmalı (bkz. §9).

### Monorepo tutarlılığı
`apps/salon_app/lib/app/theme/app_theme.dart` içinde `darkTheme` ve `app_theme_colors.dart` içinde `AppThemeColors.dark` **zaten mevcut**:

```
background #0F0D17 · surface #1C1828 · surfaceVariant #2A2440
textSecondary #9E97B4 · textHint #5A5473 · divider #2A2440
```

`app_theme` persistence anahtarı `app_theme`, değerler `light|dark|system`.

> **Karar:** Admin panel salon_app paletini (mor tonlu) **kopyalamaz**; çünkü admin marka rengi gül/rose (`#B76E79`) iken salon_app mor/lavender (`#7C5CBF`). Yapıyı (token isimleri, kontrast hedefleri, `light|dark|system` sözleşmesi, `app_theme` anahtar adı) **aynen** alır, tonu rose'a uyarlar. Böylece iki uygulama aynı dil bilgisiyle konuşur, zemin tonu markaya uyar.

---

## 3. Mimari Karar

### Seçilen yaklaşım: **Token-first CSS variables + `dark` class stratejisi**

```
:root  (light)  →  semantic CSS değişkenleri
.dark  (class)  →  aynı değişkenlerin koyu değerleri
                  ↓  (var() indirection)
@theme inline   →  Tailwind utility'leri (bg-surface, text-fg, border-border …)
                  ↓
Sayfalar sadece semantic utility kullanır; `dark:` neredeyse hiç gerekmez.
```

**Neden bu?**
- 351 hardcoded kullanım için `dark:` eşlemesi yazmak yerine, **~20 benzersiz sınıf → 10 semantic token** eşlemesi yeterli.
- Yeni sayfa ekleyen geliştirici otomatik olarak iki temada da doğru görünür (doğru olanı yapmak kolay).
- `dark:` yalnızca badge/native-control gibi özel durumlarda kullanılır.

### Alternatifler ve neden reddedildi

| Alternatif | Neden değil |
|---|---|
| Her kullanıma `dark:` eklemek (~400 düzenleme) | Bakımı zor, yeni kodda sürekli unutulur, aynı `gray-*` farklı bağlamlarda farklı çözüm ister |
| `next-themes` ile başlamak | Token katmanı olmadan da 351 hardcoded rengi çözmez; ayrıca ek bağımlılık. Token katmanı şart, provider opsiyonel |
| Sadece `prefers-color-scheme` (class yok) | Kullanıcı seçimi (light/dark/system) imkânsız; ürün gereksinimi ile çelişir |
| Ayrı `dark` stylesheet / dark-only sınıf isimleri | İki kod tabanı = iki bakım yükü |

### Tailwind v4 kritik noktası
Tailwind v4'te `dark:` **varsayılan olarak `prefers-color-scheme` medya sorgusudur**. Class stratejisi için `globals.css`'te açıkça tanımlanmalıdır:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

Bu satır olmadan toggle **çalışmaz** — plandaki en sık yapılan hata budur.

---

## 4. Tasarım Tokenları

### 4.1 Semantic token seti (yeni)

| Token | Rol | Light | Dark | Kontrast (surface üzerinde) |
|---|---|---|---|---|
| `--color-background` | Sayfa zemini | `#FAFAFA` | `#131013` | — |
| `--color-surface` | Kart / panel / sidebar | `#FFFFFF` | `#1C181B` | — |
| `--color-surface-variant` | Hover, chip, avatar zemini | `#F5F5F5` | `#262023` | — |
| `--color-border` | Kart kenarı, ayraç | `#E5E7EB` | `#332B2F` | 1.28 |
| `--color-border-strong` | Input kenarı, vurgulu çerçeve | `#D1D5DB` | `#453A3F` | — |
| `--color-fg` | Ana metin | `#2D2D2D` | `#F0ECEE` | **15.00** ✓ |
| `--color-fg-muted` | İkincil metin | `#6B7280` | `#B0A6AB` | **7.43** ✓ |
| `--color-fg-subtle` | İpucu / ikon (dekoratif) | `#9CA3AF` | `#7C7276` | 3.78 ⚠ |
| `--color-primary` | Marka vurgu (metin/kenar/ikon) | `#B76E79` | `#D9959F` | **7.32** ✓ |
| `--color-primary-dark` | Gradient ucu | `#8B4D57` | `#A85F6B` | 3.77 |
| `--color-primary-light` | Açık vurgu | `#D4979F` | `#E8B4BB` | **9.76** ✓ |
| `--color-on-primary` | `bg-primary` üzerindeki metin/ikon | `#FFFFFF` | `#1C181B` | **7.32** ✓ (dark) |
| `--color-secondary` | Yumuşak marka zemini | `#F5E6E8` | `#2B2226` | — |
| `--color-accent` | Vurgu (altın) | `#D4A373` | `#E0B183` | ~9 ✓ |
| `--color-success` | Başarı | `#7CB69D` | `#7CCBA2` | **9.13** ✓ |
| `--color-error` | Hata | `#E57373` | `#F28B82` | **7.35** ✓ |
| `--color-warning` | Uyarı | `#FFB74D` | `#FDD663` | **12.52** ✓ |
| `--color-info` | Bilgi | `#64B5F6` | `#8AB4F8` | **8.33** ✓ |

> ⚠ `--color-fg-subtle`: light'ta 2.54, dark'ta 3.78. Bu token **yalnızca ikon/placeholder/ayraç yazısı** için; gövde metni için `fg-muted` kullanılmalı. Mevcut `text-gray-400/500` kullanımları bu kurala göre gözden geçirilecek.

### 4.2 `--color-on-primary` neden eklendi? (ölçülmüş a11y bulgusu)

| Kombinasyon | Kontrast | AA |
|---|---:|---|
| Light: `text-white` on `#B76E79` (**mevcut**) | 3.80 | ✗ (normal metin) |
| Dark: `text-white` on `#D9959F` (naif dark) | 2.40 | ✗ |
| Dark: `text-on-primary #1C181B` on `#D9959F` (**öneri**) | **7.32** | ✓ |

Yani `bg-primary` + `text-white` kombinasyonu **dark modda okunamaz**. Çözüm: `text-white` → `text-on-primary` (12 kullanım). Light'ta `on-primary = #FFFFFF` bırakılarak **görsel kimlik korunur** (mevcut 3.80 oranı da ayrıca §12'de "opsiyonel iyileştirme" olarak not edilmiştir).

### 4.3 Light değerleri = bugünkü değerler
Light sütunu mevcut `globals.css` ile birebir aynıdır (yalnız `fg-muted` `#757575` → `#6B7280`, `border` `gray-200` ile aynı, `surface-variant` `#F5F5F5`). Tek istisna `fg-muted`; kontrastı 4.83'e çıkarır (mevcut `#757575` = 4.61). Görsel fark ~algılanamaz.

---

## 5. `src/app/globals.css` — Hedef Dosya

```css
@import "tailwindcss";

/* Class tabanlı dark mode (Tailwind v4 default'u media-query'dir!) */
@custom-variant dark (&:where(.dark, .dark *));

/* ---------- Light (bugünkü değerler korunur) ---------- */
:root {
  --background: #FAFAFA;
  --surface: #FFFFFF;
  --surface-variant: #F5F5F5;
  --border: #E5E7EB;
  --border-strong: #D1D5DB;
  --fg: #2D2D2D;
  --fg-muted: #6B7280;
  --fg-subtle: #9CA3AF;

  --primary: #B76E79;
  --primary-dark: #8B4D57;
  --primary-light: #D4979F;
  --on-primary: #FFFFFF;
  --secondary: #F5E6E8;
  --accent: #D4A373;

  --success: #7CB69D;
  --error: #E57373;
  --warning: #FFB74D;
  --info: #64B5F6;

  /* grafik yardımcıları */
  --chart-grid: #E5E7EB;
  --chart-axis: #9CA3AF;
  --chart-tooltip-bg: #FFFFFF;
  --chart-tooltip-border: #E5E7EB;
  --chart-tooltip-fg: #2D2D2D;
}

/* ---------- Dark (marka uyumlu rose-nötr; .dark :root'tan SONRA gelmeli) ---------- */
.dark {
  --background: #131013;
  --surface: #1C181B;
  --surface-variant: #262023;
  --border: #332B2F;
  --border-strong: #453A3F;
  --fg: #F0ECEE;
  --fg-muted: #B0A6AB;
  --fg-subtle: #7C7276;

  --primary: #D9959F;
  --primary-dark: #A85F6B;
  --primary-light: #E8B4BB;
  --on-primary: #1C181B;   /* açık rose üzerinde beyaz okunmaz → koyu metin */
  --secondary: #2B2226;
  --accent: #E0B183;

  --success: #7CCBA2;
  --error: #F28B82;
  --warning: #FDD663;
  --info: #8AB4F8;

  --chart-grid: #2F282C;
  --chart-axis: #8D8388;
  --chart-tooltip-bg: #262023;
  --chart-tooltip-border: #3A3135;
  --chart-tooltip-fg: #F0ECEE;
}

/* ---------- Tailwind'e tanıt (inline => var() referansı korunur) ---------- */
@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-variant: var(--surface-variant);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);

  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);
  --color-primary-light: var(--primary-light);
  --color-on-primary: var(--on-primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);

  --color-success: var(--success);
  --color-error: var(--error);
  --color-warning: var(--warning);
  --color-info: var(--info);
}

html { color-scheme: light; }
html.dark { color-scheme: dark; }

body {
  background: var(--color-background);
  color: var(--color-fg);
  font-family: 'Inter', 'Poppins', sans-serif;
  transition: background-color .15s ease, color .15s ease;
}

/* ---------- Tekrar eden kombinasyonlar (badge / input) ---------- */
@utility badge-base {
  @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium;
}
@utility badge-success {
  @apply badge-base bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300;
}
@utility badge-error {
  @apply badge-base bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300;
}
@utility badge-warning {
  @apply badge-base bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300;
}
@utility badge-info {
  @apply badge-base bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300;
}
@utility badge-neutral {
  @apply badge-base bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300;
}
@utility badge-purple {
  @apply badge-base bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300;
}

@utility card {
  @apply rounded-lg border border-border bg-surface shadow-sm dark:shadow-none;
}
@utility field {
  @apply w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg
         placeholder:text-fg-subtle focus:border-primary focus:outline-none
         focus:ring-2 focus:ring-primary/20;
}
```

**Badge kontrastları (ölçülmüş, dark `bg-*-500/15` + `text-*-300`):**

| Badge | Zemin (blend) | Metin | Kontrast |
|---|---|---|---|
| success | `#19342a` | `#86efac` | 9.55 ✓ |
| error | `#372026` | `#fca5a5` | 7.92 ✓ |
| warning | `#382e1e` | `#fcd34d` | 9.23 ✓ |
| info | `#1c2a41` | `#93c5fd` | 7.99 ✓ |
| neutral | `#24272f` | `#d1d5db` | 10.13 ✓ |
| purple | `#2d2341` | `#d8b4fe` | 8.32 ✓ |

> **Not:** `@utility` içinde `@apply` ile başka bir `@utility`'yi çağırmak Tailwind 4'te çalışır; sorun yaşanırsa `badge-base` içeriği her utility'ye tekrarlanır (fallback).

---

## 6. Tema Sağlayıcı, FOUC Önleme ve Toggle

### 6.1 Neden `next-themes` değil?
Gereksinim net ve küçük (3 durum, localStorage, sistem takibi). Sözleşmeyi `salon_app`'teki `ThemeNotifier` ile **birebir aynı** tutacağız (`light|dark|system`, anahtar `app_theme`). ~70 satırlık, bağımlılıksız, SSR-güvenli bir provider yeterlidir. `next-themes` eklenirse davranış aynı olur; karar **bağımlılık eklememek** yönünde.

### 6.2 `src/providers/ThemeProvider.tsx` (yeni)

```tsx
'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';
type Ctx = { theme: Theme; resolved: Resolved; setTheme: (t: Theme) => void; mounted: boolean };

const ThemeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'app_theme';           // salon_app ile aynı anahtar

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') setThemeState(stored);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    setMounted(true);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved: Resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* private mode */ }
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme, mounted }), [theme, resolved, setTheme, mounted]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

### 6.3 FOUC (beyaz flash) önleme — `src/app/layout.tsx`

İlk boyamadan **önce** `<html>`'e sınıfı basan inline script:

```tsx
<html lang="tr" suppressHydrationWarning>
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{
          var t=localStorage.getItem('app_theme')||'system';
          var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
          var r=document.documentElement;
          r.classList.toggle('dark',d);
          r.style.colorScheme=d?'dark':'light';
        }catch(e){}})();`,
      }}
    />
  </head>
  <body className="antialiased">
    <ThemeProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </ThemeProvider>
  </body>
</html>
```

`suppressHydrationWarning` **zorunlu**: script sunucu HTML'inde olmayan bir sınıf eklediği için React uyarı verir.

### 6.4 `src/components/ThemeToggle.tsx` (yeni) — 3 durumlu segment

- `Sun` / `Moon` / `Monitor` (lucide-react) ikonları, `role="radiogroup"`.
- Aktif durumu **yalnız `mounted` olduktan sonra** göster (SSR/hydration uyuşmazlığı olmasın).
- `aria-label="Tema"`, her butonda `title` + `aria-checked`.
- Yerleşim: **`Sidebar` footer'ında, kullanıcı bloğunun üstünde** (mobilde de erişilebilir).
- Opsiyonel: `/settings` sayfasına "Görünüm" bölümü — aynı `useTheme()` hook'unu kullanır, **API'ye kaydetmez** (client tercih).

### 6.5 Login sayfası
`/login` `AdminLayoutShell` içinde `bg-gray-50` ile ayrı render ediliyor; token migrasyonu sonrası tema otomatik uygulanır. Login'de ayrıca köşeye küçük bir toggle konabilir (opsiyonel).

---

## 7. Renk Migrasyon Haritası

`src/` içinde sırayla uygulanır (sıra önemli: önce prefixli, sonra düz).

| Mevcut | Yeni | Adet | Not |
|---|---|---:|---|
| `bg-white` | `bg-surface` | 30 | kart, sidebar, panel |
| `bg-gray-50` (düz) | `bg-background` | 9 | sayfa zemini (`min-h-screen bg-gray-50`) |
| `hover:bg-gray-50` | `hover:bg-surface-variant` | 14 | |
| `bg-gray-100` | `bg-surface-variant` | 6 | chip/avatar |
| `hover:bg-gray-100` | `hover:bg-surface-variant` | 3 | |
| `bg-gray-300` | `bg-border-strong` | 1 | |
| `border-gray-100` | `border-border` | 7 | |
| `border-gray-200` | `border-border` | 40 | |
| `border-gray-300` | `border-border-strong` | 23 | input/buton |
| `divide-gray-200` | `divide-border` | 1 | |
| `text-gray-900` `text-gray-800` | `text-fg` | 35 | |
| `text-gray-700` `text-gray-600` | `text-fg-muted` | 65 | |
| `text-gray-500` `text-gray-400` `text-gray-300` | `text-fg-subtle` | 32 | ⚠ gövde metni ise `fg-muted` yap |
| `placeholder-gray-400` | `placeholder:text-fg-subtle` | 4 | |
| `text-text-primary` | `text-fg` | 24 | isim sadeleştirme |
| `text-text-secondary` | `text-fg-muted` | 18 | |
| `text-text-hint` | `text-fg-subtle` | 1 | |
| `text-white` (primary zemin üzerinde) | `text-on-primary` | 12 | logo/avatar hariç |
| `ring-offset-2` | `ring-offset-2 ring-offset-surface` | 1 | focus halkası zemini |
| `shadow-sm` | `shadow-sm dark:shadow-none` | 17 | dark'ta gölge görünmez; `card` utility hâlleder |
| `bg-secondary` | `bg-secondary` | 7 | token zaten var, dark değeri eklendi |
| `text-yellow-400 fill-yellow-400` (yıldız) | `text-amber-400 fill-amber-400 dark:text-amber-300 dark:fill-amber-300` | 2 | |
| `bg-red-600 text-white hover:bg-red-700` | `bg-error/90 text-white hover:bg-error` | 2 | hata butonu |
| `bg-red-50 border-red-200 text-red-800` | `dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300` | 8 | hata kutusu |
| `bg-green-50 / bg-amber-50 / bg-orange-50` | `dark:bg-*-500/10` | 3 | |
| `border-green-200 / border-orange-200` | `dark:border-*-500/30` | 2 | |
| `bg-green-500 / bg-red-500` (dot) | `dark:bg-green-400 / dark:bg-red-400` | 2 | |
| `bg-purple-100 text-purple-800` | `badge-purple` | 1 | |
| `bg-blue-100 text-blue-800` | `badge-info` | 3 | |
| `bg-green-100 text-green-800` | `badge-success` | 2 | |
| `bg-red-100 text-red-800` | `badge-error` | 2 | |
| `bg-yellow-100` / `bg-amber-100` | `badge-warning` | 2 | |
| `bg-gray-100 text-gray-800` | `badge-neutral` | 3 | |
| `bg-gradient-to-br from-primary to-primary-dark` + `text-white` | **dark'ta gradient sabit kalsın:** `dark:from-[#B76E79] dark:to-[#8B4D57]` | 2 | beyaz ikon kontrastı için |

**Bağlama duyarlı tek karar:** `bg-gray-50` — sayfa sarmalayıcıda `bg-background`, kart içi chip'te `bg-surface-variant`. Codemod `bg-background` yazar; 9 kullanım elle gözden geçirilir.

---

## 8. Codemod (tek seferlik, `scripts/codemod-theme.mjs`)

Amaç: 351 + 43 kullanımı otomatik taşımak, sonra elle doğrulamak. `globals.css` **hariç**.

```js
// scripts/codemod-theme.mjs  —  node scripts/codemod-theme.mjs (dry-run) | --write
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');

// SIRA ÖNEMLİ: daha spesifik (hover:) önce
const MAP = [
  ['hover:bg-gray-50', 'hover:bg-surface-variant'],
  ['hover:bg-gray-100', 'hover:bg-surface-variant'],
  ['bg-gray-50', 'bg-background'],
  ['bg-gray-100', 'bg-surface-variant'],
  ['bg-gray-300', 'bg-border-strong'],
  ['bg-white', 'bg-surface'],
  ['border-gray-100', 'border-border'],
  ['border-gray-200', 'border-border'],
  ['border-gray-300', 'border-border-strong'],
  ['divide-gray-200', 'divide-border'],
  ['placeholder-gray-400', 'placeholder:text-fg-subtle'],
  ['text-gray-900', 'text-fg'],
  ['text-gray-800', 'text-fg'],
  ['text-gray-700', 'text-fg-muted'],
  ['text-gray-600', 'text-fg-muted'],
  ['text-gray-500', 'text-fg-subtle'],
  ['text-gray-400', 'text-fg-subtle'],
  ['text-gray-300', 'text-fg-subtle'],
  ['text-text-primary', 'text-fg'],
  ['text-text-secondary', 'text-fg-muted'],
  ['text-text-hint', 'text-fg-subtle'],
];

// Sınıf token'ı sınırı: önünde `:` `"` boşluk/baş, sonunda boşluk/tırnak/boşluk
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

let files = 0, changes = 0;
for (const file of walk('src')) {
  if (file.endsWith('globals.css')) continue;
  let src = readFileSync(file, 'utf8');
  const before = src;
  for (const [from, to] of MAP) {
    const re = new RegExp(`(?<![\\w:-])${esc(from)}(?![\\w-])`, 'g');
    src = src.replace(re, to);
  }
  const n = before === src ? 0 : 1;
  if (before !== src) { files++; changes++; }
  if (WRITE && before !== src) writeFileSync(file, src);
}
console.log(`${WRITE ? 'WRITE' : 'DRY-RUN'}: ${files} dosya etkilendi`);
```

Kullanım: `node scripts/codemod-theme.mjs` → diff gözden geçir → `--write` → `git diff` tekrar gözden geçir. Codemod **sonrası silinir** (repo'da bırakılmaz).

**Codemod sonrası elle yapılacaklar (liste §7'de):** badge'ler, `text-white`→`text-on-primary`, hata kutuları, yıldızlar, gradient, `bg-gray-50` bağlam kontrolü.

---

## 9. Grafikler (Recharts) Tema Entegrasyonu

Recharts SVG üretir; `fill="var(--x)"` presentation attribute olarak her tarayıcıda güvenilir değildir. Bu yüzden çözülen temayı JS'te okuyup hex geçiyoruz.

**`src/lib/chartTheme.ts` (yeni)**

```ts
'use client';
import { useTheme } from '@/providers/ThemeProvider';

export function useChartTheme() {
  const { resolved } = useTheme();
  const dark = resolved === 'dark';
  const v = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // resolved değiştiğinde yeniden hesaplanır
  void resolved;
  return {
    grid: dark ? '#2F282C' : '#E5E7EB',
    axis: dark ? '#8D8388' : '#9CA3AF',
    tooltip: {
      contentStyle: {
        background: dark ? '#262023' : '#FFFFFF',
        border: `1px solid ${dark ? '#3A3135' : '#E5E7EB'}`,
        borderRadius: 8,
        color: dark ? '#F0ECEE' : '#2D2D2D',
      },
      labelStyle: { color: dark ? '#F0ECEE' : '#2D2D2D' },
      itemStyle: { color: dark ? '#B0A6AB' : '#6B7280' },
    },
    bar: dark ? '#D9959F' : '#B76E79',
    pieStroke: dark ? '#1C181B' : '#FFFFFF',
    primaryCssVar: v('--primary'),
  };
}
```

**`app/page.tsx` düzenlemeleri**

| Bileşen | Değişiklik |
|---|---|
| `<CartesianGrid>` | `stroke={t.grid}` ekle (default `#ccc` dark'ta parlar) |
| `<XAxis>` `<YAxis>` | `stroke={t.axis}` + `tick={{ fill: t.axis, fontSize: 12 }}` |
| `<Tooltip>` | `{...t.tooltip}` spread |
| `<Bar>` | `fill={t.bar}` (sabit `#B76E79` kaldır) |
| `<Pie>` | `stroke={t.pieStroke}` `strokeWidth={2}` (dilim ayrımı) |
| `<Cell fill={entry.color}>` | **Backend'den gelen hex renkler.** Dark'ta kontrastı düşük olabilir → `/admin/dashboard` `appointmentsByStatus[].color` değerleri denetlenecek; gerekirse dark'ta dilim kenarına beyaz çizgi (`stroke`) eklenir. Bu bir **API veri bulgusu**; plan §11'de doğrulama adımı var. |

---

## 10. Dosya Bazlı Değişiklik Listesi

| # | Dosya | İş | Yeni? |
|---|---|---|---|
| 1 | `src/app/globals.css` | Token katmanı, `@custom-variant`, `@utility` seti | düzenle |
| 2 | `src/app/layout.tsx` | Inline FOUC script, `suppressHydrationWarning`, `ThemeProvider` sarmalama | düzenle |
| 3 | `src/providers/ThemeProvider.tsx` | 3 durumlu tema context'i | **yeni** |
| 4 | `src/components/ThemeToggle.tsx` | Segment kontrol | **yeni** |
| 5 | `src/lib/chartTheme.ts` | Recharts tema hook'u | **yeni** |
| 6 | `src/components/Sidebar.tsx` | `ThemeToggle` yerleşimi + renk migrasyonu + `text-on-primary` | düzenle |
| 7 | `src/components/AdminLayoutShell.tsx` | `bg-gray-50` → `bg-background` (2 yer) | düzenle |
| 8 | `src/app/page.tsx` | Migrasyon + grafik teması | düzenle (54 renk satırı) |
| 9 | `src/app/salons/page.tsx` | Migrasyon (+ badge'ler) | düzenle (63 renk satırı) |
| 10 | `src/app/users/page.tsx` | Migrasyon + `getRoleColor` badge'lere | düzenle (44) |
| 11 | `src/app/appointments/page.tsx` | Migrasyon + durum badge'leri | düzenle (44) |
| 12 | `src/app/settings/page.tsx` | Migrasyon (+ opsiyonel "Görünüm" bölümü) | düzenle (45) |
| 13 | `src/app/categories/page.tsx` | Migrasyon | düzenle (38) |
| 14 | `src/app/reviews/page.tsx` | Migrasyon (yıldız renkleri) | düzenle (31) |
| 15 | `src/app/login/page.tsx` | Migrasyon | düzenle (14) |
| 16 | `scripts/codemod-theme.mjs` | Tek seferlik codemod (sonra silinir) | **yeni (geçici)** |
| 17 | `docs/ADMIN-PANEL.md` | Dark mode bölümü ekle | düzenle |

Dokunulmayan: `src/lib/api.ts`, `next.config.ts`, `postcss.config.mjs`, `package.json` (yeni bağımlılık **yok**).

---

## 11. Doğrulama Planı

### 11.1 Statik
```bash
cd apps/admin_panel
npx tsc --noEmit      # tip hatası yok
npm run lint          # eslint temiz
npm run build         # production build geçer
```

### 11.2 Migrasyon tamamlanma kontrolü (grep guard) — **0 sonuç vermeli**
```bash
cd apps/admin_panel/src
grep -rn "bg-white\|text-gray-[0-9]\|border-gray-[0-9]\|divide-gray-\|placeholder-gray-\|text-text-" . || echo "TEMİZ"
grep -rn "text-secondary\b" . || echo "TEMİZ"     # muhtemel hatalı kullanım
```

### 11.3 Çalışma zamanı — mevcut CDP harness'ı ile (`screenshots/_harness`)
Projede zaten sıfır-bağımlılık CDP sürücüsü var (`cdp.js`, `drive.js`) ve admin plan scriptleri (`plan-admin-sidebar.js`) `http://127.0.0.1:3001` Next dev sunucusunu kullanıyor. Aynı düzenle yeni bir `screenshots/_harness/plan-admin-darkmode.js` yazılır:

Adımlar (her tema için):
1. `goto /login` → `localStorage.setItem('app_theme','dark')` seed
2. `goto /` → **flash ölçümü**: `performance.getEntriesByType('paint')` sonrası ilk karede `document.documentElement.classList.contains('dark')` doğru olmalı; ekran görüntüsünde beyaz kare arama
3. 7 sayfa + login için `shot out: screenshots/admin_panel/dark_<sayfa>.png`
4. `eval` ile ölçüm: her sayfada `getComputedStyle(document.body).backgroundColor`, `document.documentElement.className`, `style.colorScheme`
5. `diag` ile konsol/network hatalarını topla (React hydration uyarısı **olmamalı**)
6. Aynı adımları `app_theme='light'` ile tekrarla → `light_<sayfa>.png`
7. `app_theme='system'` + CDP `Emulation.setEmulatedMedia({features:[{name:'prefers-color-scheme',value:'dark'}]})` → koyu gelmeli (canlı takip testi)

### 11.4 Kontrast denetimi
Her ekran görüntüsü için: gövde metni ≥ 4.5:1, büyük başlık/ikon ≥ 3:1. Zaten §4 tablosunda hesaplandı; ekranda **gerçekten uygulanan** renkler `getComputedStyle` ile örneklenip doğrulanır (özellikle sidebar aktif satır `bg-primary` + `text-on-primary`, badge'ler, grafik eksenleri).

### 11.5 Fonksiyonel
- [ ] Toggle: Light → Dark → System döngüsü ve ikonun doğru aktif görünmesi
- [ ] Sayfa yenilemede tercih korunur (`localStorage.app_theme`)
- [ ] Sekme kopyasında (yeni tab) tercih okunur
- [ ] Sistem teması OS'ten değiştirilince `System` modunda canlı güncellenir
- [ ] `color-scheme` doğru → native scrollbar/dropdown/date-input koyu
- [ ] SSR HTML'inde `dark` sınıfı yok (script ekler) → hydration uyarısı yok
- [ ] Light tema **regresyon yok** (önce/sonra screenshot diff)

### 11.6 Kayıt
Bulgular `docs/` veya commit mesajına yazılır; `screenshots/admin_panel/dark_*.png` referans olarak saklanır.

---

## 12. Riskler ve Tuzaklar

| # | Risk | Etki | Önlem |
|---|---|---|---|
| R1 | `@custom-variant dark` unutulursa toggle çalışmaz (sadece OS takip edilir) | Yüksek | §5'teki satır zorunlu; toggle testi §11.5 |
| R2 | `.dark` bloğu `:root`'tan **önce** yazılırsa aynı özgüllükte kaybeder | Yüksek | `.dark` her zaman `:root`'tan sonra |
| R3 | `@theme` (inline'sız) kullanılırsa değerler build'de sabitlenir, `var()` çalışmaz | Yüksek | Mutlaka `@theme inline` + `var()` |
| R4 | Hydration mismatch (`<html className>`) | Orta | `suppressHydrationWarning` + class'ı yalnız efekt/script uygular |
| R5 | Dark'ta `text-white` on `bg-primary` okunmaz (2.40:1) | Orta | `--color-on-primary` + 12 kullanımın taşınması (§4.2) |
| R6 | `bg-gray-50` bağlam ayrımı (zemin vs chip) | Orta | Codemod sonrası 9 kullanım elle kontrol |
| R7 | Recharts default grid/tooltip açık kalır | Orta | §9 hook'u; `stroke`/`contentStyle` zorunlu |
| R8 | Backend'den gelen `appointmentsByStatus[].color` dark'ta düşük kontrast | Düşük-Orta | Pie dilimlerine `stroke`; gerekirse dark'ta renk haritası |
| R9 | `shadow-sm` dark'ta görünmez/kirli | Düşük | `card` utility `dark:shadow-none`; kenar kontrastı yeterli |
| R10 | `fg-subtle` gövde metni olarak kullanılırsa AA altı (2.54 / 3.78) | Orta | Kod incelemesi: gövde metni `fg-muted` |
| R11 | Light temada görsel regresyon | Orta | Önce/sonra screenshot diff (§11.3) |
| R12 | Sistem teması `matchMedia` dinleyicisi sızıntısı | Düşük | `useEffect` cleanup (§6.2) |
| R13 | Private/incognito'da `localStorage` throw | Düşük | `try/catch` (§6.2) |
| R14 | `dark:` çok kullanılırsa token avantajı kaybolur | Düşük | Kural: önce token; `dark:` yalnız badge/native/gradient |

### Bilinen mevcut a11y borcu (bu iş kapsamı dışı, not)
Light temada `#B76E79` + beyaz = **3.80:1** → AA altı. İstenirse `--primary` solid dolgu tonu `#A6616C`'ye çekilerek 4.5+ sağlanır; ancak marka görünümü değişir. Light'ta **dokunulmadı**, dark'ta `on-primary` ile çözüldü.

---

## 13. İş Kırılımı ve Efor

| Faz | İş | Çıktı | Tahmini |
|---|---|---|---|
| **F1** | Token katmanı: `globals.css` (§5) | Light birebir aynı görünür, dark değişkenleri hazır | 0.5 sa |
| **F2** | ThemeProvider + FOUC script + ThemeToggle (§6) | Toggle çalışır, tercih kalıcı, flash yok | 1.5 sa |
| **F3** | Codemod + elle düzeltmeler (§7, §8) | 351+43 kullanım semantic token'a taşındı | 2.5 sa |
| **F4** | Badge/input/gradient/özel durumlar (§5, §7) | Tüm durum renkleri iki temada okunur | 1.5 sa |
| **F5** | Grafik teması (§9) | Dashboard grafikleri iki temada okunur | 1 sa |
| **F6** | Doğrulama + screenshot'lar (§11) | Kanıt görüntüler + yeşil build/lint/tsc | 1.5 sa |
| **F7** | Opsiyonel: Settings "Görünüm" bölümü, login toggle | İkinci/üçüncü erişim noktası | 0.5 sa |
| | **Toplam** | | **~9 saat (1–1.5 iş günü)** |

Bağımlılık sırası: F1 → F2 → F3 → F4 → F5 → F6 (F7 bağımsız).

---

## 14. Kabul Kriterleri

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` hatasız
- [ ] §11.2 grep guard temiz (hardcoded `gray-*`/`white`/`text-text-*` kalmadı)
- [ ] Light tema önce/sonra görsel olarak aynı (diff ile kanıtlı)
- [ ] Dark temada 8 sayfa (7 panel + login) okunur; gövde metni ≥ 4.5:1
- [ ] `bg-primary` üzerindeki metin/ikon dark'ta ≥ 4.5:1
- [ ] Toggle 3 durumlu, tercih `localStorage.app_theme` ile kalıcı
- [ ] Sayfa yüklemesinde dark flash yok; hydration uyarısı yok
- [ ] `System` modunda OS teması değişimi canlı yansır
- [ ] Native kontroller (`color-scheme`) koyu
- [ ] Grafik eksen/tooltip/grid dark'ta okunur
- [ ] Yeni bağımlılık eklenmedi

---

## 16. Uygulama Sonucu

Tüm fazlar (F1–F7) uygulandı ve çalışma zamanında doğrulandı.

### Faz durumu

| Faz | İş | Durum |
|---|---|---|
| F1 | Token katmanı (`globals.css`) | ✅ |
| F2 | ThemeProvider + FOUC script + ThemeToggle | ✅ |
| F3 | Codemod (310 dönüşüm, 10 dosya) + elle düzeltmeler | ✅ Codemod sonrası silindi |
| F4 | Badge/input/gradient/özel durumlar | ✅ |
| F5 | Recharts tema entegrasyonu | ✅ |
| F6 | Doğrulama + screenshot'lar | ✅ |
| F7 | Ayarlar › Görünüm + login toggle | ✅ |

### Plandan sapmalar (gerekçeli)

| Konu | Planda | Uygulananda | Neden |
|---|---|---|---|
| Tema provider | `useState` + `useEffect` taslağı | `useSyncExternalStore` | React 19 `react-hooks/set-state-in-effect` lint kuralı; ayrıca sekme-arası senkronizasyon bedava geldi |
| Badge'ler | Önce inline `dark:`, sonra utility | `<span className="badge-*">` (merkezî) | Aynı görsel sonuç + tekrar eden `dark:` stringleri kalktı |
| `card` utility | Tanımlanacaktı | Kaldırıldı | Kullanılmadı; ölü soyutlama bırakılmadı |
| Pie `fill="#8884d8"` | Değişmeyecekti | Kaldırıldı | Her `<Cell>` kendi fill'ini veriyor; kullanılmayan ham hex |
| Settings inline `--tw-ring-color` | Belirtilmemişti | `focus:ring-primary/20` ile değiştirildi | Hardcoded `rgb(183,110,121)` dark'ta temayı dinlemiyordu |
| ToggleSwitch inline `backgroundColor` | Belirtilmemişti | `bg-success` / `bg-border-strong` token'larına taşındı | Aynı sebep; inline hex temayı bloke ediyordu |

### Ölçülen sonuçlar (headless Chrome + CDP, `screenshots/_harness/plan-admin-darkmode.js`)

**FOUC (400 ms'de, React hydrate olmadan):** `htmlClass: "dark"`, `colorScheme: "dark"` → inline script ilk boyamadan önce çalışıyor. ✅

**Kontrast (WCAG AA ≥ 4.5 gövde metni):**

| Öğe | Dark | Light |
|---|---|---|
| Sayfa başlığı (`h1`) | 16.14 | 13.19 |
| Sidebar aktif satır (`bg-primary-solid` + `on-primary`) | **7.32** | **4.62** ✓ |
| Dolgulu buton (`bg-primary-solid`) | 7.32 | 4.62 |
| Sidebar pasif satır | 7.43 | 4.83 |
| Gövde paragrafı | 8.00 | 4.63 |
| Tablo hücresi | 15.00 | — |
| Tablo başlığı | 7.43 | — |
| Badge — Salon Sahibi | 8.42 | — |
| Badge — Tamamlandı | 9.87 | — |
| Satır aksiyon (Tamamla) | 7.55 | — |
| `fg-subtle` (ipucu/ikon) | 3.78 | — |

**Fonksiyonel:**

| Test | Sonuç |
|---|---|
| Gerçek toggle tıklaması (dark → light) | ✅ `htmlClass: ""`, `theme: "light"` |
| `system` + emüle edilen OS teması dark↔light | ✅ canlı geçiş |
| Reload sonrası tercih kalıcılığı | ✅ `theme: "dark"`, `htmlClass: "dark"` |
| Konsol/hydration hatası, sayfa hatası | ✅ `{errors:[], warns:[], net:[], pageErrors:[]}` |
| `tsc --noEmit` / `eslint` / `next build` | ✅ üçü de temiz |

**Ekran görüntüleri:** `screenshots/admin_panel/dark_{login,dashboard,salons,users,appointments,reviews,categories,settings}.png` ve `light_{dashboard,settings}.png`.

### Bilinen sınırlar

- `--background` (#FAFAFA) ile `--surface` (#FFFFFF) light'ta yalnızca 1.04:1; kart ayrımı `border` ile sağlanıyor (mevcut tasarım).
- Backend'den gelen `appointmentsByStatus[].color` light-tema hex'leri (`#64B5F6`, `#FFB74D`) — **ölçüldü, kusur değil**: dark zeminde (#1C181B) 7.56–10.15:1. API'nin `status` enum'unu payload'a koymaması nedeniyle frontend renk sahipliğini alamıyor; ileride iki temalı palet istenirse önce API `status` alanı eklemeli.
- Değerlendirmede Next.js **dev-tools rozeti** sidebar logosunun üzerine biniyor (dev-only; production build'de yok).

---

## 17. Düzeltme Turu — Borç Kapatma

§16'da işaretlenen iki borç için ayrı bir tur yapıldı.

### Borç 1 — Light temada dolgulu yüzey kontrastı (GERÇEK KUSUR, DÜZELTİLDİ)

**Önce:** `bg-primary` (#B76E79) + beyaz metin = **3.80:1** → AA normal metin altı.
Sorun yalnızca *dolgulu* yüzeylerdeydi (`text-sm` buton etiketleri, aktif menü satırı);
`text-primary` accent olarak büyük başlık/ikonlarda 3:1 eşiğini zaten geçiyordu.

**Çözüm:** marka accent'ı (`--primary`) aynen korundu; dolgulu yüzeyler için ayrı token eklendi.

| Token | Light | Dark | Üzerine gelen metinle |
|---|---|---|---|
| `--primary-solid` | `#A6616C` | `#D9959F` | light **4.62:1** · dark **7.32:1** |
| `--primary-solid-hover` | `#8B4D57` | `#E8B4BB` | light 6.37:1 · dark 9.76:1 |

`bg-primary` → `bg-primary-solid` taşıması **8 yerde** yapıldı (Sidebar aktif satır, Kategori Ekle,
form submit, Giriş Yap, Kaydet, 2 avatar, aktif sayfa düğmesi) + `border-primary` → `border-primary-solid`.
`bg-primary/10` gibi **saydam accent zeminleri bilinçli olarak dokunulmadı**.

**Doğrulama (runtime ölçümü):**

| Öğe | Light önce | Light sonra | Dark |
|---|---|---|---|
| Sidebar aktif satır | 3.80 ✗ | **4.62** ✓ | 7.32 ✓ |
| Ayarları Kaydet butonu | 3.80 ✗ | **4.62** ✓ | 7.32 ✓ |
| Giriş Yap butonu (login) | 3.80 ✗ | **4.62** ✓ | 7.32 ✓ |
| Kategori Ekle butonu | 3.80 ✗ | **4.62** ✓ | 7.32 ✓ |

Görsel etki: yalnızca dolgulu butonlar/aktif satır bir ton koyulaştı (`#B76E79` → `#A6616C`);
metin, ikon, kenar ve `bg-primary/10` zeminleri değişmedi.

### Borç 2 — Backend grafik renkleri (KUSUR DEĞİL, ÖLÇÜMLE KAPATILDI)

Endişe, API'nin döndürdüğü `appointmentsByStatus[].color` değerlerinin dark'ta okunmamasıydı.
Ölçüm aksini gösterdi:

| Renk | Dark zemin #1C181B | Light zemin #FFFFFF |
|---|---|---|
| `#64B5F6` (Tamamlandı) | **7.93** | 2.21 |
| `#FFB74D` (Beklemede) | **10.15** | 1.73 |
| `#E57373` (İptal) | 5.88 | 2.99 |
| `#7CB69D` (Onaylandı) | 7.56 | 2.32 |

Yani **dark modda sorun yok** (hepsi 3:1 grafik nesnesi eşiğinin çok üstünde). Zayıflık
light temada ve bu işin kapsamı dışında. Kod değişikliği yapılmadı; API'ye `status` enum'u
eklenmeden frontend renk sahipliğini alamaz (renk çoğaltması olurdu).

### Düzeltme turu doğrulaması

- `npx tsc --noEmit` · `npm run lint` · `npm run build` → üçü temiz
- Üretilen CSS'te `bg-primary-solid` / `border-primary-solid` → `var(--primary-solid)`, `hover:bg-primary-solid-hover` → `var(--primary-solid-hover)`
- Runtime: 4 sayfa + login, light ve dark → yukarıdaki tablo
- Konsol: `{errors:[], warns:[], net:[], pageErrors:[]}`
- Ekran görüntüleri yenilendi; `light_login.png` eklendi

---

## 15. Geri Alma (Rollback)

Tüm değişiklik **tek PR / tek commit serisi**. Geri alma: `git revert`. Risk düşük çünkü:
- Light değerleri aynı hex'ler; token eklemek kırar değil, sadeleştirir.
- Davranış feature-flag gerektirmez; provider kaldırılırsa sayfalar light'ta aynen çalışır (script yoksa `<html>`'de `dark` sınıfı da olmaz).
- Codemod geçici olduğu için repo'da artık iz bırakmaz (geçmişte kalır).
