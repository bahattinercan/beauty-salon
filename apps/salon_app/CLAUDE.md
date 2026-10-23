# Salon App CLAUDE.md

## Project Overview
Salon owner management app for beauty salons — appointment scheduling, staff & service management, reviews, and profile. Built with Flutter using Riverpod state management and GoRouter navigation.

## Directory Structure
```
apps/salon_app/
  lib/
    main.dart                    # Entry point — ProviderScope + SalonApp
    app/
      router.dart                # GoRouter config with auth redirect
      theme/
        app_colors.dart          # Color constants (primary, secondary, gradients)
        app_theme.dart           # Light/dark ThemeData
        app_theme_colors.dart    # Theme color references (light/dark)
    core/
      l10n/
        app_strings.dart         # TR/EN string translations (S.of(context))
        locale_provider.dart     # LocaleNotifier — AsyncNotifier<Locale>
      network/
        api_client.dart          # Singleton Dio client + JWT refresh interceptor
      theme/
        theme_provider.dart      # ThemeMode notifier
    features/
      auth/
        data/auth_provider.dart  # AuthNotifier — login/logout/forgot-password/reset/change-password
        presentation/screens/login_screen.dart
        presentation/screens/register_screen.dart
      salon/
        data/salon_provider.dart # SalonInfo, WorkingDay models + SalonNotifier
      dashboard/
        data/dashboard_provider.dart
        presentation/screens/dashboard_screen.dart
      appointments/
        data/appointments_provider.dart
        presentation/screens/salon_appointments_screen.dart
      staff/
        data/staff_provider.dart
        presentation/screens/staff_management_screen.dart
      services/
        data/services_provider.dart
        presentation/screens/service_management_screen.dart
      reviews/
        data/reviews_provider.dart
        presentation/screens/salon_reviews_screen.dart
      profile/
        presentation/screens/salon_profile_screen.dart
    shared/
      widgets/salon_main_scaffold.dart   # Bottom nav shell (5 tabs)
```

## Key Packages & Versions
| Package | Version | Purpose |
|---------|---------|---------|
| flutter_riverpod | ^3.2.1 | State management |
| go_router | ^17.1.0 | Navigation with auth redirect |
| dio | ^5.9.1 | HTTP client |
| flutter_secure_storage | ^10.0.0 | Token storage |
| table_calendar | ^3.2.0 | Calendar UI |
| fl_chart | ^0.70.2 | Charts/analytics |
| image_picker | ^1.2.1 | Image selection |
| intl | ^0.20.2 | Localization |
| cupertino_icons | ^1.0.8 | Icons |

## Architecture Patterns

### State Management — Riverpod Notifiers
- Uses `AsyncNotifier<T>` for async state (auth, data fetching)
- Uses `FutureProvider<T>` for one-shot fetches (e.g., categories)
- **No riverpod_generator** — providers defined manually with `AsyncNotifierProvider`
- Provider pattern:
```dart
class AuthNotifier extends AsyncNotifier<AuthState> { ... }
final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
```
- Screens consume state via `ref.watch(provider)` and `ref.read(provider.notifier).method()`

