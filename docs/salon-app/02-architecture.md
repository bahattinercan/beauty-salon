# 02 · Mimari

## Katman Modeli

Salon app, "hafif Clean Architecture" kullanır: **Presentation → Data(provider) → Network(ApiClient)**. `customer_app`'deki Domain/Repository/UseCase + GetIt DI katmanları burada **yok**.

```
┌──────────────────────────────────────────────────────┐
│ Presentation (screens)                               │
│   ref.watch(provider)  /  ref.read(provider.notifier)│
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│ Data (AsyncNotifier + model sınıfları aynı dosyada)  │
│   build() → _fetch() → AsyncValue.guard()            │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│ Network: apiClientProvider → ApiClient → Dio         │
│          + _AuthInterceptor (Bearer / 401 refresh)   │
└──────────────────┬───────────────────────────────────┘
                   │
              REST API (apps/api)
```

Ayrıca yatay **core** servisleri: `environment`, `theme`, `l10n`, `network/media_url`, `network/upload_service`, `widgets/state_view`.

---

## Provider Grafiği (bağımlılık yönü)

```
authProvider ───────────────┐
     │                      │
     ▼                      │ (login → refreshListenable → router)
salonProvider ──┐           │
     │          │           │
     ▼          ▼           ▼
dashboard  appointments  staff   services   reviews
     │          │          │        │
     │          │          │        └── categoriesProvider (FutureProvider)
     │          │          │
     └── hepsi salonProvider.future'a bakar ── apiClientProvider
```

Kod kanıtları:
- `DashboardNotifier._fetch()` → `ref.watch(salonProvider.future)`
- `SalonAppointmentsNotifier._fetch()` → `ref.watch(salonProvider.future)`
- `StaffNotifier._fetch()` / `ServicesNotifier._fetch()` / `ReviewsNotifier._fetch()` → aynı
- `SalonNotifier._fetch()` → `await ref.read(authProvider.future)` (senkron `read` değil; ilk açılışta auth henüz çözülmemişse boş salon dönme bug'ı düzeltilmiş)

**Salon yoksa (null)** tüm feature provider'ları boş/`0` döner — ekranlar crash etmez.

---

## Provider Desenleri

### 1. `AsyncNotifier<T>` (async, yeniden fetch edilebilir)
```dart
final salonProvider = AsyncNotifierProvider<SalonNotifier, SalonInfo?>(SalonNotifier.new);

class SalonNotifier extends AsyncNotifier<SalonInfo?> {
  @override Future<SalonInfo?> build() => _fetch();

  Future<SalonInfo?> _fetch() async { ... }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}
```
Mutasyon sonrası standart kalıp: ** mutate → `state = await AsyncValue.guard(_fetch)` ** (tam liste yeniden çekilir, optimistic güncelleme yok).

### 2. `FutureProvider<T>` (tek atış, cache)
```dart
final categoriesProvider = FutureProvider<List<ServiceCategory>>((ref) async { ... });
```

### 3. `Notifier<T>` (senkron state + async persistence)
`ThemeNotifier` — `build()` `ThemeMode.system` döner, `_load()` async olarak secure storage'dan okuyup state'i günceller.

### 4. `AsyncNotifier` + secure storage bootstrap
`AuthNotifier.build()` storage'dan token okuyarak oturum durumunu yeniden kurar (cold start'ta "logged in" korunur).

### 5. Router refresh
```dart
class _RouterNotifier extends ChangeNotifier {
  _RouterNotifier(this._ref) { _ref.listen(authProvider, (_, _) => notifyListeners()); }
  bool get isLoggedIn => _ref.read(authProvider).asData?.value.isLoggedIn ?? false;
  bool get isResolving => _ref.read(authProvider).isLoading;
}
```
`refreshListenable: notifier` → auth state değiştiğinde GoRouter redirect'i yeniden çalışır.

---

## Veri Akışı Örnekleri

### A) Dashboard açılışı
1. `authProvider` storage'dan token okur → `isLoggedIn`.
2. Router redirect: `/login` değilse `/dashboard`.
3. `salonProvider` → `GET /salons/owner/my-salons` → ilk salon.
4. `dashboardProvider` → **tek istek**: `GET /appointments/salon/{id}?from=YYYY-MM-01&to=YYYY-MM-DD`.
5. Client-side türetme:
   - `todayCount` = ay listesinden `_dayOf(date) == today`
   - `weeklyChart` = son 7 günün sayıları
   - `monthRevenue` = `COMPLETED` randevuların `servicePrice` toplamı
   - `avgRating` = `salon.ratingAvg` (API'den, ekstra istek yok)

> **N+1 düzeltmesi:** Eski sürüm gün başına istek atıyordu (1 + 7 + 31 ≈ 39 istek) ve rate limit'i (100/dk) tetikliyordu. Şimdi tek aralık isteği var; test `build() randevular için tek istek yapar (gün başına N+1 yok)` bunu kilitliyor.

### B) Randevu durumu değiştirme
```
tile "Onayla" → notifier.updateStatus(id,'CONFIRMED')
   → PATCH /appointments/{id}/status
   → state = AsyncValue.guard(_fetch)   // tam liste yeniden çekilir
   → SnackBar "Randevu onaylandı"
```

### C) Yorum yanıtlama (sayfalı)
```
GET /reviews/salon/{id}?page=1&limit=20  → { data: { data:[...], meta:{total,...} } }
ReviewFeed { reviews, total, page, limit, hasMore }
loadMore() → page+1 fetch → mevcut listeye append
reply(id,text) → PATCH /reviews/{id}/reply → page 1'e dön
```

---

## Tutarsızlık: İki ApiClient Yolu

| Kullanım | Yer | Sonuç |
|---|---|---|
| `ref.read(apiClientProvider).dio` | salon, dashboard, appointments, staff, services, reviews | Testlerde `ProviderOverride` ile sahte istemci verilebilir ✅ |
| `ApiClient().dio` (yeni instance) | `auth_provider.dart` (6 çağrı), `upload_service.dart` | Her çağrıda yeni Dio + yeni interceptor; override edilemez ❌ |

Bu, auth testlerinin `FakeAuthNotifier` ile yapılmasına neden oluyor. Detay ve öneri: [12-gaps-risks.md](12-gaps-risks.md).

---

## Hata Yönetimi Deseni

- **Fetch tarafı:** `AsyncValue.guard()` → `AsyncError` → ekran `ErrorState(message, onRetry)` gösterir.
- **Mutasyon tarafı:** `try/catch` → `ScaffoldMessenger` SnackBar (`AppColors.error` kırmızısı).
- **API hata mesajı:** `e.response?.data?['message']` (auth) veya `e.toString()` (diğerleri).
- **401:** interceptor otomatik refresh dener; başarısızsa `deleteAll()` → oturum düşer.

---

## Performas / Ölçeklenme Notları

- Dashboard tek istekle geliyor (iyileştirilmiş).
- Randevular ekranı seçili gün için `refresh(date:)` yapıyor; ayrıca client-side `_filterList` ile tekrar filtreliyor (çift filtre, zararsız).
- Yorumlar 20'lik sayfa + "Daha fazla göster" → sonsuz liste riski kontrol altında.
- Provider'lar global (root scope) → tüm ekranlar aynı salon verisini paylaşır; salon değişirse tüm provider'lar yeniden fetch eder.
