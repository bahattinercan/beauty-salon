# CA-004 — Bildirim Ekranı (Notifications)

**Öncelik:** 🟡 Orta
**Tahmini Efor:** 5-6 saat
**Kapsam:** `apps/customer_app/` (Flutter) + `apps/api/` (Backend)

---

## Özet

`ProfileScreen`'te "Bildirimler (3)" menü öğesi var ama `onTap: () => {}` — boş. Backend'de `Notification` modeli ve migration mevcut ama **controller ve route dosyaları yok**. Bildirim ekranı, entity, repository, provider ve API endpoint'leri sıfırdan yazılacak.

---

## Backend Tarafı (API-002)

### Controller: `apps/api/src/controllers/notification.controller.js`

```javascript
// GET /notifications — Kullanıcının bildirimleri (sayfalı, unread filter)
const getNotifications = async (req, res, next) => {
  // req.user.id → userId
  // query: page (default 1), limit (default 20), isRead (true/false/null)
  const notifications = await Notification.findAll({
    where: {
      userId: req.user.id,
      ...(req.query.isRead !== undefined && { isRead: req.query.isRead === 'true' }),
    },
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: (page - 1) * limit,
  });
  const total = await Notification.count({ where: { userId: req.user.id } });
  // successResponse with notifications + { page, total, totalPages }
};

// GET /notifications/unread-count — Okunmamış sayı
const getUnreadCount = async (req, res, next) => {
  const count = await Notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  // successResponse({ count })
};

// PATCH /notifications/:id/read — Tek bildirimi okundu işaretle
const markAsRead = async (req, res, next) => {
  await Notification.update({ isRead: true }, {
    where: { id: req.params.id, userId: req.user.id },
  });
  // successResponse
};

// PATCH /notifications/read-all — Tümünü okundu işaretle
const markAllAsRead = async (req, res, next) => {
  await Notification.update({ isRead: true }, {
    where: { userId: req.user.id, isRead: false },
  });
  // successResponse
};
```

### Route: `apps/api/src/routes/notification.routes.js`

```javascript
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

module.exports = router;
```

### Route Registration: `apps/api/src/routes/index.js` → ekle
```javascript
const notificationRoutes = require('./notification.routes');
router.use('/notifications', notificationRoutes);
```

### Notification Model Referans

```javascript
// apps/api/src/models/Notification.js
{
  id: UUID,
  userId: UUID,
  title: STRING,
  body: TEXT,
  type: ENUM('APPOINTMENT', 'REVIEW', 'ORDER', 'SYSTEM'),
  data: JSONB,          // extra data (appointmentId, salonName, etc.)
  isRead: BOOLEAN,      // default: false
  createdAt: DATE,
  updatedAt: DATE,
}
```

---

## Flutter Tarafı

### 1. Domain Layer

#### `lib/features/notifications/domain/entities/notification.dart` (YENİ)
```dart
class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;           // APPOINTMENT, REVIEW, ORDER, SYSTEM
  final Map<String, dynamic>? data;
  final bool isRead;
  final String createdAt;

  const NotificationItem({...});

  factory NotificationItem.fromJson(Map<String, dynamic> json);
  
  // Helper getters
  String get typeLabel;         // TR/EN type name
  IconData get typeIcon;        // type'a göre icon
  String get timeAgo;           // DateTime.parse(createdAt).timeAgoTr
  String get formattedDate;     // "12 Oca 2026, 14:30"
}
```

#### `lib/features/notifications/domain/repositories/notification_repository.dart` (YENİ)
```dart
abstract class NotificationRepository {
  Future<Either<Failure, List<NotificationItem>>> getNotifications({
    int page, int limit, bool? isRead,
  });
  Future<Either<Failure, int>> getUnreadCount();
  Future<Either<Failure, Unit>> markAsRead(String id);
  Future<Either<Failure, Unit>> markAllAsRead();
}
```

#### `lib/features/notifications/domain/usecases/` (YENİ)