### Navigation — GoRouter Shell Routes
```
/login                          (public, no scaffold)
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
|-------|----------------------|------------|-------------|
| 0 | dashboard_outlined / dashboard | Ekran | `/dashboard` |
| 1 | calendar_today_outlined / calendar_today | Randevular | `/appointments` |
| 2 | people_outline / people | Ekibim | `/staff`, `/services` |
| 3 | rate_review_outlined / rate_review | Yorumlar | `/reviews` |
| 4 | store_outlined / store | Salonum | `/salon-profile` |

**Auth redirect logic** (`_RouterNotifier`):
- Not logged in → redirect to `/login`
- Logged in at `/login` → redirect to `/dashboard`

### API Client — Singleton Pattern
```dart
final client = ApiClient();  // singleton
// base URL: http://10.0.2.2:3000/api/v1
```
- **Timeouts**: connect 10s, receive 10s
- **Auth interceptor**: auto-reads `access_token` from secure storage, adds `Bearer` header
- **401 handling**: auto-refreshes token via `/auth/refresh`, retries original request
- **Refresh failure**: clears all secure storage (forces logout)
- **Token storage keys**: `access_token`, `refresh_token`, `user_id`, `user_name`

### Auth Flow
- **Role check**: only `SALON_OWNER` role allowed
- **State**: `AuthState(isLoggedIn, salonOwnerId?, fullName?)`
- **Login** → `/auth/login` → store tokens + user info → update state → redirect to `/dashboard`
- **Logout** → `deleteAll()` from secure storage → reset to initial state
- **Password change** → `/auth/change-password`
- **Forgot password** → `/auth/forgot-password`
- **Reset password** → `/auth/reset-password`

### Salon Info Resolution
All features depend on `salonProvider` (SalonNotifier) to get `SalonInfo`:
- Fetches `/salons/owner/my-salons` → takes first salon
- Used as base for all feature-specific API calls
- `SalonInfo` fields: `id`, `name`, `address`, `phone`, `email`, `description`, `ratingAvg`, `reviewCount`, `workingHours`
- `WorkingDay` fields: `open`, `close`, `isClosed` (per day of week)

### Theming
- Light/dark themes via `AppTheme.lightTheme` / `AppTheme.darkTheme`
- `ThemeProvider` controls `themeMode` (watched in main.dart)
- Status bar brightness adapts to theme mode
- Gradient-based design system (primary gradient, header gradient)

### Localization
- Turkish (default) and English supported
- `localeProvider` — AsyncNotifier persisting locale to secure storage
- Strings accessed via `S.of(context)`
- Flutter localization delegates: GlobalMaterialLocalizations, GlobalWidgetsLocalizations, GlobalCupertinoLocalizations

## Feature Details

### Auth (`features/auth/data/auth_provider.dart`)
| Method | Endpoint | Notes |
|--------|----------|-------|
| `login(email, password)` | POST `/auth/login` | Role check: SALON_OWNER |
| `changePassword(current, new)` | POST `/auth/change-password` | |
| `forgotPassword(email)` | POST `/auth/forgot-password` | |
| `resetPassword(email, token, new)` | POST `/auth/reset-password` | |
| `logout()` | — | Clears secure storage |

### Dashboard (`features/dashboard/data/dashboard_provider.dart`)
**Model**: `DashboardData`
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
  final String id, startTime, endTime, customerName, serviceName, status, date;
  final String? customerPhone, staffName;
}
```
**Endpoints**:
- `GET /appointments/salon/{salonId}?date={date}` — daily appointments
- Weekly chart: 7 sequential calls (one per day)

### Appointments (`features/appointments/data/appointments_provider.dart`)
**Model**: `SalonAppointment`
```dart
class SalonAppointment {
  final String id, date, startTime, endTime, status, customerName, serviceName;
  final String? customerPhone, staffName, note;
  final double servicePrice;
}
```
**Methods**:
| Method | Endpoint | Notes |
|--------|----------|-------|
| `refresh(date?, status?)` | GET `/appointments/salon/{id}` | Filter by date/status |
| `updateStatus(id, newStatus)` | PATCH `/appointments/{id}/status` | |
| `cancel(id)` | PATCH `/appointments/{id}/cancel` | |

### Staff (`features/staff/data/staff_provider.dart`)
**Model**: `StaffMember`
```dart
class StaffMember {
  final String id, fullName, serviceName;
  final String? title, phone, email;
  final bool isActive;
  final List<String> serviceNames, serviceIds;
  final double? ratingAvg;
}
```
**Methods**:
| Method | Endpoint | Notes |
|--------|----------|-------|
| `create(data)` | POST `/salons/{id}/staff` | |
| `editStaff(id, data)` | PATCH `/staff/{id}` | |
| `delete(id)` | DELETE `/staff/{id}` | |

