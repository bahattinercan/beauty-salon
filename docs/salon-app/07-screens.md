# 07 · Ekran Rehberi (Ekran Ekran)

Her ekran için: amaç, UI yapısı, etkileşimler, veri kaynakları, bilinen davranışlar.

---

## 7.1 Login — `LoginScreen`
`lib/features/auth/presentation/screens/login_screen.dart` (318 satır, `ConsumerStatefulWidget`)

**Yapı**
```
Scaffold
 └ Center → ConstrainedBox(maxWidth: 560)
    ├ Gradient header (headerGradient, alt kenar 36px radius)
    │   ├ 76×76 ikon kutusu (store_rounded)
    │   ├ "Salon Yönetimi" (26px, w800)
    │   └ alt yazı
    └ SingleChildScrollView → Form
        ├ e-posta TextFormField (validator: boş / '@' yok)
        ├ şifre TextFormField (≥6, visibility toggle)
        ├ "Şifremi Unuttum" TextButton
        ├ "Hesabın yok mu? Kayıt Ol" → push('/register')
        └ gradient sarmalı ElevatedButton (yüklenirken spinner)
```

**Davranış**
- `ref.listen(authProvider)`: başarı → `context.go('/dashboard')`; hata → kırmızı SnackBar.
- Butona basarken `isLoading` ise disabled.

**Şifre sıfırlama (2 dialog)**
1. E-posta dialog'u → `forgotPassword(email)` → başarısızsa dialog açık kalır + SnackBar.
2. Kod dialog'u (`barrierDismissible: false`): 6 haneli kod (büyük punto, letter-spacing 8) + yeni şifre → `resetPassword`.

---

## 7.2 Register — `RegisterScreen`
Aynı görsel şablon; alanlar: Ad Soyad, E-posta, Şifre, Şifre (Tekrar).
- Ad soyad boşsa buton disabled.
- Şifre eşleşmesi `passwordsDoNotMatch` ile doğrulanır.
- **Telefon alanı yok** (provider `phone` destekliyor ama UI göndermiyor).

---

## 7.3 Dashboard — `DashboardScreen`
`features/dashboard/presentation/screens/dashboard_screen.dart` (359 satır, `ConsumerWidget`)

**Bölümler**
1. **Gradient header** (`_GradientHeader`): "Merhaba, Salon Sahibi" + salon adı + 44×44 bildirim ikonu (şu an **etkisiz** — onTap yok).
2. **Stat kartları** (`_StatCard`, gradient, 16px radius):
   - Row 1: Bugün (randevu), Bu Hafta (randevu), Aylık Gelir (`₺`)
   - Row 2: Ortalama (puan), Toplam (yorum)
   - Dar ekranda `FittedBox` ile ölçeklenir (metin taşması önlenir).
3. **Haftalık Randevu** bar chart (`fl_chart`, 200px):
   - 7 grup, çubuk genişliği 26, üst radius 8, gradient
   - Üst etiket: değer; alt etiket: `dayAbbreviations` (Pzt…Paz / Mon…Sun)
   - `maxY` en yüksek güne göre ölçeklenir (min 1) — tek günlük verinin ince çizgi kalmasını engeller
4. **Bugünkü Randevular** (`_AppointmentTile`): zaman rozeti (lavender gradient), müşteri adı, `servis • çalışan`, durum rozeti; sağ üstte "Tümü" → `/appointments`.

**Yükleniyor:** `_StatsShimmer` (4 kutu, `surfaceVariant`). **Hata:** düz metin `Hata: ...`. **Boş:** `_EmptyState` (64×64 ikon kutusu + mesaj).

**Pull-to-refresh:** `RefreshIndicator` → `dashboardProvider.notifier.refresh()`.

---

## 7.4 Randevular — `SalonAppointmentsScreen`
`features/appointments/.../salon_appointments_screen.dart` (332 satır, `ConsumerStatefulWidget`)

**State:** `_focusedDay`, `_selectedDay`, `_calendarFormat` (week/month), `_statusFilter`.

**Yapı**
- AppBar: başlık + haftalık/aylık takvim toggle ikonu
- `TableCalendar`: ±365 gün, seçili gün = primary daire, bugün = %20 opak daire, locale `tr_TR`/`en_US`
- Randevu sayısı metni
- **Filtre chip'leri:** Tümü, Bekleyen, Onaylı, Tamamlandı, İptal, Gelmedi
- Liste: `_AppointmentTile`

**Tile davranışı**
| Durum | Görünen aksiyonlar |
|---|---|
| PENDING | Onayla, İptal Et |
| CONFIRMED | Tamamla, İptal Et |
| COMPLETED / CANCELLED / NO_SHOW | aksiyon yok |

- İptal → onay dialog'u (`cancelAppointmentBody(name)`) → `cancel(id)` → SnackBar.
- Durum değişimi → SnackBar ("Randevu onaylandı" / "Randevu tamamlandı").
- Gün seçimi → `refresh(date: selected, status: filter)`.

**Not:** `_filterList` hem seçili güne hem duruma göre **client-side** filtre yapar; server zaten `date`/`status` parametresiyle filtreler. Çift filtre zararsız ama gereksiz.

---

## 7.5 Ekip Yönetimi — `StaffManagementScreen`
(356 satır)

