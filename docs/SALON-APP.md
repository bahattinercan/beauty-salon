# 🏨 Salon App — Salon Sahibi Uygulaması

> Oluşturulma: 2026-01  
> Kapsam: `apps/salon_app/` (Flutter)

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Mimari Mimari](#mimari-mimari)
4. [Directory Structure](#directory-structure)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [Auth Akış](#auth-akış)
8. [Dashboard](#dashboard)
9. [Dashboard Model](#dashboard-model)
10. [Salon Provider](#salon-provider)
11. [Ekranlar](#ekranlar)

---

## Proje Özeti

Salon sahibi yönetim uygulaması. Salon sahipleri randevuları, personeli, hizmetleri ve yorumları yönetir.

---

## Teknoloji Yığını

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| State | flutter_riverpod ^3.2.1 | |
| Navigation | go_router ^17.1.0 | |
| Network | dio ^5.9.1 | |
| Storage | flutter_secure_storage ^10.0.0 | |
| Chart | fl_chart ^0.70.2 | |
| Calendar | table_calendar ^3.2.0 | |
| Icons | cupertino_icons ^1.0.8 | |

---

## Mimari Mimari

```
lib/
├── main.dart                    # Entry point — ProviderScope + SalonApp
├── app/
│   ├── router.dart              # GoRouter config with auth redirect
│   ├── theme/
│   │   ├── app_colors.dart      # Color constants (primary, secondary, gradients)
│   │   └── app_theme.dart       # Light/dark ThemeData
│   ├── core/
│   │   ├── l10n/
│   │   │   ├── app_strings.dart         # TR/EN string translations
│   │   └── locale_provider.dart         # LocaleNotifier — AsyncNotifier<Locale>
│   ├── network/
│   │   └── api_client.dart          # Singleton Dio client + JWT refresh interceptor
│   ├── theme/
│   │   └── theme_provider.dart      # ThemeMode notifier
│   └── features/
│       ├── auth/
│   │   ├── data/auth_provider.dart  # AuthNotifier — login/logout/forgot-password/reset/change-password
│   │   └── presentation/
│   │       ├── login_screen.dart
│   │   └── register_screen.dart
│       ├── salon/
│       ├── dashboard/
│       ├── appointments/
│       ├── staff/
│       ├── services/
│       ├── reviews/
│       └── profile/
└── shared/
    └── widgets/salon_main_scaffold.dart   # Bottom nav shell (5 tabs)
```

---

## Routing

```
/login                          (public, no scaffold)
/register                       (public, no scaffold)
ShellRoute (SalonMainScaffold)
  /dashboard                    → DashboardScreen
  /appointments                 → SalonAppointmentsScreen
  /staff                        → StaffManagementScreen
  /services                     → ServiceManagementScreen
  /reviews                      → SalonReviewsScreen
  /salon-profile                → SalonProfileScreen
```

**Bottom nav mapping** (in `SalonMainScaffold`):
| Index | Icon (inactive/active) | Label (TR) | Route match |
|-------|----------------------|------------|
| 0 | dashboard_outlined / dashboard | Ekran | `/dashboard` |
| 1 | calendar_today_outlined / calendar_today | Randevular | `/appointments` |
| 2 | people_outline / people | Ekibim | `/staff`, `/services` |
| 3 | rate_review_outlined / rate_review | Yorumlar | `/reviews` |
| 4 | store_outlined / store | Salonum | `/salon-profile` |

---

## State Management

### Riverpod Notifiers

- `AsyncNotifier<T>` for async state (auth, data fetching)
- `FutureProvider<T>` for one-shot fetches (e.g. categories)
- **No riverpod_generator** — providers defined manually with `AsyncNotifierProvider`
- Provider pattern:
```dart
class AuthNotifier extends AsyncNotifier<AuthState> { ... }
final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
```
- Screens consume state via `ref.watch(provider)` and `ref.read(provider.notifier).method()`

---

## Auth Akış

- **Role check**: only `SALON_OWNER` role allowed
- **State**: `AuthState(isLoggedIn, salonOwnerId?, fullName?)`
- **Login** → `/auth/login` → store tokens + user info → update state → redirect to `/dashboard`
- **Logout** → `deleteAll()` from secure storage → reset to initial state
- **Password change** → `/auth/change-password`
- **Forgot password** → `/auth/forgot-password`
- **Reset password** → `/auth/reset-password`

---

## Dashboard

### Dashboard Model
```dart
class DashboardData {
  final int todayCount;
  final int weekCount;
  final double monthRevenue;
  final double avgRating;
  final List<DashboardAppointment> todayAppointments;
  final List<int> weeklyChart; // 7 gün randevu sayısı
}
```

**Model**: `DashboardAppointment`
```dart
class DashboardAppointment {
  final String id, startTime, endTime, customerName, serviceName;
  final String? customerPhone, staffName;
  final String status;
  final String date;
  final double? servicePrice;
}
```

**Endpoints**:
- `GET /appointments/salon/{salonId}?date={date}` — daily appointments
- Weekly chart: 7 sequential calls (one per day)

---

## Ekranlar

| Ekran | Açıklama |
|--------|----------|
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
| DashboardScreen | Dashboard |
