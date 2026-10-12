# CA-016 — Named Routes (go_router)

**Öncelik:** 🟡 Orta
**Durum:** ✅ Uygulandı (2026-07-27) — `RouteNames` + 34 çağrı sitesi, raw path: 0
**Kapsam:** `apps/customer_app/lib/app/router.dart` + 34 çağrı sitesi
**Kural:** CLAUDE.md §9 — named routes zorunlu, call site'ta raw path string yasak

---

## Özet

`router.dart`'ta hiçbir `GoRoute`'ta `name:` tanımlı değil. 34 çağrı sitesinde raw path string kullanılıyor (`context.go('/login')`, `context.push('/salon/${salon.id}')`). Path değişirse her çağrı sitesi kırılır; deep-link ve tip güvenliği yok.

---

## 1. Route Name Tablosu

| Path | name | Parametre |
|------|------|-----------|
| `/login` | `login` | — |
| `/register` | `register` | — |
| `/forgot-password` | `forgotPassword` | — |
| `/reset-password` | `resetPassword` | query: `email` |
| `/home` | `home` | — (shell) |
| `/discover` | `discover` | query: `category` |
| `/appointments` | `appointments` | — (shell) |
| `/profile` | `profile` | — (shell) |
| `/salon/:id` | `salonDetail` | `id` |
| `/booking/:salonId` | `booking` | `salonId` |
| `/review/:appointmentId` | `writeReview` | `appointmentId` |
| `/favorites` | `favorites` | — |
| `/edit-profile` | `editProfile` | — |
| `/my-reviews` | `myReviews` | — |

Öneri: name'leri sabit bir sınıfta tut, string literal kullanma:

```dart
// lib/app/route_names.dart
class RouteNames {
  RouteNames._();
  static const login = 'login';
  static const register = 'register';
  static const forgotPassword = 'forgotPassword';
  static const resetPassword = 'resetPassword';
  static const home = 'home';
  static const discover = 'discover';
  static const appointments = 'appointments';
  static const profile = 'profile';
  static const salonDetail = 'salonDetail';
  static const booking = 'booking';
  static const writeReview = 'writeReview';
  static const favorites = 'favorites';
  static const editProfile = 'editProfile';
  static const myReviews = 'myReviews';
}
```

---

## 2. router.dart Güncelleme

Her `GoRoute`'a `name:` ekle. Örnek:

```dart
GoRoute(
  path: '/salon/:id',
  name: RouteNames.salonDetail,
  builder: (context, state) => SalonDetailScreen(
    salonId: state.pathParameters['id']!,
  ),
),
```

`initialLocation` ve `redirect` içindeki path karşılaştırmaları da name'e çevrilmeli:

```dart
redirect: (context, state) async {
  final isLoggedIn = await getIt<AuthRepository>().isLoggedIn();
  final isAuthRoute = const {
    RouteNames.login, RouteNames.register,
    RouteNames.forgotPassword, RouteNames.resetPassword,
  }.contains(state.matchedLocation);   // name bazlı kontrol
  ...
}
```

> `state.matchedLocation` path döner. Name bazlı kontrol için `state.path` yerine route name set'i kullanılır; en temiz yol `state.matchedLocation`'ı path olarak tutup path→name haritası çıkarmak ya da `isAuthRoute`'u path set'i olarak bırakmak. **Karar:** redirect'te path set'i bırakılabilir (yalnızca router içi), call site'larda raw path yasak.

---

## 3. Çağrı Sitesı Dönüşümleri

Dönüşüm kalıbı:

```dart
// ESKİ
context.push('/salon/${salon.id}');
context.go('/reset-password?email=${Uri.encodeQueryComponent(email)}');

// YENİ
context.pushNamed(RouteNames.salonDetail, pathParameters: {'id': salon.id});
context.pushNamed(RouteNames.resetPassword, queryParameters: {'email': email});
```

### Dosya bazında listeler (34 site)

| Dosya | Satır | Eski | Yeni |
|-------|-------|------|------|
| `app/widgets/main_scaffold.dart` | 22, 24, 26, 28 | `go('/home' / '/discover' / '/appointments' / '/profile')` | `goNamed(...)` |
| `core/widgets/salon_card.dart` | 41 | `push('/salon/$id')` | `pushNamed(salonDetail, pathParameters:{'id':id})` |
| `features/appointments/.../appointments_screen.dart` | 106, 131, 134 | `go('/discover')`, `push('/review/${a.id}')`, `push('/booking/${a.salon.id}')` | `goNamed(discover)`, `pushNamed(writeReview, ...)`, `pushNamed(booking, ...)` |
| `features/auth/.../forgot_password_screen.dart` | 63, 140, 244 | `go('/reset-password?email=...')`, `go('/login')` ×2 | `pushNamed(resetPassword, queryParameters:{...})`, `goNamed(login)` |
| `features/auth/.../login_screen.dart` | 79, 263, 284 | `go('/home')`, `go('/forgot-password')`, `go('/register')` | `goNamed(...)` |
| `features/auth/.../register_screen.dart` | 51, 173 | `go('/home')`, `go('/login')` | `goNamed(...)` |
| `features/auth/.../reset_password_screen.dart` | 103, 268 | `go('/login')`, `go('/forgot-password')` | `goNamed(...)` |
| `features/booking/.../booking_screen.dart` | 745, 756 | `go('/appointments')`, `go('/home')` | `goNamed(...)` |
| `features/favorites/.../favorites_screen.dart` | 50, 77 | `go('/discover')`, `push('/salon/${salon.id}')` | `goNamed(discover)`, `pushNamed(salonDetail, ...)` |
| `features/home/.../home_screen.dart` | 159, 213, 229, 289 | `go('/discover')`, `go('/discover?category=...')` | `goNamed(discover, queryParameters:{'category': turkishKey})` |
| `features/profile/.../profile_screen.dart` | 122, 127, 132, 137, 330 | `push('/edit-profile')`, `push('/favorites')`, `go('/appointments')`, `push('/my-reviews')`, `go('/login')` | `pushNamed/goNamed(...)` |
| `features/reviews/.../my_reviews_screen.dart` | 93 | `push('/salon/${review.salonId}')` | `pushNamed(salonDetail, ...)` |
| `features/salon_detail/.../salon_detail_screen.dart` | 321 | `push('/booking/${widget.salonId}')` | `pushNamed(booking, ...)` |
| `features/salon_discovery/.../discover_screen.dart` | 650 | `push('/salon/${salon.id}')` | `pushNamed(salonDetail, ...)` |

---

## 4. Dikkat Edilecekler

1. `queryParameters` encode'ü `go_router` kendisi yapar → `Uri.encodeQueryComponent` çağrılarını kaldır.
2. `pathParameters` map key'leri route parametre adıyla birebir aynı olmalı (`id`, `salonId`, `appointmentId`).
3. ShellRoute altındaki route'larda `goNamed` shell navigator'ı kullanır — davranış değişmez, test et.
4. `main_scaffold`'da bottom-nav aktif index'i name'den türetiliyorsa (`state.path`), `state.matchedLocation` korunmalı.
5. Widget testleri (`CA-015`) router'sız `MaterialApp(home: XScreen())` ile pump ediliyor; `goNamed` kullanmayan testler etkilenmez.

---

## Doğrulama

```bash
cd apps/customer_app
grep -rn "context.go('\|context.push('" lib/     # sonuç: 0 satır
flutter analyze
flutter test
```