**`get_notifications_usecase.dart`:**
```dart
@injectable
class GetNotificationsUseCase {
  final NotificationRepository _repository;
  GetNotificationsUseCase(this._repository);
  
  Future<Either<Failure, List<NotificationItem>>> call({
    int page = 1, int limit = 20, bool? isRead,
  }) => _repository.getNotifications(page: page, limit: limit, isRead: isRead);
}
```

**`get_unread_count_usecase.dart`:**
```dart
@injectable
class GetUnreadCountUseCase {
  final NotificationRepository _repository;
  GetUnreadCountUseCase(this._repository);
  
  Future<Either<Failure, int>> call() => _repository.getUnreadCount();
}
```

**`mark_read_usecase.dart`:**
```dart
@injectable
class MarkAsReadUseCase {
  final NotificationRepository _repository;
  MarkAsReadUseCase(this._repository);
  
  Future<Either<Failure, Unit>> call(String id) => _repository.markAsRead(id);
}
```

**`mark_all_read_usecase.dart`:**
```dart
@injectable
class MarkAllReadUseCase {
  final NotificationRepository _repository;
  MarkAllReadUseCase(this._repository);
  
  Future<Either<Failure, Unit>> call() => _repository.markAllAsRead();
}
```

### 2. Data Layer

#### `lib/features/notifications/data/models/notification_model.dart` (YENİ)
```dart
class NotificationModel extends NotificationItem {
  factory NotificationModel.fromJson(Map<String, dynamic> json);
  NotificationItem toEntity();
}
```

**Parse:**
```dart
NotificationModel({
  id: json['id'],
  title: json['title'],
  body: json['body'],
  type: json['type'],
  data: json['data']?.toString(),
  isRead: json['isRead'] as bool? ?? false,
  createdAt: json['createdAt'],
});
```

#### `lib/features/notifications/data/datasources/notification_remote_datasource.dart` (YENİ)
```dart
abstract class NotificationRemoteDataSource {
  Future<List<NotificationModel>> getNotifications({int page, int limit, bool? isRead});
  Future<int> getUnreadCount();
  Future<void> markAsRead(String id);
  Future<void> markAllAsRead();
}

@Injectable(as: NotificationRemoteDataSource)
class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final ApiClient _apiClient;
  
  // API endpoints: /notifications, /notifications/unread-count, /notifications/:id/read, /notifications/read-all
}
```

#### `lib/features/notifications/data/repositories/notification_repository_impl.dart` (YENİ)

`NotificationRepository` implement et. Hataları `ApiFailure`'a map et.

### 3. Presentation

#### `lib/features/notifications/presentation/providers/notifications_provider.dart` (YENİ)

```dart
sealed class NotificationsState {
  const NotificationsState();
}

class NotificationsInitial extends NotificationsState {}
class NotificationsLoading extends NotificationsState {}
class NotificationsLoaded extends NotificationsState {
  final List<NotificationItem> notifications;
  final int unreadCount;
  final int page;
  final int totalPages;
  const NotificationsLoaded({
    required this.notifications, required this.unreadCount,
    required this.page, required this.totalPages,
  });
}
class NotificationsError extends NotificationsState {
  final String message;
  const NotificationsError(this.message);
}

class NotificationsNotifier extends Notifier<NotificationsState> {
  Future<void> loadNotifications({int page = 1, bool? isRead});
  Future<void> loadUnreadCount();
  Future<void> markAsRead(String id);
  Future<void> markAllAsRead();
  void clearError();
}

final notificationsProvider = NotifierProvider<NotificationsNotifier, NotificationsState>(...);
final unreadCountProvider = StateProvider<int>((ref) => 0);
```

#### `lib/features/notifications/presentation/screens/notifications_screen.dart` (YENİ)

