# 06 · Veri Modelleri

Tüm modeller **elle yazılmış** (freezed/json_serializable yok). Ortak felsefe: **null-güvenli parsing** — eksik/bozuk alanlar crash etmez, default'a düşer.

---

## AuthState
`features/auth/data/auth_provider.dart`

| Alan | Tip | Default |
|---|---|---|
| `isLoggedIn` | bool | zorunlu |
| `salonOwnerId` | String? | null |
| `fullName` | String? | null |

`AuthState.initial()` → `isLoggedIn: false`.

---

## SalonInfo
`features/salon/data/salon_provider.dart`

| Alan | Tip | Parsing kuralı |
|---|---|---|
| `id` | String | `?? ''` |
| `name` | String | `?? ''` |
| `address`, `phone`, `email`, `description` | String? | doğrudan |
| `ratingAvg` | double | `num → double ?? 0.0` |
| `reviewCount` | int | `num → int ?? 0` |
| `workingHours` | Map<String, WorkingDay> | `kDayKeys` üzerinden; olmayan gün map'te **yer almaz** |
| `isVerified` | bool | `?? false` |
| `logoUrl`, `coverImageUrl` | String? | doğrudan |
| `galleryImages` | List<String> | non-empty filtrelenir |

```dart
const kDayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
```

### WorkingDay
| Alan | Tip | Default (fromJson) |
|---|---|---|
| `open` | String | `'09:00'` |
| `close` | String | `'18:00'` |
| `isClosed` | bool | `false` |

- `displayTimeRange` → kapalıysa `"Kapalı"`, değilse `"09:00 - 18:00"`
- `toJson()` → `{open, close, isClosed}` (PATCH `workingHours` için)
- `WorkingDay.defaultOpen` / `defaultClosed` statikleri (çalışma saatleri sheet'inde eksik günler için kullanılır)

---

## DashboardAppointment
`features/dashboard/data/dashboard_provider.dart`

| Alan | Tip | Not |
|---|---|---|
| `id`, `startTime`, `endTime`, `status`, `date` | String | status default `'PENDING'` |
| `customerName` | String | nested `customer.fullName`, yoksa `'Müşteri'` |
| `customerPhone` | String? | — |
| `serviceName` | String | nested `service.name` |
| `staffName` | String? | nested `staff.fullName` |
| `servicePrice` | double? | nested `service.price` |

## DashboardData
| Alan | Tip | Kaynak |
|---|---|---|
| `todayCount` | int | ay listesinden bugünkü kayıt sayısı |
| `weekCount` | int | `weeklyChart.reduce(+)` (son 7 gün) |
| `monthRevenue` | double | `COMPLETED` randevuların fiyat toplamı |
| `avgRating` | double | `salon.ratingAvg` |
| `todayAppointments` | List<DashboardAppointment> | — |
| `weeklyChart` | List<int> (7) | index 0 = 6 gün önce, index 6 = bugün |

> ⚠️ `weeklyChart` ay başı–bugün aralığından türetildiği için **ayın ilk günlerinde** (ör. 3 Ekim) son 7 günün bir kısmı sorgu kapsamı dışında kalır ve 0 görünür. Detay: [12-gaps-risks.md](12-gaps-risks.md).

---

## SalonAppointment
`features/appointments/data/appointments_provider.dart`

| Alan | Tip | Default |
|---|---|---|
| `id`, `date`, `startTime`, `endTime`, `status`, `customerName`, `serviceName` | String | status `'PENDING'`, customer `'Müşteri'` |
| `customerPhone`, `staffName`, `note` | String? | — |
| `servicePrice` | double | `?? 0` (SQLite DECIMAL string gelmesine de tolere eder — test var) |

---

## StaffMember
`features/staff/data/staff_provider.dart`

| Alan | Tip | Not |
|---|---|---|
| `id`, `fullName` | String | — |
| `title`, `phone`, `email` | String? | — |
| `isActive` | bool | `?? true` — **açıkça `false` gelirse false kalır** (test: `isActive açıkça false ise true olmaz`) |
| `serviceNames` | List<String> | nested `services[].name` |
| `serviceIds` | List<String> | nested `services[].id` (form'da seçim için) |
| `ratingAvg` | double? | null olabilir |

---

## SalonService / ServiceCategory
`features/services/data/services_provider.dart`

**SalonService**
| Alan | Tip | Default |
|---|---|---|
| `id`, `name` | String | — |
| `categoryId`, `categoryName` | String? | nested `category` |
| `durationMinutes` | int | `?? 30` |
| `price` | double | `?? 0` |
| `description` | String? | — |
| `isActive` | bool | `?? true` |

**ServiceCategory**: `{id, name}` — eksik alanlar boş string.

---

## SalonReview & ReviewFeed
`features/reviews/data/reviews_provider.dart`

**SalonReview**
| Alan | Tip | Not |
|---|---|---|
| `id` | String | — |
| `customerName` | String | nested `customer.fullName`, default `'Müşteri'` |
| `rating` | double | `?? 0` |
| `comment` | String? | — |
| `replyText` | String? | API alanı `salonReply` |
| `serviceName` | String? | `appointment.service.name` (2 seviye nested) |
| `createdAt` | DateTime | `DateTime.tryParse` → null ise `DateTime.now()` |
| `hasReply` | computed | `replyText != null && !isEmpty` |

**ReviewFeed** (sayfalama sarmalayıcısı)
| Alan | Tip |
|---|---|
| `reviews` | List<SalonReview> |
| `total` | int |
| `page` | int |
| `limit` | int (20) |
| `hasMore` | computed: `reviews.length < total` |

`_fetch` iki response biçimini de tolere eder: `data` düz **List** ise `total = length`; `data` **Map** ise `data.data` + `data.total`.

---

## Model Testleri (hangisi neyi kilitliyor)

| Model | Test dosyası | Örnek assert |
|---|---|---|
| SalonInfo / WorkingDay | `test/features/salon/salon_info_model_test.dart` | null alanlar, roundtrip toJson, "Kapalı" |
| SalonAppointment | `.../appointments/salon_appointment_model_test.dart` | nested null, price string toleransı |
| DashboardAppointment | `.../dashboard/dashboard_appointment_model_test.dart` | nested null, price çıkarımı |
| StaffMember | `.../staff/staff_member_model_test.dart` | services name/id, isActive false |
| SalonService / ServiceCategory | `.../services/salon_service_model_test.dart` | category nested, default 30/0 |
| SalonReview | `.../reviews/salon_review_model_test.dart` | nested customer/service |
| ReviewFeed | `.../reviews/review_feed_test.dart` | hasMore mantığı |
| AuthState | `.../auth/auth_state_test.dart` | initial, alan saklama |
| resolveMediaUrl | `test/core/media_url_test.dart` | origin tamamlama, idempotency |
