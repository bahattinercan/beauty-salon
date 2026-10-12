# 🏨 Customer App — Detaylı Doküman

> Oluşturulma: 2026-01  
> Kapsam: `apps/customer_app/` (Flutter)

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Yığını](#teknoloji-yığını)
3. [Mimari Mimari](#mimari-mimari)
4. [Directory Structure](#directory-structure)
5. [Routing](#routing)
6. [State Management](#state-management)
7. [Auth Akış](#auth-akış)
8. [API Client](#api-client)
9. [Domain Entities](#domain-entities)
10. [Eksik Özellikler](#eksik-özellikler)

---

## Proje Özeti

Müşteri mobil uygulaması. Müşteriler salon arayabilir, hizmet seçebilir, çalışan bazlı randevu alabilir, yorum yapabilir ve favorilere ekleyebilir.

---

## Teknoloji Yığını

| Bileşen | Versiyon | Açıklama |
|---------|----------|----------|
| State | flutter_riverpod ^3.2.1 | |
| Navigation | go_router ^17.1.0 | |
| Network | dio ^5.9.1 | |
| DI | get_it ^8.0.0 + injectable ^2.5.0 | |
| Error handling | fpdart ^1.1.0 | |
| Immutable models | freezed ^3.0.0 + json_annotation ^6.8.0 | |
| Notifications | flutter_local_notifications | |
| Secure storage | flutter_secure_storage ^10.0.0 | |
| Maps | google_maps_flutter ^2.14.0 | |
| Image | image_picker ^1.2.1 | |

---

## Mimari Mimari

```
lib/
├── core/
│   ├── di/              # get_it + injectable (injection.dart, app_module.dart)
│   ├── error/           # failures.dart (ServerFailure, CacheFailure, NetworkFailure, UnauthorizedFailure)
│   ├── constants/       # api_constants.dart, app_constants.dart
│   ├── network/         # api_client.dart
│   ├── services/        # notification_service.dart
│   ├── extensions/      # BuildContext, String, DateTime extensions
│   ├── utils/           # Pure helper functions (no Flutter/Dio imports)
│   ├── widgets/         # Reusable UI components used by 2+ features (SalonCard, etc.)
│   └── l10n/            # app_strings.dart (localization), locale_provider.dart
│
├── features/
│   └── <feature>/
│       ├── data/
│   │   ├── datasources/     # <feature>_remote_datasource.dart
│   │   ├── models/          # <feature>_model.dart  (DTO + toEntity())
│   │   └── repositories/    # <feature>_repository_impl.dart
│       ├── domain/
│   │   ├── entities/        # <entity>.dart  (pure Dart class)
│   │   ├── repositories/    # <feature>_repository.dart  (abstract)
│   │   └── usecases/        # get_x_usecase.dart, create_x_usecase.dart
│       └── presentation/
│           ├── providers/       # <feature>_provider.dart
│           ├── screens/         # <feature>_screen.dart
│           └── widgets/         # Extracted sub-widgets (only when screen > 200 lines)
│
├── app/
│   ├── router.dart              # go_router configuration
│   ├── widgets/                 # App-level shell widgets (MainScaffold)
│   └── theme/                   # AppColors, AppTheme, ThemeProvider
│
└── main.dart
```

---

## Routing

```
/login                          (public, no scaffold)
/register                       (public, no scaffold)
ShellRoute (MainScaffold)
  /home                         → HomeScreen
  /discover                     → DiscoverScreen
  /appointments                 → AppointmentsScreen
  /profile                      → ProfileScreen
Detail routes (outside shell, fullscreen)
  /salon/:id                    → SalonDetailScreen
  /booking/:salonId             → BookingScreen
  /review/:appointmentId        → WriteReviewScreen
  /favorites                      → FavoritesScreen
  /edit-profile                   → EditProfileScreen
  /my-reviews                      → MyReviewsScreen
```

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

- **Role check**: only `CUSTOMER` role allowed
- **State**: `AuthState(isLoggedIn, salonOwnerId?, fullName?)`
- **Login** → `/auth/login` → store tokens + user info → update state → redirect to `/home`
- **Logout** → `deleteAll()` from secure storage → reset to initial state
- **Password change** → `/auth/change-password`
- **Forgot password** → `/auth/forgot-password`
- **Reset password** → `/auth/reset-password`

---

## API Client

### Singleton Pattern
```dart
final client = ApiClient();  // singleton
// base URL: http://10.0.2.2:3000/api/v1
```
- **Timeouts**: connect 10s, receive 10s
- **Auth interceptor**: auto-reads `access_token` from secure storage, adds `Bearer` header
- **401 handling**: auto-refreshes token via `/auth/refresh`, retries original request
- **Refresh failure**: clears all secure storage (forces logout)
- **Token storage keys**: `access_token`, `refresh_token`, `user_id`, `user_name`

---

## Domain Entities

### User
- `id`, `email`, `fullName`, `phone`, `avatarUrl`, `role` (CUSTOMER)

### Salon
- `id`, `name`, `address`, `phone`, `logoUrl`, `coverImageUrl`, `ratingAvg`, `reviewCount`

### Appointment
- `id`, `date`, `startTime`, `endTime`, `status`, `customerName`, `serviceName`, `servicePrice`

### Review
- `id`, `customerName`, `serviceName`, `rating`, `comment`, `replyText`, `createdAt`

---

## Ekranlar

| Ekran | Açıklama |
|--------|----------|
| LoginScreen | Giriş ekranı |
| RegisterScreen | Kayıt ekranı |
| HomeScreen | Ana ekran |
| DiscoverScreen | Keşfet ekranı |
| AppointmentsScreen | Randevular |
| ProfileScreen | Profil |
| SalonDetailScreen | Salon detay |
| BookingScreen | Randevu oluştur |
| WriteReviewScreen | Yorum yaz |
| MyReviewsScreen | Kendi yorumlarım |
| FavoritesScreen | Favoriler |
| EditProfileScreen | Profil düzenle |