- FAB (extended): "Çalışan Ekle"
- Kart: 52×52 avatar (isim baş harfleri, max 2), ad, (Pasif rozeti), ünvan, sağ üstte `PopupMenuButton` (Düzenle / Pasif Yap–Aktif Yap / Sil), hizmet chip'leri, telefon
- Pasif çalışan: kart kenarı kırmızımsı, avatar gradient yerine gri
- Silme → onay dialog'u → `delete(id)`
- Form sheet (`_StaffFormSheet`, `ConsumerStatefulWidget`): Ad Soyad, Ünvan, Telefon, E-posta + **aktif hizmetlerden** seçim (chip toggle)
  - Gönderilen body: `{fullName, title?, phone?, email?, serviceIds: [...]}`
  - Sadece `svc.isActive` hizmetler seçilebilir

---

## 7.6 Hizmet Yönetimi — `ServiceManagementScreen`
(337 satır)

- Hizmetler **kategoriye göre gruplanır**; kategori başlığı + adet rozeti
- Kart: ad, (Pasif rozeti), süre `dk`, fiyat `₺`, açıklama (max 2 satır), popup menu
- Form sheet (`_ServiceFormSheet`): ad, kategori dropdown (`categoriesProvider`), süre + fiyat (yan yana), açıklama
  - Body: `{name, categoryId?, durationMinutes (default 30), price (default 0), description?}`
- Silme → onay dialog'u

---

## 7.7 Yorumlar — `SalonReviewsScreen`
(277 satır, `ConsumerStatefulWidget`)

**Üst istatistik şeridi:** Ortalama (yıldız), Toplam, Yanıtsız (yanıtsız sayısı **yüklenen sayfaya** göre hesaplanır).

**Filtreler:** Tümü / Yanıtsız / Yanıtlı.

**Kart:** CircleAvatar (baş harfler), müşteri adı, hizmet adı, 5 yıldız (rating.round()), tarih (`dd MMM yyyy`, locale'e göre), yorum metni, yanıt kutusu (lavender), "Yanıtla" / "Yanıtı Düzenle" butonu. Yanıtsız kartın kenarı uyarı rengiyle (%30 warning) vurgulanır.

**Sayfalama:** `feed.hasMore` ise listenin sonunda `Daha fazla göster (N)` TextButton → `loadMore()`.

**Yanıt dialog'u:** max 500 karakter, 4 satır → `reply(id, text)` → sayfa 1'e döner.

---

## 7.8 Salon Profili — `SalonProfileScreen`
(1.274 satır — en büyük ekran; header + 5 bölüm + 4 sheet + 3 dialog)

**Header:** 86×86 logo kutusu (`logoUrl` varsa `Image.network(resolveMediaUrl(...))`, `errorBuilder` fallback ikonu), salon adı, adres, rozetler: **Onaylı** (isVerified) ve **puan**.

**Bölümler**
1. **İstatistik kartı** — şu an yalnızca yorum sayısı (`_buildStat`). `staffCount`/`serviceCount` çevirileri tanımlı ama kullanılmıyor.
2. **Salon Bilgileri** (`_buildSection` + `_MenuItem` listesi): Salon Adı, Telefon, E-posta, Adres, Açıklama, "Salon Bilgilerini Düzenle". Alan yoksa (`null`) satır gösterilmez.
3. **Fotoğraflar** (`_SalonGallerySection`): kapak + galeri yatay scroll (96×96), "Fotoğraf ekle" → `pickMultiImage(limit: 5)` → upload → `updateInfo`.
4. **Çalışma Saatleri**: 7 gün satırı (kapalıysa "Kapalı"), hepsi aynı sheet'i açar + "Çalışma Saatlerini Düzenle".
5. **Ayarlar**: Bildirim Ayarları (**no-op**), Şifre Değiştir, Dil, Tema.
6. **Çıkış Yap** (kırmızı outlined) ve **Salonu Sil** (kırmızı outlined, hardcoded TR metin).
7. Footer: `Salon App v1.0.0`.

**Sheet'ler**
| Sheet | İçerik | API |
|---|---|---|
| `_SalonEditSheet` | ad, adres, açıklama | `PATCH /salons/{id}` |
| `_WorkingHoursSheet` | gün başına Switch + `_TimeChip` (açılış/kapanış) → `showTimePicker` | `PATCH` `{workingHours: {monday:{open,close,isClosed}, ...}}` |
| `_ContactChangeSheet` | yeni değer + doğrulama yöntemi (email/sms radio) → kod gönder | `request-*-change` |
| `_ChangePasswordSheet` | mevcut/yeni/tekrar, visibility toggle'lar | `POST /auth/change-password` |

**OTP akışı:** sheet kapanır → `_showOtpDialog` (6 haneli, büyük punto) → `confirmEmailChange` / `confirmPhoneChange` → başarı SnackBar.

**Salon silme:** onay dialog'u → `deleteSalon(id)` → `context.go('/login')`.

---

## 7.9 Ortak Durum Görünümleri (`core/widgets/state_view.dart`)

| Widget | Ne zaman |
|---|---|
| `Skeleton` / `SkeletonList(count, itemHeight)` | loading — opaklık nabız animasyonu (1200ms loop) |
| `EmptyState(message, subMessage, icon, actionLabel, onAction)` | veri yok |
| `ErrorState(message, onRetry)` | hata — "Tekrar dene" butonu |
| `AsyncStateView<T>(value, data, skeleton, empty, isEmpty, onRetry)` | `AsyncValue`'ı tutarlı render eder |

`_colors(context)` tema extension'ı yoksa `AppThemeColors.light`'a düşer → widget'lar düz `MaterialApp` ile test edilebilir.
