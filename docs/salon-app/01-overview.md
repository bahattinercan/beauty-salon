# 01 · Genel Bakış

## Proje Özeti

**salon_app**, güzellik salonu sahiplerinin işletmesini telefonundan/tabletinden/web'ten yönetmesini sağlayan Flutter uygulamasıdır. `beauty_salon` ekosistemindeki 4 uygulamadan biridir:

| Uygulama | Teknoloji | Kullanıcı |
|----------|-----------|----------|
| `apps/api` | Node.js + Express + Sequelize (SQLite) | — |
| `apps/salon_app` | **Flutter (bu doküman)** | Salon sahibi |
| `apps/customer_app` | Flutter | Müşteri |
| `apps/admin_panel` | Next.js | Platform admini |

Salon sahibi uygulamada şu işleri yapar:
1. **Randevuları** izler, onaylar, tamamlar, iptal eder; takvim + durum filtreleri ile.
2. **Ekibini** (çalışan/staff) ekler, düzenler, aktif/pasif yapar, siler; çalışanlara hizmet atar.
3. **Hizmetlerini** kategori, süre, fiyat ve açıklamayla yönetir.
4. **Yorumları** okur ve yanıtlar (yanıt ekleme/düzenleme), sayfalı besleme.
5. **Salon profilini** düzenler: ad, adres, açıklama, logo/kapak/galeri, çalışma saatleri.
6. **E-posta / telefon** değişikliğini OTP ile doğrular.
7. **Dil (TR/EN)**, **tema (açık/koyu/system)** ayarlarını ve şifresini değiştirir.

---

## Teknoloji Yığını

| Bileşen | Paket | Versiyon | Rol |
|---|---|---|---|
| Dil | Dart | SDK `^3.10.7` | — |
| Framework | Flutter | 3.44.3 (stable, doğrulandı) | UI |
| State | `flutter_riverpod` | ^3.2.1 | AsyncNotifier tabanlı state |
| Navigasyon | `go_router` | ^17.1.0 | Route + redirect + shell |
| HTTP | `dio` | ^5.9.1 | API istemcisi, interceptor |
| Depolama | `flutter_secure_storage` | ^10.0.0 | Token/locale/tema kalıcılığı |
| Takvim | `table_calendar` | ^3.2.0 | Randevu takvimi |
| Grafik | `fl_chart` | ^0.70.2 | Haftalık bar chart |
| Görsel | `image_picker` | ^1.2.1 | Galeri fotoğraf seçimi |
| Yerelleştirme | `intl` + `flutter_localizations` | ^0.20.2 | TR/EN |
| İkonlar | `cupertino_icons` | ^1.0.8 | — |
| Lint | `flutter_lints` | ^6.0.0 | `analysis_options.yaml` |
| Font | Poppins (4 ağırlık) | asset | Tipografi |

> **Not:** `riverpod_generator`, `freezed`, `json_serializable` **kullanılmıyor**. Tüm modeller ve provider'lar elle yazılmış.

---

## Platform Desteği

Repo'da her platform için runner exists:

| Platform | Dizini | Not |
|---|---|---|
| Android | `android/` | `applicationId = com.beautysalon.salon_app`, Gradle 8.14, Kotlin MainActivity |
| iOS | `ios/` | Runner + Podfile |
| Web | `web/` | `index.html`, `manifest.json`, favicon/icon'lar |
| Windows | `windows/` | CMake runner |
| Linux | `linux/` | CMake runner |
| macOS | `macos/` | Xcode project |

Android manifest yalnızca Flutter'ın varsayılan activity/queries'ini içerir — **ekstra izin (kamera, konum, bildirim) tanımlanmamış**. `image_picker` Android'de sistem file picker üzerinden çalıştığı için ek izin gerekmez.

---

## Dosya Yapısı

