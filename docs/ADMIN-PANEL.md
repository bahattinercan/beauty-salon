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

## Admin Endpoint'ler

| Method | Path | Auth | Açıklama |
|--------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Dashboard (stats, recent appointments, reviews) |
| GET | `/admin/salons` | ADMIN | Tüm salonlar (verified filter, sayfalı) |
| GET | `/admin/appointments` | ADMIN | Tüm randevular (status filter, sayfalı) |
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı) |

---

## Admin Endpoint'ler

| Method | Path | Auth | Açıklama |
|--------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Dashboard (stats, recent appointments, reviews) |
| GET | `/admin/salons` | ADMIN | Tüm salonlar (verified filter, sayfalı) |
| GET | `/admin/appointments` | ADMIN | Tüm randevular (status filter, sayfalı) |
| GET | `/admin/reviews` | ADMIN | Tüm yorumlar (sayfalı) |
