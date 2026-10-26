# 🏨 Admin Panel — Detaylı Doküman

> Oluşturulma: 2026-01  
> Kapsam: `apps/admin_panel/` (Next.js)

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Proje Yapısı](#proje-yapısı)
4. [Routing](#routing)
5. [Layout](#layout)
6. [Admin Endpoint'ler](#admin-endpointler)

---

## Proje Özeti

Admin Panel, salon sahibinin salonunu yönetmek için kullanılır.

---

## Teknoloji Yığını

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| Framework | Next.js 16.1.6 | |
| UI | Tailwind CSS 4 | |
| Chart | recharts | |
| Icons | lucide-react | |
| Language | TypeScript 5 | |

---

## Proje Yapısı

```
apps/admin_panel/
├── .next/                    # Next.js build output
├── public/                    # Static files
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with Sidebar
│   │   ├── globals.css        # Global styles
│   │   ├── page.tsx           # Main page
│   │   ├── appointments/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── favorites/page.tsx
│   │   ├── settings/page.tsx
│   │   └── users/page.tsx
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── providers/
│   │   └── DashboardProvider.tsx
│   └── ...
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Routing

```
/login                          (public, no scaffold)
/register                       (public, no scaffold)
ShellRoute (SalonMainScaffold)
  /dashboard                    → DashboardScreen
  /salons                       → SalonsScreen
  /appointments                 → AppointmentsScreen
  /users                        → UsersScreen
  /settings                     → SettingsScreen
  /reviews                      → ReviewsScreen
```

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Beauty Salon Admin Panel                     │
├──────────────────────────────────────────────────────────────────────┤
│  Sidebar (Sidebar)                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  Main Content                                                   ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tema (Dark Mode)

Admin panel **light / dark / system** olmak üzere üç durumlu tema destekler.

### Mimari

```
:root            → light CSS değişkenleri      (src/app/globals.css)
.dark            → dark CSS değişkenleri       (aynı dosya, :root'tan SONRA)
@theme inline    → Tailwind utility'leri       (bg-surface, text-fg, border-border …)
```

Sayfalar **semantic token** kullanır; tema `dark:` yazmadan otomatik döner.

| Token | Light | Dark |
|---|---|---|
| `background` | `#FAFAFA` | `#131013` |
| `surface` | `#FFFFFF` | `#1C181B` |
| `surface-variant` | `#F5F5F5` | `#262023` |
| `border` | `#E5E7EB` | `#332B2F` |
| `fg` | `#2D2D2D` | `#F0ECEE` |
| `fg-muted` | `#6B7280` | `#B0A6AB` |
| `fg-subtle` | `#9CA3AF` | `#7C7276` |
| `primary` | `#B76E79` | `#D9959F` |
| `on-primary` | `#FFFFFF` | `#1C181B` |
| `secondary` | `#F5E6E8` | `#2B2226` |
| `success` / `error` / `warning` / `info` | `#7CB69D` / `#E57373` / `#FFB74D` / `#64B5F6` | `#7CCBA2` / `#F28B82` / `#FDD663` / `#8AB4F8` |

`fg-subtle` yalnızca ikon/ipucu içindir; gövde metni `fg-muted` kullanır.
`on-primary`, `bg-primary` üzerindeki metin/ikon içindir (dark'ta beyaz okunmaz).

### Kalıcılık

- `localStorage` anahtarı: **`app_theme`** (salon_app ile aynı), değerler `light` / `dark` / `system`.
- Tercih **sunucuya kaydedilmez** (client-side kullanıcı tercihi).

### Dosyalar

| Dosya | Rol |
|---|---|
| `src/app/globals.css` | Token katmanı, `@custom-variant dark`, `badge-*` utility'leri |
| `src/providers/ThemeProvider.tsx` | `useSyncExternalStore` tabanlı 3 durumlu tema context'i |
| `src/components/ThemeToggle.tsx` | Segment kontrol (Açık / Koyu / Sistem) |
| `src/lib/chartTheme.ts` | Recharts için tema farkındalı renkler |
| `src/app/layout.tsx` | FOUC önleyen inline script + `suppressHydrationWarning` |

Tema seçici: **Sidebar alt kısmı**, **Ayarlar › Görünüm** ve **giriş ekranı**.

### Yeni badge eklerken

Tekrar eden rozet stilleri `globals.css` içinde utility olarak tanımlıdır:

```tsx
<span className="badge-success">Tamamlandı</span>
<span className="badge-info">Müştéri</span>
<span className="badge-error">Admin</span>
<span className="badge-warning">Bekliyor</span>
<span className="badge-purple">Salon Sahibi</span>
<span className="badge-neutral">—</span>
```

---

## Admin Endpoint'ler

| Method | Path | Auth | Açıklama |
|--------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Dashboard (stats, recent appointments, reviews) |
| GET | `/admin/salons` | ADMIN | Tüm salonlar (verified filter, sayfalı) |
| GET | `/admin/appointments` | ADMIN | Tüm randevular (status filter, sayfalı) |
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı) |

---

## Test kapısı

| Adım | Komut | Beklenen sonuç |
|---|---|---|
| Tip kontrolü | `npm run typecheck` | hatasız (`tsc --noEmit`) |
| Lint | `npm run lint` | hatasız (`eslint`) |
| Test | `npm test` | **156 test** yeşil (29 `node:test` + 127 vitest) |
| Build | `npm run build` | T1 ölçümü: 11 statik route, build **exit 0** |

`npm test` sırasıyla `npm run test:node` (`node --test`, 29 test) ve `npm run test:unit` (vitest, 127 test) çalıştırır; toplam **156 test**.
