# 03 · Yönlendirme ve Navigasyon

Kaynak: `lib/app/router.dart`, `lib/shared/widgets/salon_main_scaffold.dart`

## Route Tablosu

| Route | Ekran | Erişim | Scaffold |
|---|---|---|---|
| `/login` | `LoginScreen` | public | kendi Scaffold'u (no shell) |
| `/register` | `RegisterScreen` | public | kendi Scaffold'u |
| `/dashboard` | `DashboardScreen` | auth | `SalonMainScaffold` |
| `/appointments` | `SalonAppointmentsScreen` | auth | shell |
| `/staff` | `StaffManagementScreen` | auth | shell |
| `/services` | `ServiceManagementScreen` | auth | shell |
| `/reviews` | `SalonReviewsScreen` | auth | shell |
| `/salon-profile` | `SalonProfileScreen` | auth | shell |

- Root navigator: `_rootNavigatorKey` (login/register)
- Shell navigator: `_shellNavigatorKey` (6 iç route)
- İç route'lar `NoTransitionPage` kullanır → sekme değişiminde sayfa geçiş animasyonu yok.

---

## Auth Redirect Mantığı

```dart
redirect: (context, state) {
  final isLoginRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

  // Oturum durumu henüz çözülmedi (secure storage okunuyor)
  if (notifier.isResolving) {
    return state.matchedLocation == '/' ? '/login' : null;   // deep link korunur
  }

  if (!notifier.isLoggedIn && !isLoginRoute) return '/login';
  if (notifier.isLoggedIn && isLoginRoute)   return '/dashboard';
  return null;
}
```

**Neden `isResolving` dalı var?** Cold start'ta secure storage okunurken redirect erken çalışıyordu; web'te `/reviews` ile açılan uygulama `/login`'e düşüyor, login ekranı da `/dashboard`'a atıyordu. Şimdi yalnızca kök yol (`/`) login'e gönderiliyor; durum çözülünce `refreshListenable` redirect'i yeniden değerlendirir ve deep link korunur.

---

## Web'de initialLocation

```dart
final webPath = kIsWeb ? Uri.base.path : '';
final initialLocation = webPath.isNotEmpty && webPath != '/' ? webPath : '/login';
```

GoRouter, Flutter web'de `defaultRouteName` her zaman `/` olduğu için tarayıcı URL'sini dikkate almaz; bu yüzden `Uri.base.path`'ten alınır. Mobilde varsayılan `/login`.

---

## Alt Navigasyon (SalonMainScaffold)

| Index | İkon (pasif/aktif) | Etiket (TR) | Route |
|---|---|---|---|
| 0 | `dashboard_outlined` / `dashboard` | Panel | `/dashboard` |
| 1 | `calendar_today_outlined` / `calendar_today` | Randevular | `/appointments` |
| 2 | `people_outline` / `people` | Ekip | `/staff` **ve** `/services` |
| 3 | `rate_review_outlined` / `rate_review` | Yorumlar | `/reviews` |
| 4 | `store_outlined` / `store` | Salonum | `/salon-profile` |

`_getCurrentIndex()` path prefix'e göre index seçer; `/services` açıkken de 2. sekme aktif görünür. Tıklama sabit `context.go(...)`:
- 2. sekme her zaman `/staff`'a gider (services'e yalnızca iç bağlantı/FAB üzerinden geçilir).

Etiketler `S.of(context)` ile yerelleştirilir (`navDashboard`, `navAppointments`, `navTeam`, `navReviews`, `navMySalon`).

---

## Ekran İçi Navigasyon Örnekleri

| Nereden | Ne | Hedef |
|---|---|---|
| Login | "Hesabın yok mu? Kayıt Ol" | `context.push('/register')` |
| Register | "Zaten hesabın var mı?" | `context.pop()` |
| Dashboard | "Tümü" (Bugünkü Randevular başlığı) | `context.go('/appointments')` |
| Profil | Çıkış sonrası | router redirect → `/login` |
| Profil | Salon silme sonrası | `context.go('/login')` |

---

## Yeni Route Ekleme Checklist

1. `router.dart` içinde `ShellRoute.routes`'a `GoRoute(path, pageBuilder: NoTransitionPage(...))` ekle.
2. `SalonMainScaffold._getCurrentIndex()`'e prefix kuralı ekle.
3. `_onTap()` switch'ine index ekle (sekme gerekiyorsa).
4. `app_strings.dart`'a TR/EN etiket ekle.
5. Redirect mantığı zaten genel: auth'sız erişim `/login`'e düşer.