### Services (`features/services/data/services_provider.dart`)
**Model**: `ServiceCategory`
```dart
class ServiceCategory { final String id, name; }
```
**Model**: `SalonService`
```dart
class SalonService {
  final String id, name;
  final String? categoryId, categoryName, description;
  final int durationMinutes;
  final double price;
  final bool isActive;
}
```
**Methods**:
| Method | Endpoint | Notes |
|--------|----------|-------|
| `create(data)` | POST `/salons/{id}/services` | |
| `editService(id, data)` | PATCH `/services/{id}` | |
| `delete(id)` | DELETE `/services/{id}` | |
| `categoriesProvider` | GET `/categories` | FutureProvider |

### Reviews (`features/reviews/data/reviews_provider.dart`)
**Model**: `SalonReview`
```dart
class SalonReview {
  final String id, customerName, serviceName;
  final double rating;
  final String? comment, replyText;
  final DateTime createdAt;
  bool get hasReply => replyText != null && replyText!.isNotEmpty;
}
```
**Methods**:
| Method | Endpoint | Notes |
|--------|----------|-------|
| `refresh()` | GET `/reviews/salon/{id}` | Handles nested `data` in response |
| `reply(reviewId, text)` | PATCH `/reviews/{id}/reply` | |

### Salon Info (`features/salon/data/salon_provider.dart`)
**Model**: `SalonInfo`
```dart
class SalonInfo {
  final String id, name;
  final String? address, phone, email, description;
  final double ratingAvg;
  final int reviewCount;
  final Map<String, WorkingDay> workingHours; // monday..sunday
}
```
**Model**: `WorkingDay`
```dart
class WorkingDay {
  final String open, close;
  final bool isClosed;
  static get defaultOpen => WorkingDay('09:00', '18:00', false);
  static get defaultClosed => WorkingDay('09:00', '18:00', true);
}
```
**Methods**:
| Method | Endpoint | Notes |
|--------|----------|-------|
| `refresh()` | GET `/salons/owner/my-salons` | Takes first salon |
| `updateInfo(data)` | PATCH `/salons/{id}` | |
| `requestEmailChange(newEmail)` | POST `/salons/{id}/request-email-change` | verifyVia: 'email' |
| `confirmEmailChange(token)` | POST `/salons/{id}/confirm-email-change` | |
| `requestPhoneChange(newPhone)` | POST `/salons/{id}/request-phone-change` | verifyVia: 'sms' |
| `confirmPhoneChange(token)` | POST `/salons/{id}/confirm-phone-change` | |

## Critical Rules
- **No GetIt/Injectable** — salon_app uses pure Riverpod providers (unlike customer_app which uses DI container)
- **No code generation** — all providers manually defined, no freezed/json_serializable
- **API base URL**: `http://10.0.2.2:3000/api/v1` (Android emulator localhost)
- **SecureStorage keys**: `access_token`, `refresh_token`, `user_id`, `user_name`, `app_locale`
- Features follow simple 2-layer pattern: `data/providers.dart` + `presentation/screens/`
- No entities/repositories layer — providers call ApiClient directly
- All providers depend on `salonProvider.future` to resolve salon ID
- Error handling: `AsyncValue.guard()` pattern in all refresh methods

## Adding a New Feature
1. Create `lib/features/<feature>/data/<feature>_provider.dart` with AsyncNotifier
2. Create `lib/features/<feature>/presentation/screens/<screen>.dart`
3. Add route in `app/router.dart` inside ShellRoute (if nav needed) or standalone GoRoute
4. Update `SalonMainScaffold._getCurrentIndex()` and `_onTap()` if adding bottom nav item

## Doğrulama notu (Flutter aracı)

`flutter analyze` çalıştırıldığında Flutter tool'u `analysis_options.yaml` dosyasına otomatik bir `analyzer.exclude` bloğu ekliyor ve commit diff'ini kirletiyor (gözlenen sürüm: bu makinedeki Flutter SDK).
Bu yüzden doğrulama için `dart analyze <yollar>` kullanın: yan etkisi yoktur, aynı analiz sonucunu verir.
