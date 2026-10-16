# 09 · Çok Dillilik (i18n) ve Tema

## 9.1 Çeviri Katmanı

Flutter'ın generated `l10n` sistemi **kullanılmıyor**; yerine elle yazılmış bir katalog var:

```dart
class S {
  final String lang;
  static S of(BuildContext context) => S._(Localizations.localeOf(context).languageCode);
  bool get isEn => lang == 'en';

  String get navDashboard    => isEn ? 'Dashboard' : 'Panel';
  String resetPasswordBody(String email) => isEn ? '...' : '...';
}
```

**Kullanım:** her ekranın başında `final s = S.of(context);` → `s.loginButton`, `s.appointmentCount(3)`.

**Katalog grupları** (`lib/core/l10n/app_strings.dart`, 234 satır):
Navigation, Auth, Common (save/cancel/delete/edit/yes/no…), Status (`statusLabel('CONFIRMED')`), Dashboard, Appointments, Staff, Services, Reviews, Profile (contact change/OTP, working hours, settings, theme), Theme.

Parametreli çeviriler: `appointmentCount(n)`, `cancelAppointmentBody(name)`, `deleteStaffBody(name)`, `deleteServiceBody(name)`, `replyDialogTitle(name)`, `otpSentToEmail(email)`, `resetPasswordBody(email)`, `errorMsg(msg)`.

### Çevirisi olmayan (hardcoded Türkçe) metinler
| Yer | Metin |
|---|---|
| `WorkingDay.displayTimeRange` | `"Kapalı"` |
| Profil → salon silme butonu/dialog'u | `"Salonu Sil"`, `"Sil"`, `"İptal"`, uyarı cümlesi |
| Dashboard gelir kartı | `"₺"` literal |
| Login "Don't have an account? Register" satırı | satır içi ternary ile yazılmış |
| Footer | `"Salon App v1.0.0"` |

> `S` sınıfında `staffCount`, `serviceCount` gibi anahtarlar tanımlı ama UI'da kullanılmıyor (ölü çeviri).

---

## 9.2 Locale Yönetimi

```dart
final localeProvider = AsyncNotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);
// build(): secure storage 'app_locale' → Locale(saved) ?? Locale('tr')
// setLocale(locale): storage'a languageCode yazar, state = AsyncData(locale)
```

`main.dart`:
```dart
final locale = localeAsync.asData?.value ?? const Locale('tr');
MaterialApp.router(locale: locale, supportedLocales: [Locale('tr'), Locale('en')], localizationsDelegates: [...Global...])
```

**Değiştirme yeri:** Profil → Ayarlar → Dil → TR/EN dialog'u. Seçim secure storage'a yazılır, uygulama yeniden açıldığında korunur (logout'ta `deleteAll()` nedeniyle sıfırlanır).

**Tarih/takvim yerelleştirmesi:**
- `TableCalendar(locale: s.isEn ? 'en_US' : 'tr_TR')`
- `DateFormat('dd MMM yyyy', s.isEn ? 'en_US' : 'tr_TR')` (yorumlar)

---

## 9.3 Tema (Dark Mode)

```dart
final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);
// storage key: 'app_theme' → 'light' | 'dark' | 'system'
```

- `build()` `ThemeMode.system` döner; `_load()` async okuma sonrası state'i günceller.
- `setTheme(mode)` state'i anında günceller + storage'a yazar.
- Profil → Ayarlar → Tema dialog'unda System / Açık / Koyu seçimi, aktif seçim `Icons.check` ile işaretli.

**Status bar uyumu** (`main.dart`):
```dart
SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
  statusBarColor: Colors.transparent,
  statusBarIconBrightness: themeMode == ThemeMode.dark ? Brightness.light : Brightness.dark,
));
```

**Not:** `admin_panel` de localStorage anahtarı `app_theme` kullanıyor — anahtar adı tutarlı, ancak depolama katmanları farklı (browser vs. secure storage) ve senkronizasyon yok.

---

## 9.4 Tema/Çeviri Erişim Desenleri (kod yazarken)

| İhtiyaç | Doğru yol |
|---|---|
| Kart zemini | `context.colors.surface` |
| İkincil metin | `context.colors.textSecondary` |
| Chip kenarlığı | `context.colors.secondaryBorder` |
| Durum rengi | `AppColors.success/error/warning` (temadan bağımsız sabit) |
| Metin | `S.of(context).<key>` |
| Görsel URL | `resolveMediaUrl(url)` |