**UI Yapısı:**
```
┌──────────────────────────────┐
│ ←  Bildirimler          [T ] │ ← "Tümünü oku" butonu
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔔  Randevu Hatırlatıcı  │ │
│ │     Randevunuz 1 saat     │ │
│ │     sonra!                │ │
│ │     12 Oca 2026, 14:30   │ │
│ └──────────────────────────┘ │ ← isRead=false → highlight
│                              │
│ ┌──────────────────────────┐ │
│ │ ⭐  Yeni Yorum           │ │
│ │     Salona yorum yazıldı  │ │
│ │     10 Oca 2026, 09:15   │ │
│ └──────────────────────────┘ │ ← isRead=true → normal
│                              │
│ ┌──────────────────────────┐ │
│ │ ℹ️   Sistem Bilgisi      │ │
│ │     Bakım yapılacak       │ │
│ │     8 Oca 2026, 16:00    │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

**Özellikler:**
- Pull-to-refresh
- Her notification card → tap → `markAsRead` + push detail (opsiyonel)
- "Tümünü oku" AppBar button → `markAllAsRead`
- Filtre: "Tümü" / "Okunmamış" chip'ler (opsiyonel)
- Loading → shimmer
- Empty state → "Henüz bildiriminiz yok"

#### `lib/features/notifications/presentation/widgets/notification_card.dart` (YENİ)

```dart
class NotificationCard extends StatelessWidget {
  final NotificationItem notification;
  final VoidCallback onTap;
  
  // isRead ise highlight border/background
  // typeIcon + title + body + timeAgo
  // right-aligned timestamp
}
```

**Type → Icon mapping:**
```dart
IconData get typeIcon {
  switch (type) {
    case 'APPOINTMENT': return Icons.calendar_today;
    case 'REVIEW': return Icons.rate_review;
    case 'ORDER': return Icons.shopping_bag;
    case 'SYSTEM': return Icons.info;
    default: return Icons.notifications;
  }
}
```

### 4. Profile Screen Güncelleme

#### `lib/features/profile/presentation/screens/profile_screen.dart`
- `_MenuItem` → "Bildirimler" → `onTap: () => context.push('/notifications')`
- Badge sayısını dinamik yap: `unreadCountProvider`'dan oku
```dart
_trailing: ref.watch(unreadCountProvider) > 0
    ? Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: colors.error,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          '${ref.watch(unreadCountProvider)}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      )
    : null,
```

### 5. Router

#### `lib/app/router.dart` → ekle
```dart
GoRoute(
  path: '/notifications',
  builder: (context, state) => const NotificationsScreen(),
),
```

### 6. DI Registration

#### `lib/core/di/app_module.dart` → ekle
```dart
@lazySingleton
NotificationRepository get notificationRepository => NotificationRepositoryImpl();

@lazySingleton
GetNotificationsUseCase get getNotificationsUseCase => GetNotificationsUseCase();

@lazySingleton
GetUnreadCountUseCase get getUnreadCountUseCase => GetUnreadCountUseCase();

@lazySingleton
MarkAsReadUseCase get markAsReadUseCase => MarkAsReadUseCase();