```
apps/salon_app/
├── lib/
│   ├── main.dart                          # ProviderScope + MaterialApp.router
│   ├── app/
│   │   ├── environment.dart               # ApiEnvironment (baseUrl, mediaUrl)
│   │   ├── router.dart                    # GoRouter + auth redirect
│   │   └── theme/
│   │       ├── app_colors.dart            # Sabit renk paleti + gradient'ler
│   │       ├── app_theme.dart             # lightTheme / darkTheme
│   │       └── app_theme_colors.dart      # ThemeExtension (AppThemeColors)
│   ├── core/
│   │   ├── l10n/
│   │   │   ├── app_strings.dart           # S.of(context) — TR/EN katalog
│   │   │   └── locale_provider.dart       # LocaleNotifier (secure storage)
│   │   ├── network/
│   │   │   ├── api_client.dart            # Dio + _AuthInterceptor
│   │   │   ├── api_provider.dart          # apiClientProvider (test override noktası)
│   │   │   ├── media_url.dart             # resolveMediaUrl()
│   │   │   └── upload_service.dart        # POST /upload/multiple
│   │   ├── theme/
│   │   │   └── theme_provider.dart        # ThemeNotifier (secure storage)
│   │   └── widgets/
│   │       └── state_view.dart            # Skeleton, EmptyState, ErrorState, AsyncStateView
│   ├── features/
│   │   ├── auth/      data/auth_provider.dart + screens/{login,register}_screen.dart
│   │   ├── salon/     data/salon_provider.dart
│   │   ├── dashboard/ data/dashboard_provider.dart + screens/dashboard_screen.dart
│   │   ├── appointments/ data/appointments_provider.dart + screens/salon_appointments_screen.dart
│   │   ├── staff/     data/staff_provider.dart + screens/staff_management_screen.dart
│   │   ├── services/  data/services_provider.dart + screens/service_management_screen.dart
│   │   ├── reviews/   data/reviews_provider.dart + screens/salon_reviews_screen.dart
│   │   └── profile/   screens/salon_profile_screen.dart   (1.274 satır — en büyük ekran)
│   └── shared/
│       └── widgets/salon_main_scaffold.dart  # Alt navigasyon kabuğu
├── test/
│   ├── core/            fake_api.dart, media_url_test, state_view_test
│   └── features/        model testleri + salon_data_providers_test.dart
├── assets/
│   ├── fonts/           Poppins Regular/Medium/SemiBold/Bold
│   └── images/          (pubspec'ta declare edilmiş; şu an boş)
└── pubspec.yaml         version: 1.0.0+1
```

**Satır dağılımı (yaklaşık):** `lib` ~4.900 satır, `test` ~1.400 satır. En büyük dosyalar:

| Dosya | Satır |
|---|---|
| `features/profile/.../salon_profile_screen.dart` | 1.274 |
| `features/dashboard/.../dashboard_screen.dart` | 359 |
| `features/staff/.../staff_management_screen.dart` | 356 |
| `features/appointments/.../salon_appointments_screen.dart` | 332 |
| `features/services/.../service_management_screen.dart` | 337 |
| `features/auth/.../login_screen.dart` | 318 |
| `core/widgets/state_view.dart` | 207 |
| `core/l10n/app_strings.dart` | 234 |

---

## Uygulama Açılış Akışı (main.dart)

```
main()
 └─ WidgetsFlutterBinding.ensureInitialized()
 └─ runApp(ProviderScope(child: SalonApp()))
      └─ SalonApp (ConsumerWidget)
          ├─ ref.watch(routerProvider)     → GoRouter
          ├─ ref.watch(localeProvider)     → Locale (varsayılan tr)
          ├─ ref.watch(themeProvider)      → ThemeMode (varsayılan system)
          ├─ SystemChrome.setSystemUIOverlayStyle(...)  → status bar tema uyumu
          └─ MaterialApp.router(theme, darkTheme, themeMode, locale, routerConfig)
```

`main()` içinde `SystemChrome` çağrısı her rebuild'de tekrarlanıyor; zararsız ama gereksiz (bkz. [12-gaps-risks.md](12-gaps-risks.md)).

---

## Önemli Varsayımlar

1. **Tek salon modeli:** Uygulama `/salons/owner/my-salons` listesinden **ilk salonu** alır. Çoklu salon desteği UI'da yoktur.
2. **Rol kapısı:** `SALON_OWNER` olmayan kullanıcı login'de reddedilir.
3. **API response sarmalayıcısı:** `{ success: true, data: ..., timestamp }`. Sayfalı endpointlerde `data` içinde `{ data, meta }` vardır.
4. **Medya yolları kök-görelidir** (`/uploads/x.jpg`) → `resolveMediaUrl()` ile origin tamamlanır.