@lazySingleton
MarkAllReadUseCase get markAllReadUseCase => MarkAllReadUseCase();
```

### 7. Strings

#### `lib/core/l10n/app_strings.dart` → ekle
```dart
// Notifications
String get notificationsTitle       => isEn ? 'Notifications'    : 'Bildirimler';
String get notificationsEmpty       => isEn ? 'No notifications'  : 'Henüz bildiriminiz yok';
String get notificationsEmptySub    => isEn ? 'We\'ll notify you here' : 'Bildirimler burada görünecek';
String get markAllRead              => isEn ? 'Mark all read'     : 'Tümünü okundu işaretle';
String get allNotifications         => isEn ? 'All'               : 'Tümü';
String get unread                   => isEn ? 'Unread'            : 'Okunmamış';
String get notificationAppointment  => isEn ? 'Appointment'       : 'Randevu';
String get notificationReview       => isEn ? 'Review'            : 'Yorum';
String get notificationSystem       => isEn ? 'System'            : 'Sistem';
```

### 8. API Constants

#### `lib/core/constants/api_constants.dart` → ekle
```dart
static const String notifications = '/notifications';
static const String notificationsUnreadCount = '/notifications/unread-count';
static const String notificationsMarkRead = '/notifications/:id/read';
static const String notificationsMarkAllRead = '/notifications/read-all';
```

---

## Test Senaryoları

1. **Bildirim listesi:** API'den bildirimler çek → shimmer → liste göster
2. **Okunmamız badge:** `unread-count` → ProfileScreen'de kırmızı badge
3. **Mark as read:** Card'a tıkla → read işaretle → görsel değişim
4. **Mark all read:** "Tümünü oku" → hepsi read → badge sıfırlanır
5. **Empty state:** Bildirim yok → empty state göster
6. **Pull to refresh:** Liste yenilenir
7. **Filter:** "Okunmamız" → sadece unread göster
8. **Error handling:** API hatası → SnackBar + retry

---

## Notlar

- `flutter_local_notifications` zaten `pubspec.yaml`'da. Local notification zaten çalışıyor.
- Bu plan **API'den pull** yapıyor. Push notification (FCM) için backend webhook gerekli — ayrı plan.
- `NotificationService.init()` → `main.dart`'da zaten çağrılıyor olmalı.
- Backend `Notification.isRead` default `true` olarak tanımlı (muhtemelen bug — `false` olmalı). Backend tarafında düzeltilmeli.

---

## Uygulanan (2026-07-27)

**Backend zaten tamamdı:** `notification.controller.js` + `notification.routes.js` + `routes/index.js` kaydı mevcut (list, unread-count, mark-read, mark-all-read, delete). Plandaki "`isRead` default `true` bug" notu da zaten `defaultValue: false` olarak düzeltilmiş. Bu turda yalnızca Flutter tarafı yazıldı.

**Flutter katmanları (sıfırdan):**
- `domain/entities/notification_item.dart` — `timeAgo` (pure Dart extension), `copyWith`
- `domain/entities/notification_page.dart` — `items` + `page/totalPages/total` (backend `meta`), `hasNextPage`, `unreadCount`, `withRead`, `withAllRead`
- `domain/repositories/notification_repository.dart` + 4 use case (`GetNotifications`, `GetUnreadCount`, `MarkNotificationRead`, `MarkAllNotificationsRead`)
- `data/models/notification_model.dart`, `data/datasources/notification_remote_datasource.dart`, `data/repositories/notification_repository_impl.dart`
- `presentation/providers/notifications_provider.dart` — `AsyncNotifierProvider.family<..., bool?>` (key `isRead`: null=Tümü, false=Okunmamış) + `unreadCountProvider`
- `presentation/screens/notifications_screen.dart` (160 satır) + `widgets/notification_card.dart` + `widgets/notification_list_body.dart`
- `RouteNames.notifications` + router route; `ProfileScreen` menüsü `pushNamed` ile bağlandı, badge artık `unreadCountProvider`'dan okuyor (0 ise gizli)

**Plandan sapmalar:**
1. `typeIcon`/`typeLabel` domain entity'de olamaz (domain Flutter ve l10n'e erişemez) → eşleme `NotificationCard.iconFor/labelFor` içinde.
2. Plandaki `sealed NotificationsState` + `Notifier` yerine repo konvansiyonu `AsyncNotifier` (hata `Failure` olarak throw edilir, UI `AsyncValue` switch ile çizer). Presentation'da `try/catch` yok.
3. `app_module`'da manuel DI kayıtları gerekmedi — `@injectable` + build_runner üretiyor.
4. `formattedDate` uygulanmadı (l10n domain'de kullanılamaz); kart `timeAgo` gösteriyor.
5. CA-017 için `NotificationListBody` ayrı widget'a çıkarıldı (screen 207 → 160 satır).

**Testler (179 test, analyze temiz):** entity, model, use case, provider (liste, filtre, loadMore, markAsRead, unreadCount), card (başlık/gövde/tip etiketi/tap), list body (empty state, load-more var/yok).

**Trade-off:** "Okunmamış" filtresinde bir kart okundu işaretlenince listede kalır (yalnızca görsel durum değişir); kaybolması için yeniden fetch gerekir. `markAsRead`/`markAllAsRead` sonrasında `unreadCountProvider` invalidate edilir.
